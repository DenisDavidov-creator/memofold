/**
 * Нагрузочный тест: Deck API (CRUD + Review)
 *
 * Каждая итерация регистрирует собственного пользователя и создаёт колоду,
 * чтобы избежать истечения access-токена (TTL = 1 мин) при длинных сценариях.
 *
 * Запуск:
 *   k6 run --env SCENARIO=smoke  k6/decks.js
 *   k6 run --env SCENARIO=load   k6/decks.js
 *   k6 run --env SCENARIO=stress k6/decks.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, DEFAULT_THRESHOLDS, JSON_HEADERS, authHeaders, uniqueSuffix } from './config.js';

// ── Кастомные метрики ────────────────────────────────────────────────────────
const getDecksDuration    = new Trend('get_decks_duration',      true);
const getDeckByIdDuration = new Trend('get_deck_by_id_duration', true);
const reviewDuration      = new Trend('review_duration',         true);
const createDeckDuration  = new Trend('create_deck_duration',    true);
const deckErrorRate       = new Rate('deck_errors');

// ── Сценарии ─────────────────────────────────────────────────────────────────
const SCENARIOS = {
  smoke: {
    executor: 'constant-vus',
    vus:      1,
    duration: '30s',
  },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 30 },
      { duration: '2m',  target: 30 },
      { duration: '30s', target: 0  },
    ],
  },
  stress: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '1m',  target: 80 },
      { duration: '3m',  target: 80 },
      { duration: '30s', target: 0  },
    ],
  },
};

const scenario = __ENV.SCENARIO || 'smoke';

export const options = {
  scenarios:  { [scenario]: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    get_decks_duration:      ['p(95)<300'],
    get_deck_by_id_duration: ['p(95)<300'],
    review_duration:         ['p(95)<600'],
    create_deck_duration:    ['p(95)<600'],
    deck_errors:             ['rate<0.01'],
  },
};

// ── Хелпер: регистрация + логин ───────────────────────────────────────────────
function registerAndLogin() {
  const suffix   = uniqueSuffix();
  const email    = `dk_${suffix}@test.com`;
  const loginStr = `dk_${suffix}`;
  const password = 'LoadTest_Pass123';

  const regRes = http.post(
    `${BASE_URL}/api/register`,
    JSON.stringify({ email, login: loginStr, password }),
    { headers: JSON_HEADERS },
  );
  if (regRes.status !== 201) return null;

  const loginRes = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS },
  );
  return loginRes.json('accessToken') || null;
}

// ── Главная функция ──────────────────────────────────────────────────────────
export default function () {
  // Каждая итерация — свой пользователь со свежим токеном
  const token = registerAndLogin();
  if (!token) {
    deckErrorRate.add(1);
    return;
  }

  const hdrs = authHeaders(token);

  // Получаем scheduleId
  const schedRes   = http.get(`${BASE_URL}/api/schedules`, { headers: hdrs });
  const schedules  = schedRes.json();
  const scheduleId = Array.isArray(schedules) && schedules.length > 0 ? schedules[0].id : null;
  if (!scheduleId) { deckErrorRate.add(1); return; }

  // Создаём колоду с карточками
  let deckId = null;
  group('create deck', () => {
    const res = http.post(
      `${BASE_URL}/api/decks`,
      JSON.stringify({
        name:           `Deck_${uniqueSuffix()}`,
        scheduleId,
        nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
        newCards: [
          { originalWord: 'apple', translation: 'яблоко' },
          { originalWord: 'cat',   translation: 'кот'    },
          { originalWord: 'house', translation: 'дом'    },
        ],
      }),
      { headers: hdrs },
    );
    createDeckDuration.add(res.timings.duration);
    const ok = check(res, { 'POST /decks: 201': (r) => r.status === 201 });
    if (!ok) { deckErrorRate.add(1); return; }
    deckErrorRate.add(0);

    const decks = http.get(`${BASE_URL}/api/decks?archived=false`, { headers: hdrs }).json();
    deckId = Array.isArray(decks) && decks.length > 0 ? decks[0].id : null;
  });

  sleep(0.3);

  // Список колод
  group('list decks', () => {
    const res = http.get(`${BASE_URL}/api/decks?archived=false`, { headers: hdrs });
    getDecksDuration.add(res.timings.duration);
    const ok = check(res, {
      'GET /decks: 200':      (r) => r.status === 200,
      'GET /decks: not null': (r) => r.json() !== null,
    });
    deckErrorRate.add(ok ? 0 : 1);
  });

  sleep(0.3);

  if (deckId) {
    // Просмотр конкретной колоды
    group('get deck by id', () => {
      const res = http.get(`${BASE_URL}/api/decks/${deckId}`, { headers: hdrs });
      getDeckByIdDuration.add(res.timings.duration);
      const ok = check(res, {
        'GET /decks/:id: 200':  (r) => r.status === 200,
        'GET /decks/:id: name': (r) => r.json('name') !== undefined,
      });
      deckErrorRate.add(ok ? 0 : 1);
    });

    sleep(0.3);

    // Ревью колоды
    group('review deck', () => {
      const deckRes = http.get(`${BASE_URL}/api/decks/${deckId}`, { headers: hdrs });
      const cards   = deckRes.json('cards') || [];

      if (cards.length > 0) {
        const results = cards.map((c) => ({
          cardId:    c.id,
          isCorrect: Math.random() > 0.3,
        }));
        const reviewRes = http.post(
          `${BASE_URL}/api/decks/${deckId}/review`,
          JSON.stringify({ results }),
          { headers: hdrs },
        );
        reviewDuration.add(reviewRes.timings.duration);
        const ok = check(reviewRes, {
          'POST /review: 200':      (r) => r.status === 200,
          'POST /review: Accuracy': (r) => r.json('Accuracy') !== undefined,
        });
        deckErrorRate.add(ok ? 0 : 1);
      }
    });

    sleep(0.5);
  }

  // Список архивных колод
  group('list archived decks', () => {
    const res = http.get(`${BASE_URL}/api/decks?archived=true`, { headers: hdrs });
    check(res, { 'GET /decks?archived=true: 200': (r) => r.status === 200 });
  });

  sleep(1);
}

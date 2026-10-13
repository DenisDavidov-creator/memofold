/**
 * Комплексный нагрузочный тест — реалистичный пользовательский сценарий.
 *
 * Симулирует поведение реального пользователя:
 *   1. Регистрация / логин
 *   2. Просмотр своих колод
 *   3. Создание новой колоды (premium user — без лимита)
 *   4. Ревью одной из колод
 *   5. Работа с наборами слов
 *   6. Управление расписанием
 *
 * Параллельно запускаются несколько VU-групп с разным поведением:
 *   - browser  : читают данные (GET-heavy), 60% трафика
 *   - reviewer : проходят ревью, 30% трафика
 *   - creator  : создают колоды/наборы, 10% трафика
 *
 * Запуск:
 *   k6 run k6/full_scenario.js                      # smoke (по умолчанию)
 *   k6 run --env SCENARIO=load  k6/full_scenario.js
 *   k6 run --env SCENARIO=stress k6/full_scenario.js
 *   k6 run --env SCENARIO=spike k6/full_scenario.js
 *
 * С HTML-отчётом:
 *   k6 run --out json=k6/results/full_$(date +%s).json k6/full_scenario.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';
import { BASE_URL, DEFAULT_THRESHOLDS, JSON_HEADERS, authHeaders, uniqueSuffix } from './config.js';

// ── Кастомные метрики ─────────────────────────────────────────────────────────
const authDuration      = new Trend('auth_duration',        true);
const readDuration      = new Trend('read_duration',        true);
const writeDuration     = new Trend('write_duration',       true);
const reviewDuration    = new Trend('review_duration',      true);
const totalErrors       = new Counter('total_errors');
const successfulLogins  = new Counter('successful_logins');

// ── Сценарии ──────────────────────────────────────────────────────────────────
const SCENARIOS = {
  smoke: {
    browser:  { executor: 'constant-vus', vus: 1, duration: '30s' },
    reviewer: { executor: 'constant-vus', vus: 1, duration: '30s', startTime: '5s' },
  },
  load: {
    browser: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '1m',  target: 30 },
        { duration: '3m',  target: 30 },
        { duration: '30s', target: 0  },
      ],
    },
    reviewer: {
      executor:  'ramping-vus',
      startVUs:  0,
      startTime: '30s',
      stages: [
        { duration: '30s', target: 15 },
        { duration: '3m',  target: 15 },
        { duration: '30s', target: 0  },
      ],
    },
    creator: {
      executor:  'ramping-vus',
      startVUs:  0,
      startTime: '1m',
      stages: [
        { duration: '30s', target: 5  },
        { duration: '2m',  target: 5  },
        { duration: '30s', target: 0  },
      ],
    },
  },
  stress: {
    browser: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '2m',  target: 80  },
        { duration: '5m',  target: 80  },
        { duration: '1m',  target: 120 },
        { duration: '2m',  target: 120 },
        { duration: '1m',  target: 0   },
      ],
    },
    reviewer: {
      executor:  'ramping-vus',
      startVUs:  0,
      startTime: '30s',
      stages: [
        { duration: '2m',  target: 40 },
        { duration: '5m',  target: 40 },
        { duration: '1m',  target: 60 },
        { duration: '2m',  target: 60 },
        { duration: '1m',  target: 0  },
      ],
    },
  },
  spike: {
    browser: {
      executor:  'ramping-vus',
      startVUs:  0,
      stages: [
        { duration: '30s', target: 5   }, // нормальный трафик
        { duration: '10s', target: 200 }, // резкий спайк
        { duration: '1m',  target: 200 }, // держим спайк
        { duration: '10s', target: 5   }, // возврат
        { duration: '30s', target: 0   },
      ],
    },
  },
};

const scenario = __ENV.SCENARIO || 'smoke';

export const options = {
  scenarios: SCENARIOS[scenario],
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    auth_duration:   ['p(95)<800', 'p(99)<1500'],
    read_duration:   ['p(95)<300', 'p(99)<600' ],
    write_duration:  ['p(95)<600', 'p(99)<1000'],
    review_duration: ['p(95)<700', 'p(99)<1200'],
    total_errors:    ['count<50'],
  },
};

// ── Хелперы ───────────────────────────────────────────────────────────────────
function registerAndLogin(isPremium = false) {
  const suffix   = uniqueSuffix();
  const email    = `fl_${suffix}@test.com`;
  const loginStr = `fl_${suffix}`;
  const password = 'LoadTest_Pass123';

  const regRes = http.post(
    `${BASE_URL}/api/register`,
    JSON.stringify({ email, login: loginStr, password }),
    { headers: JSON_HEADERS },
  );
  authDuration.add(regRes.timings.duration);
  if (regRes.status !== 201) { totalErrors.add(1); return null; }

  const loginRes = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS },
  );
  authDuration.add(loginRes.timings.duration);
  const token = loginRes.json('accessToken');
  if (!token) { totalErrors.add(1); return null; }

  successfulLogins.add(1);

  // Симуляция премиум-пользователя
  if (isPremium) {
    http.post(`${BASE_URL}/api/payment/mock`,
      JSON.stringify({ planId: 'lifetime' }),
      { headers: authHeaders(token) });
  }

  return token;
}

function getScheduleId(token) {
  const res = http.get(`${BASE_URL}/api/schedules`, { headers: authHeaders(token) });
  readDuration.add(res.timings.duration);
  const schedules = res.json();
  return Array.isArray(schedules) && schedules.length > 0 ? schedules[0].id : null;
}

function createDeck(token, scheduleId, cardCount = 3) {
  const cards = Array.from({ length: cardCount }, (_, i) => ({
    originalWord: `word_${i}_${uniqueSuffix()}`,
    translation:  `слово_${i}`,
  }));
  const res = http.post(
    `${BASE_URL}/api/decks`,
    JSON.stringify({
      name:           `Deck_${uniqueSuffix()}`,
      scheduleId,
      nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
      newCards:       cards,
    }),
    { headers: authHeaders(token) },
  );
  writeDuration.add(res.timings.duration);
  return res;
}

function getDecks(token) {
  const res = http.get(`${BASE_URL}/api/decks?archived=false`, { headers: authHeaders(token) });
  readDuration.add(res.timings.duration);
  const ok = check(res, { 'GET /decks: 200': (r) => r.status === 200 });
  if (!ok) totalErrors.add(1);
  return res.json() || [];
}

function reviewDeck(token, deckId, cards) {
  if (!cards || cards.length === 0) return;
  const results = cards.map((c) => ({
    cardId:    c.id,
    isCorrect: Math.random() > 0.25,
  }));
  const res = http.post(
    `${BASE_URL}/api/decks/${deckId}/review`,
    JSON.stringify({ results }),
    { headers: authHeaders(token) },
  );
  reviewDuration.add(res.timings.duration);
  const ok = check(res, { 'POST /review: 200': (r) => r.status === 200 });
  if (!ok) totalErrors.add(1);
}

// ── Сценарий "browser": чтение + просмотр данных ─────────────────────────────
export function browser() {
  const token = registerAndLogin();
  if (!token) return;

  const hdrs = authHeaders(token);

  group('profile', () => {
    const res = http.get(`${BASE_URL}/api/profile`, { headers: hdrs });
    readDuration.add(res.timings.duration);
    check(res, {
      'GET /profile: 200':  (r) => r.status === 200,
      'profile: has email': (r) => r.json('user.email') !== undefined,
    });
  });
  sleep(0.5);

  group('read decks', () => {
    const decks = getDecks(token);
    if (decks.length > 0) {
      const res = http.get(`${BASE_URL}/api/decks/${decks[0].id}`, { headers: hdrs });
      readDuration.add(res.timings.duration);
      check(res, { 'GET /decks/:id: 200': (r) => r.status === 200 });
    }
  });
  sleep(0.5);

  group('read word-sets', () => {
    const res = http.get(`${BASE_URL}/api/word-sets?type=my`, { headers: hdrs });
    readDuration.add(res.timings.duration);
    check(res, { 'GET /word-sets: 2xx': (r) => r.status >= 200 && r.status < 300 });
  });
  sleep(0.3);

  group('read schedules', () => {
    const res = http.get(`${BASE_URL}/api/schedules`, { headers: hdrs });
    readDuration.add(res.timings.duration);
    check(res, { 'GET /schedules: 2xx': (r) => r.status >= 200 && r.status < 300 });
  });

  sleep(2);
}

// ── Сценарий "reviewer": создаёт колоду и проходит ревью ─────────────────────
export function reviewer() {
  // Создаём premium-пользователя, чтобы снять лимит 1 колода/день
  const token = registerAndLogin(true);
  if (!token) return;

  const scheduleId = getScheduleId(token);
  if (!scheduleId) return;

  group('create and review', () => {
    const deckRes = createDeck(token, scheduleId, 4);
    if (deckRes.status !== 201) { totalErrors.add(1); return; }

    const decks = getDecks(token);
    if (decks.length === 0) return;

    const deckId  = decks[0].id;
    const deckDetail = http.get(`${BASE_URL}/api/decks/${deckId}`, { headers: authHeaders(token) });
    const cards   = deckDetail.json('cards') || [];

    reviewDeck(token, deckId, cards);
  });

  sleep(2);
}

// ── Сценарий "creator": интенсивно создаёт и удаляет ресурсы ─────────────────
export function creator() {
  const token = registerAndLogin(true);
  if (!token) return;

  const scheduleId = getScheduleId(token);
  const hdrs       = authHeaders(token);

  group('create word-set + batch cards', () => {
    const wsRes = http.post(
      `${BASE_URL}/api/word-sets`,
      JSON.stringify({ name: `WS_${uniqueSuffix()}`, isPublic: false }),
      { headers: hdrs },
    );
    writeDuration.add(wsRes.timings.duration);
    if (wsRes.status !== 201) { totalErrors.add(1); return; }

    const wsId = wsRes.json('id');
    const bRes = http.post(
      `${BASE_URL}/api/word-sets/${wsId}/cards/batch`,
      JSON.stringify({
        cards: Array.from({ length: 5 }, (_, i) => ({
          originalWord: `w${i}_${uniqueSuffix()}`,
          translation:  `с${i}`,
          wordSetId:     wsId,
        })),
      }),
      { headers: hdrs },
    );
    writeDuration.add(bRes.timings.duration);
    check(bRes, { 'POST /batch: 200': (r) => r.status === 200 });

    http.del(`${BASE_URL}/api/word-sets/${wsId}`, null, { headers: hdrs });
  });

  sleep(0.5);

  if (scheduleId) {
    group('create deck + delete', () => {
      const res = createDeck(token, scheduleId, 3);
      if (res.status === 201) {
        const decks  = getDecks(token);
        if (decks.length > 0) {
          http.del(`${BASE_URL}/api/decks/${decks[0].id}`, null, { headers: hdrs });
        }
      }
    });
  }

  sleep(2);
}

// ── Экспорт сценариев ─────────────────────────────────────────────────────────
// k6 вызывает функцию с тем же именем, что и ключ в options.scenarios
export default browser; // fallback для smoke

/**
 * Нагрузочный тест: WordSet API
 *
 * Каждая итерация использует собственного пользователя, чтобы избежать
 * истечения access-токена (TTL = 1 мин) при длинных сценариях.
 *
 * Запуск:
 *   k6 run --env SCENARIO=smoke  k6/wordsets.js
 *   k6 run --env SCENARIO=load   k6/wordsets.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, DEFAULT_THRESHOLDS, JSON_HEADERS, authHeaders, uniqueSuffix } from './config.js';

const getWordSetsDuration   = new Trend('get_wordsets_duration',   true);
const createWordSetDuration = new Trend('create_wordset_duration', true);
const batchCardsDuration    = new Trend('batch_cards_duration',    true);
const wordSetErrorRate      = new Rate('wordset_errors');

const SCENARIOS = {
  smoke: { executor: 'constant-vus', vus: 1, duration: '30s' },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 40 },
      { duration: '2m',  target: 40 },
      { duration: '30s', target: 0  },
    ],
  },
};

const scenario = __ENV.SCENARIO || 'smoke';

export const options = {
  scenarios:  { [scenario]: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    get_wordsets_duration:   ['p(95)<300'],
    create_wordset_duration: ['p(95)<500'],
    batch_cards_duration:    ['p(95)<600'],
    wordset_errors:          ['rate<0.01'],
  },
};

// ── Хелпер: регистрация + логин ───────────────────────────────────────────────
function registerAndLogin() {
  const suffix   = uniqueSuffix();
  const email    = `ws_${suffix}@test.com`;
  const loginStr = `ws_${suffix}`;
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

// ── Главная функция ───────────────────────────────────────────────────────────
export default function () {
  const token = registerAndLogin();
  if (!token) { wordSetErrorRate.add(1); return; }

  const hdrs = authHeaders(token);

  // 1. Список своих наборов
  group('list my word-sets', () => {
    const res = http.get(`${BASE_URL}/api/word-sets?type=my`, { headers: hdrs });
    getWordSetsDuration.add(res.timings.duration);
    const ok = check(res, {
      'GET /word-sets: 2xx':     (r) => r.status >= 200 && r.status < 300,
      'GET /word-sets: not null': (r) => r.json() !== null,
    });
    wordSetErrorRate.add(ok ? 0 : 1);
  });

  sleep(0.2);

  // 2. Список публичных наборов
  group('list public word-sets', () => {
    const res = http.get(`${BASE_URL}/api/word-sets?type=public`, { headers: hdrs });
    getWordSetsDuration.add(res.timings.duration);
    check(res, { 'GET /word-sets?type=public: 2xx': (r) => r.status >= 200 && r.status < 300 });
  });

  sleep(0.2);

  // 3. Создание + batch-карточки + удаление
  group('create word-set', () => {
    const res = http.post(
      `${BASE_URL}/api/word-sets`,
      JSON.stringify({ name: `Set_${uniqueSuffix()}`, isPublic: false }),
      { headers: hdrs },
    );
    createWordSetDuration.add(res.timings.duration);
    const ok = check(res, {
      'POST /word-sets: 201': (r) => r.status === 201,
      'POST /word-sets: id':  (r) => r.json('id') !== undefined,
    });
    wordSetErrorRate.add(ok ? 0 : 1);

    if (ok) {
      const wsId     = res.json('id');
      const batchRes = http.post(
        `${BASE_URL}/api/word-sets/${wsId}/cards/batch`,
        JSON.stringify({
          cards: [
            { originalWord: 'moon', translation: 'луна',   wordSetId: wsId },
            { originalWord: 'star', translation: 'звезда', wordSetId: wsId },
          ],
        }),
        { headers: hdrs },
      );
      batchCardsDuration.add(batchRes.timings.duration);
      check(batchRes, { 'POST /batch: 200': (r) => r.status === 200 });

      // 4. Копируем набор в себя же (проверяем copy-endpoint)
      const copyRes = http.post(
        `${BASE_URL}/api/word-sets/${wsId}/copy`,
        null,
        { headers: hdrs },
      );
      check(copyRes, { 'POST /copy: 200': (r) => r.status === 200 });

      http.del(`${BASE_URL}/api/word-sets/${wsId}`, null, { headers: hdrs });
    }
  });

  sleep(1);
}

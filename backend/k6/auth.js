/**
 * Нагрузочный тест: Auth API (register + login)
 *
 * Сценарии:
 *  - smoke    : 1 VU, 30 с  — базовая проверка работоспособности
 *  - load     : 0→50 VU за 30 с, держит 2 мин, спускается 30 с
 *  - stress   : 0→100 VU за 1 мин, держит 3 мин, спускается 30 с
 *  - soak     : 20 VU, 10 мин — длительная стабильность
 *
 * Запуск:
 *   k6 run --env SCENARIO=smoke   k6/auth.js
 *   k6 run --env SCENARIO=load    k6/auth.js
 *   k6 run --env SCENARIO=stress  k6/auth.js
 *   k6 run --env SCENARIO=soak    k6/auth.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';
import { BASE_URL, DEFAULT_THRESHOLDS, JSON_HEADERS, authHeaders, uniqueSuffix } from './config.js';

// ── Кастомные метрики ────────────────────────────────────────────────────────
const registerDuration = new Trend('register_duration', true);
const loginDuration    = new Trend('login_duration',    true);
const loginErrors      = new Counter('login_errors');
const registerErrors   = new Counter('register_errors');

// ── Сценарии ─────────────────────────────────────────────────────────────────
const SCENARIOS = {
  smoke: {
    executor: 'constant-vus',
    vus:      1,
    duration: '30s',
  },
  load: {
    executor:        'ramping-vus',
    startVUs:        0,
    stages: [
      { duration: '30s', target: 50  },
      { duration: '2m',  target: 50  },
      { duration: '30s', target: 0   },
    ],
  },
  stress: {
    executor:        'ramping-vus',
    startVUs:        0,
    stages: [
      { duration: '1m',  target: 100 },
      { duration: '3m',  target: 100 },
      { duration: '30s', target: 0   },
    ],
  },
  soak: {
    executor: 'constant-vus',
    vus:      20,
    duration: '10m',
  },
};

const scenario = __ENV.SCENARIO || 'smoke';

export const options = {
  scenarios:  { [scenario]: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    register_duration: ['p(95)<800'],
    login_duration:    ['p(95)<400'],
  },
};

// ── Вспомогательные функции ──────────────────────────────────────────────────
function register(email, login, password) {
  const res = http.post(
    `${BASE_URL}/api/register`,
    JSON.stringify({ email, login, password }),
    { headers: JSON_HEADERS },
  );
  registerDuration.add(res.timings.duration);

  const ok = check(res, {
    'register: status 201': (r) => r.status === 201,
    'register: has id':     (r) => r.json('id') !== undefined,
  });
  if (!ok) registerErrors.add(1);
  return res;
}

function login(email, password) {
  const res = http.post(
    `${BASE_URL}/api/login`,
    JSON.stringify({ email, password }),
    { headers: JSON_HEADERS },
  );
  loginDuration.add(res.timings.duration);

  const ok = check(res, {
    'login: status 200':        (r) => r.status === 200,
    'login: has accessToken':   (r) => r.json('accessToken') !== undefined,
  });
  if (!ok) loginErrors.add(1);
  return res;
}

// ── Главная функция ──────────────────────────────────────────────────────────
export default function () {
  const suffix   = uniqueSuffix();
  const email    = `user_${suffix}@load.test`;
  const loginStr = `u_${suffix}`;
  const password = 'LoadTest_Pass123';

  // 1. Регистрация
  register(email, loginStr, password);
  sleep(0.5);

  // 2. Логин
  const loginRes = login(email, password);
  const token    = loginRes.json('accessToken');

  if (token) {
    // 3. Получение профиля (проверяем авторизацию)
    const profileRes = http.get(`${BASE_URL}/api/profile`, { headers: authHeaders(token) });
    check(profileRes, {
      'profile: status 200': (r) => r.status === 200,
      'profile: has email':  (r) => r.json('user.email') !== undefined,
    });
  }

  sleep(1);
}

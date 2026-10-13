/**
 * Нагрузочный тест: Schedule API (CRUD расписаний)
 *
 * Каждая итерация использует собственного пользователя, чтобы избежать
 * истечения access-токена (TTL = 1 мин) при длинных сценариях.
 *
 * Запуск:
 *   k6 run --env SCENARIO=smoke k6/schedules.js
 *   k6 run --env SCENARIO=load  k6/schedules.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate } from 'k6/metrics';
import { BASE_URL, DEFAULT_THRESHOLDS, JSON_HEADERS, authHeaders, uniqueSuffix } from './config.js';

const getSchedulesDuration   = new Trend('get_schedules_duration',   true);
const createScheduleDuration = new Trend('create_schedule_duration', true);
const updateScheduleDuration = new Trend('update_schedule_duration', true);
const scheduleErrorRate      = new Rate('schedule_errors');

const SCENARIOS = {
  smoke: { executor: 'constant-vus', vus: 1, duration: '30s' },
  load: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 30 },
      { duration: '2m',  target: 30 },
      { duration: '30s', target: 0  },
    ],
  },
};

const scenario = __ENV.SCENARIO || 'smoke';

export const options = {
  scenarios:  { [scenario]: SCENARIOS[scenario] },
  thresholds: {
    ...DEFAULT_THRESHOLDS,
    get_schedules_duration:   ['p(95)<200'],
    create_schedule_duration: ['p(95)<500'],
    update_schedule_duration: ['p(95)<500'],
    schedule_errors:          ['rate<0.01'],
  },
};

// ── Хелпер: регистрация + логин ───────────────────────────────────────────────
function registerAndLogin() {
  const suffix   = uniqueSuffix();
  const email    = `sc_${suffix}@test.com`;
  const loginStr = `sc_${suffix}`;
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
  if (!token) { scheduleErrorRate.add(1); return; }

  const hdrs = authHeaders(token);

  // 1. Получение всех расписаний
  group('list schedules', () => {
    const res = http.get(`${BASE_URL}/api/schedules`, { headers: hdrs });
    getSchedulesDuration.add(res.timings.duration);
    const ok = check(res, {
      'GET /schedules: 2xx':      (r) => r.status >= 200 && r.status < 300,
      'GET /schedules: not null': (r) => r.json() !== null,
    });
    scheduleErrorRate.add(ok ? 0 : 1);
  });

  sleep(0.3);

  // 2. Создание расписания
  let newScheduleId = null;
  group('create schedule', () => {
    const res = http.post(
      `${BASE_URL}/api/schedules`,
      JSON.stringify({
        name: `LoadSched_${uniqueSuffix()}`,
        levels: [
          { level: 0, intervalMinutes: 480  },
          { level: 1, intervalMinutes: 1440 },
          { level: 2, intervalMinutes: 4320 },
        ],
      }),
      { headers: hdrs },
    );
    createScheduleDuration.add(res.timings.duration);
    const ok = check(res, {
      'POST /schedules: 201': (r) => r.status === 201,
      'POST /schedules: id':  (r) => r.json('id') !== undefined,
    });
    scheduleErrorRate.add(ok ? 0 : 1);
    if (ok) newScheduleId = res.json('id');
  });

  sleep(0.3);

  // 3. Обновление расписания
  if (newScheduleId) {
    group('update schedule', () => {
      const res = http.put(
        `${BASE_URL}/api/schedules/${newScheduleId}`,
        JSON.stringify({
          name: `Updated_${uniqueSuffix()}`,
          levels: [
            { level: 0, intervalMinutes: 240  },
            { level: 1, intervalMinutes: 720  },
            { level: 2, intervalMinutes: 2880 },
          ],
        }),
        { headers: hdrs },
      );
      updateScheduleDuration.add(res.timings.duration);
      check(res, { 'PUT /schedules/:id: 2xx': (r) => r.status >= 200 && r.status < 300 });
    });

    sleep(0.2);

    // 4. Удаление нового расписания (переносим колоды на дефолтное)
    const schedulesRes = http.get(`${BASE_URL}/api/schedules`, { headers: hdrs });
    const schedules    = schedulesRes.json();
    const defaultSched = Array.isArray(schedules)
      ? schedules.find((s) => s.id !== newScheduleId)
      : null;

    if (defaultSched) {
      group('delete schedule', () => {
        const res = http.del(
          `${BASE_URL}/api/schedules/${newScheduleId}`,
          JSON.stringify({ newScheduleId: defaultSched.id }),
          { headers: { ...hdrs, 'Content-Type': 'application/json' } },
        );
        check(res, { 'DELETE /schedules/:id: 200': (r) => r.status === 200 });
      });
    }
  }

  sleep(1);
}

// Общая конфигурация: BASE_URL берётся из env-переменной или localhost по умолчанию.
export const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Пороговые значения (thresholds), которые должны выполняться для прохождения теста.
export const DEFAULT_THRESHOLDS = {
  http_req_failed:   ['rate<0.01'],          // <1% ошибок
  http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% < 500ms, 99% < 1s
};

// Создаёт уникальный суффикс, чтобы каждый запуск не конфликтовал по email/login.
export function uniqueSuffix() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

// Стандартные заголовки для JSON-запросов.
export const JSON_HEADERS = { 'Content-Type': 'application/json' };

// Авторизованные заголовки.
export function authHeaders(token) {
  return {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

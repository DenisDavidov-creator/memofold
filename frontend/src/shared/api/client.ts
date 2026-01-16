import ky from 'ky';

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient = ky.create({
  prefixUrl: '/api',
  hooks: {
    beforeRequest: [
      (request) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
    afterResponse: [
      async (request, _options, response) => {
        if (response.status === 401 && !request.url.includes('auth/refresh') && !request.url.includes('auth/login')) {
          
          if (isRefreshing) {
            // Если рефреш уже идет, ставим запрос в очередь
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(() => {
              // Когда очередь разблокируется, повторяем запрос
              // Важно: берем новый токен
              const newToken = localStorage.getItem('accessToken');
              request.headers.set('Authorization', `Bearer ${newToken}`);
              return ky(request);
            });
          }

          isRefreshing = true;

          try {
            const res = await ky.post('/api/auth/refresh', { 
                credentials: 'include' 
            }).json<{ accessToken: string }>();

            localStorage.setItem('accessToken', res.accessToken);
            
            // Обновляем хедер для текущего запроса
            request.headers.set('Authorization', `Bearer ${res.accessToken}`);
            
            processQueue(null, res.accessToken);
            isRefreshing = false;
            
            return ky(request); // Повтор

          } catch (refreshError) {
            processQueue(refreshError, null);
            isRefreshing = false;
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            throw refreshError;
          }
        }
      }
    ]
  },
});
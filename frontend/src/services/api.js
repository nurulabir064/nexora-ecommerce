import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000
});

let csrfToken = null;
let csrfRequest = null;
async function getCsrfToken(forceRefresh = false) {
  if (forceRefresh) csrfToken = null;
  if (csrfToken) return csrfToken;
  if (!csrfRequest) {
    csrfRequest = api.get('/auth/csrf').then(({ data }) => {
      csrfToken = data.csrfToken;
      return csrfToken;
    }).finally(() => { csrfRequest = null; });
  }
  return csrfRequest;
}

api.interceptors.request.use(async config => {
  const method = (config.method || 'get').toLowerCase();
  if (!['get', 'head', 'options'].includes(method) && !config.skipCsrf) {
    config.headers['X-CSRF-Token'] = await getCsrfToken();
  }
  return config;
});

api.interceptors.response.use(response => response, async error => {
  const config = error.config;
  const isUnsafe = config && !['get', 'head', 'options'].includes((config.method || 'get').toLowerCase());
  const isCsrfFailure = error.response?.status === 403 && error.response?.data?.message === 'CSRF validation failed. Refresh and try again.';
  if (isUnsafe && isCsrfFailure && !config._csrfRetried) {
    config._csrfRetried = true;
    try {
      config.headers['X-CSRF-Token'] = await getCsrfToken(true);
      return api(config);
    } catch { /* Preserve the original request error. */ }
  }
  return Promise.reject(error);
});

export function clearCsrfToken() { csrfToken = null; }

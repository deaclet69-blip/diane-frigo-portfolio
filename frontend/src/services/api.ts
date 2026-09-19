import axios from 'axios';

// En local (npm run dev) : '/api' passe par le proxy Vite vers localhost:3000.
// Une fois déployé : VITE_API_URL pointera vers la vraie adresse du backend
// (ex. https://diane-frigo-backend.onrender.com/api), injectée au moment du
// build par la plateforme d'hébergement (Render) — aucune modification de
// code nécessaire à chaque déploiement.
const API_BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({ baseURL: API_BASE_URL });

// Déclenche une notification visible (voir components/ApiErrorNotification.tsx)
// pour qu'une erreur API ne se traduise plus jamais par une page silencieusement
// vide. Événement global plutôt qu'un contexte React : évite de devoir modifier
// chacune des pages qui appellent l'API.
function notifyApiError(message: string, severity: 'error' | 'warning' = 'error') {
  window.dispatchEvent(new CustomEvent('api-error', { detail: { message, severity } }));
}

// Injecte le token d'accès sur chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Rafraîchit automatiquement le token en cas de 401 (une seule tentative)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, null, {
            headers: { Authorization: `Bearer ${refreshToken}` },
          });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/#/login';
          return Promise.reject(error);
        }
      }
      return Promise.reject(error);
    }

    // Toute autre erreur : on prévient l'utilisateur au lieu de laisser la
    // page se charger avec des données vides sans explication.
    if (error.response?.status === 403) {
      notifyApiError(
        "Access denied: you don't have permission to view this data. Contact an administrator if you think this is a mistake.",
      );
    } else if (error.response && error.response.status >= 500) {
      notifyApiError('A server error occurred. Please try again in a moment.');
    } else if (!error.response) {
      notifyApiError('Unable to reach the server. Please check your internet connection.', 'warning');
    }

    return Promise.reject(error);
  },
);

import axios from 'axios';

/**
 * En desarrollo (npm run dev): baseURL = '' para que las peticiones
 * pasen por el proxy de Vite (localhost:5173 → localhost:8888).
 * Si baseURL fuera 'http://localhost:8888', las peticiones irían DIRECTO
 * al backend y el CORS del navegador las bloquearía.
 *
 * En producción (npm run build): baseURL = VITE_API_BASE_URL_PRODUCCION
 * (la URL real de tu API Gateway / servidor).
 */
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' || 
   window.location.hostname.startsWith('192.168.') ||
   window.location.hostname.startsWith('10.'));

export const getApiBaseUrl = () => {
  if (!import.meta.env.PROD) {
    return '';
  }
  if (isLocalhost) {
    return window.location.origin;
  }
  return import.meta.env.VITE_API_BASE_URL_PRODUCCION || import.meta.env.VITE_API_BASE_URL || '';
};

const axiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
});

export default axiosInstance;

// src/services/api.js
import axios from 'axios';
import { getResponseCache, getRequestDeduplicator } from './cache';
import { clearAuthStorage } from '../utils/auth';

/**
 * Determina la base del API en RUNTIME:
 * - Si el hostname es sifadeco.vercel.app → usa backend remoto (onrender.com)
 * - Si es localhost o 127.0.0.1 → usa /api relativo
 * - Fallback: /api
 */
function getApiBase() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;

    // Vercel: siempre usar backend remoto
    if (hostname === 'sifadeco.vercel.app') {
      console.log('[API] Detectado Vercel, usando backend remoto');
      return 'https://sifadeco.onrender.com/api';
    }

    // Localhost: usar /api relativo
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      console.log('[API] Detectado localhost, usando /api');
      return '/api';
    }
  }

  // Fallback
  return '/api';
}

const API_BASE = getApiBase();

// Log temporal para debugging (elimina en producción)
console.log('API base (build):', API_BASE);

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

api.interceptors.request.use(
  (config) => {
    try {
      // Agregar token JWT
      const token = localStorage.getItem('token');
      config.headers = config.headers || {};
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('[API] Token agregado al header:', `Bearer ${token.substring(0, 20)}...`);
      } else {
        console.warn('[API] No hay token en localStorage para:', config.url);
      }

      // Agregar CSRF token en requests de modificación
      const method = config.method?.toUpperCase();
      if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
        const csrfToken = localStorage.getItem('csrfToken');
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        } else {
          console.warn('[API] CSRF token no encontrado. Algunas operaciones pueden fallar.');
        }
      }

      // Implementar caching para GETs
      if (method === 'GET') {
        const cache = getResponseCache();
        // Generar clave de caché incluyendo query parameters
        const cacheKey = config.params
          ? `${config.url}?${new URLSearchParams(config.params).toString()}`
          : config.url;
        const cached = cache.get(cacheKey);
        if (cached) {
          // Retornar respuesta cacheada
          return Promise.reject({
            response: { data: cached, status: 200 },
            isFromCache: true,
          });
        }
      }
    } catch (e) {
      console.error('[API] Error en request interceptor:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    // Guardar en caché si es GET exitoso
    if (response.config.method?.toUpperCase() === 'GET') {
      // Usar la misma clave que en request interceptor
      const cacheKey = response.config.params
        ? `${response.config.url}?${new URLSearchParams(response.config.params).toString()}`
        : response.config.url;
      getResponseCache().set(cacheKey, response.data);
    }

    // Invalidar caché en operaciones de modificación
    const method = response.config.method?.toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      getResponseCache().invalidate('*'); // Limpiar todo el caché
    }

    return response;
  },
  (error) => {
    try {
      // Si viene del caché, retornar los datos
      if (error.isFromCache) {
        return Promise.resolve(error.response);
      }

      const status = error?.response?.status;
      const data = error?.response?.data;

      console.error(
        '[API error]',
        status,
        data ?? error.message
      );

      // Manejar errores de seguridad específicos
      if (status === 401 && (data?.message === 'Sesión cerrada por inactividad' || data?.message === 'Token inválido o expirado')) {
        console.warn('[AUTH] Sesión expirada por inactividad. Cerrando sesión...');
        clearAuthStorage();
        if (typeof window !== 'undefined') {
          window.location.href = '/inicio';
        }
      }

      if (status === 403 && data?.code === 'CSRF_INVALID') {
        console.warn('[SECURITY] CSRF token inválido. Redireccionando a login...');
        localStorage.removeItem('csrfToken');
      }

      if (status === 429 && data?.code === 'RATE_LIMIT_EXCEEDED') {
        console.warn('[SECURITY] Rate limit excedido. Demasiadas solicitudes.');
      }

      if (status === 400 && data?.code === 'VALIDATION_ERROR') {
        console.warn('[SECURITY] Error de validación de datos:', data?.details);
      }
    } catch (e) {
      console.error('[API] Error en response interceptor:', e);
    }

    return Promise.reject(error);
  }
);

export default api;

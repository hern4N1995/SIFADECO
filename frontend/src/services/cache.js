/**
 * Cache y utilidades para optimizar requests del frontend
 * Evita solicitudes duplicadas y caching de resultados
 */

/**
 * Cache simple con TTL (Time To Live)
 * Almacena resultados de requests para evitar refetch innecesario
 */
class ResponseCache {
  constructor(ttlSeconds = 300) {
    this.cache = new Map();
    this.ttlMs = ttlSeconds * 1000;
  }

  /**
   * Obtiene valor cacheado si existe y no expiró
   * @param {string} key - Clave de caché (generalmente la URL)
   * @returns {*} Valor cacheado o null
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      console.log(`[Cache] EXPIRED: ${key}`);
      return null;
    }

    console.log(`[Cache] HIT: ${key}`);
    return entry.value;
  }

  /**
   * Guarda valor en caché
   */
  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
    });
    console.log(`[Cache] SET: ${key} (TTL: ${this.ttlMs / 1000}s)`);
  }

  /**
   * Invalida caché de una clave (después de POST/PUT/DELETE)
   */
  invalidate(pattern) {
    // Si pattern contiene *, invalida todo lo que matchee
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          console.log(`[Cache] INVALIDATED: ${key}`);
        }
      }
    } else {
      this.cache.delete(pattern);
      console.log(`[Cache] INVALIDATED: ${pattern}`);
    }
  }

  /**
   * Limpia toda la caché
   */
  clear() {
    this.cache.clear();
    console.log('[Cache] CLEARED');
  }
}

/**
 * Deduplicador de requests
 * Si hace 2 requests idénticos antes que termine el primero, devuelve la promesa del primero
 */
class RequestDeduplicator {
  constructor() {
    this.pending = new Map();
  }

  /**
   * Ejecuta fetch deduplicado
   * @param {string} key - Clave única del request (ej: endpoint + params)
   * @param {Function} fetcher - Función que retorna Promise (la llamada a API)
   * @returns {Promise} Promise del resultado
   */
  async fetch(key, fetcher) {
    // Si ya hay una request pendiente con esta clave, esperar su resultado
    if (this.pending.has(key)) {
      console.log(`[Dedup] Reusing pending request: ${key}`);
      return this.pending.get(key);
    }

    // Crear nueva promesa y guardarla
    const promise = fetcher()
      .then((result) => {
        this.pending.delete(key);
        return result;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    console.log(`[Dedup] New request: ${key}`);
    return promise;
  }

  /**
   * Obtiene número de requests pendientes
   */
  getPendingCount() {
    return this.pending.size;
  }
}

/**
 * Instancias globales (se crean una sola vez)
 */
let responseCache = null;
let requestDeduplicator = null;

const getResponseCache = () => {
  if (!responseCache) {
    responseCache = new ResponseCache(300); // 5 minutos TTL
  }
  return responseCache;
};

const getRequestDeduplicator = () => {
  if (!requestDeduplicator) {
    requestDeduplicator = new RequestDeduplicator();
  }
  return requestDeduplicator;
};

export {
  ResponseCache,
  RequestDeduplicator,
  getResponseCache,
  getRequestDeduplicator,
};

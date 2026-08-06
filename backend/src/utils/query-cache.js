/**
 * Utilidades para optimización de queries
 * Evita problemas N+1, lazy loading, y cachea resultados
 */

const logger = require('./logger');

/**
 * Caché simple en memoria para resultados de queries
 * Se limpia cada X minutos para evitar datos obsoletos
 */
class QueryCache {
  constructor(ttlMinutes = 5) {
    this.cache = new Map();
    this.ttlMs = ttlMinutes * 60 * 1000;
  }

  /**
   * Obtiene valor cacheado si existe y no expiró
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > this.ttlMs;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    logger.debug(`Cache HIT: ${key}`);
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
    logger.debug(`Cache SET: ${key}`);
  }

  /**
   * Invalida toda la caché (usar después de INSERT/UPDATE/DELETE)
   */
  invalidate() {
    logger.info('Cache invalidated');
    this.cache.clear();
  }

  /**
   * Invalida un key específico
   */
  invalidateKey(key) {
    this.cache.delete(key);
    logger.debug(`Cache invalidated: ${key}`);
  }

  /**
   * Obtiene stats de caché
   */
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

/**
 * Patrón: si no existe en caché, ejecutar query y guardar
 * Evita repetir la misma query múltiples veces
 */
const withCache = async (pool, key, query, params = [], ttlMinutes = 5) => {
  const cache = getQueryCache();
  
  // Intentar obtener del caché
  const cached = cache.get(key);
  if (cached) return cached;

  // Si no está en caché, ejecutar query
  const result = await pool.query(query, params);
  const data = result.rows;

  // Guardar en caché
  cache.set(key, data);
  return data;
};

/**
 * Instancia global de caché (se crea una sola vez)
 */
let globalQueryCache = null;

const getQueryCache = () => {
  if (!globalQueryCache) {
    globalQueryCache = new QueryCache(5); // 5 minutos TTL
  }
  return globalQueryCache;
};

/**
 * Sugerencias de índices en BD para mejorar performance
 * Ejecutar estas queries en PostgreSQL:
 */
const SUGGESTED_INDEXES = `
-- Índices para mejorar velocidad de queries comunes

-- Usuarios: búsquedas por id_planta y estado
CREATE INDEX IF NOT EXISTS idx_usuario_id_planta ON usuario(id_planta);
CREATE INDEX IF NOT EXISTS idx_usuario_estado ON usuario(estado);

-- Tropas: búsquedas por id_planta y fecha
CREATE INDEX IF NOT EXISTS idx_tropa_id_planta ON tropa(id_planta);
CREATE INDEX IF NOT EXISTS idx_tropa_fecha ON tropa(fecha);

-- Tropadetalle: búsquedas por id_tropa
CREATE INDEX IF NOT EXISTS idx_tropa_detalle_id_tropa ON tropa_detalle(id_tropa);

-- Faena: búsquedas por id_faena_detalle y estado
CREATE INDEX IF NOT EXISTS idx_faena_detalle ON faena(id_faena_detalle);
CREATE INDEX IF NOT EXISTS idx_faena_estado ON faena(estado);

-- Decomiso: búsquedas por id_faena_detalle
CREATE INDEX IF NOT EXISTS idx_decomiso_faena_detalle ON decomiso(id_faena_detalle);

-- Decomiso detalle: búsquedas por id_decomiso
CREATE INDEX IF NOT EXISTS idx_decomiso_detalle_id_decomiso ON decomiso_detalle(id_decomiso);

-- Plantas: filtros por estado
CREATE INDEX IF NOT EXISTS idx_planta_estado ON planta(estado);

-- Especies: filtros por estado
CREATE INDEX IF NOT EXISTS idx_especie_estado ON especie(estado);
`;

module.exports = {
  QueryCache,
  getQueryCache,
  withCache,
  SUGGESTED_INDEXES,
};

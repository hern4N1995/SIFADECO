/**
 * middleware/rateLimiter.js
 * Rate limiter mejorado con Redis para producción
 * En desarrollo: desactivado
 * En producción: activo con Redis
 */

const rateLimit = require('express-rate-limit');
let RedisStore;
let redisClient;

// Intentar cargar Redis en producción
if (process.env.NODE_ENV === 'production' || process.env.USE_REDIS === 'true') {
  try {
    const redis = require('redis');
    RedisStore = require('rate-limit-redis');
    
    // Crear cliente Redis
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      password: process.env.REDIS_PASSWORD,
      legacyMode: true, // Compatible con rate-limit-redis
    });

    redisClient.connect().catch((err) => {
      console.error('⚠️  Error conectando a Redis:', err.message);
      console.log('⚠️  Rate limiter fallback a memoria');
      redisClient = null;
    });
  } catch (err) {
    console.warn('⚠️  Redis no disponible, usando fallback en memoria');
    redisClient = null;
  }
}

// Crear limiter
let rateLimiterConfig = {
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 200, // 200 requests por minuto (bastante permisivo para desarrollo)
  message: {
    error: 'Demasiadas solicitudes. Intenta más tarde.',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 60,
  },
  standardHeaders: false, // No enviar headers RateLimit-*
  skip: (req) => {
    // No limitar health checks
    if (req.path === '/health' || req.path === '/api/health') return true;
    return false;
  },
  keyGenerator: (req, res) => {
    // Usar ID de usuario si está autenticado, sino usar IP
    return req.user?.id_usuario || req.ip;
  },
};

// Si Redis está disponible, usar Redis store
if (redisClient) {
  console.log('✅ Rate limiter configurado con Redis');
  rateLimiterConfig.store = new RedisStore({
    client: redisClient,
    prefix: 'rl:', // Prefix para las keys en Redis
  });
} else {
  console.log('⚠️  Rate limiter usando store en memoria (solo desarrollo)');
}

const limiter = rateLimit(rateLimiterConfig);

module.exports = limiter;

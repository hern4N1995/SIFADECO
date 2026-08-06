/**
 * Validador de variables de entorno
 * Se ejecuta al startup para detectar configuraciones faltantes
 */

const logger = require('./logger');

/**
 * Variables requeridas para el backend
 */
const REQUIRED_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_ORIGINS',
];

/**
 * Variables opcionales con valores por defecto
 */
const OPTIONAL_VARS = {
  NODE_ENV: 'development',
  PORT: '3000',
  JWT_EXPIRY: '24h',
};

/**
 * Valida que todas las variables requeridas existan
 * @throws Error si falta alguna variable requerida
 */
const validateEnvironment = () => {
  const missing = [];

  REQUIRED_VARS.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    const msg = `Missing required environment variables: ${missing.join(', ')}`;
    logger.error(msg);
    throw new Error(msg);
  }

  logger.info('✅ All required environment variables are set');
  
  // Log vars opcionales
  Object.entries(OPTIONAL_VARS).forEach(([key, defaultVal]) => {
    const val = process.env[key] || defaultVal;
    logger.debug(`${key}: ${val}`);
  });
};

module.exports = {
  validateEnvironment,
  REQUIRED_VARS,
  OPTIONAL_VARS,
};

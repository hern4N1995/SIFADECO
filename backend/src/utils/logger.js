/**
 * Logger centralizado para toda la aplicación
 * Facilita migración futura a Winston/Pino
 */

const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG',
};

const getTimestamp = () => new Date().toISOString();

/**
 * Log a nivel INFO (operaciones normales)
 */
const info = (message, data = null) => {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}] [INFO] ${message}`, data || '');
};

/**
 * Log a nivel WARN (algo inesperado pero no crítico)
 */
const warn = (message, data = null) => {
  const timestamp = getTimestamp();
  console.warn(`[${timestamp}] [WARN] ${message}`, data || '');
};

/**
 * Log a nivel ERROR (error que requiere atención)
 */
const error = (message, err = null) => {
  const timestamp = getTimestamp();
  const errorMsg = err?.message || (typeof err === 'string' ? err : JSON.stringify(err));
  console.error(`[${timestamp}] [ERROR] ${message}`, errorMsg);
  if (err?.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
};

/**
 * Log a nivel DEBUG (solo en desarrollo)
 */
const debug = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    const timestamp = getTimestamp();
    console.debug(`[${timestamp}] [DEBUG] ${message}`, data || '');
  }
};

/**
 * Log de operaciones de base de datos
 */
const database = (operation, table, duration = null) => {
  const msg = `[DB] ${operation} on ${table}`;
  const data = duration ? `(${duration}ms)` : '';
  info(msg, data);
};

module.exports = {
  info,
  warn,
  error,
  debug,
  database,
  LOG_LEVELS,
};

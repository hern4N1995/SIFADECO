/**
 * Utilidades para respuestas API normalizadas
 * Garantiza consistencia en todas las endpoints
 */

/**
 * Respuesta exitosa normalizada
 * @param {*} data - Datos a retornar
 * @param {string} message - Mensaje opcional
 * @param {number} statusCode - HTTP status (default 200)
 * @returns {Object}
 */
const success = (data, message = null, statusCode = 200) => ({
  success: true,
  data,
  ...(message && { message }),
  timestamp: new Date().toISOString(),
});

/**
 * Respuesta de error normalizada
 * @param {string} code - Código de error (ej: VALIDATION_ERROR)
 * @param {string} message - Mensaje de error
 * @param {*} details - Detalles adicionales
 * @param {number} statusCode - HTTP status (default 400)
 * @returns {Object}
 */
const error = (code, message, details = null, statusCode = 400) => ({
  success: false,
  code,
  message,
  ...(details && { details }),
  timestamp: new Date().toISOString(),
});

/**
 * Respuesta paginated (para listas grandes)
 * @param {Array} data - Array de datos
 * @param {number} page - Página actual
 * @param {number} limit - Registros por página
 * @param {number} total - Total de registros
 * @returns {Object}
 */
const paginated = (data, page, limit, total) => ({
  success: true,
  data,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  },
  timestamp: new Date().toISOString(),
});

module.exports = {
  success,
  error,
  paginated,
};

// src/middleware/apply-validation.js
/**
 * Wrapper para aplicar validación y CSRF token a las rutas
 */

const security = require('./security');
const auth = require('./auth');
const schemas = require('./validation-schemas');

/**
 * Middleware que aplica validación + CSRF + sanitización
 * @param {string} schemaName - Nombre del esquema de validación (ej: 'usuarioCreate')
 */
function validateAndProtect(schemaName) {
  return [
    auth.verificarToken,
    security.csrfProtection,
    security.detectAnomalies,
    security.auditLog,
    security.validateDataTypes(schemas[schemaName] || {}),
  ];
}

module.exports = {
  validateAndProtect,
  schemas,
};

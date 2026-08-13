// backend/src/config/db.js
// Archivo legado mantenido por compatibilidad. Toda la conexión real vive en src/db.js.
module.exports = require('../db');
module.exports.pool = require('../db').pool;

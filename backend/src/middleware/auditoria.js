// src/middleware/auditoria.js
// Registra en audit_log cada operación de escritura (POST, PUT, PATCH, DELETE) sobre /api.
// Se ejecuta al terminar la respuesta, así no bloquea ni altera la petición.
const pool = require('../db');

const METODOS_AUDITADOS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
// Rutas que no se registran (el login no tiene usuario autenticado aún)
const RUTAS_EXCLUIDAS = ['/api/auth/login'];
const CLAVES_SENSIBLES = /pass|contrasen|token|secret|csrf/i;
const MAX_DETALLE = 2000; // caracteres

// Quita valores sensibles y acota el tamaño del body guardado
function sanitizarBody(body) {
  if (!body || typeof body !== 'object' || Object.keys(body).length === 0) return null;

  const limpio = {};
  for (const [clave, valor] of Object.entries(body)) {
    limpio[clave] = CLAVES_SENSIBLES.test(clave) ? '***' : valor;
  }

  let json = JSON.stringify(limpio);
  if (json.length > MAX_DETALLE) {
    json = JSON.stringify({ _truncado: true, preview: json.slice(0, MAX_DETALLE) });
  }
  return json;
}

function auditoria(req, res, next) {
  if (!METODOS_AUDITADOS.has(req.method)) return next();
  if (!req.originalUrl.startsWith('/api/')) return next();
  if (RUTAS_EXCLUIDAS.some((r) => req.originalUrl.startsWith(r))) return next();

  res.on('finish', () => {
    // req.user lo asigna verificarToken en la ruta; si no existe, la acción no fue autenticada
    const usuario = req.user || {};
    const ip = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').toString().split(',')[0].trim();

    pool
      .query(
        `INSERT INTO audit_log (id_usuario, rol, metodo, ruta, status, ip, user_agent, detalles)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          usuario.id_usuario ?? null,
          usuario.rol ?? null,
          req.method,
          req.originalUrl.split('?')[0],
          res.statusCode,
          ip || null,
          (req.headers['user-agent'] || '').slice(0, 500),
          sanitizarBody(req.body),
        ]
      )
      .catch((err) => console.error('[AUDITORIA] No se pudo registrar la acción:', err.message));
  });

  next();
}

module.exports = auditoria;

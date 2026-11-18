// src/controllers/auditoria.controller.js
const pool = require('../db');

// GET /api/auditoria?page=1&limit=50&id_usuario=&metodo=&desde=YYYY-MM-DD&hasta=YYYY-MM-DD&ruta=
exports.listarAuditoria = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
  const offset = (page - 1) * limit;

  const condiciones = [];
  const valores = [];
  const agregar = (sql, valor) => {
    valores.push(valor);
    condiciones.push(sql.replace('?', `$${valores.length}`));
  };

  if (req.query.id_usuario) agregar('a.id_usuario = ?', parseInt(req.query.id_usuario, 10));
  if (req.query.metodo) agregar('a.metodo = ?', String(req.query.metodo).toUpperCase());
  if (req.query.desde) agregar('a.fecha >= ?', String(req.query.desde));
  if (req.query.hasta) agregar("a.fecha < (?::date + INTERVAL '1 day')", String(req.query.hasta));
  if (req.query.ruta) agregar('a.ruta ILIKE ?', `%${String(req.query.ruta)}%`);

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  try {
    const total = await pool.query(`SELECT COUNT(*)::int AS n FROM audit_log a ${where}`, valores);

    const filas = await pool.query(
      `SELECT a.id_audit, a.fecha, a.id_usuario, a.rol, a.metodo, a.ruta, a.status,
              a.ip, a.user_agent, a.detalles,
              u.nombre, u.apellido, u.email
       FROM audit_log a
       LEFT JOIN usuario u ON u.id_usuario = a.id_usuario
       ${where}
       ORDER BY a.fecha DESC, a.id_audit DESC
       LIMIT $${valores.length + 1} OFFSET $${valores.length + 2}`,
      [...valores, limit, offset]
    );

    res.json({
      data: filas.rows,
      page,
      limit,
      total: total.rows[0].n,
    });
  } catch (error) {
    console.error('Error al listar auditoría:', error);
    res.status(500).json({ message: 'Error al obtener la auditoría' });
  }
};

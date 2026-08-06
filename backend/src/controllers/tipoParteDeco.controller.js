// controllers/tipoParteDeco.controller.js
const pool = require('../db');

// GET /api/tipos-parte-deco
const obtenerTipos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id_tipo_parte_deco AS id,
        nombre_tipo_parte,
        estado,
        fecha_creacion
      FROM tipo_parte_deco
      WHERE estado = true
      ORDER BY nombre_tipo_parte
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('obtenerTipos error:', err);
    res.status(500).json({ error: 'Error al obtener tipos' });
  }
};

// POST /api/tipos-parte-deco
const crearTipo = async (req, res) => {
  const { nombre_tipo_parte } = req.body;
  if (!nombre_tipo_parte || !String(nombre_tipo_parte).trim()) {
    return res.status(400).json({ error: 'nombre_tipo_parte es obligatorio' });
  }
  const nombre = String(nombre_tipo_parte).trim();

  try {
    const dup = await pool.query(
      `SELECT 1 FROM tipo_parte_deco WHERE LOWER(nombre_tipo_parte) = LOWER($1) AND estado = true`,
      [nombre],
    );
    if (dup.rowCount > 0) {
      return res
        .status(409)
        .json({ error: 'Ya existe un tipo con ese nombre' });
    }

    const result = await pool.query(
      `INSERT INTO tipo_parte_deco (nombre_tipo_parte, estado, fecha_creacion)
       VALUES ($1, true, NOW())
       RETURNING id_tipo_parte_deco AS id, nombre_tipo_parte, estado, fecha_creacion`,
      [nombre],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('crearTipo error:', err);
    res.status(500).json({ error: 'Error al crear tipo' });
  }
};

// PUT /api/tipos-parte-deco/:id
const editarTipo = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre_tipo_parte, estado } = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  if (nombre_tipo_parte === undefined && estado === undefined) {
    return res.status(400).json({ error: 'Nada para actualizar' });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (nombre_tipo_parte !== undefined) {
    fields.push(`nombre_tipo_parte = $${idx++}`);
    values.push(String(nombre_tipo_parte).trim());
  }
  if (estado !== undefined) {
    const estadoBool =
      typeof estado === 'boolean'
        ? estado
        : String(estado).toLowerCase() === 'activo' ||
          String(estado).toLowerCase() === 'true';
    fields.push(`estado = $${idx++}`);
    values.push(estadoBool);
  }

  values.push(id);

  const query = `
    UPDATE tipo_parte_deco
    SET ${fields.join(', ')}
    WHERE id_tipo_parte_deco = $${idx}
    RETURNING id_tipo_parte_deco AS id, nombre_tipo_parte, estado, fecha_creacion
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Tipo no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('editarTipo error:', err);
    res.status(500).json({ error: 'Error al actualizar tipo' });
  }
};

// DELETE /api/tipos-parte-deco/:id -> soft delete
const eliminarTipo = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const result = await pool.query(
      `UPDATE tipo_parte_deco SET estado = false WHERE id_tipo_parte_deco = $1 AND estado = true RETURNING id_tipo_parte_deco AS id`,
      [id],
    );
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ error: 'Tipo no encontrado o ya inactivo' });
    res.json({ message: 'Tipo eliminado correctamente' });
  } catch (err) {
    console.error('eliminarTipo error:', err);
    res.status(500).json({ error: 'Error al eliminar tipo' });
  }
};

module.exports = {
  obtenerTipos,
  crearTipo,
  editarTipo,
  eliminarTipo,
};

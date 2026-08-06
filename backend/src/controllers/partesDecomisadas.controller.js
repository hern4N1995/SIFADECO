// controllers/partesDecomisadas.controller.js
const pool = require('../db');

// GET /api/partes-decomisadas
// Devuelve partes activas con nombre del tipo asociado (tipo_nombre)
const obtenerPartes = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        p.id_parte_decomisada AS id,
        p.nombre_parte,
        p.estado,
        p.fecha_creacion,
        p.id_tipo_parte_deco,
        t.nombre_tipo_parte AS tipo_nombre
      FROM parte_decomisada p
      LEFT JOIN tipo_parte_deco t ON p.id_tipo_parte_deco = t.id_tipo_parte_deco
      WHERE p.estado = true
      ORDER BY p.fecha_creacion DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('obtenerPartes error:', err);
    res.status(500).json({ error: 'Error al obtener partes decomisadas' });
  }
};

// POST /api/partes-decomisadas
// Body: { nombre_parte, id_tipo_parte_deco? }
const crearParte = async (req, res) => {
  const { nombre_parte, id_tipo_parte_deco } = req.body;
  if (!nombre_parte || !String(nombre_parte).trim()) {
    return res.status(400).json({ error: 'nombre_parte es obligatorio' });
  }
  const nombre = String(nombre_parte).trim();
  const tipoId = id_tipo_parte_deco || null;

  try {
    // si se quiere validar existencia del tipo:
    if (tipoId) {
      const chk = await pool.query(
        `SELECT 1 FROM tipo_parte_deco WHERE id_tipo_parte_deco = $1 AND estado = true`,
        [tipoId],
      );
      if (chk.rowCount === 0)
        return res.status(400).json({ error: 'Tipo de parte inválido' });
    }

    const result = await pool.query(
      `INSERT INTO parte_decomisada (id_tipo_parte_deco, nombre_parte, estado, fecha_creacion)
       VALUES ($1, $2, true, NOW())
       RETURNING id_parte_decomisada AS id, id_tipo_parte_deco, nombre_parte, estado, fecha_creacion`,
      [tipoId, nombre],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('crearParte error:', err);
    res.status(500).json({ error: 'Error al crear parte decomisada' });
  }
};

// PUT /api/partes-decomisadas/:id
// Body: { nombre_parte?, id_tipo_parte_deco?, estado? }
const editarParte = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { nombre_parte, id_tipo_parte_deco, estado } = req.body;

  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
  if (
    nombre_parte === undefined &&
    id_tipo_parte_deco === undefined &&
    estado === undefined
  ) {
    return res.status(400).json({ error: 'Nada para actualizar' });
  }

  const fields = [];
  const values = [];
  let idx = 1;

  if (id_tipo_parte_deco !== undefined) {
    // opcional: validar existencia
    if (id_tipo_parte_deco) {
      const chk = await pool.query(
        `SELECT 1 FROM tipo_parte_deco WHERE id_tipo_parte_deco = $1 AND estado = true`,
        [id_tipo_parte_deco],
      );
      if (chk.rowCount === 0)
        return res.status(400).json({ error: 'Tipo de parte inválido' });
    }
    fields.push(`id_tipo_parte_deco = $${idx++}`);
    values.push(id_tipo_parte_deco || null);
  }
  if (nombre_parte !== undefined) {
    fields.push(`nombre_parte = $${idx++}`);
    values.push(String(nombre_parte).trim());
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
    UPDATE parte_decomisada
    SET ${fields.join(', ')}
    WHERE id_parte_decomisada = $${idx}
    RETURNING id_parte_decomisada AS id, id_tipo_parte_deco, nombre_parte, estado, fecha_creacion
  `;

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0)
      return res.status(404).json({ error: 'Parte no encontrada' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('editarParte error:', err);
    res.status(500).json({ error: 'Error al actualizar parte decomisada' });
  }
};

// DELETE /api/partes-decomisadas/:id -> soft delete
const eliminarParte = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: 'ID inválido' });

  try {
    const result = await pool.query(
      `UPDATE parte_decomisada SET estado = false WHERE id_parte_decomisada = $1 AND estado = true RETURNING id_parte_decomisada AS id`,
      [id],
    );
    if (result.rowCount === 0)
      return res
        .status(404)
        .json({ error: 'Parte no encontrada o ya inactiva' });
    res.json({ message: 'Parte eliminada correctamente' });
  } catch (err) {
    console.error('eliminarParte error:', err);
    res.status(500).json({ error: 'Error al eliminar parte decomisada' });
  }
};

module.exports = {
  obtenerPartes,
  crearParte,
  editarParte,
  eliminarParte,
};

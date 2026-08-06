// controllers/productor.controller.js
const pool = require('../db');

// Obtener todos los productores activos
const obtenerProductores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id_productor,
        cuit,
        nombre
      FROM productor
      WHERE estado = true
      ORDER BY nombre
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener productores:', error);
    res.status(500).json({ error: 'Error al obtener productores' });
  }
};

// Crear nuevo productor
const crearProductor = async (req, res) => {
  const { cuit, nombre } = req.body;

  if (!cuit || !nombre) {
    return res.status(400).json({ error: 'CUIT y nombre son obligatorios' });
  }

  try {
    const existe = await pool.query(
      'SELECT 1 FROM productor WHERE cuit = $1 AND estado = true',
      [cuit],
    );
    if (existe.rowCount > 0) {
      return res.status(409).json({ error: 'El productor ya está registrado' });
    }

    const insert = await pool.query(
      `INSERT INTO productor (cuit, nombre, estado, creado_en)
       VALUES ($1, $2, true, NOW())
       RETURNING id_productor AS id, cuit, nombre`,
      [cuit, nombre],
    );

    res.status(201).json(insert.rows[0]);
  } catch (error) {
    console.error('Error al crear productor:', error);
    res.status(500).json({ error: 'Error al crear productor' });
  }
};

// Editar productor
const editarProductor = async (req, res) => {
  const { id } = req.params;
  const { cuit, nombre } = req.body;

  if (!cuit || !nombre) {
    return res.status(400).json({ error: 'CUIT y nombre son obligatorios' });
  }

  try {
    const update = await pool.query(
      `UPDATE productor
       SET cuit = $1, nombre = $2
       WHERE id_productor = $3 AND estado = true
       RETURNING id_productor AS id, cuit, nombre`,
      [cuit, nombre, id],
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'Productor no encontrado' });
    }

    res.json(update.rows[0]);
  } catch (error) {
    console.error('Error al editar productor:', error);
    res.status(500).json({ error: 'Error al editar productor' });
  }
};

// Eliminar productor (soft delete)
const eliminarProductor = async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`[eliminarProductor] Intentando eliminar productor ID: ${id}`);
    
    const update = await pool.query(
      `UPDATE productor
       SET estado = false
       WHERE id_productor = $1
       RETURNING id_productor AS id`,
      [id],
    );

    if (update.rowCount === 0) {
      console.warn(`[eliminarProductor] Productor no encontrado: ${id}`);
      return res.status(404).json({ error: 'Productor no encontrado' });
    }

    console.log(`[eliminarProductor] Productor eliminado exitosamente: ${id}`);
    res.json({
      mensaje: 'Productor eliminado correctamente',
      id: update.rows[0].id,
    });
  } catch (error) {
    console.error(`[eliminarProductor] Error al eliminar productor ${id}:`, error.message);
    res.status(500).json({ error: 'Error al eliminar productor', details: error.message });
  }
};

module.exports = {
  obtenerProductores,
  crearProductor,
  editarProductor,
  eliminarProductor,
};

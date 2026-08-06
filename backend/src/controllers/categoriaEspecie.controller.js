const pool = require('../db');

// Listar todas las categorías activas con nombre de especie
const getCategorias = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ce.id_cat_especie,
        ce.descripcion,
        ce.id_especie,
        e.descripcion AS especie
      FROM categoria_especie ce
      JOIN especie e ON ce.id_especie = e.id_especie
      WHERE ce.estado IS TRUE
      ORDER BY ce.id_cat_especie DESC
    `);
    res.status(200).json(result.rows);
  } catch (err) {
    console.error('Error al obtener categorías:', err.message);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
};

// Registrar nueva categoría
const registrarCategoria = async (req, res) => {
  const { descripcion, id_especie } = req.body;

  if (!descripcion || !id_especie) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO categoria_especie (descripcion, id_especie, estado)
       VALUES ($1, $2, TRUE)
       RETURNING id_cat_especie`,
      [descripcion.trim(), id_especie],
    );
    res.status(201).json({ id_cat_especie: result.rows[0].id_cat_especie });
  } catch (err) {
    console.error('Error al registrar categoría:', err.message);
    res.status(500).json({ error: 'Error al registrar categoría' });
  }
};

// Modificar categoría
const actualizarCategoria = async (req, res) => {
  const { id } = req.params;
  const { descripcion, id_especie } = req.body;

  if (!descripcion || !id_especie) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    await pool.query(
      `UPDATE categoria_especie
       SET descripcion = $1, id_especie = $2
       WHERE id_cat_especie = $3`,
      [descripcion.trim(), id_especie, id],
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al actualizar categoría:', err.message);
    res.status(500).json({ error: 'Error al actualizar categoría' });
  }
};

// Eliminación lógica
const eliminarCategoria = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query(
      `UPDATE categoria_especie SET estado = FALSE WHERE id_cat_especie = $1`,
      [id],
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al eliminar categoría:', err.message);
    res.status(500).json({ error: 'Error al eliminar categoría' });
  }
};

// Listar categorías por especie (solo activas)
const getCategoriasPorEspecie = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `
      SELECT id_cat_especie AS id, descripcion AS nombre
      FROM categoria_especie
      WHERE id_especie = $1 AND estado IS TRUE
      ORDER BY descripcion
      `,
      [id],
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Error al obtener categorías por especie:', error.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  getCategorias,
  registrarCategoria,
  actualizarCategoria,
  eliminarCategoria,
  getCategoriasPorEspecie,
};

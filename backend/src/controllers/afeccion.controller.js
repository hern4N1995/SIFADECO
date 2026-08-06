const pool = require('../db');

const registrarAfeccion = async (req, res) => {
  const { descripcion, id_especie } = req.body;

  if (!descripcion || !id_especie) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  try {
    const query = `
      INSERT INTO afeccion (descripcion, id_especie)
      VALUES ($1, $2)
      RETURNING id_afeccion, descripcion, id_especie
    `;
    const result = await pool.query(query, [descripcion, id_especie]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error al registrar afección:', err.message);
    res.status(500).json({ error: 'Error al registrar afección' });
  }
};

const listarAfecciones = async (req, res) => {
  try {
    const query = `
      SELECT 
        a.id_afeccion,
        a.descripcion,
        e.descripcion AS especie
      FROM afeccion a
      JOIN especie e ON a.id_especie = e.id_especie
      ORDER BY a.id_afeccion DESC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al listar afecciones:', err.message);
    res.status(500).json({ error: 'Error al listar afecciones' });
  }
};

const actualizarAfeccion = async (req, res) => {
  const { id } = req.params;
  const { descripcion, id_especie } = req.body;

  try {
    await pool.query(
      'UPDATE afeccion SET descripcion = $1, id_especie = $2 WHERE id_afeccion = $3',
      [descripcion, id_especie, id],
    );
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al actualizar afección:', err.message);
    res.status(500).json({ error: 'Error al actualizar afección' });
  }
};

const eliminarAfeccion = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM afeccion WHERE id_afeccion = $1', [id]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Error al eliminar afección:', err.message);
    res.status(500).json({ error: 'Error al eliminar afección' });
  }
};

module.exports = {
  registrarAfeccion,
  listarAfecciones,
  actualizarAfeccion,
  eliminarAfeccion,
};

const pool = require('../db');

const obtenerProvincias = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id_provincia AS id, descripcion FROM provincia ORDER BY descripcion',
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener provincias:', error);
    res.status(500).json({ error: 'Error al obtener provincias' });
  }
};

const agregarProvincia = async (req, res) => {
  const { descripcion } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO provincia (descripcion) VALUES ($1) RETURNING id_provincia AS id, descripcion',
      [descripcion],
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error al agregar provincia:', error);
    res.status(500).json({ error: 'Error al agregar provincia' });
  }
};

const editarProvincia = async (req, res) => {
  const { id } = req.params;
  const { descripcion } = req.body;
  try {
    await pool.query(
      'UPDATE provincia SET descripcion = $1 WHERE id_provincia = $2',
      [descripcion, id],
    );
    res.sendStatus(204);
  } catch (error) {
    console.error('Error al editar provincia:', error);
    res.status(500).json({ error: 'Error al editar provincia' });
  }
};

const eliminarProvincia = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM provincia WHERE id_provincia = $1', [id]);
    res.sendStatus(204);
  } catch (error) {
    console.error('Error al eliminar provincia:', error);
    res.status(500).json({ error: 'Error al eliminar provincia' });
  }
};

module.exports = {
  obtenerProvincias,
  agregarProvincia,
  editarProvincia,
  eliminarProvincia,
};

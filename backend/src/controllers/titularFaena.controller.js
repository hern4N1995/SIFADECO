const pool = require('../db');

const normalizarCuit = (value) => {
  if (value === undefined || value === null || value === '') return null;
  return String(value).replace(/\D/g, '');
};

// Obtener todos los titulares
const obtenerTitulares = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tf.id_titular_faena AS id,
              tf.nombre,
              tf.localidad,
              tf.direccion,
              tf.cuit,
              p.descripcion AS provincia,
              p.id_provincia 
       FROM titular_faena tf
       JOIN provincia p ON tf.id_provincia = p.id_provincia
       ORDER BY tf.id_titular_faena`,
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener titulares:', error.message);
    res.status(500).json({ error: 'Error al obtener titulares' });
  }
};

// Crear titular
const crearTitular = async (req, res) => {
  const { nombre, id_provincia, localidad, direccion, cuit, documento } = req.body;
  if (!nombre || !id_provincia || !localidad) {
    return res
      .status(400)
      .json({ error: 'Nombre, provincia y localidad son obligatorios' });
  }

  const cuitNormalizado = normalizarCuit(cuit ?? documento);
  if (cuitNormalizado && !/^\d{11}$/.test(cuitNormalizado)) {
    return res.status(400).json({ error: 'El CUIT debe tener exactamente 11 dígitos' });
  }

  try {
    // Insertar titular
    const insert = await pool.query(
      `INSERT INTO titular_faena (nombre, id_provincia, localidad, direccion, cuit)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id_titular_faena AS id, nombre, localidad, direccion, cuit, id_provincia`,
      [
        nombre.trim(),
        id_provincia,
        localidad.trim(),
        direccion || null,
        cuitNormalizado,
      ],
    );

    const nuevo = insert.rows[0];

    // Obtener nombre de provincia
    const provinciaRes = await pool.query(
      `SELECT descripcion FROM provincia WHERE id_provincia = $1`,
      [nuevo.id_provincia],
    );

    const provincia =
      provinciaRes.rows[0]?.descripcion || 'Provincia desconocida';

    // Devolver titular completo
    res.status(201).json({ ...nuevo, provincia });
  } catch (error) {
    console.error('Error al crear titular:', error.message);
    res.status(500).json({ error: 'Error al crear titular' });
  }
};

// Modificar titular
const modificarTitular = async (req, res) => {
  const { id } = req.params;
  const { nombre, id_provincia, localidad, direccion, cuit, documento } = req.body;

  const cuitNormalizado = normalizarCuit(cuit ?? documento);
  if (cuitNormalizado && !/^\d{11}$/.test(cuitNormalizado)) {
    return res.status(400).json({ error: 'El CUIT debe tener exactamente 11 dígitos' });
  }

  try {
    const update = await pool.query(
      `UPDATE titular_faena
       SET nombre = $1, id_provincia = $2, localidad = $3, direccion = $4, cuit = $5
       WHERE id_titular_faena = $6
       RETURNING id_titular_faena AS id, nombre, localidad, direccion, cuit, id_provincia`,
      [
        nombre.trim(),
        id_provincia,
        localidad.trim(),
        direccion || null,
        cuitNormalizado,
        id,
      ],
    );

    if (update.rowCount === 0) {
      return res.status(404).json({ error: 'Titular no encontrado' });
    }

    res.json(update.rows[0]);
  } catch (error) {
    console.error('Error al modificar titular:', error.message);
    res.status(500).json({ error: 'Error al modificar titular' });
  }
};

// Eliminar titular
const eliminarTitular = async (req, res) => {
  const { id } = req.params;
  try {
    const del = await pool.query(
      'DELETE FROM titular_faena WHERE id_titular_faena = $1',
      [id],
    );
    if (del.rowCount === 0) {
      return res.status(404).json({ error: 'Titular no encontrado' });
    }
    res.sendStatus(204);
  } catch (error) {
    console.error('Error al eliminar titular:', error.message);
    res.status(500).json({ error: 'Error al eliminar titular' });
  }
};

module.exports = {
  obtenerTitulares,
  crearTitular,
  modificarTitular,
  eliminarTitular,
};

const pool = require('../db');

// Obtener todos los departamentos con nombre de provincia
const obtenerDepartamentos = async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT 
        d.id_departamento, 
        d.nombre_departamento AS departamento, 
        p.descripcion AS provincia
      FROM departamento d
      JOIN provincia p ON d.id_provincia = p.id_provincia
      ORDER BY p.descripcion, d.nombre_departamento
    `);
    res.status(200).json(resultado.rows);
  } catch (error) {
    console.error('Error al obtener departamentos:', error.message);
    res.status(500).json({ error: 'Error al obtener departamentos' });
  }
};

// Crear nuevo departamento con id_provincia
// Crear nuevo departamento con id_provincia
const crearDepartamento = async (req, res) => {
  const { nombre_departamento, id_provincia } = req.body;

  if (!nombre_departamento || !id_provincia || isNaN(id_provincia)) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  try {
    // Verificar que la provincia exista
    const existeProvincia = await pool.query(
      'SELECT 1 FROM provincia WHERE id_provincia = $1',
      [id_provincia],
    );
    if (existeProvincia.rowCount === 0) {
      return res.status(400).json({ error: 'Provincia inexistente' });
    }

    // 🔹 Verificar que no exista el mismo departamento en la misma provincia
    const existeDepto = await pool.query(
      `SELECT 1 FROM departamento 
       WHERE LOWER(nombre_departamento) = LOWER($1) 
       AND id_provincia = $2`,
      [nombre_departamento.trim(), id_provincia],
    );
    if (existeDepto.rowCount > 0) {
      return res
        .status(400)
        .json({ error: 'El departamento ya existe en esta provincia' });
    }

    // Insertar
    await pool.query(
      'INSERT INTO departamento (nombre_departamento, id_provincia) VALUES ($1, $2)',
      [nombre_departamento.trim(), id_provincia],
    );

    // Devolver el registro recién creado
    const nuevo = await pool.query(
      `SELECT 
         d.id_departamento, 
         d.nombre_departamento AS departamento, 
         p.descripcion AS provincia
       FROM departamento d
       JOIN provincia p ON d.id_provincia = p.id_provincia
       WHERE d.nombre_departamento = $1 AND d.id_provincia = $2
       ORDER BY d.id_departamento DESC
       LIMIT 1`,
      [nombre_departamento.trim(), id_provincia],
    );

    res.status(201).json(nuevo.rows[0]);
  } catch (error) {
    console.error('Error al crear departamento:', error.message);
    res.status(500).json({ error: 'Error al crear departamento' });
  }
};

// Editar nombre del departamento
// editarDepartamento (reemplazar en departamento.controller.js)
const editarDepartamento = async (req, res) => {
  const { id } = req.params;
  const { nombre_departamento, id_provincia: bodyIdProvincia } = req.body;

  if (!nombre_departamento || typeof nombre_departamento !== 'string') {
    return res.status(400).json({ error: 'Nombre de departamento inválido' });
  }

  try {
    // 1) Obtener registro actual para conocer su id_provincia si el cliente no lo pasó
    const cur = await pool.query(
      'SELECT id_departamento, id_provincia FROM departamento WHERE id_departamento = $1',
      [id],
    );
    if (cur.rowCount === 0) {
      return res.status(404).json({ error: 'Departamento no encontrado' });
    }
    const current = cur.rows[0];
    const idProvincia = bodyIdProvincia ?? current.id_provincia;

    // 2) validar que la provincia exista
    const prov = await pool.query(
      'SELECT 1 FROM provincia WHERE id_provincia = $1',
      [idProvincia],
    );
    if (prov.rowCount === 0) {
      return res.status(400).json({ error: 'Provincia inexistente' });
    }

    // 3) comprobar duplicado (excluir el propio id)
    const exists = await pool.query(
      `SELECT 1 FROM departamento
       WHERE LOWER(nombre_departamento) = LOWER($1)
         AND id_provincia = $2
         AND id_departamento <> $3
       LIMIT 1`,
      [nombre_departamento.trim(), idProvincia, id],
    );
    if (exists.rowCount > 0) {
      return res
        .status(409)
        .json({
          error: 'Ya existe un departamento con ese nombre en la provincia',
        });
    }

    // 4) actualizar
    await pool.query(
      'UPDATE departamento SET nombre_departamento = $1, id_provincia = $2 WHERE id_departamento = $3',
      [nombre_departamento.trim(), idProvincia, id],
    );

    // 5) devolver fila actualizada con provincia (para que frontend muestre label)
    const updated = await pool.query(
      `SELECT d.id_departamento, d.nombre_departamento AS departamento, d.id_provincia,
              p.descripcion AS provincia
       FROM departamento d
       JOIN provincia p ON d.id_provincia = p.id_provincia
       WHERE d.id_departamento = $1`,
      [id],
    );

    res.status(200).json(updated.rows[0]);
  } catch (error) {
    console.error('Error al editar departamento:', error.message);
    res.status(500).json({ error: 'Error al editar departamento' });
  }
};

// Eliminar departamento
const eliminarDepartamento = async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM departamento WHERE id_departamento = $1', [
      id,
    ]);
    res.status(200).json({ mensaje: 'Departamento eliminado' });
  } catch (error) {
    console.error('Error al eliminar departamento:', error.message);
    res.status(500).json({ error: 'Error al eliminar departamento' });
  }
};

module.exports = {
  obtenerDepartamentos,
  crearDepartamento,
  editarDepartamento,
  eliminarDepartamento,
};

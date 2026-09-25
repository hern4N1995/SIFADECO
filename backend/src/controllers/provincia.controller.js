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
  let { descripcion } = req.body;
  
  try {
    // Validar entrada
    if (!descripcion || !descripcion.trim()) {
      return res.status(400).json({ error: 'La descripción es obligatoria' });
    }
    
    descripcion = descripcion.trim();
    
    // Validar longitud (máximo 20 caracteres)
    if (descripcion.length > 20) {
      return res.status(400).json({ 
        error: `La descripción no puede exceder 20 caracteres (tienes ${descripcion.length})`,
        descripcion,
        length: descripcion.length,
        max: 20
      });
    }
    
    console.log(`[PROVINCIA] Intentando insertar: "${descripcion}" (${descripcion.length} caracteres)`);
    
    const result = await pool.query(
      'INSERT INTO provincia (descripcion) VALUES ($1) RETURNING id_provincia AS id, descripcion',
      [descripcion],
    );
    
    console.log(`[PROVINCIA] ✅ Inserción exitosa: ID=${result.rows[0].id}, Descripción=${result.rows[0].descripcion}`);
    res.status(201).json(result.rows[0]);
    
  } catch (error) {
    console.error('[PROVINCIA ERROR]', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    
    // Manejo específico de errores
    if (error.code === '23505') {
      // UNIQUE constraint violation
      return res.status(400).json({ 
        error: 'Esta provincia ya existe',
        code: 'DUPLICATE_PROVINCIA'
      });
    }
    
    if (error.code === '23502') {
      // NOT NULL constraint violation
      return res.status(400).json({ 
        error: 'El campo descripción es obligatorio',
        code: 'NOT_NULL_VIOLATION'
      });
    }
    
    if (error.code === '23514') {
      // CHECK constraint violation
      return res.status(400).json({ 
        error: 'Los datos no cumplen las restricciones de la tabla',
        code: 'CHECK_VIOLATION',
        detail: error.detail
      });
    }
    
    // Error genérico
    res.status(500).json({ 
      error: 'Error al agregar provincia',
      message: error.message,
      code: error.code
    });
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

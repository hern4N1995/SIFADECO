const obtenerCombinaciones = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ce.id_cat_enfermedad,
        ce.nombre AS categoria,
        e.id_enfermedad,
        e.nombre AS enfermedad
      FROM enfermedad e
      JOIN categoria_enfermedad ce ON e.id_cat_enfermedad = ce.id_cat_enfermedad
      ORDER BY ce.nombre, e.nombre
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener combinaciones:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = { obtenerCombinaciones };

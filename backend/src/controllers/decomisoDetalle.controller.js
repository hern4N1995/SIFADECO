const pool = require('../db');

const registrarDetalleDecomiso = async (req, res) => {
  const { id_decomiso, id_enfermedad, id_parte, cantidad } = req.body;

  try {
    const query = `
      INSERT INTO decomiso_detalle (id_decomiso, id_enfermedad, id_parte, cantidad)
      VALUES ($1, $2, $3, $4)
      RETURNING id_decomiso_detalle
    `;

    const result = await pool.query(query, [
      id_decomiso,
      id_enfermedad,
      id_parte,
      cantidad,
    ]);

    res.status(201).json({
      message: 'Detalle de decomiso registrado correctamente',
      id_decomiso_detalle: result.rows[0].id_decomiso_detalle,
    });
  } catch (error) {
    console.error('❌ Error al registrar detalle de decomiso:', error.message);
    res.status(500).json({ error: 'Error al registrar detalle de decomiso' });
  }
};

module.exports = {
  registrarDetalleDecomiso,
};

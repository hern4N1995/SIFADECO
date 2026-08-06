const pool = require('../db');

const registrarFaena = async (req, res) => {
  const { id_tropa, fecha_faena, hora_faena, categorias } = req.body;

  if (
    !id_tropa ||
    !fecha_faena ||
    !Array.isArray(categorias) ||
    categorias.length === 0
  ) {
    return res.status(400).json({ error: 'Datos incompletos o inválidos' });
  }

  try {
    // Normalizar fecha y hora: construir timestamp completo
    let fechaNormalizada = fecha_faena;
    let horaFormato = hora_faena || '00:00:00'; // Por defecto 00:00:00 si no se proporciona
    
    if (typeof fecha_faena === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha_faena)) {
      // Es una fecha sin hora en formato YYYY-MM-DD
      // Construir timestamp: YYYY-MM-DDTHH:mm:ssZ
      if (typeof hora_faena === 'string' && /^\d{2}:\d{2}/.test(hora_faena)) {
        // Hora en formato HH:mm:ss
        horaFormato = hora_faena.substring(0, 8); // Tomar HH:mm:ss
      }
      fechaNormalizada = `${fecha_faena}T${horaFormato}Z`;
    } else if (typeof fecha_faena === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(fecha_faena)) {
      // Ya es un timestamp, usar tal cual
      fechaNormalizada = fecha_faena;
    }
    
    console.log('[registrarFaena] Fecha recibida:', fecha_faena, 'Hora:', hora_faena, 'Normalizada:', fechaNormalizada);
    
    // Insertar faena principal
    const faenaRes = await pool.query(
      `INSERT INTO faena (id_tropa, fecha_faena) VALUES ($1, $2) RETURNING id_faena, fecha_faena`,
      [id_tropa, fechaNormalizada],
    );

    const id_faena = faenaRes.rows[0].id_faena;
    const fechaGuardada = faenaRes.rows[0].fecha_faena;
    console.log('[registrarFaena] Fecha guardada en BD:', fechaGuardada);
    
    const detallesInsertados = [];

    for (const cat of categorias) {
      const { id_tropa_detalle, cantidad } = cat;

      if (!id_tropa_detalle || typeof cantidad !== 'number' || cantidad <= 0) {
        console.warn('❌ Categoría inválida:', cat);
        continue;
      }

      // Validar remanente disponible
      const remanenteRes = await pool.query(
        `SELECT cantidad - COALESCE((
           SELECT SUM(cantidad_faena)
           FROM faena_detalle
           WHERE id_tropa_detalle = $1
         ), 0) AS remanente
         FROM tropa_detalle
         WHERE id_tropa_detalle = $1`,
        [id_tropa_detalle],
      );

      const remanente = remanenteRes.rows[0]?.remanente ?? 0;

      if (cantidad > remanente) {
        return res.status(400).json({
          error: `La cantidad (${cantidad}) excede el remanente disponible (${remanente}) para id_tropa_detalle ${id_tropa_detalle}`,
        });
      }

      // Insertar detalle de faena
      await pool.query(
        `INSERT INTO faena_detalle (id_faena, id_tropa_detalle, cantidad_faena)
         VALUES ($1, $2, $3)`,
        [id_faena, id_tropa_detalle, cantidad],
      );

      detallesInsertados.push({ id_tropa_detalle, cantidad });
    }

    res.status(201).json({
      id_faena,
      id_tropa,
      fecha_faena,
      hora_faena: horaFormato,
      detalles: detallesInsertados,
    });
  } catch (err) {
    console.error('Error al registrar faena:', err.message);
    res.status(500).json({ error: 'Error interno al registrar faena' });
  }
};

module.exports = { registrarFaena };

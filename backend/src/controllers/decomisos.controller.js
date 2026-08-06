const pool = require('../db');

// 🔍 Cargar combinaciones ya registradas en parte_deco_afeccion
const obtenerCombinaciones = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        tp.id_tipo_parte_deco,
        tp.nombre_tipo_parte AS tipo_parte,
        pd.id_parte_decomisada,
        pd.nombre_parte AS parte,
        a.id_afeccion,
        a.descripcion AS afeccion
      FROM parte_deco_afeccion pda
      JOIN parte_decomisada pd ON pda.id_parte_decomisada = pd.id_parte_decomisada
      JOIN tipo_parte_deco tp ON pd.id_tipo_parte_deco = tp.id_tipo_parte_deco
      JOIN afeccion a ON pda.id_afeccion = a.id_afeccion
      ORDER BY tp.nombre_tipo_parte, pd.nombre_parte, a.descripcion;
    `);

    res.json(result.rows || []);
  } catch (err) {
    console.error('❌ Error al obtener combinaciones:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// 📦 Cargar todos los tipos, partes y afecciones desde la base
const obtenerDatosBaseDecomiso = async (req, res) => {
  try {
    const [tiposParte, partes, afecciones] = await Promise.all([
      pool.query(`
        SELECT id_tipo_parte_deco, nombre_tipo_parte
        FROM tipo_parte_deco
        WHERE estado = true
        ORDER BY nombre_tipo_parte;
      `),
      pool.query(`
        SELECT id_parte_decomisada, nombre_parte, id_tipo_parte_deco
        FROM parte_decomisada
        WHERE estado = true
        ORDER BY nombre_parte;
      `),
      pool.query(`
        SELECT a.id_afeccion, a.descripcion, e.descripcion AS especie
        FROM afeccion a
        JOIN especie e ON a.id_especie = e.id_especie
        ORDER BY a.descripcion;
      `),
    ]);

    res.json({
      tiposParte: tiposParte.rows,
      partes: partes.rows,
      afecciones: afecciones.rows,
    });
  } catch (err) {
    console.error('❌ Error al obtener datos base de decomiso:', err.message);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Obtener resumen decomiso
const obtenerResumenDecomiso = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT
        d.id_decomiso,
        d.fecha_decomiso,
        fd.id_faena_detalle,
        t.n_tropa,
        t.dte_dtu,
        f.fecha_faena,
        fd.cantidad_faena,
        dd.id_decomiso_detalle,
        dd.cantidad,
        dd.peso_kg,
        dd.animales_afectados,
        dd.destino_decomiso,
        dd.observaciones,
        tp.nombre_tipo_parte,
        pd.nombre_parte,
        a.descripcion AS afeccion
      FROM decomiso d
      JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
      JOIN tropa_detalle td ON fd.id_tropa_detalle = td.id_tropa_detalle
      JOIN tropa t ON t.id_tropa = td.id_tropa
      JOIN decomiso_detalle dd ON d.id_decomiso = dd.id_decomiso
      JOIN parte_decomisada pd ON dd.id_parte_decomisada = pd.id_parte_decomisada
      JOIN tipo_parte_deco tp ON pd.id_tipo_parte_deco = tp.id_tipo_parte_deco
      JOIN afeccion a ON dd.id_afeccion = a.id_afeccion
      JOIN faena f ON f.id_faena = fd.id_faena
      WHERE d.id_decomiso = $1`,
      [id],
    );

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al obtener resumen para id:', id);
    console.error(err.stack || err.message || err);
    res.status(500).json({ error: 'Error al obtener resumen del decomiso' });
  }
};

const listarDecomisos = async (req, res) => {
  try {
    // Limitar a 100 decomisos para evitar timeouts (paginación en frontend)
    const limit = 100;
    const result = await pool.query(`
      SELECT 
        d.id_decomiso,
        d.fecha_decomiso,
        f.id_faena,
        f.fecha_faena,
        t.n_tropa,
        t.dte_dtu,
        t.id_planta,
        t.fecha_ingreso,
        p.nombre AS nombre_planta,
        (SELECT SUM(cantidad) FROM tropa_detalle WHERE id_tropa = t.id_tropa) AS cantidad_tropa,
        (SELECT SUM(cantidad_faena) FROM faena_detalle WHERE id_faena = f.id_faena) AS cantidad_faena,
        dd.id_decomiso_detalle,
        dd.id_parte_decomisada,
        dd.id_afeccion,
        dd.cantidad,
        dd.peso_kg,
        dd.animales_afectados,
        dd.destino_decomiso,
        dd.observaciones,
        tp.nombre_tipo_parte,
        pd.nombre_parte,
        a.descripcion AS afeccion
      FROM decomiso d
      JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
      JOIN faena f ON fd.id_faena = f.id_faena
      JOIN tropa_detalle td ON fd.id_tropa_detalle = td.id_tropa_detalle
      JOIN tropa t ON td.id_tropa = t.id_tropa
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      LEFT JOIN decomiso_detalle dd ON d.id_decomiso = dd.id_decomiso
      LEFT JOIN parte_decomisada pd ON dd.id_parte_decomisada = pd.id_parte_decomisada
      LEFT JOIN tipo_parte_deco tp ON pd.id_tipo_parte_deco = tp.id_tipo_parte_deco
      LEFT JOIN afeccion a ON dd.id_afeccion = a.id_afeccion
      ORDER BY d.fecha_decomiso DESC, d.id_decomiso DESC
      LIMIT $1;
    `, [limit]);

    if (result.rows.length > 0) {
      console.log('[listarDecomisos] First row keys:', Object.keys(result.rows[0]));
      console.log('[listarDecomisos] First row fecha_ingreso:', result.rows[0].fecha_ingreso);
      console.log('[listarDecomisos] First row fecha_decomiso:', result.rows[0].fecha_decomiso);
    }

    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error al listar decomisos:', err.message);
    res.status(500).json({ error: 'Error al listar decomisos' });
  }
};

// 📄 Obtener info de faena desde un id_decomiso
const obtenerInfoFaenaPorDecomiso = async (req, res) => {
  const { id_decomiso } = req.params;

  try {
    const query = `
      SELECT 
        f.fecha_faena,
        t.dte_dtu,
        t.n_tropa
      FROM decomiso d
      JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
      JOIN faena f ON fd.id_faena = f.id_faena
      JOIN tropa_detalle td ON fd.id_tropa_detalle = td.id_tropa_detalle
      JOIN tropa t ON td.id_tropa = t.id_tropa
      WHERE d.id_decomiso = $1
    `;

    const resultado = await pool.query(query, [id_decomiso]);

    if (resultado.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'No se encontró información para el decomiso' });
    }

    res.json(resultado.rows[0]);
  } catch (error) {
    console.error('❌ Error al obtener info de faena:', error.message);
    res.status(500).json({ error: 'Error al obtener info de faena' });
  }
};

// 📝 Registrar decomiso y crear combinación parte + afección si no existe
const registrarDecomiso = async (req, res) => {
  const detalles = req.body;

  try {
    if (!Array.isArray(detalles) || detalles.length === 0) {
      return res.status(400).json({ error: 'Payload inválido o vacío' });
    }

    const { id_faena_detalle, fecha_decomiso } = detalles[0];

    if (!id_faena_detalle) {
      return res.status(400).json({ error: 'Falta id_faena_detalle' });
    }

    if (!fecha_decomiso) {
      return res.status(400).json({ error: 'Falta fecha_decomiso' });
    }

    // Paso 1: Insertar en decomiso con fecha_decomiso
    const result = await pool.query(
      `INSERT INTO decomiso (id_faena_detalle, fecha_decomiso) VALUES ($1, $2) RETURNING id_decomiso`,
      [id_faena_detalle, fecha_decomiso],
    );

    const id_decomiso = result.rows[0].id_decomiso;

    // ---------------------------
    // Normalizar y validar payload
    // ---------------------------
    const detallesNormalizados = detalles.map((d) => {
      // parsear peso: aceptar números o strings con coma/punto
      const parsedPeso =
        d.peso_kg !== undefined &&
        d.peso_kg !== null &&
        String(d.peso_kg).trim() !== ''
          ? Number(String(d.peso_kg).replace(',', '.'))
          : NaN;
      const peso = Number.isFinite(parsedPeso) ? parsedPeso : 0;

      // cantidad
      const parsedCantidad =
        d.cantidad !== undefined &&
        d.cantidad !== null &&
        String(d.cantidad).trim() !== ''
          ? Number(String(d.cantidad).replace(',', '.'))
          : NaN;
      const cantidad = Number.isFinite(parsedCantidad) ? parsedCantidad : 0;

      // animales afectadps
      const parsedAnimales =
        d.animales_afectados !== undefined &&
        d.animales_afectados !== null &&
        String(d.animales_afectados).trim() !== ''
          ? Number(String(d.animales_afectados).replace(',', '.'))
          : NaN;
      const animales_afectados = Number.isFinite(parsedAnimales)
        ? parsedAnimales
        : 0;

      return {
        ...d,
        peso_kg: peso,
        cantidad,
        animales_afectados,
      };
    });

    // Paso 2: Insertar cada detalle usando detallesNormalizados
    for (const d of detallesNormalizados) {
      // Verificar si la combinación parte + afección existe
      const existe = await pool.query(
        `SELECT 1 FROM parte_deco_afeccion
         WHERE id_parte_decomisada = $1 AND id_afeccion = $2`,
        [d.id_parte_decomisada, d.id_afeccion],
      );

      if (existe.rowCount === 0) {
        await pool.query(
          `INSERT INTO parte_deco_afeccion (id_parte_decomisada, id_afeccion)
           VALUES ($1, $2)`,
          [d.id_parte_decomisada, d.id_afeccion],
        );
      }

      // Insertar detalle del decomiso (peso_kg ya es número, no usamos || null que convierta 0 en null)
      await pool.query(
        `INSERT INTO decomiso_detalle (
          id_decomiso,
          id_parte_decomisada,
          id_afeccion,
          cantidad,
          animales_afectados,
          peso_kg,
          destino_decomiso,
          observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id_decomiso,
          d.id_parte_decomisada,
          d.id_afeccion,
          d.cantidad,
          d.animales_afectados,
          d.peso_kg,
          d.destino_decomiso || null,
          d.observaciones || null,
        ],
      );
    }

    res.status(201).json({ id_decomiso });
  } catch (error) {
    console.error('❌ Error al registrar decomisos:', error.message);
    res.status(500).json({ error: 'Error al registrar decomisos' });
  }
};

const actualizarDecomiso = async (req, res) => {
  const { id } = req.params;
  const detalles = req.body;

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res.status(400).json({ error: 'Payload inválido o vacío' });
  }

  const firstDetalle = detalles[0];
  const fechaDecomiso = firstDetalle?.fecha_decomiso;
  if (!fechaDecomiso) {
    return res.status(400).json({ error: 'Falta fecha_decomiso' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const decomisoResult = await client.query(
      `SELECT 
        d.fecha_decomiso,
        fd.cantidad_faena
       FROM decomiso d
       JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
       WHERE d.id_decomiso = $1`,
      [id],
    );
    if (decomisoResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Decomiso no encontrado' });
    }

    const fechaOriginal = decomisoResult.rows[0].fecha_decomiso;
    const cantidadFaena = decomisoResult.rows[0].cantidad_faena || 0;
    
    const fechaOriginalDate = new Date(fechaOriginal);
    const now = new Date();
    const diffDays = (now - fechaOriginalDate) / (1000 * 60 * 60 * 24);
    if (diffDays > 7) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error: 'El período de edición de 7 días ha expirado para este decomiso',
      });
    }

    // Validar que la cantidad total decomisada no supere la cantidad faenada
    const totalDecomiso = detalles.reduce((sum, d) => {
      const cantidad = d.cantidad !== undefined && d.cantidad !== null && String(d.cantidad).trim() !== ''
        ? Number(String(d.cantidad).replace(',', '.'))
        : 0;
      return sum + (Number.isFinite(cantidad) ? cantidad : 0);
    }, 0);

    if (totalDecomiso > cantidadFaena) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `La cantidad total de decomiso (${totalDecomiso}) no puede superar la cantidad faenada (${cantidadFaena}).`,
      });
    }

    await client.query(
      'UPDATE decomiso SET fecha_decomiso = $1 WHERE id_decomiso = $2',
      [fechaDecomiso, id],
    );

    await client.query('DELETE FROM decomiso_detalle WHERE id_decomiso = $1', [id]);

    for (const d of detalles) {
      const parsedPeso =
        d.peso_kg !== undefined && d.peso_kg !== null && String(d.peso_kg).trim() !== ''
          ? Number(String(d.peso_kg).replace(',', '.'))
          : NaN;
      const peso = Number.isFinite(parsedPeso) ? parsedPeso : 0;

      const parsedCantidad =
        d.cantidad !== undefined && d.cantidad !== null && String(d.cantidad).trim() !== ''
          ? Number(String(d.cantidad).replace(',', '.'))
          : NaN;
      const cantidad = Number.isFinite(parsedCantidad) ? parsedCantidad : 0;

      const parsedAnimales =
        d.animales_afectados !== undefined &&
        d.animales_afectados !== null &&
        String(d.animales_afectados).trim() !== ''
          ? Number(String(d.animales_afectados).replace(',', '.'))
          : NaN;
      const animales_afectados = Number.isFinite(parsedAnimales)
        ? parsedAnimales
        : 0;

      const existe = await client.query(
        `SELECT 1 FROM parte_deco_afeccion
         WHERE id_parte_decomisada = $1 AND id_afeccion = $2`,
        [d.id_parte_decomisada, d.id_afeccion],
      );
      if (existe.rowCount === 0) {
        await client.query(
          `INSERT INTO parte_deco_afeccion (id_parte_decomisada, id_afeccion)
           VALUES ($1, $2)`,
          [d.id_parte_decomisada, d.id_afeccion],
        );
      }

      await client.query(
        `INSERT INTO decomiso_detalle (
          id_decomiso,
          id_parte_decomisada,
          id_afeccion,
          cantidad,
          animales_afectados,
          peso_kg,
          destino_decomiso,
          observaciones
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          id,
          d.id_parte_decomisada,
          d.id_afeccion,
          cantidad,
          animales_afectados,
          peso,
          d.destino_decomiso || null,
          d.observaciones || null,
        ],
      );
    }

    await client.query('COMMIT');
    res.json({ message: 'Decomiso actualizado correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error al actualizar decomiso:', error.message);
    res.status(500).json({ error: 'Error al actualizar decomiso' });
  } finally {
    client.release();
  }
};

module.exports = {
  obtenerCombinaciones,
  obtenerDatosBaseDecomiso,
  obtenerInfoFaenaPorDecomiso,
  registrarDecomiso,
  actualizarDecomiso,
  obtenerResumenDecomiso,
  listarDecomisos,
};

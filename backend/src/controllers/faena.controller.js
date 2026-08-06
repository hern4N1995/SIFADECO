const pool = require('../db');

const EDICION_FAENA_VENTANA_HORAS = 48;
const EDICION_FAENA_VENTANA_MS = EDICION_FAENA_VENTANA_HORAS * 60 * 60 * 1000;

// Obtener tropas con remanente para faenar
const obtenerFaenas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id_tropa,
        t.fecha,
        t.dte_dtu,
        t.guia_policial,
        t.n_tropa,
        pr.nombre AS productor,
        d.nombre_departamento AS departamento,
        tf.nombre AS titular_faena,
        (
          SELECT e.descripcion
          FROM tropa_detalle td
          JOIN especie e ON td.id_especie = e.id_especie
          WHERE td.id_tropa = t.id_tropa
          LIMIT 1
        ) AS especie,
        (
          SELECT SUM(td.cantidad - COALESCE((
            SELECT SUM(fd.cantidad_faena)
            FROM faena_detalle fd
            WHERE fd.id_tropa_detalle = td.id_tropa_detalle
          ), 0))
          FROM tropa_detalle td
          WHERE td.id_tropa = t.id_tropa
        ) AS total_a_faenar
      FROM tropa t
      LEFT JOIN productor pr ON t.id_productor = pr.id_productor
      LEFT JOIN departamento d ON t.id_departamento = d.id_departamento
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      ORDER BY t.fecha DESC;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener faenas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Crear una nueva faena
const crearFaena = async (req, res) => {
  try {
    const {
      fecha,
      dte,
      guiaPolicial,
      nroUsuario,
      guiaExtendida,
      procedencia,
      titular,
    } = req.body;

    const resultado = await pool.query(
      `INSERT INTO faenas (fecha, dte, guia_policial, nro_usuario, guia_extendida, procedencia, titular)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        fecha,
        dte,
        guiaPolicial,
        nroUsuario,
        guiaExtendida,
        procedencia,
        titular,
      ],
    );

    res.status(201).json(resultado.rows[0]);
  } catch (error) {
    console.error('Error al crear faena:', error);
    res.status(500).json({ error: 'Error al crear faena' });
  }
};

// Obtener faenas realizadas con filtros y paginación
// Obtener faenas realizadas con filtros, paginación y total_faenados
const obtenerFaenasRealizadas = async (req, res) => {
  const {
    desde = '',
    hasta = '',
    n_tropa = '',
    id_especie = '',
    id_provincia = '',
    id_planta = '',
    limit = '100', // por defecto mayor para permitir sumar en backend
    offset = '0',
  } = req.query;

  const filtros = [];
  const valores = [];

  // Filtro de planta del usuario (solo si NO es admin)
  const idPlantaUsuario = req.user?.id_planta;
  const rolUsuario = req.user?.rol;
  
  // Solo usuarios no-admin (rol !== 1) ven filtrados por su planta
  if (idPlantaUsuario && rolUsuario !== 1) {
    valores.push(idPlantaUsuario);
    filtros.push(`t.id_planta = $${valores.length}`);
  }

  if (String(desde).trim()) {
    valores.push(desde);
    filtros.push(`f.fecha_faena::date >= $${valores.length}`);
  }
  if (String(hasta).trim()) {
    valores.push(hasta);
    filtros.push(`f.fecha_faena::date <= $${valores.length}`);
  }
  if (String(n_tropa).trim()) {
    valores.push(`^${n_tropa}`);
    filtros.push(`t.n_tropa::text ~ $${valores.length}`);
  }

  if (String(id_especie).trim()) {
    valores.push(id_especie);
    filtros.push(`esp.id_especie = $${valores.length}`);
  }
  if (String(id_provincia).trim()) {
    valores.push(id_provincia);
    filtros.push(`prov.id_provincia = $${valores.length}`);
  }
  if (String(id_planta).trim()) {
    valores.push(id_planta);
    filtros.push(`t.id_planta = $${valores.length}`);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : '';

  const limitNum = parseInt(limit, 10) || 100;
  const offsetNum = parseInt(offset, 10) || 0;

  try {
    // Query principal: devuelve UNA SOLA FILA por faena con TODAS las especies agregadas
    const query = `
      SELECT
        f.id_faena,
        f.fecha_faena,
        t.dte_dtu,
        t.guia_policial,
        t.n_tropa,
        t.id_planta,
        p.nombre AS nombre_planta,
        prod.nombre AS productor,
        depto.nombre_departamento AS departamento,
        tf.nombre AS titular_faena,
        STRING_AGG(DISTINCT esp.descripcion, ', ') AS especie,
        SUM(fd.cantidad_faena)::int AS total_faenado,
        t.id_tropa,
        prov.id_provincia
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN productor prod ON t.id_productor = prod.id_productor
      JOIN departamento depto ON t.id_departamento = depto.id_departamento
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN provincia prov ON depto.id_provincia = prov.id_provincia
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      ${where}
      GROUP BY f.id_faena, f.fecha_faena, t.dte_dtu, t.guia_policial, t.n_tropa, t.id_planta, p.nombre,
               prod.nombre, depto.nombre_departamento, tf.nombre, t.id_tropa, prov.id_provincia
      ORDER BY f.fecha_faena DESC, f.id_faena DESC
      LIMIT $${valores.length + 1} OFFSET $${valores.length + 2};
    `;

    const resultado = await pool.query(query, [
      ...valores,
      limitNum,
      offsetNum,
    ]);

    const faenas = resultado.rows || [];

    // Calcular total faenados de todas las faenas filtradas
    const totalFaenadosQuery = `
      SELECT SUM(fd.cantidad_faena)::int as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN departamento depto ON t.id_departamento = depto.id_departamento
      LEFT JOIN provincia prov ON depto.id_provincia = prov.id_provincia
      ${where}
    `;
    const totalFaenadosResult = await pool.query(totalFaenadosQuery, valores);
    const totalFaenados = parseInt(totalFaenadosResult.rows[0].total || 0);

    // Calcular sum_faenado por tropa de las faenas filtradas
    const sumFaenadoPerTropaQuery = `
      SELECT t.id_tropa, SUM(fd.cantidad_faena)::int as sum_faenado
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN departamento depto ON t.id_departamento = depto.id_departamento
      LEFT JOIN provincia prov ON depto.id_provincia = prov.id_provincia
      ${where}
      GROUP BY t.id_tropa
    `;
    const sumFaenadoResult = await pool.query(sumFaenadoPerTropaQuery, valores);
    const sumFaenadoByTropa = sumFaenadoResult.rows.reduce((acc, row) => {
      acc[row.id_tropa] = Number(row.sum_faenado);
      return acc;
    }, {});

    // Obtener todas las tropas que coinciden con los filtros de tropas (incluyendo las que NO tienen faenas)
    // Extraer IDs de tropas de las faenas ya retornadas (esto asegura que usamos las mismas tropas que la query de faenas)
    const allTropasIds = [...new Set(faenas.map(f => f.id_tropa))];

    let fullyFaenadaCount = 0;
    let totalCantidadByTropa = {};
    
    if (allTropasIds.length > 0) {
      // Query con los mismos filtros que la query principal (especie, provincia)
      const idsPlaceholders = allTropasIds.map((_, i) => `$${i + 1}`).join(',');
      
      // Construir filtros adicionales para esta query
      let filtrosAdicionales = [];
      let valoresAdicionales = [];
      
      if (String(id_especie).trim()) {
        valoresAdicionales.push(id_especie);
        filtrosAdicionales.push(`esp.id_especie = $${allTropasIds.length + valoresAdicionales.length}`);
      }
      if (String(id_provincia).trim()) {
        valoresAdicionales.push(id_provincia);
        filtrosAdicionales.push(`prov.id_provincia = $${allTropasIds.length + valoresAdicionales.length}`);
      }
      
      const whereAdicionales = filtrosAdicionales.length > 0 ? `AND ${filtrosAdicionales.join(' AND ')}` : '';
      
      const totalCantidadQuery = `
        SELECT td.id_tropa, SUM(td.cantidad)::int as total_cantidad
        FROM tropa_detalle td
        JOIN especie esp ON td.id_especie = esp.id_especie
        JOIN tropa t ON td.id_tropa = t.id_tropa
        JOIN departamento depto ON t.id_departamento = depto.id_departamento
        LEFT JOIN provincia prov ON depto.id_provincia = prov.id_provincia
        WHERE td.id_tropa IN (${idsPlaceholders})
        ${whereAdicionales}
        GROUP BY td.id_tropa
      `;
      const totalCantidadResult = await pool.query(
        totalCantidadQuery, 
        [...allTropasIds, ...valoresAdicionales]
      );
      console.log('[obtenerFaenasRealizadas] Query:', totalCantidadQuery);
      console.log('[obtenerFaenasRealizadas] Valores:', [...allTropasIds, ...valoresAdicionales]);
      console.log('[obtenerFaenasRealizadas] Resultado:', totalCantidadResult.rows);
      totalCantidadByTropa = totalCantidadResult.rows.reduce((acc, row) => {
        acc[row.id_tropa] = Number(row.total_cantidad);
        return acc;
      }, {});
      
      // Contar tropas faenadas en su totalidad (que aparecen en sumFaenadoByTropa)
      for (const idTropa of allTropasIds) {
        const sumFaenado = sumFaenadoByTropa[idTropa] || 0;
        const totalCantidad = totalCantidadByTropa[idTropa] || 0;
        if (totalCantidad > 0 && sumFaenado === totalCantidad) {
          fullyFaenadaCount++;
        }
      }
    }

    // Total unidades: sumar todas las cantidades de totalCantidadByTropa
    const totalUnidades = Object.values(totalCantidadByTropa).reduce((sum, qty) => sum + qty, 0);
    
    // Total de tropas que tuvieron faenas en el período
    const totalTropas = allTropasIds.length;

    res.status(200).json({
      faenas,
      total_faenados: totalFaenados,
      total_tropas: totalTropas,
      tropas_faenadas_completas: fullyFaenadaCount,
      total_unidades: totalUnidades,
      total_por_tropa: totalCantidadByTropa,
    });
  } catch (error) {
    console.error('Error al obtener faenas realizadas:', error.message);
    res.status(500).json({ error: 'Error al obtener faenas realizadas' });
  }
};

// Obtener remanente por número de tropa
const obtenerRemanentePorTropa = async (req, res) => {
  const { n_tropa } = req.query;

  if (!n_tropa) {
    return res.status(400).json({ error: 'Falta el número de tropa' });
  }

  try {
    const tropaRes = await pool.query(
      'SELECT id_tropa, fecha FROM tropa WHERE n_tropa = $1 LIMIT 1',
      [n_tropa],
    );

    if (tropaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tropa no encontrada' });
    }

    const { id_tropa, fecha } = tropaRes.rows[0];

    const detalleRes = await pool.query(
      `SELECT td.id_tropa_detalle, td.id_especie, td.id_cat_especie, td.cantidad,
              e.descripcion AS especie, c.descripcion AS categoria
       FROM tropa_detalle td
       JOIN especie e ON td.id_especie = e.id_especie
       JOIN categoria_especie c ON td.id_cat_especie = c.id_cat_especie
       WHERE td.id_tropa = $1`,
      [id_tropa],
    );

    const faenaRes = await pool.query(
      `SELECT id_tropa_detalle, SUM(cantidad_faena) AS faenados
       FROM faena_detalle
       WHERE id_tropa_detalle IN (
         SELECT id_tropa_detalle FROM tropa_detalle WHERE id_tropa = $1
       )
       GROUP BY id_tropa_detalle`,
      [id_tropa],
    );

    const faenaMap = {};
    faenaRes.rows.forEach((f) => {
      faenaMap[f.id_tropa_detalle] = parseInt(f.faenados, 10);
    });

    const animales = {};

    detalleRes.rows.forEach((row) => {
      const grupo = row.especie;
      const categoria = row.categoria;
      const faenados = faenaMap[row.id_tropa_detalle] || 0;
      const remanente = row.cantidad - faenados;

      if (!animales[grupo]) {
        animales[grupo] = {};
      }

      animales[grupo][categoria] = {
        faenados,
        remanente: remanente < 0 ? 0 : remanente,
      };

      if (!animales[grupo].TOTAL) {
        animales[grupo].TOTAL = { faenados: 0, remanente: 0 };
      }

      animales[grupo].TOTAL.faenados += faenados;
      animales[grupo].TOTAL.remanente += remanente < 0 ? 0 : remanente;
    });

    res.json({
      n_tropa,
      fecha,
      animales,
    });
  } catch (error) {
    console.error('Error al obtener remanente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

//ObtenerFaenasSinDecomiso
// Obtener faenas realizadas SIN decomiso, con filtros y paginación
const obtenerFaenasSinDecomiso = async (req, res) => {
  const {
    fecha = '',
    dte_dtu = '',
    n_tropa = '',
    limit = '20',
    offset = '0',
  } = req.query;

  const filtros = [];
  const valores = [];

  // Filtro de planta del usuario (solo si NO es admin)
  const idPlantaUsuario = req.user?.id_planta;
  const rolUsuario = req.user?.rol;
  
  // Solo usuarios no-admin (rol !== 1) ven filtrados por su planta
  if (idPlantaUsuario && rolUsuario !== 1) {
    filtros.push(`t.id_planta = $${valores.length + 1}`);
    valores.push(idPlantaUsuario);
  }

  if (fecha.trim()) {
    filtros.push(`f.fecha_faena::date = $${valores.length + 1}`);
    valores.push(fecha);
  }
  if (dte_dtu.trim()) {
    filtros.push(`t.dte_dtu ILIKE $${valores.length + 1}`);
    valores.push(`%${dte_dtu}%`);
  }
  if (n_tropa.trim()) {
    filtros.push(`t.n_tropa::text ILIKE $${valores.length + 1}`);
    valores.push(`%${n_tropa}%`);
  }

  const whereBase =
    filtros.length > 0 ? `WHERE ${filtros.join(' AND ')}` : 'WHERE true';

  const limitNum = parseInt(limit, 10) || 20;
  const offsetNum = parseInt(offset, 10) || 0;

  try {
    const query = `
      SELECT
        f.id_faena,
        f.fecha_faena,
        t.dte_dtu,
        t.guia_policial,
        t.n_tropa,
        t.id_planta,
        p.nombre AS nombre_planta,
        prod.nombre AS productor,
        depto.nombre_departamento AS departamento,
        tf.nombre AS titular_faena,
        STRING_AGG(DISTINCT esp.descripcion, ', ') AS especie,
        SUM(fd.cantidad_faena) AS total_faenado,
        t.id_tropa
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN productor prod ON t.id_productor = prod.id_productor
      JOIN departamento depto ON t.id_departamento = depto.id_departamento
      JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      ${whereBase}
      AND NOT EXISTS (
        SELECT 1
        FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
        )
      GROUP BY f.id_faena, f.fecha_faena, t.dte_dtu, t.guia_policial, t.n_tropa, t.id_planta, p.nombre,
               prod.nombre, depto.nombre_departamento, tf.nombre, t.id_tropa
      ORDER BY f.fecha_faena DESC, f.id_faena DESC
      LIMIT $${valores.length + 1} OFFSET $${valores.length + 2};
    `;

    const resultado = await pool.query(query, [
      ...valores,
      limitNum,
      offsetNum,
    ]);
    res.json(resultado.rows);
  } catch (error) {
    console.error('❌ Error al obtener faenas realizadas:', error.message);
    res.status(500).json({ error: 'Error al obtener faenas realizadas' });
  }
};

//ObtenerDatosParaDecomiso
const obtenerDatosParaDecomiso = async (req, res) => {
  const { id_faena } = req.params;
  const idPlantaUsuario = req.user?.id_planta;
  const rolUsuario = req.user?.rol;

  try {
    const query = `
      SELECT 
        fd.id_faena_detalle, -- ✅ necesario para registrar decomiso
        td.id_tropa_detalle,
        ce.descripcion AS categoria,
        e.descripcion AS especie,
        fd.cantidad_faena AS faenados,
        t.dte_dtu,
        t.n_tropa,
        f.fecha_faena,
        t.id_planta
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa_detalle td ON fd.id_tropa_detalle = td.id_tropa_detalle
      JOIN tropa t ON td.id_tropa = t.id_tropa
      JOIN especie e ON td.id_especie = e.id_especie
      JOIN categoria_especie ce ON td.id_cat_especie = ce.id_cat_especie
      WHERE f.id_faena = $1
      ${idPlantaUsuario && rolUsuario !== 1 ? `AND t.id_planta = $2` : ''}
    `;

    const valores = [id_faena];
    if (idPlantaUsuario && rolUsuario !== 1) {
      valores.push(idPlantaUsuario);
    }

    const resultado = await pool.query(query, valores);

    if (resultado.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'No se encontraron datos para esta faena' });
    }

    res.json(resultado.rows);
  } catch (error) {
    console.error('❌ Error al obtener datos para decomiso:', error.message);
    res.status(500).json({ error: 'Error al obtener datos para decomiso' });
  }
};

// Obtener detalles de faena con categorías para informe
const modificarFaena = async (req, res) => {
  const { id_faena } = req.params;
  if (!id_faena || isNaN(parseInt(id_faena))) {
    return res.status(400).json({ error: 'ID de faena inválido' });
  }

  const { fecha_faena, categorias } = req.body;

  if (!Array.isArray(categorias) || categorias.length === 0) {
    return res.status(400).json({ error: 'Debe enviar al menos una categoría' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const faenaResult = await client.query(
      'SELECT fecha_faena FROM faena WHERE id_faena = $1 FOR UPDATE',
      [parseInt(id_faena)],
    );

    if (faenaResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Faena no encontrada' });
    }

    const fechaFaena = new Date(faenaResult.rows[0].fecha_faena);
    if (Number.isNaN(fechaFaena.getTime())) {
      await client.query('ROLLBACK');
      return res
        .status(400)
        .json({ error: 'Fecha de faena inválida para edición' });
    }

    const limiteEdicion = fechaFaena.getTime() + EDICION_FAENA_VENTANA_MS;
    if (Date.now() > limiteEdicion) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        error:
          'La faena solo puede modificarse dentro de las 48 horas desde su fecha y hora',
      });
    }

    const detalleActual = await client.query(
      `SELECT
        fd.id_tropa_detalle,
        COALESCE(fd.cantidad_faena, 0)::int AS cantidad_actual,
        COALESCE(td.cantidad, 0)::int AS cantidad_inicial,
        COALESCE(sumfd.total_faenado, 0)::int AS total_faenado_detalle
      FROM faena_detalle fd
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      LEFT JOIN (
        SELECT id_tropa_detalle, SUM(cantidad_faena)::int AS total_faenado
        FROM faena_detalle
        GROUP BY id_tropa_detalle
      ) sumfd ON sumfd.id_tropa_detalle = fd.id_tropa_detalle
      WHERE fd.id_faena = $1`,
      [parseInt(id_faena)],
    );

    const detalleMap = new Map(
      detalleActual.rows.map((r) => [String(r.id_tropa_detalle), r]),
    );

    for (const cat of categorias) {
      if (!cat.id_tropa_detalle || cat.cantidad_faena === undefined) continue;
      const detalle = detalleMap.get(String(cat.id_tropa_detalle));
      if (!detalle) {
        return res.status(400).json({
          error: `La categoría con id_tropa_detalle ${cat.id_tropa_detalle} no pertenece a esta faena`,
        });
      }

      const nuevaCantidad = Number(cat.cantidad_faena);
      if (!Number.isFinite(nuevaCantidad) || nuevaCantidad < 0) {
        return res.status(400).json({
          error: `Cantidad inválida para ${cat.id_tropa_detalle}`,
        });
      }

      const remanenteSinEstaFaena = Math.max(
        0,
        Number(detalle.cantidad_inicial) -
          (Number(detalle.total_faenado_detalle) - Number(detalle.cantidad_actual)),
      );
      const maxPermitido = remanenteSinEstaFaena;

      if (nuevaCantidad > maxPermitido) {
        return res.status(400).json({
          error: `La cantidad para ${cat.id_tropa_detalle} supera el remanente permitido (${maxPermitido})`,
        });
      }
    }

    // Actualizar fecha si se envió
    if (fecha_faena) {
      await client.query(
        'UPDATE faena SET fecha_faena = $1 WHERE id_faena = $2',
        [fecha_faena, parseInt(id_faena)],
      );
    }

    // Actualizar cantidades por id_tropa_detalle
    for (const cat of categorias) {
      if (!cat.id_tropa_detalle || cat.cantidad_faena === undefined) continue;
      await client.query(
        `UPDATE faena_detalle
         SET cantidad_faena = $1
         WHERE id_faena = $2 AND id_tropa_detalle = $3`,
        [Number(cat.cantidad_faena), parseInt(id_faena), cat.id_tropa_detalle],
      );
    }

    await client.query('COMMIT');
    res.status(200).json({ message: 'Faena actualizada correctamente' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al modificar faena:', error.message);
    res.status(500).json({ error: 'Error al modificar la faena' });
  } finally {
    client.release();
  }
};

const obtenerDetalleFaenaPorId = async (req, res) => {
  const { id_faena } = req.params;
  if (!id_faena || isNaN(parseInt(id_faena))) {
    return res.status(400).json({ error: 'ID de faena inválido' });
  }
  try {
    // Query 1: Obtener cabecera con especies consolidadas
    const cabeceraResult = await pool.query(
      `SELECT DISTINCT
        f.id_faena,
        f.fecha_faena,
        t.n_tropa,
        t.dte_dtu,
        t.guia_policial,
        p.nombre AS nombre_planta,
        prod.nombre AS productor,
        depto.nombre_departamento AS departamento,
        tf.nombre AS titular_faena,
        STRING_AGG(DISTINCT esp.descripcion, ', ' ORDER BY esp.descripcion) AS especie
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN productor prod ON t.id_productor = prod.id_productor
      JOIN departamento depto ON t.id_departamento = depto.id_departamento
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      WHERE f.id_faena = $1
      GROUP BY f.id_faena, f.fecha_faena, t.n_tropa, t.dte_dtu, t.guia_policial,
               p.nombre, prod.nombre, depto.nombre_departamento, tf.nombre`,
      [parseInt(id_faena)],
    );

    if (cabeceraResult.rows.length === 0) {
      return res.status(404).json({ error: 'Faena no encontrada' });
    }

    const cabecera = cabeceraResult.rows[0];

    // Query 2: Obtener categorías con validación de max_permitido
    const categoriasResult = await pool.query(
      `SELECT
        td.id_tropa_detalle,
        COALESCE(td.cantidad, 0)::int AS cantidad_inicial,
        COALESCE(sumfd.total_faenado, 0)::int AS total_faenado_detalle,
        esp.descripcion AS especie,
        ce.descripcion AS categoria,
        fd.cantidad_faena
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      LEFT JOIN (
        SELECT id_tropa_detalle, SUM(cantidad_faena)::int AS total_faenado
        FROM faena_detalle
        GROUP BY id_tropa_detalle
      ) sumfd ON sumfd.id_tropa_detalle = td.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN categoria_especie ce ON td.id_cat_especie = ce.id_cat_especie
      WHERE f.id_faena = $1
      ORDER BY esp.descripcion ASC, ce.descripcion ASC`,
      [parseInt(id_faena)],
    );

    const categorias = categoriasResult.rows.map((r) => ({
      max_permitido: Math.max(
        0,
        Number(r.cantidad_inicial || 0) -
          (Number(r.total_faenado_detalle || 0) - Number(r.cantidad_faena || 0)),
      ),
      id_tropa_detalle: r.id_tropa_detalle,
      especie: r.especie,
      categoria: r.categoria,
      cantidad_faena: r.cantidad_faena,
    }));

    const total_faenado = categorias.reduce(
      (acc, c) => acc + Number(c.cantidad_faena || 0),
      0,
    );

    res.status(200).json({
      id_faena: cabecera.id_faena,
      fecha_faena: cabecera.fecha_faena,
      n_tropa: cabecera.n_tropa,
      dte_dtu: cabecera.dte_dtu,
      guia_policial: cabecera.guia_policial,
      nombre_planta: cabecera.nombre_planta,
      productor: cabecera.productor,
      departamento: cabecera.departamento,
      titular_faena: cabecera.titular_faena,
      especie: cabecera.especie,
      categorias,
      total_faenado,
    });
  } catch (error) {
    console.error('Error al obtener detalle de faena:', error.message);
    res.status(500).json({ error: 'Error al obtener detalle de faena' });
  }
};

const obtenerDetallesFaenaConCategoria = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        f.id_faena,
        f.fecha_faena,
        t.id_planta,
        esp.descripcion AS especie,
        ce.descripcion AS categoria_especie,
        fd.cantidad_faena
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN categoria_especie ce ON td.id_cat_especie = ce.id_cat_especie
      JOIN tropa t ON f.id_tropa = t.id_tropa
      ORDER BY f.fecha_faena DESC;
    `);

    res.status(200).json(result.rows || []);
  } catch (error) {
    console.error(
      'Error al obtener detalles de faena con categoría:',
      error.message,
    );
    res.status(500).json({ error: 'Error al obtener detalles de faena' });
  }
};

module.exports = {
  obtenerFaenas,
  crearFaena,
  obtenerFaenasRealizadas,
  obtenerRemanentePorTropa,
  obtenerDatosParaDecomiso,
  obtenerFaenasSinDecomiso,
  obtenerDetallesFaenaConCategoria,
  obtenerDetalleFaenaPorId,
  modificarFaena,
};

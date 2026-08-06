// controllers/tropa.controller.js
const pool = require('../db');

/*
  Controlador de Tropas - versión corregida y consistente:
  - Usa `tropaId` como nombre de parámetro en las rutas que lo requieren.
  - Devuelve `id` en las consultas principales para mantener consistencia con el frontend.
  - Validaciones robustas de parámetros y manejo de errores claro.
*/

/* Obtener todas las tropas */
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        t.id_tropa AS id,
        t.n_tropa,
        t.fecha_alta,
        t.fecha_ingreso,
        t.dte_dtu,
        tf.nombre AS titular,
        pr.nombre AS productor_nombre,
        d.nombre_departamento AS departamento,
        p.id_planta,
        p.nombre AS planta_nombre
      FROM tropa t
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN productor pr ON t.id_productor = pr.id_productor
      LEFT JOIN departamento d ON t.id_departamento = d.id_departamento
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      ORDER BY t.fecha_alta DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener tropas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener todos los detalles de todas las tropas */
exports.getTodosLosDetalles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        td.id_tropa_detalle AS id,
        td.id_tropa,
        t.n_tropa,
        t.fecha_alta,
        t.fecha_ingreso,
        t.dte_dtu,
        tf.nombre AS titular,
        e.descripcion AS nombre_especie,
        ce.descripcion AS nombre_categoria,
        td.cantidad
      FROM tropa_detalle td
      JOIN tropa t ON td.id_tropa = t.id_tropa
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      JOIN especie e ON td.id_especie = e.id_especie
      JOIN categoria_especie ce ON td.id_cat_especie = ce.id_cat_especie
      ORDER BY t.fecha_alta DESC, e.descripcion, ce.descripcion
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener todos los detalles de tropas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Crear una nueva tropa */
exports.createTropa = async (req, res) => {
  const {
    dte_dtu,
    guia_policial,
    fecha_alta,
    fecha_ingreso,
    id_titular_faena,
    n_tropa,
    id_departamento,
    id_productor,
    id_planta,
  } = req.body;

  try {
    // Validar que no exista una tropa con el mismo DTe/DTu
    if (dte_dtu) {
      const duplicateDte = await pool.query(
        `SELECT id_tropa FROM tropa WHERE dte_dtu = $1 LIMIT 1`,
        [dte_dtu],
      );

      if (duplicateDte.rows.length > 0) {
        return res.status(400).json({
          error: `Ya existe una tropa registrada con el DTE/DTU: ${dte_dtu}`,
        });
      }
    }

    const result = await pool.query(
      `INSERT INTO tropa (
        dte_dtu, guia_policial, fecha_alta, fecha_ingreso,
        id_titular_faena, n_tropa,
        id_departamento, id_productor, id_planta
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id_tropa AS id`,
      [
        dte_dtu,
        guia_policial,
        fecha_alta || new Date(),
        fecha_ingreso || null,
        id_titular_faena,
        n_tropa,
        id_departamento,
        id_productor,
        id_planta,
      ],
    );

    res.status(201).json({
      message: 'Tropa creada correctamente',
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error('Error al crear tropa:', err);
    
    // Capturar error de clave única duplicada (PostgreSQL error code 23505)
    if (err.code === '23505' && err.constraint === 'unique_dte_dtu') {
      return res.status(409).json({ 
        error: `El DTE/DTU ${dte_dtu} ya está registrado en el sistema`,
        code: 'DUPLICATE_DTE_DTU'
      });
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener tropa por ID */
exports.getById = async (req, res) => {
  const { tropaId } = req.params;

  if (!/^\d+$/.test(tropaId)) {
    return res
      .status(400)
      .json({ error: 'ID inválido. Debe ser un número entero.' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        t.id_tropa AS id,
        t.n_tropa,
        t.dte_dtu,
        t.guia_policial,
        t.fecha_alta,
        t.fecha_ingreso,
        t.id_departamento,
        t.id_productor,
        t.id_planta,
        t.id_titular_faena,
        tf.nombre AS titular,
        p.nombre AS planta,
        pr.nombre AS productor,
        d.nombre_departamento AS departamento
      FROM tropa t
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      LEFT JOIN productor pr ON t.id_productor = pr.id_productor
      LEFT JOIN departamento d ON t.id_departamento = d.id_departamento
      WHERE t.id_tropa = $1
    `,
      [parseInt(tropaId, 10)],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Tropa no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error al obtener tropa:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener detalle simple de una tropa (lista de items) */
exports.getDetalle = async (req, res) => {
  const { tropaId } = req.params;

  if (!/^\d+$/.test(tropaId)) {
    return res.status(400).json({ error: 'ID de tropa inválido' });
  }

  try {
    const q = `
      SELECT
        td.id_tropa_detalle AS id,
        td.id_tropa,
        td.id_especie,
        e.descripcion AS especie,
        td.id_cat_especie,
        ce.descripcion AS categoria,
        td.cantidad,
        COALESCE((
          SELECT SUM(fd.cantidad_faena)
          FROM faena_detalle fd
          WHERE fd.id_tropa_detalle = td.id_tropa_detalle
        ), 0) AS faenados,
        td.cantidad - COALESCE((
          SELECT SUM(fd.cantidad_faena)
          FROM faena_detalle fd
          WHERE fd.id_tropa_detalle = td.id_tropa_detalle
        ), 0) AS remanente
      FROM tropa_detalle td
      LEFT JOIN especie e ON td.id_especie = e.id_especie
      LEFT JOIN categoria_especie ce ON td.id_cat_especie = ce.id_cat_especie
      WHERE td.id_tropa = $1
      ORDER BY e.descripcion, ce.descripcion
    `;
    const { rows } = await pool.query(q, [parseInt(tropaId, 10)]);
    res.json(rows);
  } catch (err) {
    console.error('Error al obtener detalle de tropa:', err);
    res.status(500).json({ error: 'Error interno al obtener detalle' });
  }
};

/* Obtener detalle agrupado (ej. sumar cantidades por especie/categoría) */
exports.getDetalleAgrupado = async (req, res) => {
  const rawId =
    req.params.tropaId ?? req.params.id ?? req.params.tropa_id ?? null;

  const tropaId = Number(rawId);
  if (!Number.isInteger(tropaId) || tropaId <= 0) {
    return res.status(400).json({ error: 'ID de tropa inválido' });
  }

  try {
    const tropaRes = await pool.query(
      `
      SELECT 
        t.n_tropa, 
        t.dte_dtu, 
        t.fecha_alta, 
        t.fecha_ingreso,
        t.fecha_ingreso AS fecha,
        tf.nombre AS titular
      FROM tropa t
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      WHERE t.id_tropa = $1
      `,
      [tropaId],
    );

    if (tropaRes.rows.length === 0) {
      return res.status(404).json({ error: 'Tropa no encontrada' });
    }

    const { n_tropa, dte_dtu, fecha_alta, fecha_ingreso, fecha, titular } = tropaRes.rows[0];

    const detalleRes = await pool.query(
      `
      SELECT
        td.id_especie,
        e.descripcion AS especie,
        td.id_cat_especie,
        ce.descripcion AS categoria,
        SUM(td.cantidad) AS cantidad_total,
        COALESCE((
          SELECT SUM(fd.cantidad_faena)
          FROM faena_detalle fd
          WHERE fd.id_tropa_detalle IN (
            SELECT id_tropa_detalle FROM tropa_detalle td2
            WHERE td2.id_tropa = $1
            AND td2.id_especie = td.id_especie
            AND td2.id_cat_especie = td.id_cat_especie
          )
        ), 0) AS cantidad_faenada
      FROM tropa_detalle td
      LEFT JOIN especie e ON td.id_especie = e.id_especie
      LEFT JOIN categoria_especie ce ON td.id_cat_especie = ce.id_cat_especie
      WHERE td.id_tropa = $1
      GROUP BY td.id_especie, e.descripcion, td.id_cat_especie, ce.descripcion
      ORDER BY e.descripcion, ce.descripcion
      `,
      [tropaId],
    );

    const categorias = detalleRes.rows.map((row) => {
      const cantidad_total = parseInt(row.cantidad_total, 10) || 0;
      const cantidad_faenada = parseInt(row.cantidad_faenada, 10) || 0;
      const remanente = cantidad_total - cantidad_faenada;
      
      return {
        id_especie: row.id_especie,
        id_cat_especie: row.id_cat_especie,
        especie: row.especie,
        nombre: row.categoria,
        cantidad_total,
        cantidad_faenada,
        remanente: remanente > 0 ? remanente : 0,
      };
    });

    return res.status(200).json({
      tropaId,
      n_tropa,
      dte_dtu,
      fecha_alta,
      fecha_ingreso,
      fecha,
      titular,
      especie: categorias[0]?.especie || '',
      categorias,
    });
  } catch (err) {
    console.error('Error en getDetalleAgrupado:', err && (err.stack || err));
    return res
      .status(500)
      .json({ error: 'Error interno al obtener detalle agrupado' });
  }
};

/* Guardar detalle de tropa (array de detalles) */
exports.saveDetalle = async (req, res) => {
  const { tropaId } = req.params;
  const detalles = req.body;

  if (!/^\d+$/.test(tropaId)) {
    return res.status(400).json({ error: 'ID de tropa inválido' });
  }

  if (!Array.isArray(detalles) || detalles.length === 0) {
    return res
      .status(400)
      .json({ error: 'No se recibieron detalles válidos.' });
  }

  try {
    const detallesInsertados = [];

    for (const detalle of detalles) {
      const { id_especie, id_cat_especie, cantidad } = detalle;

      if (
        !id_especie ||
        !id_cat_especie ||
        cantidad == null ||
        isNaN(cantidad) ||
        parseInt(cantidad, 10) <= 0
      ) {
        console.warn('Detalle inválido omitido:', detalle);
        continue;
      }

      // First, check if a row with the same tropa, especie, and categoria already exists
      const existingQuery = await pool.query(
        `SELECT id_tropa_detalle, cantidad FROM tropa_detalle 
         WHERE id_tropa = $1 AND id_especie = $2 AND id_cat_especie = $3`,
        [parseInt(tropaId, 10), id_especie, id_cat_especie],
      );

      const cantidadNum = parseInt(cantidad, 10);
      let result;

      if (existingQuery.rows.length > 0) {
        // Row exists: update it by adding the new cantidad
        const existing = existingQuery.rows[0];
        const newCantidad = (existing.cantidad || 0) + cantidadNum;
        result = await pool.query(
          `UPDATE tropa_detalle SET cantidad = $1 WHERE id_tropa_detalle = $2 RETURNING *`,
          [newCantidad, existing.id_tropa_detalle],
        );
      } else {
        // Row doesn't exist: insert it
        result = await pool.query(
          `INSERT INTO tropa_detalle (id_tropa, id_especie, id_cat_especie, cantidad)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [parseInt(tropaId, 10), id_especie, id_cat_especie, cantidadNum],
        );
      }

      detallesInsertados.push({
        id_especie,
        id_cat_especie,
        cantidad: cantidadNum,
      });
    }

    res.status(201).json({
      message: 'Detalles guardados correctamente',
      cantidad: detallesInsertados.length,
      detalles: detallesInsertados,
    });
  } catch (err) {
    console.error('Error al guardar detalles de tropa:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener tropas de la planta del usuario logueado */
exports.getByUsuarioPlanta = async (req, res) => {
  try {
    const id_usuario = req.user?.id_usuario;
    if (!id_usuario) return res.status(401).json({ error: 'No autenticado' });

    let id_planta = req.user.id_planta ?? null;
    if (!id_planta) {
      const uRes = await pool.query(
        `SELECT id_planta FROM usuario WHERE id_usuario = $1 LIMIT 1`,
        [id_usuario],
      );
      id_planta = uRes.rows[0]?.id_planta ?? null;
    }

    if (!id_planta)
      return res.status(404).json({ error: 'Usuario sin planta asignada' });

    const q = `
      SELECT
        t.id_tropa AS id,
        t.n_tropa,
        t.fecha_alta,
        t.fecha_ingreso,
        t.dte_dtu,
        t.guia_policial,
        t.id_planta,
        p.nombre AS planta_nombre,
        tf.nombre AS titular,
        pr.nombre AS productor_nombre,
        d.nombre_departamento AS departamento
      FROM tropa t
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN productor pr ON t.id_productor = pr.id_productor
      LEFT JOIN departamento d ON t.id_departamento = d.id_departamento
      WHERE t.id_planta = $1
      ORDER BY t.fecha_alta DESC
    `;
    const result = await pool.query(q, [id_planta]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener tropas por planta:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener titulares */
exports.getTitulares = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_titular_faena AS id, nombre FROM titular_faena ORDER BY nombre
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener titulares:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener departamentos */
exports.getDepartamentos = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_departamento AS id, nombre_departamento AS nombre FROM departamento
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener departamentos:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener plantas */
exports.getPlantas = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_planta AS id, nombre FROM planta ORDER BY nombre
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener plantas:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Obtener productores */
exports.getProductores = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_productor AS id, nombre FROM productor ORDER BY nombre
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener productores:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

/* Actualizar una tropa existente */
exports.updateTropa = async (req, res) => {
  const { tropaId } = req.params;
  const {
    dte_dtu,
    guia_policial,
    fecha_alta,
    fecha_ingreso,
    id_titular_faena,
    n_tropa,
    id_departamento,
    id_productor,
    id_planta,
  } = req.body;

  try {
    // Validar que el tropaId sea válido
    const tropaIdNum = parseInt(tropaId, 10);
    if (!Number.isInteger(tropaIdNum) || tropaIdNum <= 0) {
      return res.status(400).json({ error: 'ID de tropa inválido' });
    }

    // Obtener la tropa actual para comparar el DTe/DTu
    const currentTropa = await pool.query(
      `SELECT dte_dtu FROM tropa WHERE id_tropa = $1`,
      [tropaIdNum],
    );

    if (currentTropa.rows.length === 0) {
      return res.status(404).json({ error: 'Tropa no encontrada' });
    }

    const currentDte = currentTropa.rows[0].dte_dtu;

    // Si el DTe/DTu cambió, verificar que no haya otra tropa con el mismo DTe/DTu
    if (dte_dtu && dte_dtu !== currentDte) {
      const duplicateDte = await pool.query(
        `SELECT id_tropa FROM tropa WHERE dte_dtu = $1 AND id_tropa != $2 LIMIT 1`,
        [dte_dtu, tropaIdNum],
      );

      if (duplicateDte.rows.length > 0) {
        return res.status(400).json({
          error: `Ya existe una tropa registrada con el DTE/DTU: ${dte_dtu}`,
        });
      }
    }

    // Actualizar la tropa
    const result = await pool.query(
      `UPDATE tropa SET
        dte_dtu = COALESCE($1, dte_dtu),
        guia_policial = COALESCE($2, guia_policial),
        fecha_alta = COALESCE($3, fecha_alta),
        fecha_ingreso = COALESCE($4, fecha_ingreso),
        id_titular_faena = COALESCE($5, id_titular_faena),
        n_tropa = COALESCE($6, n_tropa),
        id_departamento = COALESCE($7, id_departamento),
        id_productor = COALESCE($8, id_productor),
        id_planta = COALESCE($9, id_planta)
       WHERE id_tropa = $10
       RETURNING id_tropa AS id`,
      [
        dte_dtu || null,
        guia_policial || null,
        fecha_alta || null,
        fecha_ingreso || null,
        id_titular_faena || null,
        n_tropa || null,
        id_departamento || null,
        id_productor || null,
        id_planta || null,
        tropaIdNum,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'No se pudo actualizar la tropa' });
    }

    res.json({
      message: 'Tropa actualizada correctamente',
      id: result.rows[0].id,
    });
  } catch (err) {
    console.error('Error al actualizar tropa:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

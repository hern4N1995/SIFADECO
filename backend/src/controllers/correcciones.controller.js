// src/controllers/correcciones.controller.js
// Correcciones de carga: solo superadmin. Corrige errores de datos ya cargados
// (ej: un decomiso con otra afección), sin la ventana de 7 días, y registra cada cambio.
const pool = require('../db');

const MOTIVO_MIN = 10;

// Campos corregibles de decomiso_detalle y su tipo
const CAMPOS = {
  id_parte_decomisada: 'int',
  id_afeccion: 'int',
  cantidad: 'num',
  animales_afectados: 'num',
  peso_kg: 'num',
  destino_decomiso: 'text',
  observaciones: 'text',
};

const aNumero = (v) => {
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : NaN;
};

// Texto para comparar y guardar en el historial (null para vacío)
const aTexto = (v) => {
  if (v === undefined || v === null) return null;
  const s = String(v);
  return s.trim() === '' ? null : s;
};

// GET /api/correcciones/decomisos?q=  → busca decomisos por N° de tropa, DTe/DTu o ID
exports.buscarDecomisos = async (req, res) => {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);

  try {
    const result = await pool.query(
      `SELECT DISTINCT d.id_decomiso, d.fecha_decomiso, t.n_tropa, t.dte_dtu, f.fecha_faena
       FROM decomiso d
       JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
       JOIN tropa_detalle td ON fd.id_tropa_detalle = td.id_tropa_detalle
       JOIN tropa t ON t.id_tropa = td.id_tropa
       JOIN faena f ON f.id_faena = fd.id_faena
       WHERE t.n_tropa::text ILIKE $1
          OR t.dte_dtu ILIKE $1
          OR d.id_decomiso::text = $2
       ORDER BY d.id_decomiso DESC
       LIMIT 50`,
      [`%${q}%`, q],
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error al buscar decomisos para corrección:', err);
    res.status(500).json({ message: 'Error al buscar decomisos' });
  }
};

// GET /api/correcciones/decomisos/:id → cabecera, detalles editables e historial de cambios
exports.obtenerDecomisoParaCorregir = async (req, res) => {
  const idDecomiso = parseInt(req.params.id, 10);
  if (!Number.isInteger(idDecomiso) || idDecomiso <= 0) {
    return res.status(400).json({ message: 'ID de decomiso inválido' });
  }

  try {
    const cabecera = await pool.query(
      `SELECT d.id_decomiso, d.fecha_decomiso, t.n_tropa, t.dte_dtu, f.fecha_faena
       FROM decomiso d
       JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
       JOIN tropa_detalle td ON fd.id_tropa_detalle = td.id_tropa_detalle
       JOIN tropa t ON t.id_tropa = td.id_tropa
       JOIN faena f ON f.id_faena = fd.id_faena
       WHERE d.id_decomiso = $1
       LIMIT 1`,
      [idDecomiso],
    );
    if (cabecera.rows.length === 0) {
      return res.status(404).json({ message: 'Decomiso no encontrado' });
    }

    const detalles = await pool.query(
      `SELECT dd.id_decomiso_detalle, dd.id_parte_decomisada, dd.id_afeccion,
              dd.cantidad, dd.animales_afectados, dd.peso_kg,
              dd.destino_decomiso, dd.observaciones,
              pd.nombre_parte, tp.nombre_tipo_parte, a.descripcion AS afeccion
       FROM decomiso_detalle dd
       JOIN parte_decomisada pd ON dd.id_parte_decomisada = pd.id_parte_decomisada
       JOIN tipo_parte_deco tp ON pd.id_tipo_parte_deco = tp.id_tipo_parte_deco
       JOIN afeccion a ON dd.id_afeccion = a.id_afeccion
       WHERE dd.id_decomiso = $1
       ORDER BY dd.id_decomiso_detalle`,
      [idDecomiso],
    );

    const historial = await pool.query(
      `SELECT c.id_correccion, c.fecha, c.entidad, c.id_registro, c.campo,
              c.valor_antes, c.valor_despues, c.motivo,
              u.nombre, u.apellido, u.email
       FROM correccion_carga c
       LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE c.id_decomiso = $1
       ORDER BY c.fecha DESC, c.id_correccion DESC`,
      [idDecomiso],
    );

    res.json({
      decomiso: cabecera.rows[0],
      detalles: detalles.rows,
      historial: historial.rows,
    });
  } catch (err) {
    console.error('Error al obtener decomiso para corregir:', err);
    res.status(500).json({ message: 'Error al obtener el decomiso' });
  }
};

// PUT /api/correcciones/decomiso-detalle/:idDetalle
// body: { motivo (obligatorio), ...campos corregibles (los omitidos no cambian) }
exports.corregirDecomisoDetalle = async (req, res) => {
  const idDetalle = parseInt(req.params.idDetalle, 10);
  if (!Number.isInteger(idDetalle) || idDetalle <= 0) {
    return res.status(400).json({ message: 'ID de detalle inválido' });
  }

  const body = req.body || {};
  const motivo = typeof body.motivo === 'string' ? body.motivo.trim() : '';
  if (motivo.length < MOTIVO_MIN) {
    return res.status(400).json({
      message: `Indicá el motivo de la corrección (mínimo ${MOTIVO_MIN} caracteres)`,
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const actualRes = await client.query(
      `SELECT * FROM decomiso_detalle WHERE id_decomiso_detalle = $1 FOR UPDATE`,
      [idDetalle],
    );
    if (actualRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Detalle de decomiso no encontrado' });
    }
    const actual = actualRes.rows[0];

    // Valores nuevos: si el campo no viene en el body, no cambia
    const nuevos = {};
    for (const [campo, tipo] of Object.entries(CAMPOS)) {
      if (!(campo in body)) {
        // Campo omitido: se mantiene el valor actual, en el mismo formato normalizado
        nuevos[campo] =
          tipo === 'text'
            ? aTexto(actual[campo])
            : actual[campo] === null
              ? null
              : Number(actual[campo]);
        continue;
      }
      if (tipo === 'text') {
        nuevos[campo] = aTexto(body[campo]);
      } else {
        const n = aNumero(body[campo]);
        if (n !== null && Number.isNaN(n)) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: `Valor numérico inválido en ${campo}` });
        }
        if (tipo === 'int' && n === null) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: `${campo} es obligatorio` });
        }
        if (n !== null && n < 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ message: `${campo} no puede ser negativo` });
        }
        nuevos[campo] = n;
      }
    }

    // Cambios reales (comparación normalizada)
    const cambios = [];
    for (const [campo, tipo] of Object.entries(CAMPOS)) {
      const antes = tipo === 'text' ? aTexto(actual[campo]) : (actual[campo] === null ? null : Number(actual[campo]));
      const despues = nuevos[campo];
      if (antes !== despues) cambios.push({ campo, antes, despues });
    }

    if (cambios.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No hay cambios para guardar' });
    }

    // Si cambia la parte o la afección, la combinación debe existir en parte_deco_afeccion
    if (nuevos.id_parte_decomisada !== actual.id_parte_decomisada || nuevos.id_afeccion !== actual.id_afeccion) {
      const existe = await client.query(
        `SELECT 1 FROM parte_deco_afeccion WHERE id_parte_decomisada = $1 AND id_afeccion = $2`,
        [nuevos.id_parte_decomisada, nuevos.id_afeccion],
      );
      if (existe.rowCount === 0) {
        await client.query(
          `INSERT INTO parte_deco_afeccion (id_parte_decomisada, id_afeccion) VALUES ($1, $2)`,
          [nuevos.id_parte_decomisada, nuevos.id_afeccion],
        );
      }
    }

    await client.query(
      `UPDATE decomiso_detalle SET
         id_parte_decomisada = $1,
         id_afeccion = $2,
         cantidad = $3,
         animales_afectados = $4,
         peso_kg = $5,
         destino_decomiso = $6,
         observaciones = $7
       WHERE id_decomiso_detalle = $8`,
      [
        nuevos.id_parte_decomisada,
        nuevos.id_afeccion,
        nuevos.cantidad,
        nuevos.animales_afectados,
        nuevos.peso_kg,
        nuevos.destino_decomiso,
        nuevos.observaciones,
        idDetalle,
      ],
    );

    for (const c of cambios) {
      await client.query(
        `INSERT INTO correccion_carga
           (id_usuario, rol, entidad, id_registro, id_decomiso, campo, valor_antes, valor_despues, motivo)
         VALUES ($1, $2, 'decomiso_detalle', $3, $4, $5, $6, $7, $8)`,
        [
          req.user?.id_usuario ?? null,
          req.user?.rol ?? null,
          idDetalle,
          actual.id_decomiso,
          c.campo,
          c.antes === null ? null : String(c.antes),
          c.despues === null ? null : String(c.despues),
          motivo,
        ],
      );
    }

    await client.query('COMMIT');
    res.json({
      message: 'Corrección guardada',
      id_decomiso: actual.id_decomiso,
      campos_corregidos: cambios.map((c) => c.campo),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.code === '23503') {
      return res.status(400).json({ message: 'La parte o la afección indicada no existe' });
    }
    console.error('Error al corregir decomiso:', err);
    res.status(500).json({ message: 'Error al guardar la corrección' });
  } finally {
    client.release();
  }
};

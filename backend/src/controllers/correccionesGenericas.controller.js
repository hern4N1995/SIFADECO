// src/controllers/correccionesGenericas.controller.js
// Corrección de registros cargados (tropa, faena, productor, departamento, planta, titular, veterinario).
// Solo superadmin. Solo se modifican los campos declarados en config/entidadesCorregibles.js.
// Cada campo que cambia queda en correccion_carga con valor anterior, nuevo y motivo.
const pool = require('../db');
const ENTIDADES = require('../config/entidadesCorregibles');

const MOTIVO_MIN = 10;

class ErrorValidacion extends Error {}

const fechaLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
};

// Valor de la base → texto/número comparable
const desdeBase = (tipo, v) => {
  if (v === null || v === undefined) return null;
  switch (tipo) {
    case 'date':
      return v instanceof Date ? fechaLocal(v) : String(v).slice(0, 10);
    case 'bool':
      return Boolean(v);
    case 'int':
    case 'fk':
    case 'num':
      return Number(v);
    default:
      return String(v);
  }
};

// Valor enviado por el cliente → valor validado para guardar
const desdeEntrada = (tipo, v, campo) => {
  if (v === undefined) return undefined;
  if (v === null || (typeof v === 'string' && v.trim() === '')) return null;
  switch (tipo) {
    case 'text':
      return String(v).trim();
    case 'int':
    case 'fk': {
      const n = Number(v);
      if (!Number.isInteger(n)) throw new ErrorValidacion(`${campo}: se espera un número entero`);
      return n;
    }
    case 'num': {
      const n = Number(String(v).replace(',', '.'));
      if (!Number.isFinite(n)) throw new ErrorValidacion(`${campo}: número inválido`);
      return n;
    }
    case 'date': {
      const s = String(v).slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) throw new ErrorValidacion(`${campo}: fecha inválida (AAAA-MM-DD)`);
      return s;
    }
    case 'bool':
      if (typeof v === 'boolean') return v;
      if (v === 'true' || v === 'false') return v === 'true';
      throw new ErrorValidacion(`${campo}: se espera verdadero o falso`);
    default:
      throw new ErrorValidacion(`${campo}: tipo no soportado`);
  }
};

const obtenerConfig = (req, res) => {
  const cfg = ENTIDADES[req.params.entidad];
  if (!cfg) {
    res.status(404).json({ message: 'Tipo de registro no corregible' });
    return null;
  }
  return cfg;
};

// GET /api/correcciones/entidades → qué se puede corregir y con qué campos
exports.listarEntidades = (req, res) => {
  const lista = Object.entries(ENTIDADES).map(([clave, cfg]) => ({
    clave,
    titulo: cfg.titulo,
    campos: Object.entries(cfg.campos).map(([campo, meta]) => ({
      campo,
      label: meta.label,
      tipo: meta.tipo,
      requerido: Boolean(meta.requerido),
    })),
  }));
  res.json(lista);
};

// GET /api/correcciones/:entidad/buscar?q=
exports.buscarRegistros = async (req, res) => {
  const cfg = obtenerConfig(req, res);
  if (!cfg) return;

  const q = String(req.query.q || '').trim();
  if (!q) return res.json([]);

  try {
    // Parámetros según las columnas buscables de la entidad (sin $ huérfanos)
    const params = [];
    const condiciones = [];
    if (cfg.buscar.length > 0) {
      params.push(`%${q}%`);
      condiciones.push(...cfg.buscar.map((c) => `CAST(${c} AS TEXT) ILIKE $${params.length}`));
    }
    params.push(q);
    condiciones.push(`CAST(${cfg.pk} AS TEXT) = $${params.length}`);

    const result = await pool.query(
      `SELECT * FROM ${cfg.tabla} WHERE ${condiciones.join(' OR ')} ORDER BY ${cfg.pk} DESC LIMIT 50`,
      params,
    );

    res.json(
      result.rows.map((r) => ({
        id: r[cfg.pk],
        etiqueta: cfg.etiqueta(r),
      })),
    );
  } catch (err) {
    console.error('Error al buscar registros para corrección:', err);
    res.status(500).json({ message: 'Error al buscar registros' });
  }
};

// GET /api/correcciones/:entidad/:id → valores actuales, opciones para desplegables e historial
exports.obtenerRegistro = async (req, res) => {
  const cfg = obtenerConfig(req, res);
  if (!cfg) return;

  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'ID inválido' });

  try {
    const fila = await pool.query(`SELECT * FROM ${cfg.tabla} WHERE ${cfg.pk} = $1`, [id]);
    if (fila.rows.length === 0) return res.status(404).json({ message: 'Registro no encontrado' });
    const row = fila.rows[0];

    const valores = {};
    const opciones = {};
    for (const [campo, meta] of Object.entries(cfg.campos)) {
      valores[campo] = desdeBase(meta.tipo, row[campo]);
      if (meta.tipo === 'fk') {
        const ref = meta.ref;
        const op = await pool.query(
          `SELECT ${ref.pk} AS value, CAST(${ref.etiqueta} AS TEXT) AS label
           FROM ${ref.tabla} ORDER BY label LIMIT 2000`,
        );
        opciones[campo] = op.rows;
      }
    }

    const historial = await pool.query(
      `SELECT c.id_correccion, c.fecha, c.campo, c.valor_antes, c.valor_despues, c.motivo,
              u.nombre, u.apellido, u.email
       FROM correccion_carga c
       LEFT JOIN usuario u ON u.id_usuario = c.id_usuario
       WHERE c.entidad = $1 AND c.id_registro = $2
       ORDER BY c.fecha DESC, c.id_correccion DESC
       LIMIT 200`,
      [req.params.entidad, id],
    );

    res.json({
      entidad: { clave: req.params.entidad, titulo: cfg.titulo },
      id,
      etiqueta: cfg.etiqueta(row),
      campos: Object.entries(cfg.campos).map(([campo, meta]) => ({
        campo,
        label: meta.label,
        tipo: meta.tipo,
        requerido: Boolean(meta.requerido),
      })),
      valores,
      opciones,
      historial: historial.rows,
    });
  } catch (err) {
    console.error('Error al obtener registro para corregir:', err);
    res.status(500).json({ message: 'Error al obtener el registro' });
  }
};

// PUT /api/correcciones/:entidad/:id   body: { motivo (obligatorio), ...campos }
exports.corregirRegistro = async (req, res) => {
  const cfg = obtenerConfig(req, res);
  if (!cfg) return;

  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: 'ID inválido' });

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

    const fila = await client.query(`SELECT * FROM ${cfg.tabla} WHERE ${cfg.pk} = $1 FOR UPDATE`, [id]);
    if (fila.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Registro no encontrado' });
    }
    const actual = fila.rows[0];

    const cambios = [];
    for (const [campo, meta] of Object.entries(cfg.campos)) {
      if (!(campo in body)) continue;

      const nuevo = desdeEntrada(meta.tipo, body[campo], meta.label);
      if (nuevo === null && meta.requerido) {
        throw new ErrorValidacion(`${meta.label} es obligatorio`);
      }

      const antes = desdeBase(meta.tipo, actual[campo]);
      if (antes !== nuevo) cambios.push({ campo, antes, nuevo });
    }

    if (cambios.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'No hay cambios para guardar' });
    }

    // Nombres de columna vienen del registro (no del usuario)
    const sets = cambios.map((c, i) => `${c.campo} = $${i + 1}`).join(', ');
    await client.query(
      `UPDATE ${cfg.tabla} SET ${sets} WHERE ${cfg.pk} = $${cambios.length + 1}`,
      [...cambios.map((c) => c.nuevo), id],
    );

    for (const c of cambios) {
      await client.query(
        `INSERT INTO correccion_carga
           (id_usuario, rol, entidad, id_registro, campo, valor_antes, valor_despues, motivo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          req.user?.id_usuario ?? null,
          req.user?.rol ?? null,
          req.params.entidad,
          id,
          c.campo,
          c.antes === null ? null : String(c.antes),
          c.nuevo === null ? null : String(c.nuevo),
          motivo,
        ],
      );
    }

    await client.query('COMMIT');
    res.json({
      message: 'Corrección guardada',
      campos_corregidos: cambios.map((c) => c.campo),
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof ErrorValidacion) {
      return res.status(400).json({ message: err.message });
    }
    if (err.code === '23503') {
      return res.status(400).json({ message: 'Una de las referencias seleccionadas no existe' });
    }
    if (err.code === '23505') {
      return res.status(400).json({ message: 'Ya existe otro registro con ese valor único' });
    }
    if (err.code === '23502') {
      return res.status(400).json({ message: 'Falta un campo obligatorio' });
    }
    if (['22P02', '22007', '22008', '22003'].includes(err.code)) {
      return res.status(400).json({ message: 'Un valor tiene un formato inválido' });
    }
    console.error('Error al corregir registro:', err);
    res.status(500).json({ message: 'Error al guardar la corrección' });
  } finally {
    client.release();
  }
};

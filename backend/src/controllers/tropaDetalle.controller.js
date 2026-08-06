// src/controllers/tropaDetalle.controller.js
const db = require('../db'); // cliente pg

const ok = (res, data, msg = 'OK') =>
  res.status(200).json({ data, message: msg });
const err = (res, status = 500, error = 'Error interno') =>
  res.status(status).json({ error });

/**
 * Actualiza campos de un detalle de tropa.
 * Acepta id_cat_especie y/o cantidad en el body.
 */
async function updateDetalle(req, res) {
  try {
    const detalleIdRaw = req.params.detalleId;
    const detalleId = Number(detalleIdRaw);

    if (!Number.isInteger(detalleId) || detalleId <= 0) {
      return err(res, 400, 'detalleId inválido');
    }

    // permitimos recibir string o number; normalizamos a entero cuando corresponde
    let { id_cat_especie, cantidad } = req.body;

    const updates = {};
    if (
      id_cat_especie !== undefined &&
      id_cat_especie !== null &&
      id_cat_especie !== ''
    ) {
      const n = Number(id_cat_especie);
      updates.id_cat_especie = Number.isInteger(n) ? n : id_cat_especie;
    }
    if (cantidad !== undefined && cantidad !== null && cantidad !== '') {
      const nc = Number(cantidad);
      updates.cantidad = Number.isFinite(nc) ? nc : cantidad;
    }

    if (Object.keys(updates).length === 0)
      return err(res, 400, 'No hay campos para actualizar');

    const keys = Object.keys(updates);
    const sets = keys.map((k, i) => `${k} = $${i + 1}`).join(', ');
    const params = keys.map((k) => updates[k]);
    params.push(detalleId);

    const sql = `UPDATE tropa_detalle SET ${sets} WHERE id_tropa_detalle = $${keys.length + 1} RETURNING *;`;

    console.log('[tropaDetalle] SQL:', sql, 'PARAMS:', params);

    const result = await db.query(sql, params);
    const row = result.rows && result.rows[0];
    if (!row) return err(res, 404, 'Detalle no encontrado');

    // Traer fila enriquecida con datos de categoría y especie para el frontend
    const joinSql = `
      SELECT
        td.id_tropa_detalle AS id,
        td.id_tropa,
        td.id_especie,
        e.descripcion AS especie_nombre,
        td.id_cat_especie,
        ce.descripcion AS categoria_nombre,
        td.cantidad
      FROM tropa_detalle td
      LEFT JOIN categoria_especie ce ON td.id_cat_especie = ce.id_cat_especie
      LEFT JOIN especie e ON td.id_especie = e.id_especie
      WHERE td.id_tropa_detalle = $1
      LIMIT 1;
    `;
    const joined = await db.query(joinSql, [detalleId]);
    const joinedRow = joined.rows && joined.rows[0];

    return ok(res, joinedRow, 'Detalle actualizado');
  } catch (e) {
    console.error('updateDetalle error', e && (e.stack || e));
    return err(res, 500, 'Error actualizando detalle');
  }
}

async function patchDetalle(req, res) {
  return updateDetalle(req, res);
}

/**
 * Elimina un detalle de tropa (DELETE físico).
 * Si prefieres soft-delete, cambia la consulta a UPDATE estado = false.
 */
async function deleteDetalle(req, res) {
  try {
    const detalleIdRaw = req.params.detalleId;
    const detalleId = Number(detalleIdRaw);

    if (!Number.isInteger(detalleId) || detalleId <= 0) {
      return err(res, 400, 'detalleId inválido');
    }

    const sql =
      'DELETE FROM tropa_detalle WHERE id_tropa_detalle = $1 RETURNING *;';
    const r = await db.query(sql, [detalleId]);
    const row = r.rows && r.rows[0];
    if (!row) return err(res, 404, 'Detalle no encontrado');

    return ok(res, row, 'Detalle eliminado');
  } catch (e) {
    console.error('deleteDetalle error', e && (e.stack || e));
    return err(res, 500, 'Error eliminando detalle');
  }
}

module.exports = { updateDetalle, patchDetalle, deleteDetalle };

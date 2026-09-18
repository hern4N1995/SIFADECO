// controllers/tropaEliminacion.controller.js
const pool = require('../db');

/**
 * SOLICITAR ELIMINACIÓN DE TROPA
 * Rol 3 (usuario) solicita la eliminación
 * La tropa entra en estado 'pendiente_eliminacion'
 */
exports.solicitarEliminacion = async (req, res) => {
  const { tropaId } = req.params;
  const { motivo = '' } = req.body;
  const usuarioId = req.user?.id_usuario;
  const rolUsuario = req.user?.rol;

  // Validar rol
  if (rolUsuario !== 3) {
    return res.status(403).json({
      error: 'Solo usuarios (rol 3) pueden solicitar eliminación de tropas',
    });
  }

  // Validar ID
  if (!/^\d+$/.test(tropaId)) {
    return res.status(400).json({ error: 'ID de tropa inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar que la tropa existe y está activa
    const tropaRes = await client.query(
      `SELECT id_tropa, n_tropa, estado FROM tropa WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    if (tropaRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tropa no encontrada' });
    }

    const { n_tropa, estado } = tropaRes.rows[0];

    if (estado !== 'activa') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `La tropa ya está en estado "${estado}". No se puede solicitar eliminación.`,
      });
    }

    // 2. Contar faenas y decomisos asociados para auditoría
    const faenasRes = await client.query(
      `SELECT COUNT(*) as count FROM faena WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    const decomisoRes = await client.query(
      `SELECT COUNT(DISTINCT d.id_decomiso) as count 
       FROM decomiso d
       JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
       JOIN faena f ON fd.id_faena = f.id_faena
       WHERE f.id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    const cantFaenas = parseInt(faenasRes.rows[0].count, 10);
    const cantDecomisos = parseInt(decomisoRes.rows[0].count, 10);

    // 3. Actualizar estado de la tropa
    await client.query(
      `UPDATE tropa 
       SET estado = 'pendiente_eliminacion',
           usuario_solicita_eliminacion = $1,
           fecha_solicita_eliminacion = NOW(),
           motivo_eliminacion = $2
       WHERE id_tropa = $3`,
      [usuarioId, motivo || null, parseInt(tropaId, 10)]
    );

    // 4. Registrar en auditoría
    await client.query(
      `INSERT INTO audit_tropa_eliminacion 
       (id_tropa, n_tropa, accion, usuario_id, rol_usuario, detalles)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        parseInt(tropaId, 10),
        n_tropa,
        'solicitud_eliminacion',
        usuarioId,
        rolUsuario,
        JSON.stringify({
          motivo: motivo || 'Sin especificar',
          faenas_asociadas: cantFaenas,
          decomisos_asociados: cantDecomisos,
          fecha_solicitud: new Date().toISOString(),
        }),
      ]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Solicitud de eliminación registrada correctamente',
      tropa_id: parseInt(tropaId, 10),
      n_tropa,
      estado: 'pendiente_eliminacion',
      faenas_asociadas: cantFaenas,
      decomisos_asociados: cantDecomisos,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[tropaEliminacion.solicitarEliminacion] Error:', err);
    res.status(500).json({ error: 'Error al procesar solicitud de eliminación' });
  } finally {
    client.release();
  }
};

/**
 * CONFIRMAR ELIMINACIÓN DE TROPA
 * Rol 1 (admin) confirma y ejecuta hard delete
 * Se elimina completamente: FAENA, DECOMISO, TROPA
 */
exports.confirmarEliminacion = async (req, res) => {
  const { tropaId } = req.params;
  const usuarioId = req.usuario?.id_usuario || req.usuario?.id;
  const rolUsuario = req.usuario?.id_rol || req.usuario?.rol;

  // Validar rol
  if (rolUsuario !== 1) {
    return res.status(403).json({
      error: 'Solo administradores (rol 1) pueden confirmar eliminación de tropas',
    });
  }

  // Validar ID
  if (!/^\d+$/.test(tropaId)) {
    return res.status(400).json({ error: 'ID de tropa inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Verificar que la tropa existe y está pendiente
    const tropaRes = await client.query(
      `SELECT id_tropa, n_tropa, estado, usuario_solicita_eliminacion, 
              fecha_solicita_eliminacion, motivo_eliminacion
       FROM tropa WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    if (tropaRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tropa no encontrada' });
    }

    const tropaData = tropaRes.rows[0];

    if (tropaData.estado !== 'pendiente_eliminacion') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `La tropa no está en estado pendiente. Estado actual: ${tropaData.estado}`,
      });
    }

    // 2. Contar registros antes de eliminar (para auditoría)
    const detalleRes = await client.query(
      `SELECT COUNT(*) as count FROM tropa_detalle WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    const faenasRes = await client.query(
      `SELECT COUNT(*) as count FROM faena WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    const decomisoRes = await client.query(
      `SELECT COUNT(DISTINCT d.id_decomiso) as count 
       FROM decomiso d
       JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
       JOIN faena f ON fd.id_faena = f.id_faena
       WHERE f.id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    const cantDetalle = parseInt(detalleRes.rows[0].count, 10);
    const cantFaenas = parseInt(faenasRes.rows[0].count, 10);
    const cantDecomisos = parseInt(decomisoRes.rows[0].count, 10);

    // 3. Eliminar FAENA (esto cascara y elimina FAENA_DETALLE, DECOMISO, etc.)
    // Nota: Gracias a ON DELETE CASCADE, esto elimina automáticamente todas las cascadas
    await client.query(
      `DELETE FROM faena WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    // 4. Eliminar TROPA_DETALLE (ahora tiene ON DELETE CASCADE, pero lo eliminamos explícitamente)
    await client.query(
      `DELETE FROM tropa_detalle WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    // 5. Eliminar TROPA
    await client.query(
      `DELETE FROM tropa WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    // 6. Registrar en auditoría
    await client.query(
      `INSERT INTO audit_tropa_eliminacion 
       (id_tropa, n_tropa, accion, usuario_id, rol_usuario, detalles)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        parseInt(tropaId, 10),
        tropaData.n_tropa,
        'confirmacion_eliminacion',
        usuarioId,
        rolUsuario,
        JSON.stringify({
          solicitada_por: tropaData.usuario_solicita_eliminacion,
          fecha_solicitud: tropaData.fecha_solicita_eliminacion,
          motivo_solicitud: tropaData.motivo_eliminacion,
          fecha_confirmacion: new Date().toISOString(),
          registros_eliminados: {
            tropa_detalle: cantDetalle,
            faenas: cantFaenas,
            decomisos: cantDecomisos,
          },
        }),
      ]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Tropa eliminada completamente',
      tropa_id: parseInt(tropaId, 10),
      n_tropa: tropaData.n_tropa,
      registros_eliminados: {
        tropa_detalle: cantDetalle,
        faenas: cantFaenas,
        decomisos: cantDecomisos,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[tropaEliminacion.confirmarEliminacion] Error:', err);
    res.status(500).json({ error: 'Error al confirmar eliminación de tropa' });
  } finally {
    client.release();
  }
};

/**
 * OBTENER TROPAS PENDIENTES DE ELIMINACIÓN
 * Solo para rol 1 (admin)
 */
exports.obtenerPendientes = async (req, res) => {
  const rolUsuario = req.usuario?.id_rol || req.usuario?.rol;

  // Validar rol
  if (rolUsuario !== 1) {
    return res.status(403).json({
      error: 'Solo administradores pueden ver tropas pendientes de eliminación',
    });
  }

  try {
    const result = await pool.query(
      `SELECT 
        t.id_tropa,
        t.n_tropa,
        t.dte_dtu,
        t.fecha_alta,
        t.fecha_ingreso,
        t.estado,
        t.usuario_solicita_eliminacion,
        t.fecha_solicita_eliminacion,
        t.motivo_eliminacion,
        u.nombre AS usuario_solicita_nombre,
        u.email AS usuario_solicita_email,
        p.nombre AS planta_nombre,
        pr.nombre AS productor_nombre,
        tf.nombre AS titular_nombre,
        COUNT(DISTINCT f.id_faena) AS cant_faenas,
        COUNT(DISTINCT d.id_decomiso) AS cant_decomisos
       FROM tropa t
       LEFT JOIN usuario u ON t.usuario_solicita_eliminacion = u.id_usuario
       LEFT JOIN planta p ON t.id_planta = p.id_planta
       LEFT JOIN productor pr ON t.id_productor = pr.id_productor
       LEFT JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
       LEFT JOIN faena f ON t.id_tropa = f.id_tropa
       LEFT JOIN faena_detalle fd ON f.id_faena = fd.id_faena
       LEFT JOIN decomiso d ON fd.id_faena_detalle = d.id_faena_detalle
       WHERE t.estado = 'pendiente_eliminacion'
       GROUP BY 
        t.id_tropa, t.n_tropa, t.dte_dtu, t.fecha_alta, t.fecha_ingreso,
        t.estado, t.usuario_solicita_eliminacion, t.fecha_solicita_eliminacion,
        t.motivo_eliminacion, u.nombre, u.email, p.nombre, pr.nombre, tf.nombre
       ORDER BY t.fecha_solicita_eliminacion DESC`,
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[tropaEliminacion.obtenerPendientes] Error:', err);
    res.status(500).json({ error: 'Error al obtener tropas pendientes' });
  }
};

/**
 * OBTENER HISTORIAL DE AUDITORÍA DE UNA TROPA
 * Solo para rol 1 (admin)
 */
exports.obtenerHistorialAuditoria = async (req, res) => {
  const { tropaId } = req.params;
  const rolUsuario = req.usuario?.id_rol || req.usuario?.rol;

  // Validar rol
  if (rolUsuario !== 1) {
    return res.status(403).json({
      error: 'Solo administradores pueden ver historial de auditoría',
    });
  }

  if (!/^\d+$/.test(tropaId)) {
    return res.status(400).json({ error: 'ID de tropa inválido' });
  }

  try {
    const result = await pool.query(
      `SELECT 
        a.id_audit,
        a.id_tropa,
        a.n_tropa,
        a.accion,
        a.usuario_id,
        a.rol_usuario,
        a.fecha_accion,
        a.detalles,
        u.nombre AS usuario_nombre,
        u.email AS usuario_email
       FROM audit_tropa_eliminacion a
       LEFT JOIN usuario u ON a.usuario_id = u.id_usuario
       WHERE a.id_tropa = $1
       ORDER BY a.fecha_accion DESC`,
      [parseInt(tropaId, 10)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[tropaEliminacion.obtenerHistorialAuditoria] Error:', err);
    res.status(500).json({ error: 'Error al obtener historial de auditoría' });
  }
};

/**
 * CANCELAR SOLICITUD DE ELIMINACIÓN
 * Rol 1 (admin) puede cancelar una solicitud
 * La tropa vuelve a estado 'activa'
 */
exports.cancelarSolicitud = async (req, res) => {
  const { tropaId } = req.params;
  const { motivo_rechazo = '' } = req.body;
  const usuarioId = req.usuario?.id_usuario || req.usuario?.id;
  const rolUsuario = req.usuario?.id_rol || req.usuario?.rol;

  // Validar rol
  if (rolUsuario !== 1) {
    return res.status(403).json({
      error: 'Solo administradores pueden cancelar solicitudes de eliminación',
    });
  }

  if (!/^\d+$/.test(tropaId)) {
    return res.status(400).json({ error: 'ID de tropa inválido' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verificar que la tropa está pendiente
    const tropaRes = await client.query(
      `SELECT id_tropa, n_tropa, estado FROM tropa WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    if (tropaRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Tropa no encontrada' });
    }

    const { n_tropa, estado } = tropaRes.rows[0];

    if (estado !== 'pendiente_eliminacion') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `La tropa no está en estado pendiente. Estado actual: ${estado}`,
      });
    }

    // Actualizar estado
    await client.query(
      `UPDATE tropa 
       SET estado = 'activa',
           usuario_solicita_eliminacion = NULL,
           fecha_solicita_eliminacion = NULL,
           motivo_eliminacion = NULL
       WHERE id_tropa = $1`,
      [parseInt(tropaId, 10)]
    );

    // Registrar en auditoría
    await client.query(
      `INSERT INTO audit_tropa_eliminacion 
       (id_tropa, n_tropa, accion, usuario_id, rol_usuario, detalles)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        parseInt(tropaId, 10),
        n_tropa,
        'cancelacion_solicitud',
        usuarioId,
        rolUsuario,
        JSON.stringify({
          motivo_rechazo: motivo_rechazo || 'Sin especificar',
          fecha_cancelacion: new Date().toISOString(),
        }),
      ]
    );

    await client.query('COMMIT');

    res.status(200).json({
      message: 'Solicitud de eliminación cancelada',
      tropa_id: parseInt(tropaId, 10),
      n_tropa,
      estado: 'activa',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[tropaEliminacion.cancelarSolicitud] Error:', err);
    res.status(500).json({ error: 'Error al cancelar solicitud' });
  } finally {
    client.release();
  }
};

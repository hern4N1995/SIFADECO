// routes/tropaEliminacion.routes.js
const express = require('express');
const router = express.Router();
const {
  solicitarEliminacion,
  confirmarEliminacion,
  obtenerPendientes,
  obtenerHistorialAuditoria,
  cancelarSolicitud,
} = require('../controllers/tropaEliminacion.controller');

const { verificarToken } = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

/**
 * RUTAS PROTEGIDAS PARA ELIMINACIÓN DE TROPAS
 * Base: /api/tropas-eliminacion
 */

/**
 * POST /api/tropas-eliminacion/:tropaId/solicitar
 * Solicitar eliminación de una tropa (roles 1 - admin, 2 - supervisor, 3 - usuario)
 * Body: { motivo: string (opcional) }
 */
router.post(
  '/:tropaId/solicitar',
  verificarToken,
  permitirRoles(1, 2, 3),
  solicitarEliminacion
);

/**
 * DELETE /api/tropas-eliminacion/:tropaId/confirmar
 * Confirmar y ejecutar eliminación (rol 1 - admin)
 */
router.delete(
  '/:tropaId/confirmar',
  verificarToken,
  permitirRoles(1),
  confirmarEliminacion
);

/**
 * GET /api/tropas-eliminacion/pendientes
 * Obtener lista de tropas pendientes de eliminación (rol 1 - admin)
 */
router.get(
  '/pendientes',
  verificarToken,
  permitirRoles(1),
  obtenerPendientes
);

/**
 * GET /api/tropas-eliminacion/:tropaId/auditoria
 * Obtener historial de auditoría de una tropa (rol 1 - admin)
 */
router.get(
  '/:tropaId/auditoria',
  verificarToken,
  permitirRoles(1),
  obtenerHistorialAuditoria
);

/**
 * POST /api/tropas-eliminacion/:tropaId/cancelar
 * Cancelar solicitud de eliminación (rol 1 - admin)
 * Body: { motivo_rechazo: string (opcional) }
 */
router.post(
  '/:tropaId/cancelar',
  verificarToken,
  permitirRoles(1),
  cancelarSolicitud
);

module.exports = router;

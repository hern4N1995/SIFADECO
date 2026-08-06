// routes/tropa.routes.js
const express = require('express');
const router = express.Router();
const tropaController = require('../controllers/tropa.controller');
const { verificarToken } = require('../middleware/auth');

/*
  Este router se monta en App.js en '/api/tropas'.
  Por eso las rutas aquí son relativas al punto de montaje,
  por ejemplo: GET /api/tropas/plantas -> router.get('/plantas', ...)
*/

/* Recursos auxiliares (consultas relacionadas a tropas) */
router.get('/departamentos', tropaController.getDepartamentos);
router.get('/plantas', tropaController.getPlantas);
router.get('/productores', tropaController.getProductores);
router.get('/titulares', tropaController.getTitulares);

/* Detalles de tropa (deben ir antes de la ruta con :tropaId para evitar colisiones) */
router.get('/detalle-todas', tropaController.getTodosLosDetalles);
router.get('/:tropaId/detalle-agrupado', tropaController.getDetalleAgrupado);
router.get('/:tropaId/detalle', tropaController.getDetalle);
router.post('/:tropaId/detalle', tropaController.saveDetalle);

/* Tropas de la planta del usuario (protegida) */
router.get('/por-planta', verificarToken, tropaController.getByUsuarioPlanta);

/* Operaciones sobre tropas */
router.get('/', tropaController.getAll);
router.post('/', tropaController.createTropa);
router.get('/:tropaId', tropaController.getById);
router.put('/:tropaId', tropaController.updateTropa);

module.exports = router;

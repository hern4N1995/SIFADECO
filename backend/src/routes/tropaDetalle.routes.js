// routes/tropaDetalle.routes.js
const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams por si se monta bajo /api/tropas/:tropaId/...
const {
  updateDetalle,
  patchDetalle,
  deleteDetalle,
} = require('../controllers/tropaDetalle.controller');
const { verificarToken } = require('../middleware/auth');

/*
  Este router se monta en App.js en '/api/tropas'.
  Rutas relativas esperadas:
    PUT    /api/tropas/:tropaId/detalle/:detalleId
    PATCH  /api/tropas/:tropaId/detalle/:detalleId
    DELETE /api/tropas/:tropaId/detalle/:detalleId

  También se exponen rutas planas alternativas para casos donde no se
  provea tropaId en la URL:
    PUT    /api/tropas/tropa-detalle/:detalleId
    PATCH  /api/tropas/tropa-detalle/:detalleId
    DELETE /api/tropas/tropa-detalle/:detalleId
*/

/* Rutas con tropaId en la URL (preferidas cuando aplica) */
router.put('/:tropaId/detalle/:detalleId', verificarToken, updateDetalle);
router.patch('/:tropaId/detalle/:detalleId', verificarToken, patchDetalle);
router.delete('/:tropaId/detalle/:detalleId', verificarToken, deleteDetalle);

/* Rutas alternativas planas (útiles para llamadas directas sin tropaId) */
router.put('/tropa-detalle/:detalleId', verificarToken, updateDetalle);
router.patch('/tropa-detalle/:detalleId', verificarToken, patchDetalle);
router.delete('/tropa-detalle/:detalleId', verificarToken, deleteDetalle);

module.exports = router;

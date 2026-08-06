// routes/faena.routes.js
const express = require('express');
const router = express.Router();

const {
  obtenerFaenas,
  crearFaena,
  obtenerRemanentePorTropa,
  obtenerFaenasSinDecomiso,
  obtenerFaenasRealizadas,
  obtenerDatosParaDecomiso,
  obtenerDetallesFaenaConCategoria,
  obtenerDetalleFaenaPorId,
  modificarFaena,
} = require('../controllers/faena.controller');

const { verificarToken } = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');
const { registrarFaena } = require('../controllers/registrarFaena.controller');

/*
  Nota:
  - Este router se monta en App.js en '/api/faena'.
  - Las rutas definidas aquí deben ser relativas al punto de montaje.
  - Evitamos repetir el segmento 'faena' dentro de las rutas para no generar
    endpoints como '/api/faena/faena/...'.
  - LAS RUTAS ESTÁTICAS DEBEN IR ANTES DE LAS DINÁMICAS (:id_faena)
*/

/* Operaciones CRUD / listados generales (rutas generales van primero) */
router.get('/', verificarToken, permitirRoles(1, 2, 3), obtenerFaenas);
router.post('/', verificarToken, permitirRoles(2), crearFaena);

/* Rutas estáticas específicas (deben ir ANTES de /:id_faena) */
router.get(
  '/faenas-realizadas',
  verificarToken,
  permitirRoles(1, 2, 3),
  obtenerFaenasRealizadas,
);

router.get(
  '/faenas-sin-decomiso',
  verificarToken,
  permitirRoles(1, 2, 3),
  obtenerFaenasSinDecomiso,
);

router.get(
  '/detalles-categorias',
  verificarToken,
  permitirRoles(1, 2, 3),
  obtenerDetallesFaenaConCategoria,
);

/* Endpoint para obtener tropas relacionadas (si corresponde) */
router.get('/tropas', obtenerFaenas);

/* Remanente por tropa (protegido) */
router.get(
  '/remanente',
  verificarToken,
  permitirRoles(1, 2, 3),
  obtenerRemanentePorTropa,
);

/* Registrar faena (acción distinta a crearFaena) */
router.post(
  '/registrar',
  verificarToken,
  permitirRoles(1, 2, 3),
  registrarFaena,
);

/* Rutas DINÁMICAS (deben ir DESPUÉS de las estáticas) */
router.get('/:id_faena/decomiso-datos', obtenerDatosParaDecomiso);
router.get('/:id_faena/detalle', verificarToken, permitirRoles(1, 2, 3), obtenerDetalleFaenaPorId);
router.put('/:id_faena', verificarToken, permitirRoles(1, 2, 3), modificarFaena);

module.exports = router;

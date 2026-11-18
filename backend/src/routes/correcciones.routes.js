// src/routes/correcciones.routes.js
// Base: /api/correcciones — solo superadmin (rol 4)
const express = require('express');
const router = express.Router();
const {
  buscarDecomisos,
  obtenerDecomisoParaCorregir,
  corregirDecomisoDetalle,
} = require('../controllers/correcciones.controller');
const {
  listarEntidades,
  buscarRegistros,
  obtenerRegistro,
  corregirRegistro,
} = require('../controllers/correccionesGenericas.controller');
const { verificarToken } = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');
const { ROLES } = require('../config/roles');

const soloSuperadmin = [verificarToken, permitirRoles(ROLES.SUPERADMIN)];

// Decomisos (flujo propio: detalles por fila con historial por decomiso)
router.get('/decomisos', ...soloSuperadmin, buscarDecomisos);
router.get('/decomisos/:id', ...soloSuperadmin, obtenerDecomisoParaCorregir);
router.put('/decomiso-detalle/:idDetalle', ...soloSuperadmin, corregirDecomisoDetalle);

// Genéricas: tropa, faena, productor, departamento, planta, titular_faena, veterinario
// (deben ir al final: el comodín /:entidad/:id no debe capturar las rutas de arriba)
router.get('/entidades', ...soloSuperadmin, listarEntidades);
router.get('/:entidad/buscar', ...soloSuperadmin, buscarRegistros);
router.get('/:entidad/:id', ...soloSuperadmin, obtenerRegistro);
router.put('/:entidad/:id', ...soloSuperadmin, corregirRegistro);

module.exports = router;

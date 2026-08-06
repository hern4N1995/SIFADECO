const express = require('express');
const router = express.Router();
const {
  registrarAfeccion,
  listarAfecciones,
  actualizarAfeccion,
  eliminarAfeccion,
} = require('../controllers/afeccion.controller');
const { verificarToken } = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

// Supervisores (rol 2) y administradores (rol 1) pueden administrar afecciones
router.get('/', verificarToken, permitirRoles(1, 2), listarAfecciones);

router.post('/', verificarToken, permitirRoles(1, 2), registrarAfeccion);

router.put('/:id', verificarToken, permitirRoles(1, 2), actualizarAfeccion);

router.delete('/:id', verificarToken, permitirRoles(1, 2), eliminarAfeccion);

module.exports = router;

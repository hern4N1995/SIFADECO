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

// Todos los roles autenticados pueden ver afecciones (lectura)
router.get('/', verificarToken, permitirRoles(1, 2, 3), listarAfecciones);

// Solo supervisores (rol 2) y administradores (rol 1) pueden administrar (crear, editar, eliminar)
router.post('/', verificarToken, permitirRoles(1, 2), registrarAfeccion);

router.put('/:id', verificarToken, permitirRoles(1, 2), actualizarAfeccion);

router.delete('/:id', verificarToken, permitirRoles(1, 2), eliminarAfeccion);

module.exports = router;

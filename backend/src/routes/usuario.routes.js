/* // src/routes/usuario.routes.js
const express = require('express');
const router = express.Router();
const {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getPerfil,
  updatePerfil,
} = require('../controllers/usuario.controller');

const { verificarToken } = require('../middleware/auth');

// Rutas generales
router.get('/', obtenerUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario);
router.delete('/:id', eliminarUsuario);

// Rutas de perfil del usuario logueado
router.get('/perfil', verificarToken, getPerfil);
router.put('/perfil', verificarToken, updatePerfil);

module.exports = router;
 */
// src/routes/usuario.routes.js
const express = require('express');
const router = express.Router();
const {
  obtenerUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  getPerfil,
  updatePerfil,
  usuarioActual,
  cambiarEstadoUsuario,
} = require('../controllers/usuario.controller');

const { verificarToken } = require('../middleware/auth');

router.get('/usuario-actual', verificarToken, usuarioActual);

// ✅ Rutas de perfil del usuario logueado (deben ir antes que las rutas con :id)
router.get('/perfil', verificarToken, getPerfil);
router.put('/perfil', verificarToken, updatePerfil);

// Rutas generales
router.get('/', obtenerUsuarios);
router.post('/', crearUsuario);
router.put('/:id', actualizarUsuario); // ✅ ahora no intercepta /perfil
router.delete('/:id', eliminarUsuario);
// Cambiar estado (PATCH)
router.patch('/:id/estado', cambiarEstadoUsuario);

module.exports = router;

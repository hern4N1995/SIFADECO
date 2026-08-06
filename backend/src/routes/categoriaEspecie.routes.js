const express = require('express');
const router = express.Router();
const {
  getCategorias,
  registrarCategoria,
  actualizarCategoria,
  eliminarCategoria,
  getCategoriasPorEspecie,
} = require('../controllers/categoriaEspecie.controller');

const { verificarToken } = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

// Administración (solo roles 1 y 2)
router.get('/', verificarToken, permitirRoles(1, 2), getCategorias);
router.post('/', verificarToken, permitirRoles(1, 2), registrarCategoria);
router.put('/:id', verificarToken, permitirRoles(1, 2), actualizarCategoria);
router.delete('/:id', verificarToken, permitirRoles(1, 2), eliminarCategoria);

// Público: categorías por especie
router.get('/:id/categorias', verificarToken, getCategoriasPorEspecie);

module.exports = router;

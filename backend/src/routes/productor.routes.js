// routes/productor.routes.js
const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');
const {
  obtenerProductores,
  crearProductor,
  editarProductor,
  eliminarProductor,
} = require('../controllers/productor.controller');

// Rutas relativas al mount point en App.js (App.js monta este router en /api/productores)
router.get('/', obtenerProductores);
router.post('/', verificarToken, crearProductor);
router.put('/:id', verificarToken, editarProductor);
router.delete('/:id', verificarToken, eliminarProductor);

module.exports = router;

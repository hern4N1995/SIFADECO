// routes/partesDecomisadas.routes.js
const express = require('express');
const router = express.Router();

const {
  obtenerPartes,
  crearParte,
  editarParte,
  eliminarParte,
} = require('../controllers/partesDecomisadas.controller');

router.get('/', obtenerPartes);
router.post('/', crearParte);
router.put('/:id', editarParte);
router.delete('/:id', eliminarParte);

module.exports = router;

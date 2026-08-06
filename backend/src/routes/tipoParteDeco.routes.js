// routes/tipoParteDeco.routes.js
const express = require('express');
const router = express.Router();
const {
  obtenerTipos,
  crearTipo,
  editarTipo,
  eliminarTipo,
} = require('../controllers/tipoParteDeco.controller');

router.get('/', obtenerTipos);
router.post('/', crearTipo);
router.put('/:id', editarTipo);
router.delete('/:id', eliminarTipo);

module.exports = router;

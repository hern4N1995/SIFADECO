const express = require('express');
const router = express.Router();
const {
  obtenerProvincias,
  agregarProvincia,
  editarProvincia,
  eliminarProvincia,
} = require('../controllers/provincia.controller');

router.get('/', obtenerProvincias);
router.post('/', agregarProvincia);
router.put('/:id', editarProvincia);
router.delete('/:id', eliminarProvincia);

module.exports = router;

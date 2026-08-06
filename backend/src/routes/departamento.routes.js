const express = require('express');
const router = express.Router();
const {
  obtenerDepartamentos,
  crearDepartamento,
  editarDepartamento,
  eliminarDepartamento,
} = require('../controllers/departamento.controller');

router.get('/', obtenerDepartamentos);
router.post('/', crearDepartamento);
router.put('/:id', editarDepartamento);
router.delete('/:id', eliminarDepartamento);

module.exports = router;

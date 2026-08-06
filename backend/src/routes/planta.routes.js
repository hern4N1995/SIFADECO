const express = require('express');
const router = express.Router();
const {
  obtenerPlantas,
  crearPlanta,
  modificarPlanta,
  eliminarPlanta,
} = require('../controllers/planta.controller');

router.get('/', obtenerPlantas);
router.post('/', crearPlanta);
router.put('/:id', modificarPlanta);
router.delete('/:id', eliminarPlanta);

module.exports = router;

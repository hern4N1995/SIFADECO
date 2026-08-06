const express = require('express');
const router = express.Router();
const {
  obtenerTitulares,
  crearTitular,
  modificarTitular,
  eliminarTitular,
} = require('../controllers/titularFaena.controller');

router.get('/', obtenerTitulares);
router.post('/', crearTitular);
router.put('/:id', modificarTitular);
router.delete('/:id', eliminarTitular);

module.exports = router;

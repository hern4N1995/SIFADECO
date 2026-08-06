const express = require('express');
const router = express.Router();

const {
  registrarDetalleDecomiso,
} = require('../controllers/decomisoDetalle.controller');

const { verificarToken } = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');

router.post('/', verificarToken, permitirRoles(1), registrarDetalleDecomiso);

module.exports = router;

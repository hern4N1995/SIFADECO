const express = require('express');
const router = express.Router();
const diagnosticoController = require('../controllers/diagnostico.controller');

// Endpoint de diagnóstico - accesible sin autenticación
router.post('/request-debug', diagnosticoController);

module.exports = router;

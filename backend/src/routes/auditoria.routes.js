// src/routes/auditoria.routes.js
const express = require('express');
const router = express.Router();
const { listarAuditoria } = require('../controllers/auditoria.controller');
const { verificarToken } = require('../middleware/auth');
const { permitirRoles } = require('../middleware/roles');
const { ROLES } = require('../config/roles');

// Solo superadmin. La auditoría es de solo lectura: no hay endpoints de edición.
router.get('/', verificarToken, permitirRoles(ROLES.SUPERADMIN), listarAuditoria);

module.exports = router;

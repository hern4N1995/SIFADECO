// src/middleware/roles.js
const { esSuperAdmin } = require('../config/roles');

exports.permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolUsuario = req.user?.rol;

    // El superadmin pasa todas las restricciones de rol
    if (esSuperAdmin(rolUsuario)) return next();

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ message: 'Acceso denegado por rol' });
    }

    next();
  };
};

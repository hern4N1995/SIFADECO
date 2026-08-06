// src/middleware/roles.js
exports.permitirRoles = (...rolesPermitidos) => {
  return (req, res, next) => {
    const rolUsuario = req.user?.rol;

    if (!rolesPermitidos.includes(rolUsuario)) {
      return res.status(403).json({ message: 'Acceso denegado por rol' });
    }

    next();
  };
};

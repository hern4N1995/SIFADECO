// src/config/roles.js
// Fuente única de verdad para los ids de rol (tabla rol_usuario).
const ROLES = Object.freeze({
  ADMIN: 1,
  SUPERVISOR: 2,
  USUARIO: 3,
  SUPERADMIN: 4,
});

// Superadmin ve todo y además accede a la auditoría. Admin mantiene sus permisos.
const esSuperAdmin = (rol) => Number(rol) === ROLES.SUPERADMIN;

// "Admin" a efectos de visibilidad de datos (todas las plantas): admin o superadmin.
const esAdmin = (rol) => {
  const r = Number(rol);
  return r === ROLES.ADMIN || r === ROLES.SUPERADMIN;
};

module.exports = { ROLES, esSuperAdmin, esAdmin };

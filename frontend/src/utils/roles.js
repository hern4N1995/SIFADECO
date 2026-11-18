// src/utils/roles.js
// Ids de rol (deben coincidir con backend/src/config/roles.js y la tabla rol_usuario)
export const ROLES = Object.freeze({
  ADMIN: 1,
  SUPERVISOR: 2,
  USUARIO: 3,
  SUPERADMIN: 4,
});

// Superadmin ve todo: se trata como admin para visibilidad de datos (todas las plantas)
export const esAdmin = (rol) => {
  const r = Number(rol);
  return r === ROLES.ADMIN || r === ROLES.SUPERADMIN;
};

export const esSuperAdmin = (rol) => Number(rol) === ROLES.SUPERADMIN;

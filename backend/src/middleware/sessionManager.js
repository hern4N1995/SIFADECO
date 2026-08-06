// Gestor simple de sesiones en memoria para controlar inactividad
const INACTIVITY_LIMIT_MS = 2 * 60 * 60 * 1000; // 2 horas
const sessions = new Map(); // key: token, value: lastSeen timestamp (ms)

function addSession(token) {
  if (!token) return;
  sessions.set(token, Date.now());
}

function touchSession(token) {
  if (!token) return;
  sessions.set(token, Date.now());
}

function isActive(token) {
  if (!token) return false;
  const last = sessions.get(token);
  if (!last) return false; // si no existe, considerarlo no activo
  return Date.now() - last <= INACTIVITY_LIMIT_MS;
}

function removeSession(token) {
  if (!token) return;
  sessions.delete(token);
}

// Limpieza periódica para evitar crecimiento ilimitado
setInterval(() => {
  const now = Date.now();
  for (const [token, last] of sessions.entries()) {
    if (now - last > INACTIVITY_LIMIT_MS) {
      sessions.delete(token);
    }
  }
}, 10 * 60 * 1000); // cada 10 minutos

module.exports = {
  addSession,
  touchSession,
  isActive,
  removeSession,
  INACTIVITY_LIMIT_MS,
};

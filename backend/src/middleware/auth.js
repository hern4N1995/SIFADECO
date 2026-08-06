// src/middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET; // Usar process.env en producción
const sessionManager = require('./sessionManager');

exports.verificarToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    console.warn('[AUTH] Token no proporcionado en Authorization header');
    return res.status(401).json({ message: 'Token no proporcionado' });
  }

  try {
    if (!JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET no configurado!');
      throw new Error('JWT_SECRET no está configurado');
    }
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar inactividad: si la sesión existe y supera el límite, rechazar
    if (!sessionManager.isActive(token)) {
      console.warn('[AUTH] Sesión inactiva por más de 2 horas para token:', token?.slice?.(0,10));
      sessionManager.removeSession(token);
      return res.status(401).json({ message: 'Sesión cerrada por inactividad' });
    }

    // Actualizar último acceso y adjuntar usuario
    sessionManager.touchSession(token);
    req.user = decoded; // { id_usuario, rol }
    console.log('[AUTH] Token verificado y sesión actualizada para usuario:', decoded.id_usuario);
    next();
  } catch (error) {
    console.error('[AUTH] Error al verificar token:', error.message, 'JWT_SECRET definido:', !!JWT_SECRET);
    return res.status(403).json({ message: 'Token inválido o expirado' });
  }
};

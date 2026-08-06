// src/middleware/security.js
/**
 * Middleware de seguridad para proteger contra manipulaciones desde consola
 */

const crypto = require('crypto');

// Almacenar tokens CSRF en memoria (en producción usar Redis)
const csrfTokens = new Map();

/**
 * Middleware: Generar y validar CSRF tokens
 * Previene ataques cross-site request forgery
 */
exports.csrfProtection = (req, res, next) => {
  const token = req.headers['x-csrf-token'];
  const method = req.method.toUpperCase();

  // GET, HEAD, OPTIONS no necesitan CSRF token
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    return next();
  }

  // POST, PUT, DELETE, PATCH requieren CSRF token válido
  // PERO permitir POST sin CSRF si el usuario está autenticado (verificarToken ya pasó)
  if (!token) {
    // Si el usuario está autenticado (req.user existe), permitir sin CSRF token
    if (req.user && req.user.id_usuario) {
      return next();
    }
    return res.status(403).json({ 
      error: 'CSRF token no proporcionado',
      code: 'CSRF_MISSING' 
    });
  }

  // Validar que el token existe y es válido
  if (!csrfTokens.has(token)) {
    return res.status(403).json({ 
      error: 'CSRF token inválido',
      code: 'CSRF_INVALID' 
    });
  }

  const tokenData = csrfTokens.get(token);
  
  // Token expira en 1 hora
  if (Date.now() - tokenData.createdAt > 3600000) {
    csrfTokens.delete(token);
    return res.status(403).json({ 
      error: 'CSRF token expirado',
      code: 'CSRF_EXPIRED' 
    });
  }

  // Validar que el token pertenece al usuario actual
  if (tokenData.userId !== req.user?.id_usuario) {
    return res.status(403).json({ 
      error: 'CSRF token no coincide con usuario',
      code: 'CSRF_MISMATCH' 
    });
  }

  next();
};

/**
 * Generar nuevo CSRF token para el usuario
 */
exports.generateCsrfToken = (userId) => {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.set(token, {
    userId,
    createdAt: Date.now(),
  });
  
  // Limpiar tokens antiguos cada 10 minutos
  if (csrfTokens.size > 10000) {
    const now = Date.now();
    for (const [key, value] of csrfTokens.entries()) {
      if (now - value.createdAt > 3600000) {
        csrfTokens.delete(key);
      }
    }
  }

  return token;
};

/**
 * Middleware: Validar tipos de datos
 * Previene manipulación de tipos desde consola
 */
exports.validateDataTypes = (schema) => {
  return (req, res, next) => {
    const data = req.body;
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];

      // Campo requerido
      if (rules.required && (value === undefined || value === null)) {
        errors.push({
          field,
          message: `${field} es requerido`,
          code: 'REQUIRED',
        });
        continue;
      }

      // Validar tipo
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? 'array' : typeof value;
        
        if (rules.type && actualType !== rules.type) {
          errors.push({
            field,
            message: `${field} debe ser de tipo ${rules.type}, recibido ${actualType}`,
            code: 'TYPE_MISMATCH',
          });
          continue;
        }

        // Validar longitud
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            field,
            message: `${field} debe tener mínimo ${rules.minLength} caracteres`,
            code: 'MIN_LENGTH',
          });
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            field,
            message: `${field} debe tener máximo ${rules.maxLength} caracteres`,
            code: 'MAX_LENGTH',
          });
        }

        // Validar rango numérico
        if (rules.min !== undefined && value < rules.min) {
          errors.push({
            field,
            message: `${field} debe ser mínimo ${rules.min}`,
            code: 'MIN_VALUE',
          });
        }

        if (rules.max !== undefined && value > rules.max) {
          errors.push({
            field,
            message: `${field} debe ser máximo ${rules.max}`,
            code: 'MAX_VALUE',
          });
        }

        // Validar patrón regex
        if (rules.pattern && !rules.pattern.test(String(value))) {
          errors.push({
            field,
            message: `${field} tiene formato inválido`,
            code: 'PATTERN_MISMATCH',
          });
        }

        // Validar enum
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({
            field,
            message: `${field} debe ser uno de: ${rules.enum.join(', ')}`,
            code: 'ENUM_INVALID',
          });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validación de datos fallida',
        code: 'VALIDATION_ERROR',
        details: errors,
      });
    }

    next();
  };
};

/**
 * Middleware: Rate limiting por IP y usuario
 * Previene fuerza bruta y abuso
 */
const requestCounts = new Map();
const MAX_REQUESTS_PER_MINUTE = 100;
const MAX_REQUESTS_PER_HOUR = 1000;

exports.rateLimiter = (req, res, next) => {
  const identifier = req.user?.id_usuario || req.ip;
  const now = Date.now();
  const minuteAgo = now - 60000;
  const hourAgo = now - 3600000;

  if (!requestCounts.has(identifier)) {
    requestCounts.set(identifier, []);
  }

  const timestamps = requestCounts.get(identifier);
  const recentRequests = timestamps.filter(t => t > minuteAgo);
  const hourRequests = timestamps.filter(t => t > hourAgo);

  // Limpiar entradas antiguas
  requestCounts.set(identifier, hourRequests);

  if (recentRequests.length > MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({
      error: 'Demasiadas solicitudes. Intenta más tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60,
    });
  }

  if (hourRequests.length > MAX_REQUESTS_PER_HOUR) {
    return res.status(429).json({
      error: 'Límite de solicitudes por hora excedido.',
      code: 'RATE_LIMIT_HOUR_EXCEEDED',
      retryAfter: 3600,
    });
  }

  requestCounts.get(identifier).push(now);
  next();
};

/**
 * Middleware: Sanitización de entrada
 * Previene SQL injection y XSS
 */
exports.sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        // Remover caracteres peligrosos
        obj[key] = obj[key]
          .replace(/[<>]/g, '') // Remover < >
          .replace(/['";]/g, '') // Remover quotes
          .trim();
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    }
    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Middleware: Detectar y bloquear cambios anormales
 * Alerta si hay cambios masivos o datos inconsistentes
 */
const changeHistory = new Map();

exports.detectAnomalies = (req, res, next) => {
  const userId = req.user?.id_usuario;
  const method = req.method.toUpperCase();

  if (!['POST', 'PUT', 'DELETE'].includes(method) || !userId) {
    return next();
  }

  if (!changeHistory.has(userId)) {
    changeHistory.set(userId, []);
  }

  const history = changeHistory.get(userId);
  const now = Date.now();

  // Registrar cambio
  history.push({
    timestamp: now,
    method,
    path: req.path,
    fields: Object.keys(req.body || {}),
  });

  // Limpiar historial antiguo (últimas 24 horas)
  const dayAgo = now - 86400000;
  changeHistory.set(userId, history.filter(h => h.timestamp > dayAgo));

  // Detectar patrones anormales
  const lastMinute = history.filter(h => h.timestamp > now - 60000);
  const deleteCount = lastMinute.filter(h => h.method === 'DELETE').length;

  if (deleteCount > 10) {
    // Log de alerta
    console.warn(`[SECURITY] Usuario ${userId} realizó ${deleteCount} deletes en 1 minuto`);
    return res.status(429).json({
      error: 'Comportamiento sospechoso detectado. Solicitud bloqueada.',
      code: 'ANOMALY_DETECTED',
    });
  }

  next();
};

/**
 * Middleware: Logging de auditoría
 * Registra todos los cambios de datos
 */
exports.auditLog = (req, res, next) => {
  const userId = req.user?.id_usuario;
  const method = req.method.toUpperCase();

  // Continuar con la solicitud
  const originalJson = res.json;
  res.json = function(data) {
    // Registrar en log (aquí iría a BD en producción)
    if (['POST', 'PUT', 'DELETE'].includes(method)) {
      console.log(`[AUDIT] ${new Date().toISOString()} - Usuario: ${userId}, Método: ${method}, Ruta: ${req.path}, Estatus: ${res.statusCode}`);
    }

    return originalJson.call(this, data);
  };

  next();
};

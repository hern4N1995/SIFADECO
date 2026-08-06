// GUÍA DE IMPLEMENTACIÓN DE SEGURIDAD
// ====================================

/**
 * CAMBIOS DE SEGURIDAD IMPLEMENTADOS
 * 
 * 1. MIDDLEWARES DE SEGURIDAD BACKEND
 *    - Rate Limiting: Máx 100 req/min por usuario
 *    - CSRF Protection: Token requerido en POST/PUT/DELETE
 *    - Data Type Validation: Valida tipos antes de llegar a controller
 *    - Input Sanitization: Limpia caracteres peligrosos
 *    - Anomaly Detection: Detecta cambios masivos/sospechosos
 *    - Audit Logging: Registra todos los cambios
 *    - Security Headers: X-Frame-Options, CSP, etc.
 * 
 * 2. IMPLEMENTACIÓN EN FRONTEND
 * 
 *    a) Obtener CSRF token al login:
 *    ```javascript
 *    const response = await api.post('/auth/csrf-token');
 *    const { csrfToken } = response.data;
 *    localStorage.setItem('csrfToken', csrfToken);
 *    ```
 * 
 *    b) Enviar CSRF token en cada request:
 *    ```javascript
 *    api.interceptors.request.use(config => {
 *      const token = localStorage.getItem('csrfToken');
 *      if (token) {
 *        config.headers['X-CSRF-Token'] = token;
 *      }
 *      return config;
 *    });
 *    ```
 * 
 *    c) Manejar errores de validación:
 *    ```javascript
 *    api.interceptors.response.use(
 *      response => response,
 *      error => {
 *        if (error.response?.status === 400 && error.response?.data?.code === 'VALIDATION_ERROR') {
 *          // Mostrar errores de validación al usuario
 *          console.log(error.response.data.details);
 *        }
 *        if (error.response?.status === 403 && error.response?.data?.code === 'CSRF_INVALID') {
 *          // Redirigir a login
 *        }
 *        return Promise.reject(error);
 *      }
 *    );
 *    ```
 * 
 * 3. CÓMO PROTEGER LAS RUTAS
 * 
 *    En cada archivo de rutas (ej: usuario.routes.js):
 *    
 *    const { validateAndProtect } = require('../middleware/apply-validation');
 *    
 *    // Antes:
 *    router.post('/', crearUsuario);
 *    
 *    // Después:
 *    router.post('/', ...validateAndProtect('usuarioCreate'), crearUsuario);
 *    
 *    Similar para PUT y DELETE.
 * 
 * 4. PROTECCIÓN CONTRA MANIPULACIÓN DESDE CONSOLA
 * 
 *    ❌ ESTO SERÁ BLOQUEADO:
 *    
 *    // Cambiar tipo de dato
 *    fetch('/api/usuarios/1', {
 *      method: 'PUT',
 *      body: JSON.stringify({
 *        id: "texto en vez de número"  // ❌ Error: type mismatch
 *      })
 *    })
 *    
 *    // Omitir CSRF token
 *    fetch('/api/usuarios/1', {
 *      method: 'PUT',
 *      body: JSON.stringify({ nombre: 'hacker' })
 *      // ❌ Error: CSRF_MISSING
 *    })
 *    
 *    // Enviar datos inválidos
 *    fetch('/api/usuarios', {
 *      method: 'POST',
 *      body: JSON.stringify({
 *        email: "no-es-email"  // ❌ Error: pattern mismatch
 *      })
 *    })
 *    
 *    // Rate limiting
 *    for(let i = 0; i < 200; i++) {
 *      fetch('/api/usuarios')  // ❌ Error: RATE_LIMIT_EXCEEDED después de 100
 *    }
 * 
 * 5. ESTRUCTURA DE RESPUESTA DE ERRORES
 * 
 *    Validación:
 *    {
 *      error: "Validación de datos fallida",
 *      code: "VALIDATION_ERROR",
 *      details: [
 *        { field: "email", message: "email tiene formato inválido", code: "PATTERN_MISMATCH" }
 *      ]
 *    }
 *    
 *    CSRF inválido:
 *    {
 *      error: "CSRF token inválido",
 *      code: "CSRF_INVALID"
 *    }
 *    
 *    Rate limit:
 *    {
 *      error: "Demasiadas solicitudes. Intenta más tarde.",
 *      code: "RATE_LIMIT_EXCEEDED",
 *      retryAfter: 60
 *    }
 * 
 * 6. PRÓXIMOS PASOS
 * 
 *    - Aplicar validateAndProtect() a TODAS las rutas POST/PUT/DELETE
 *    - Actualizar frontend para obtener y enviar CSRF tokens
 *    - Implementar manejo de errores de validación en UI
 *    - Migrar tokens a httpOnly cookies (más seguro)
 *    - Agregar 2FA para operaciones críticas
 * 
 */

module.exports = {
  // Guía de referencia - no es código ejecutable
  guia: true,
};

// src/App.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');

/* ---------------------------
   Helpers seguros
   --------------------------- */

function safeRequire(p) {
  try {
    const mod = require(p);
    console.log('safeRequire OK:', p);
    return mod;
  } catch (err) {
    console.error(
      'safeRequire ERROR al require:',
      p,
      '\n',
      err && err.stack ? err.stack : err,
    );
    return null;
  }
}

function toRouter(moduleExport) {
  if (!moduleExport) return null;

  // Soporte para exportaciones ES Module: moduleExport.default
  const candidate =
    moduleExport && moduleExport.default ? moduleExport.default : moduleExport;

  // Si ya es un router de express
  if (
    (typeof candidate === 'object' || typeof candidate === 'function') &&
    typeof candidate.use === 'function'
  ) {
    return candidate;
  }

  // Si exporta una función que recibe router (pattern)
  if (typeof candidate === 'function') {
    try {
      const tmp = require('express').Router();
      // Si la función espera (app) en lugar de (router), intentar pasar router igualmente.
      candidate(tmp);
      if (typeof tmp.use === 'function') return tmp;
    } catch (e) {
      // no convertible
    }
  }

  return null;
}

function safeMount(appInstance, mountPath, moduleExport, originalPath) {
  // Soporte defensivo si se pasaron argumentos en orden distinto
  if (typeof mountPath !== 'string' && typeof moduleExport === 'string') {
    const tmp = mountPath;
    mountPath = moduleExport;
    moduleExport = tmp;
  }

  // Normalizar mountPath: si es una URL completa, extraer pathname; si no es string, lo dejamos como-is
  let normalizedMountPath = mountPath;
  if (typeof normalizedMountPath === 'string') {
    normalizedMountPath = normalizedMountPath.trim();
    if (normalizedMountPath === '') normalizedMountPath = '/';
    if (/^https?:\/\//i.test(normalizedMountPath)) {
      try {
        const u = new URL(normalizedMountPath);
        normalizedMountPath = u.pathname || '/';
      } catch (e) {
        console.warn(
          'safeMount: mountPath parece una URL inválida, se ignorará:',
          mountPath,
        );
        return false;
      }
    }
    if (!normalizedMountPath.startsWith('/'))
      normalizedMountPath = '/' + normalizedMountPath;
  }

  const r = toRouter(
    typeof normalizedMountPath === 'string' ? moduleExport : mountPath,
  );
  if (!r) {
    console.warn('SAFE_MOUNT: No se pudo convertir la exportación a Router', {
      mountPath: normalizedMountPath,
      originalPath,
    });
    return false;
  }

  // inspeccionar stack del router antes de montarlo (detección de rutas mal formadas)
  try {
    const stack = r.stack || (r._router && r._router.stack) || [];
    for (let i = 0; i < stack.length; i++) {
      const layer = stack[i];
      if (!layer) continue;
      if (layer.route && layer.route.path) {
        const p = String(layer.route.path);
        if (/^:/.test(p)) {
          console.error(
            'SAFE_MOUNT: Ruta interna empieza con ":" (falta "/" antes del parámetro)',
            {
              mountPath: normalizedMountPath,
              originalPath,
              layerIndex: i,
              path: p,
            },
          );
          return false;
        }
        if (/\/:\s/.test(p) || /\/:[^a-zA-Z0-9_\/]/.test(p)) {
          console.error('SAFE_MOUNT: Ruta interna con formato inválido', {
            mountPath: normalizedMountPath,
            originalPath,
            layerIndex: i,
            path: p,
          });
          return false;
        }
      }
      if (layer && layer.regexp) {
        const re = String(layer.regexp);
        if (re.includes('https://') || re.includes('http://')) {
          console.error(
            'SAFE_MOUNT: regexp del layer contiene URL (posible ruta inválida)',
            {
              mountPath: normalizedMountPath,
              originalPath,
              layerIndex: i,
              regexp: re,
            },
          );
          return false;
        }
      }
    }
  } catch (e) {
    console.error(
      'SAFE_MOUNT: Error inspeccionando router.stack antes de montar',
      {
        mountPath: normalizedMountPath,
        originalPath,
        error: e && e.stack ? e.stack : e,
      },
    );
    return false;
  }

  // montar
  try {
    if (typeof normalizedMountPath === 'string') {
      appInstance.use(normalizedMountPath, r);
      console.log('Mounted', normalizedMountPath, 'from', originalPath);
    } else {
      appInstance.use(r);
      console.log(
        'Mounted router (direct) from',
        originalPath || normalizedMountPath,
      );
    }
    return true;
  } catch (err) {
    console.error('SAFE_MOUNT: ERROR al montar (capturado):', {
      mountPath: normalizedMountPath,
      originalPath,
    });
    console.error('Error stack:', err && err.stack ? err.stack : err);
    return false;
  }
}

/* ---------------------------
   Cargar rutas (intento seguro)
   --------------------------- */

function loadRoute(p) {
  const r = safeRequire(p);
  if (r) return r;
  try {
    const direct = require(p);
    console.log('Direct require OK:', p);
    return direct;
  } catch (err) {
    console.error(
      'Direct require ERROR:',
      p,
      err && err.stack ? err.stack : err,
    );
    return null;
  }
}

const authRoutes = loadRoute('./routes/auth.routes');
const usuarioRoutes = loadRoute('./routes/usuario.routes');
const tropaRoutes = loadRoute('./routes/tropa.routes');
const faenaRoutes = loadRoute('./routes/faena.routes');
const plantaRoutes = loadRoute('./routes/planta.routes');
const especieRoutes = loadRoute('./routes/especie.routes');
const categoriaEspecieRoutes = loadRoute('./routes/categoriaEspecie.routes');
const provinciaRoutes = loadRoute('./routes/provincia.routes');
const departamentoRoutes = loadRoute('./routes/departamento.routes');
const titularFaenaRoutes = loadRoute('./routes/titularFaena.routes');
const productorRoutes = loadRoute('./routes/productor.routes');
const decomisoRoutes = loadRoute('./routes/decomisos.routes');
const afeccionRoutes = loadRoute('./routes/afeccion.routes');
const veterinarioRoutes = loadRoute('./routes/veterinario.routes');
const tipoParteDecoRoutes = loadRoute('./routes/tipoParteDeco.routes');
const partesDecomisadasRoutes = loadRoute('./routes/partesDecomisadas.routes');
const decomisoDetalleRoutes = loadRoute('./routes/decomisoDetalle.routes');
const tropaDetalleRoutes = loadRoute('./routes/tropaDetalle.routes');

/* ---------------------------
   App y CORS manual
   --------------------------- */

const app = express();

// Parsear FRONTEND_ORIGINS de forma segura: separar por comas, trim y filtrar entradas vacías
const envOriginsRaw = (
  process.env.FRONTEND_ORIGINS ||
  process.env.FRONTEND_ORIGIN ||
  ''
).trim();
const envOrigins = envOriginsRaw
  ? envOriginsRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  : [];

// Añadir dominio del frontend en Vercel si no está presente
if (!envOrigins.includes('https://sifadeco.vercel.app')) {
  envOrigins.push('https://sifadeco.vercel.app');
}

// Sanitizar entradas: convertir a origin (scheme + host + port) y eliminar path si existe
const allowedOrigins = envOrigins
  .map((o) => {
    try {
      const u = new URL(o);
      return u.origin;
    } catch (e) {
      return o;
    }
  })
  .filter(Boolean);

// Asegurar localhost por defecto (dev) - agregar múltiples puertos para dev
const localDevPorts = [5173, 5174, 5175, 5176];
for (const port of localDevPorts) {
  const localUrl = `http://localhost:${port}`;
  if (!allowedOrigins.includes(localUrl)) {
    allowedOrigins.unshift(localUrl);
  }
}

console.log('DEBUG_ALLOWED_ORIGINS (sanitized):', allowedOrigins);

// Middleware CORS manual y seguro
app.use((req, res, next) => {
  try {
    const origin = req.headers.origin;
    // permitir requests sin origin (herramientas como curl o same-origin)
    if (!origin) return next();

    if (allowedOrigins.includes(origin)) {
      // Origen permitido: setear headers CORS
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true'); // si usas cookies / credentials
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      );
      const requestedHeaders = req.headers['access-control-request-headers'];
      const allowedHeaders = [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-CSRF-Token',
        requestedHeaders,
      ]
        .filter(Boolean)
        .join(', ');
      res.setHeader('Access-Control-Allow-Headers', allowedHeaders);
      if (req.method === 'OPTIONS') return res.sendStatus(204);
      return next();
    } else {
      // Origen no permitido: registrar y continuar (no lanzar)
      console.warn('CORS blocked origin:', origin);
      return next();
    }
  } catch (err) {
    console.error(
      'CORS manual middleware error:',
      err && err.stack ? err.stack : err,
    );
    return next();
  }
});

/* ---------------------------
   Middlewares y rutas
   --------------------------- */

// Importar middlewares de seguridad
const securityMiddleware = require('./middleware/security');
const authMiddleware = require('./middleware/auth');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ===== MIDDLEWARES DE SEGURIDAD =====
// 1. Rate limiting - Proteger contra fuerza bruta (DESHABILITADO EN DESARROLLO)
// app.use(securityMiddleware.rateLimiter);

// 2. Sanitización de entrada - Limpiar datos peligrosos
app.use(securityMiddleware.sanitizeInput);

// 3. Headers de seguridad
app.use((req, res, next) => {
  // Prevenir clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Prevenir MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Habilitar XSS protection
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Content Security Policy
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'");
  // Strict Transport Security (HTTPS)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

app.get('/', (req, res) => {
  res.json({
    message: 'Sistema de Faenas API, ESTA FUNCIONANDO CORRECTAMENTE',
  });
});

// ===== ENDPOINT PARA OBTENER CSRF TOKEN =====
// El frontend debe obtener este token ANTES de hacer cambios
app.post('/api/auth/csrf-token', authMiddleware.verificarToken, (req, res) => {
  const token = securityMiddleware.generateCsrfToken(req.user.id_usuario);
  res.json({
    csrfToken: token,
    expiresIn: 3600000, // 1 hora en ms
  });
});

// ===== HEALTH CHECK ENDPOINTS =====
const healthController = safeRequire('./controllers/health.controller');
if (healthController) {
  app.get('/api/health', healthController.healthCheck);
  app.get('/api/ping', healthController.ping);
}

/* Montar rutas con paths explícitos (usamos /api como prefijo) */
safeMount(app, '/api/auth', authRoutes, './routes/auth.routes');
safeMount(app, '/api/usuarios', usuarioRoutes, './routes/usuario.routes');
safeMount(app, '/api/tropas', tropaRoutes, './routes/tropa.routes');
safeMount(app, '/api/faena', faenaRoutes, './routes/faena.routes');
safeMount(app, '/api/provincias', provinciaRoutes, './routes/provincia.routes');
safeMount(
  app,
  '/api/departamentos',
  departamentoRoutes,
  './routes/departamento.routes',
);
safeMount(app, '/api/plantas', plantaRoutes, './routes/planta.routes');
safeMount(
  app,
  '/api/titulares-faena',
  titularFaenaRoutes,
  './routes/titularFaena.routes',
);
safeMount(app, '/api/especies', especieRoutes, './routes/especie.routes');
safeMount(
  app,
  '/api/categorias-especie',
  categoriaEspecieRoutes,
  './routes/categoriaEspecie.routes',
);
// CORRECCIÓN: montar productores bajo /api/productores para mantener consistencia
safeMount(
  app,
  '/api/productores',
  productorRoutes,
  './routes/productor.routes',
);
safeMount(app, '/api/afecciones', afeccionRoutes, './routes/afeccion.routes');
safeMount(
  app,
  '/api/veterinarios',
  veterinarioRoutes,
  './routes/veterinario.routes',
);
safeMount(
  app,
  '/api/tipos-parte-deco',
  tipoParteDecoRoutes,
  './routes/tipoParteDeco.routes',
);
safeMount(
  app,
  '/api/partes-decomisadas',
  partesDecomisadasRoutes,
  './routes/partesDecomisadas.routes',
);
safeMount(
  app,
  '/api/decomiso-detalle',
  decomisoDetalleRoutes,
  './routes/decomisoDetalle.routes',
);
safeMount(app, '/api/decomisos', decomisoRoutes, './routes/decomisos.routes');
// Montar tropaDetalleRoutes bajo el mismo prefijo de tropas
safeMount(
  app,
  '/api/tropas',
  tropaDetalleRoutes,
  './routes/tropaDetalle.routes',
);

/* ---------------------------
   Endpoint de diagnóstico: listar rutas registradas
   (se deja aquí, después de montar routers)
   --------------------------- */
app.get('/__routes', (req, res) => {
  const routes = [];

  function walk(stack, prefix = '') {
    stack.forEach((layer) => {
      if (!layer) return;
      // rutas directas (layer.route)
      if (layer.route && layer.route.path) {
        const path =
          prefix + (layer.route.path === '/' ? '' : layer.route.path);
        routes.push({
          path: path || '/',
          methods: Object.keys(layer.route.methods || {}),
        });
      } else if (
        layer.name === 'router' &&
        layer.handle &&
        layer.handle.stack
      ) {
        // intentar extraer el path del layer.regexp de forma segura
        let layerPath = '';
        try {
          const re = String(layer.regexp || '');
          // buscar el primer segmento entre barras, por ejemplo "/api" en "/^\/api\/.../"
          const m = re.match(/\/([^\\\/]+)\//);
          if (m && m[1]) {
            layerPath = '/' + m[1];
          }
        } catch (e) {
          // ignore extraction errors, no queremos romper el endpoint de diagnóstico
        }
        walk(layer.handle.stack, prefix + layerPath);
      }
    });
  }

  if (app._router && app._router.stack) walk(app._router.stack, '');
  res.json(routes);
});

/* ---------------------------
   Servir frontend estático (si existe)
   Asegurate que la ruta apunte a la carpeta correcta del build del cliente.
   --------------------------- */
const clientDist = path.join(__dirname, '..', 'client', 'dist'); // ajustar si tu build está en otro lugar
try {
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback: servir index.html para rutas no API
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api')) return next();
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log('Static client served from', clientDist);
  } else {
    console.log(
      'No se encontró client dist en',
      clientDist,
      '- no se sirve frontend estático',
    );
  }
} catch (e) {
  console.error('Error comprobando client dist:', e && e.stack ? e.stack : e);
}

/* ---------------------------
   Manejo de errores y 404 (al final)
   --------------------------- */
app.use((req, res, next) => {
  // Si la ruta empieza con /api devolvemos JSON 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Para otras rutas, dejar que el static o SPA fallback las maneje; si no, 404 simple
  res.status(404).send('Not Found');
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err && err.stack ? err.stack : err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ---------------------------
   Arranque
   --------------------------- */

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});

module.exports = app;

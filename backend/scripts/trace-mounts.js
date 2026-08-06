/*
  scripts/trace-mounts.js
  Instrumenta express para registrar app.use / router mounts y atrapar
  la llamada que provoca path-to-regexp Missing parameter name.
*/
const path = require('path');
const fs = require('fs');

// Cargar express y parchear antes de cargar src/App.js
const express = require('express');

// Guardar originales
const origUse = express.application.use;
const origRouter = express.Router;

// Helper para formatear caller
function shortStack() {
  const e = new Error();
  const s = (e.stack || '').split('\n').slice(3, 10).join('\n');
  return s;
}

// Parchear application.use para loggear argumentos
express.application.use = function patchedUse(...args) {
  try {
    const first = args[0];
    if (typeof first === 'string') {
      console.log('[TRACE-MOUNT] app.use called with path:', first);
    } else if (first && first.name) {
      console.log('[TRACE-MOUNT] app.use called with non-string first arg, type:', typeof first, 'name:', first.name);
    } else {
      console.log('[TRACE-MOUNT] app.use called with first arg type:', typeof first);
    }
  } catch (e) {
    console.error('[TRACE-MOUNT] error logging app.use args', e && e.stack ? e.stack : e);
  }
  return origUse.apply(this, args);
};

// Parchear Router factory para interceptar routers creados dinámicamente
express.Router = function patchedRouter(...args) {
  const r = origRouter.apply(this, args);
  // parchear r.use y r.get/post/... para loggear rutas internas cuando se añadan
  const methods = ['use','get','post','put','patch','delete','all'];
  methods.forEach(m => {
    if (typeof r[m] === 'function') {
      const orig = r[m].bind(r);
      r[m] = function patchedRouterMethod(pathArg, ...rest) {
        try {
          if (typeof pathArg === 'string') {
            console.log(`[TRACE-MOUNT] router.${m} called with path: ${pathArg}`);
          } else {
            console.log(`[TRACE-MOUNT] router.${m} called with non-string first arg, type: ${typeof pathArg}`);
          }
        } catch (e) {
          console.error('[TRACE-MOUNT] error logging router method', e && e.stack ? e.stack : e);
        }
        return orig(pathArg, ...rest);
      };
    }
  });
  return r;
};

// Ahora requerir src/App.js (arranca la app)
try {
  console.log('[TRACE-MOUNT] Requiring src/App.js now — esto ejecuta tu App exactamente como npm run dev lo haría.');
  require(path.join(process.cwd(), 'src', 'App.js'));
  console.log('[TRACE-MOUNT] src/App.js cargado sin lanzar el error (si el error ocurre, debería haber salido antes).');
} catch (err) {
  console.error('[TRACE-MOUNT] ERROR al cargar src/App.js — traza completa:');
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}

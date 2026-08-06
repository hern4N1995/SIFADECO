const path = require('path');
const express = require('express');

const origUse = express.application.use;
const origRouter = express.Router;

express.application.use = function patchedUse(...args) {
  try {
    const first = args[0];
    if (typeof first === 'string') {
      console.log('[TRACE] app.use path:', first);
    } else if (first && first.name) {
      console.log('[TRACE] app.use non-string first arg, type:', typeof first, 'name:', first.name);
    } else {
      console.log('[TRACE] app.use first arg type:', typeof first);
    }
  } catch (e) {
    console.error('[TRACE] error logging app.use args', e && e.stack ? e.stack : e);
  }
  return origUse.apply(this, args);
};

express.Router = function patchedRouter(...args) {
  const r = origRouter.apply(this, args);
  const methods = ['use','get','post','put','patch','delete','all','options'];
  methods.forEach(m => {
    if (typeof r[m] === 'function') {
      const orig = r[m].bind(r);
      r[m] = function patchedRouterMethod(pathArg, ...rest) {
        try {
          if (typeof pathArg === 'string') {
            console.log(`[TRACE] router.${m} path: ${pathArg}`);
          } else if (pathArg && pathArg.name) {
            console.log(`[TRACE] router.${m} non-string first arg type: ${typeof pathArg} name: ${pathArg.name}`);
          } else {
            console.log(`[TRACE] router.${m} first arg type: ${typeof pathArg}`);
          }
        } catch (e) {
          console.error('[TRACE] error logging router method', e && e.stack ? e.stack : e);
        }
        return orig(pathArg, ...rest);
      };
    }
  });
  return r;
};

console.log('[TRACE] Requiring src/App.js now');
try {
  require(path.join(process.cwd(), 'src', 'App.js'));
  console.log('[TRACE] src/App.js loaded without throwing (unexpected)');
} catch (err) {
  console.error('[TRACE] ERROR while loading src/App.js — full stack:');
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}

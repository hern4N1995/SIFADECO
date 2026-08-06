/*
 scripts/trace-pttr.js
 Intercepta path-to-regexp.parse para imprimir la cadena que intenta parsear,
 luego requiere src/App.js para reproducir el crash y mostrar la entrada.
*/
const path = require('path');

// parcheamos path-to-regexp
try {
  const ptr = require('path-to-regexp');
  if (typeof ptr.parse === 'function') {
    const origParse = ptr.parse;
    ptr.parse = function patchedParse(str, options) {
      try {
        console.error('[PTREX] parse called with:', String(str));
      } catch (e) {
        console.error('[PTREX] parse called but failed to stringify arg');
      }
      return origParse.call(this, str, options);
    };
    console.error('[PTREX] patched parse');
  } else {
    console.error('[PTREX] parse not found on path-to-regexp export');
  }
} catch (e) {
  console.error('[PTREX] error requiring path-to-regexp:', e && e.stack ? e.stack : e);
  process.exit(1);
}

// ahora requerir la app
try {
  console.error('[PTREX] Requiring src/App.js now');
  require(path.join(process.cwd(), 'src', 'App.js'));
  console.error('[PTREX] src/App.js loaded without throwing (unexpected)');
} catch (err) {
  console.error('[PTREX] ERROR while loading src/App.js — full stack:');
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
}

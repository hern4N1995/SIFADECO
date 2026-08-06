// inspect-routes.js
const path = require('path');
const fs = require('fs');

function toRouter(moduleExport) {
  if (!moduleExport) return null;
  if (
    typeof moduleExport === 'object' &&
    typeof moduleExport.use === 'function'
  )
    return moduleExport;
  if (typeof moduleExport === 'function') {
    try {
      const tmp = require('express').Router();
      moduleExport(tmp);
      if (typeof tmp.use === 'function') return tmp;
    } catch (e) {
      return null;
    }
  }
  return null;
}

function inspectRouter(r, name) {
  const stack = r.stack || (r._router && r._router.stack) || [];
  const problems = [];
  for (let i = 0; i < stack.length; i++) {
    const layer = stack[i];
    if (!layer) continue;

    // rutas declaradas directamente
    if (layer.route && layer.route.path) {
      const p = layer.route.path;
      if (/^:/.test(p))
        problems.push({ type: 'startsWithColon', index: i, path: p });
      if (/\/:\s/.test(p))
        problems.push({ type: 'paramWithSpace', index: i, path: p });
      if (/\/:[^a-zA-Z0-9_\/]/.test(p))
        problems.push({ type: 'paramInvalidChars', index: i, path: p });
      if (p.includes('http://') || p.includes('https://'))
        problems.push({ type: 'containsHttp', index: i, path: p });
    }

    // regexp del layer (puede contener tokens extraños)
    if (layer.regexp) {
      const re = String(layer.regexp);
      if (re.includes('\\:') || (re.includes(':') && !/\\:/.test(re))) {
        problems.push({ type: 'regexpColonLike', index: i, regexp: re });
      }
    }

    // handle como array (caso raro)
    if (layer.handle && Array.isArray(layer.handle)) {
      problems.push({
        type: 'handleArray',
        index: i,
        info: layer.handle.map((h) => typeof h),
      });
    }
  }

  if (problems.length) {
    console.error('>>> PROBLEMS in', name, '=>', problems);
  } else {
    console.log('OK:', name, 'layers:', stack.length);
  }
}

(function main() {
  try {
    const routesDir = path.join(__dirname, 'src', 'routes');
    if (!fs.existsSync(routesDir)) {
      console.error('routes directory not found:', routesDir);
      process.exit(1);
    }

    const files = fs.readdirSync(routesDir).filter((f) => f.endsWith('.js'));
    if (files.length === 0) {
      console.log('No route files found in', routesDir);
      return;
    }

    files.forEach((f) => {
      const full = path.join(routesDir, f);
      try {
        const mod = require(full);
        const r = toRouter(mod);
        if (!r) {
          console.warn('NOT A ROUTER (or not convertible):', f);
          return;
        }
        inspectRouter(r, f);
      } catch (e) {
        console.error('ERROR requiring', f, e && e.stack ? e.stack : e);
      }
    });
  } catch (err) {
    console.error('inspect-routes failed:', err && err.stack ? err.stack : err);
    process.exit(1);
  }
})();

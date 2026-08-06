/*
  scripts/find-bad-route.js
  Requiere cada archivo de src/routes y busca layers con rutas/regExp que
  contengan 'http://' o 'https://' o rutas internas mal formadas (ej: ':id' sin '/').
*/
const fs = require('fs');
const path = require('path');

const dir = path.join(process.cwd(), 'src', 'routes');
if (!fs.existsSync(dir)) {
  console.error('No existe', dir);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
let found = false;

for (const f of files) {
  const full = path.join(dir, f);
  try {
    console.log('--- Checking', f, '---');
    const mod = require(full);
    const router = (mod && (mod.stack || (mod._router && mod._router.stack))) ? mod : (mod && mod.default ? mod.default : mod);
    const stack = (router && (router.stack || (router._router && router._router.stack))) || [];
    if (!stack.length) {
      console.log('  (no stack found)');
      continue;
    }
    stack.forEach((layer, i) => {
      try {
        if (!layer) return;
        if (layer.route && layer.route.path) {
          const p = layer.route.path;
          const s = String(p);
          if (s.includes('http://') || s.includes('https://')) {
            console.error(`  -> BAD route.path in ${f} layer ${i}:`, s);
            found = true;
          }
          if (/^:/.test(s)) {
            console.error(`  -> BAD route.path starts with ':' in ${f} layer ${i}:`, s);
            found = true;
          }
        }
        if (layer && layer.regexp) {
          const re = String(layer.regexp);
          if (re.includes('http://') || re.includes('https://')) {
            console.error(`  -> BAD layer.regexp in ${f} layer ${i}:`, re);
            found = true;
          }
        }
      } catch (e) {
        console.error('  -> error inspecting layer', i, e && e.stack ? e.stack : e);
      }
    });
  } catch (e) {
    console.error('ERROR requiring', f, e && e.stack ? e.stack : e);
  }
}

if (!found) {
  console.log('No se encontraron rutas con http(s) ni rutas internas mal formadas en src/routes.');
} else {
  console.log('Se encontraron posibles rutas problemáticas. Corrige las rutas indicadas y vuelve a probar.');
}

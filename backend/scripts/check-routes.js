// scripts/check-routes.js
// Ejecutar desde la raíz del backend: node scripts/check-routes.js

const path = require('path');

const rutas = [
  './src/routes/auth.routes',
  './src/routes/usuario.routes',
  './src/routes/tropa.routes',
  './src/routes/faena.routes',
  './src/routes/planta.routes',
  './src/routes/especie.routes',
  './src/routes/categoriaEspecie.routes',
  './src/routes/provincia.routes',
  './src/routes/departamento.routes',
  './src/routes/titularFaena.routes',
  './src/routes/productor.routes',
  './src/routes/decomisos.routes',
  './src/routes/afeccion.routes',
  './src/routes/veterinario.routes',
  './src/routes/tipoParteDeco.routes',
  './src/routes/partesDecomisadas.routes',
  './src/routes/decomisoDetalle.routes',
  './src/routes/tropaDetalle.routes',
];

console.log('Comprobando requires de rutas uno por uno...');
for (const r of rutas) {
  try {
    console.log('-> intentando require:', r);
    const mod = require(path.resolve(r));
    console.log(
      '   OK:',
      r,
      '-> export type:',
      typeof mod,
      Array.isArray(mod) ? 'array' : mod && mod.use ? 'router' : typeof mod,
    );
  } catch (err) {
    console.error('   ERROR al require:', r);
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}
console.log('Todos los requires de rutas cargaron sin lanzar excepción.');
process.exit(0);

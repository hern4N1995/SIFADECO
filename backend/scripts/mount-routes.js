// scripts/mount-routes.js
const express = require('express');
const path = require('path');

const routeDefs = [
  { path: '/api/auth', mod: './src/routes/auth.routes' },
  { path: '/api/usuarios', mod: './src/routes/usuario.routes' },
  { path: '/api/tropas', mod: './src/routes/tropa.routes' },
  { path: '/api/faena', mod: './src/routes/faena.routes' },
  { path: '/api/plantas', mod: './src/routes/planta.routes' },
  { path: '/api/especies', mod: './src/routes/especie.routes' },
  {
    path: '/api/categorias-especie',
    mod: './src/routes/categoriaEspecie.routes',
  },
  { path: '/api/provincias', mod: './src/routes/provincia.routes' },
  { path: '/api/departamentos', mod: './src/routes/departamento.routes' },
  { path: '/api/titulares-faena', mod: './src/routes/titularFaena.routes' },
  { path: '/api/productores', mod: './src/routes/productor.routes' },
  { path: '/api/decomisos', mod: './src/routes/decomisos.routes' },
  { path: '/api/afecciones', mod: './src/routes/afeccion.routes' },
  { path: '/api/veterinarios', mod: './src/routes/veterinario.routes' },
  { path: '/api/tipos-parte-deco', mod: './src/routes/tipoParteDeco.routes' },
  {
    path: '/api/partes-decomisadas',
    mod: './src/routes/partesDecomisadas.routes',
  },
  { path: '/api/decomiso-detalle', mod: './src/routes/decomisoDetalle.routes' },
  { path: '/api/tropa-detalle', mod: './src/routes/tropaDetalle.routes' },
];

const app = express();

console.log('Montando routers uno por uno...');
for (const def of routeDefs) {
  try {
    console.log('-> montando', def.path, 'desde', def.mod);
    const router = require(path.resolve(def.mod));
    app.use(def.path, router);
    console.log('   Montado OK:', def.path);
  } catch (err) {
    console.error('   ERROR al montar', def.path, 'desde', def.mod);
    console.error(err && err.stack ? err.stack : err);
    process.exit(1);
  }
}
console.log('Todos los routers montados correctamente (no se produjo crash).');
process.exit(0);

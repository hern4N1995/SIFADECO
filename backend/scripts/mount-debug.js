const fs = require('fs');
const path = require('path');
const express = require('express');

const app = express();
const dir = path.join(process.cwd(), 'src', 'routes');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

console.log('Simulación de montaje: requiriendo y montando routers uno a uno');
for (const f of files) {
  const full = path.join(dir, f);
  try {
    console.log('-> require', f);
    const mod = require(full);
    // Intento de montaje con un mountPath seguro basado en el nombre del archivo
    const mountPath = '/_debug_mount_' + f.replace(/\.routes\.js$|\.js$/,'');
    console.log('   intentando montar en', mountPath);
    app.use(mountPath, mod);
    console.log('   MOUNT OK', f);
  } catch (e) {
    console.error('   ERROR al montar', f);
    console.error(e && e.stack ? e.stack : e);
    process.exit(1);
  }
}
console.log('Simulación completada: todos los routers montaron OK.');

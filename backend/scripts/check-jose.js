const pool = require('../src/db');

pool.query('SELECT id_usuario, nombre, id_rol, id_planta, email FROM usuario WHERE email = $1', ['jose@prueba.com'])
  .then(r => {
    console.log(r.rows[0]);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

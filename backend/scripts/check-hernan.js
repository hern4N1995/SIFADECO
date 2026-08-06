const pool = require('../src/db');

pool.query('SELECT id_usuario, nombre, id_rol, id_planta, email FROM usuario WHERE email = $1', ['hernan@example.com'])
  .then(r => {
    console.log('Hernan user data:', r.rows[0]);
    
    // Also check how many faenas sin decomiso exist by plant
    return pool.query(`
      SELECT p.nombre as planta, COUNT(DISTINCT f.id_faena) as faenas_sin_decomiso
      FROM faena f
      JOIN tropa t ON f.id_faena_detalle IN (SELECT id_faena_detalle FROM faena_detalle WHERE id_faena = f.id_faena)
      JOIN planta p ON t.id_planta = p.id_planta
      LEFT JOIN decomiso d ON f.id_faena = d.id_faena
      WHERE d.id_decomiso IS NULL
      GROUP BY p.nombre, p.id_planta
      ORDER BY p.id_planta
    `);
  })
  .then(r => {
    console.log('\nFaenas sin decomiso por planta:');
    console.log(r.rows);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });

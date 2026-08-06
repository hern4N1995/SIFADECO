const pool = require('../src/db');

async function test() {
  try {
    // Check if faena 400 (which we know has decomiso) is in the endpoint result
    const result = await pool.query(`
      SELECT
        f.id_faena,
        f.fecha_faena,
        t.dte_dtu,
        t.n_tropa,
        p.nombre AS nombre_planta,
        SUM(fd.cantidad_faena) AS total_faenado
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      WHERE f.id_faena IN (400, 397, 392, 387, 359)
      AND NOT EXISTS (
        SELECT 1
        FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
      GROUP BY f.id_faena, f.fecha_faena, t.dte_dtu, t.n_tropa, p.nombre
    `);
    
    console.log('Faenas QUE DEBERÍAN ESTAR EXCLUIDAS pero aparecen:');
    console.log(result.rows);
    console.log(`Total: ${result.rows.length}`);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

test();

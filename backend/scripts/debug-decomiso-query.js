const pool = require('../src/db');

async function test() {
  try {
    // Check if there are ANY faenas without decomiso
    const result = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total_faenas,
             COUNT(DISTINCT fd2.id_faena) as faenas_with_any_decomiso
      FROM faena f
      LEFT JOIN faena_detalle fd2 ON f.id_faena = fd2.id_faena
      LEFT JOIN decomiso d ON fd2.id_faena_detalle = d.id_faena_detalle
    `);
    
    console.log('Faena/Decomiso count:');
    console.log(result.rows[0]);
    
    // Check specific query from endpoint
    console.log('\nChecking endpoint query pattern...');
    
    const endpointResult = await pool.query(`
      SELECT
        f.id_faena,
        f.fecha_faena,
        t.dte_dtu,
        t.guia_policial,
        t.n_tropa,
        t.id_planta,
        p.nombre AS nombre_planta,
        prod.nombre AS productor,
        depto.nombre_departamento AS departamento,
        tf.nombre AS titular_faena,
        esp.descripcion AS especie,
        SUM(fd.cantidad_faena) AS total_faenado,
        t.id_tropa
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN productor prod ON t.id_productor = prod.id_productor
      JOIN departamento depto ON t.id_departamento = depto.id_departamento
      JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      WHERE NOT EXISTS (
        SELECT 1
        FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
      GROUP BY f.id_faena, f.fecha_faena, t.dte_dtu, t.guia_policial, t.n_tropa, t.id_planta, p.nombre,
               prod.nombre, depto.nombre_departamento, tf.nombre, esp.descripcion, t.id_tropa
      LIMIT 5
    `);
    
    console.log(`Endpoint query returned: ${endpointResult.rows.length} records`);
    if (endpointResult.rows.length > 0) {
      console.log('First record:', endpointResult.rows[0]);
    }
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

test();

const pool = require('../src/db');

async function test() {
  try {
    // Check if there are faenas con decomiso que siguen siendo devueltas por el endpoint
    const result = await pool.query(`
      SELECT 
        f.id_faena,
        f.fecha_faena,
        COUNT(DISTINCT fd.id_faena_detalle) as total_detalle,
        COUNT(DISTINCT CASE WHEN d.id_decomiso IS NOT NULL THEN d.id_decomiso END) as detalle_con_decomiso,
        STRING_AGG(DISTINCT d.id_decomiso::text, ', ') as decomiso_ids
      FROM faena f
      LEFT JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      LEFT JOIN decomiso d ON fd.id_faena_detalle = d.id_faena_detalle
      GROUP BY f.id_faena, f.fecha_faena
      HAVING COUNT(DISTINCT d.id_decomiso) > 0
      ORDER BY f.id_faena DESC
      LIMIT 10
    `);
    
    console.log('Faenas QUE YA TIENEN decomiso:');
    console.log(result.rows);
    
    // Now check what the endpoint query returns
    console.log('\n\nAhora checkeando qué retorna el endpoint query...');
    
    const endpointResult = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as faenas_sin_decomiso
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
    `);
    
    console.log('Endpoint says faenas sin decomiso:', endpointResult.rows[0]);
    
    process.exit(0);
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

test();

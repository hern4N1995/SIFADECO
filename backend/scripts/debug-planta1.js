const pool = require('../src/config/db');

const test = async () => {
  try {
    console.log('\n=== DEBUG FAENAS PLANTA 1 ===\n');

    // 1. Total faenas planta 1
    const p1Total = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN tropa t ON f.id_tropa = t.id_tropa
      WHERE t.id_planta = 1
    `);
    console.log('✅ Total faenas planta 1:', p1Total.rows[0].total);

    // 2. Faenas planta 1 con detalles
    const p1ConDetalles = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      WHERE t.id_planta = 1
    `);
    console.log('✅ Total faenas planta 1 CON faena_detalle:', p1ConDetalles.rows[0].total);

    // 3. Faenas planta 1 con detalles SIN decomiso
    const p1SinDecomiso = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      WHERE t.id_planta = 1
      AND NOT EXISTS (
        SELECT 1 FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
    `);
    console.log('✅ Faenas planta 1 SIN decomiso:', p1SinDecomiso.rows[0].total);

    // 4. Probar el JOIN exacto del endpoint sin los otros filtros
    const p1Endpoint = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      JOIN especie esp ON td.id_especie = esp.id_especie
      JOIN productor prod ON t.id_productor = prod.id_productor
      JOIN departamento depto ON t.id_departamento = depto.id_departamento
      JOIN titular_faena tf ON t.id_titular_faena = tf.id_titular_faena
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      WHERE t.id_planta = 1
      AND NOT EXISTS (
        SELECT 1 FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
    `);
    console.log('✅ Faenas planta 1 CON todos los JOINs del endpoint:', p1Endpoint.rows[0].total);

    // 5. Ver qué faenas se pierden - comparar step by step
    const p1Step1 = await pool.query(`
      SELECT f.id_faena FROM faena f
      JOIN tropa t ON f.id_tropa = t.id_tropa
      WHERE t.id_planta = 1 AND NOT EXISTS(
        SELECT 1 FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
      ORDER BY f.id_faena
    `);
    const totalStep1 = p1Step1.rows.length;
    console.log('\n✅ Step 1 (sin decomiso, sin faena_detalle):', totalStep1, 'faenas');

    const p1Step2 = await pool.query(`
      SELECT DISTINCT f.id_faena FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      WHERE t.id_planta = 1 AND NOT EXISTS(
        SELECT 1 FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
      ORDER BY f.id_faena
    `);
    const totalStep2 = p1Step2.rows.length;
    console.log('✅ Step 2 (con faena_detalle):', totalStep2, 'faenas');

    // 6. Ver qué falta en step 2
    const p1Lost = await pool.query(`
      SELECT f.id_faena FROM (
        SELECT f.id_faena FROM faena f
        JOIN tropa t ON f.id_tropa = t.id_tropa
        WHERE t.id_planta = 1 AND NOT EXISTS(
          SELECT 1 FROM decomiso d
          JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
          WHERE fd2.id_faena = f.id_faena
        )
      ) AS sin_det
      EXCEPT
      SELECT DISTINCT f.id_faena FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      WHERE t.id_planta = 1 AND NOT EXISTS(
        SELECT 1 FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
    `);
    console.log('✅ Faenas SIN faena_detalle:', p1Lost.rows.length);

    // 7. Ver datos de esas faenas
    if (p1Lost.rows.length > 0) {
      const ids = p1Lost.rows.map(r => r.id_faena).join(',');
      const faenasInfo = await pool.query(`
        SELECT f.id_faena, f.fecha_faena, t.n_tropa, t.id_productor, 
               t.id_departamento, t.id_titular_faena, t.id_planta
        FROM faena f
        JOIN tropa t ON f.id_tropa = t.id_tropa
        WHERE f.id_faena IN (${ids})
      `);
      console.log('\n📋 Faenas sin faena_detalle:');
      console.table(faenasInfo.rows);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

test();

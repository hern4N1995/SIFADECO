const pool = require('../src/config/db');

const test = async () => {
  try {
    console.log('\n=== DEBUG FAENAS SIN DECOMISO ===\n');

    // 1. Total faenas
    const faenasTotal = await pool.query(`SELECT COUNT(*) as total FROM faena`);
    console.log('✅ Total faenas en DB:', faenasTotal.rows[0].total);

    // 2. Total faenas con detalles
    const faenasConDetalles = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
    `);
    console.log('✅ Total faenas CON faena_detalle:', faenasConDetalles.rows[0].total);

    // 3. Ver estructura de decomiso
    const decompQuery = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name='decomiso' ORDER BY ordinal_position
    `);
    console.log('✅ Estructura de tabla decomiso:');
    decompQuery.rows.forEach(r => console.log('  -', r.column_name));

    // Total faenas con algún decomiso
    const faenasConDecomiso = await pool.query(`
      SELECT COUNT(DISTINCT fd.id_faena) as total
      FROM decomiso d
      JOIN faena_detalle fd ON d.id_faena_detalle = fd.id_faena_detalle
    `);
    console.log('\n✅ Total faenas CON decomiso:', faenasConDecomiso.rows[0].total);

    // 4. Faenas con detalles SIN decomiso (la combinación exacta del endpoint)
    const faenasCombo = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      WHERE NOT EXISTS (
        SELECT 1
        FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
    `);
    console.log('✅ Faenas con detalles SIN decomiso (endpoint):', faenasCombo.rows[0].total);

    // 5. Ver muestra de faenas sin decomiso
    const muestra = await pool.query(`
      SELECT
        f.id_faena,
        f.fecha_faena,
        t.n_tropa,
        COUNT(fd.id_faena_detalle) as total_detalles,
        SUM(fd.cantidad_faena) as total_faenado,
        EXISTS(SELECT 1 FROM decomiso WHERE id_faena_detalle IN (
          SELECT id_faena_detalle FROM faena_detalle WHERE id_faena = f.id_faena
        )) as tiene_decomiso
      FROM faena f
      LEFT JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      LEFT JOIN tropa t ON f.id_tropa = t.id_tropa
      GROUP BY f.id_faena, f.fecha_faena, t.n_tropa
      ORDER BY f.fecha_faena DESC
      LIMIT 10
    `);
    console.log('\n📋 Muestra de últimas 10 faenas:');
    console.table(muestra.rows);

    // 6. Ver exactamente qué devuelve el endpoint query
    const endpointResult = await pool.query(`
      SELECT
        f.id_faena,
        f.fecha_faena,
        t.dte_dtu,
        t.n_tropa,
        t.id_planta,
        p.nombre AS nombre_planta,
        SUM(fd.cantidad_faena) AS total_faenado
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      WHERE NOT EXISTS (
        SELECT 1
        FROM decomiso d
        JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle
        WHERE fd2.id_faena = f.id_faena
      )
      GROUP BY f.id_faena, f.fecha_faena, t.dte_dtu, t.n_tropa, t.id_planta, p.nombre
      ORDER BY f.fecha_faena DESC
      LIMIT 20
    `);
    console.log('\n✅ Resultado exacto del endpoint:');
    console.table(endpointResult.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

test();

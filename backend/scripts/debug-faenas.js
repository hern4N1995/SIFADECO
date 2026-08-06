/**
 * Script de DEBUG para verificar qué datos devuelven los endpoints de faenas
 * Uso: node scripts/debug-faenas.js
 */

const pool = require('../src/db');

async function debugFaenas() {
  try {
    console.log('\n=== DEBUG: FAENAS EN LA BASE DE DATOS ===\n');

    // 1. Verificar cuántas faenas existen
    console.log('1. Total de FAENAS:');
    const totalFaenas = await pool.query(`
      SELECT COUNT(*) as total FROM faena
    `);
    console.log(`   ${totalFaenas.rows[0].total} faenas`);

    // 2. Verificar cuántas faenas tienen detalles
    console.log('\n2. Faenas con FAENA_DETALLE:');
    const faunasConDetalle = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
    `);
    console.log(`   ${faunasConDetalle.rows[0].total} faenas`);

    // 3. Verificar cuántas faenas NO tienen decomiso
    console.log('\n3. Faenas SIN DECOMISO (que podrían necesitar):');
    const faenasSinDecomiso = await pool.query(`
      SELECT COUNT(DISTINCT f.id_faena) as total
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      WHERE NOT EXISTS (
        SELECT 1
        FROM decomiso d
        WHERE d.id_faena_detalle = fd.id_faena_detalle
      )
    `);
    console.log(`   ${faenasSinDecomiso.rows[0].total} faenas`);

    // 4. Ver últimas 5 faenas realizadas
    console.log('\n4. Últimas 5 FAENAS REALIZADAS:');
    const ultimasFaenas = await pool.query(`
      SELECT 
        f.id_faena,
        f.fecha_faena,
        t.n_tropa,
        t.dte_dtu,
        SUM(fd.cantidad_faena)::int AS total_faenado
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      GROUP BY f.id_faena, f.fecha_faena, t.n_tropa, t.dte_dtu
      ORDER BY f.fecha_faena DESC
      LIMIT 5
    `);
    
    if (ultimasFaenas.rows.length === 0) {
      console.log('   ❌ NO HAY FAENAS REALIZADAS');
    } else {
      ultimasFaenas.rows.forEach(row => {
        console.log(`   - Faena #${row.id_faena}: Tropa ${row.n_tropa} (${row.dte_dtu}) - ${row.total_faenado} faenados - ${row.fecha_faena}`);
      });
    }

    // 5. Ver últimas 5 faenas sin decomiso
    console.log('\n5. Últimas 5 FAENAS SIN DECOMISO:');
    const ultimasSinDecomiso = await pool.query(`
      SELECT 
        f.id_faena,
        f.fecha_faena,
        t.n_tropa,
        t.dte_dtu,
        SUM(fd.cantidad_faena)::int AS total_faenado
      FROM faena f
      JOIN faena_detalle fd ON f.id_faena = fd.id_faena
      JOIN tropa t ON f.id_tropa = t.id_tropa
      WHERE NOT EXISTS (
        SELECT 1
        FROM decomiso d
        WHERE d.id_faena_detalle = fd.id_faena_detalle
      )
      GROUP BY f.id_faena, f.fecha_faena, t.n_tropa, t.dte_dtu
      ORDER BY f.fecha_faena DESC
      LIMIT 5
    `);

    if (ultimasSinDecomiso.rows.length === 0) {
      console.log('   ❌ NO HAY FAENAS SIN DECOMISO (todas ya tienen decomiso registrado)');
    } else {
      ultimasSinDecomiso.rows.forEach(row => {
        console.log(`   - Faena #${row.id_faena}: Tropa ${row.n_tropa} (${row.dte_dtu}) - ${row.total_faenado} faenados - ${row.fecha_faena}`);
      });
    }

    // 6. Conteo de detalles por faena
    console.log('\n6. Promedio de DETALLES por faena:');
    const detallesPromedio = await pool.query(`
      SELECT 
        AVG(detalle_count)::int as promedio,
        MAX(detalle_count) as maximo,
        MIN(detalle_count) as minimo
      FROM (
        SELECT COUNT(*) as detalle_count
        FROM faena_detalle
        GROUP BY id_faena
      ) t
    `);
    const row = detallesPromedio.rows[0];
    console.log(`   Mínimo: ${row.minimo}, Promedio: ${row.promedio}, Máximo: ${row.maximo}`);

    console.log('\n=== FIN DEBUG ===\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error en debug:', err.message);
    process.exit(1);
  }
}

debugFaenas();

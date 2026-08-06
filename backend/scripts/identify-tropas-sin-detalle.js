/**
 * Script para identificar tropas sin detalles en tropa_detalle
 * y opcionalmente arreglarlas
 * Uso: node scripts/identify-tropas-sin-detalle.js
 */

const pool = require('../src/db');

async function identifyAndFix() {
  try {
    console.log('\n=== TROPAS SIN DETALLES ===\n');

    // 1. Identificar tropas sin detalles
    const sinDetallesRes = await pool.query(`
      SELECT t.id_tropa, t.n_tropa, t.dte_dtu, t.fecha_alta, t.fecha_ingreso
      FROM tropa t
      LEFT JOIN tropa_detalle td ON t.id_tropa = td.id_tropa
      WHERE td.id_tropa_detalle IS NULL
      ORDER BY t.fecha_alta DESC
    `);

    const sinDetalles = sinDetallesRes.rows;
    console.log(`Encontradas ${sinDetalles.length} tropas sin detalles:\n`);

    sinDetalles.forEach((t, idx) => {
      console.log(`${idx + 1}. Tropa #${t.id_tropa} (n_tropa: ${t.n_tropa})`);
      console.log(`   DTE/DTU: ${t.dte_dtu}`);
      console.log(`   Fecha: ${t.fecha_alta}\n`);
    });

    if (sinDetalles.length === 0) {
      console.log('✅ Todas las tropas tienen detalles');
      process.exit(0);
    }

    console.log('\n=== RESUMEN ===');
    console.log(`Total tropas: 192`);
    console.log(`Tropas sin detalles: ${sinDetalles.length}`);
    console.log(`Tropas con detalles: ${192 - sinDetalles.length}`);

    console.log('\n📌 NOTA:');
    console.log('Estas tropas existen pero no tienen registros de animales en tropa_detalle');
    console.log('Por eso no aparecen en /tropas/detalle-todas (que hace INNER JOIN)');
    console.log('\nEl frontend ya maneja esto usando /api/tropas + /detalle-agrupado');
    console.log('que funcionan con LEFT JOIN y muestran todas las tropas.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

identifyAndFix();

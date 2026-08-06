const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function debug() {
  try {
    // Verificar qué tiene la tropa 136 en tropa_detalle
    console.log('\n=== TROPA 136 - TODOS LOS DETALLES ===');
    const allDetailsRes = await pool.query(
      `SELECT id_tropa_detalle, id_tropa, id_especie, id_cat_especie, cantidad, 
              (SELECT descripcion FROM especie WHERE id_especie = td.id_especie) AS especie
       FROM tropa_detalle td
       WHERE id_tropa = 136`,
    );
    console.log('Todos los detalles de tropa 136:', allDetailsRes.rows);
    console.log('Total suma:', allDetailsRes.rows.reduce((sum, r) => sum + r.cantidad, 0));

    // Verificar los detalles de BOVINOS específicamente
    console.log('\n=== TROPA 136 - SOLO BOVINOS ===');
    const bovinosRes = await pool.query(
      `SELECT td.id_tropa_detalle, td.cantidad, 
              (SELECT descripcion FROM especie WHERE id_especie = td.id_especie) AS especie
       FROM tropa_detalle td
       WHERE id_tropa = 136 AND id_especie = (SELECT id_especie FROM especie WHERE descripcion = 'Bovinos')`,
    );
    console.log('Detalles de Bovinos:', bovinosRes.rows);
    console.log('Total Bovinos:', bovinosRes.rows.reduce((sum, r) => sum + r.cantidad, 0));

    // Verificar faenas para esa tropa
    console.log('\n=== FAENAS PARA TROPA 136 - DESDE 2026-06-09 ===');
    const faenasRes = await pool.query(
      `SELECT f.id_faena, f.fecha_faena, fd.id_faena_detalle, fd.cantidad_faena,
              td.id_tropa_detalle, td.cantidad, td.id_especie,
              (SELECT descripcion FROM especie WHERE id_especie = td.id_especie) AS especie
       FROM faena f
       JOIN faena_detalle fd ON f.id_faena = fd.id_faena
       JOIN tropa_detalle td ON td.id_tropa_detalle = fd.id_tropa_detalle
       WHERE f.id_tropa = 136 AND f.fecha_faena::date >= '2026-06-09'`,
    );
    console.log('Faenas con detalles:', faenasRes.rows);
    console.log('Total faenado:', faenasRes.rows.reduce((sum, r) => sum + r.cantidad_faena, 0));

    // Verificar la query que está usando el backend
    console.log('\n=== QUERY DE TOTALCANTIDAD (SIN FILTROS ADICIONALES) ===');
    const totalRes = await pool.query(
      `SELECT td.id_tropa, SUM(td.cantidad)::int as total_cantidad
       FROM tropa_detalle td
       WHERE td.id_tropa = 136
       GROUP BY td.id_tropa`,
    );
    console.log('Total sin filtros:', totalRes.rows);

    // Verificar la query con JOIN a especies y provincias
    console.log('\n=== QUERY DE TOTALCANTIDAD (CON JOINs) ===');
    const totalWithJoinsRes = await pool.query(
      `SELECT td.id_tropa, SUM(td.cantidad)::int as total_cantidad
       FROM tropa_detalle td
       JOIN especie esp ON td.id_especie = esp.id_especie
       JOIN tropa t ON td.id_tropa = t.id_tropa
       JOIN departamento depto ON t.id_departamento = depto.id_departamento
       LEFT JOIN provincia prov ON depto.id_provincia = prov.id_provincia
       WHERE td.id_tropa = 136
       GROUP BY td.id_tropa`,
    );
    console.log('Total con JOINs:', totalWithJoinsRes.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

debug();

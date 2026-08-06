const pool = require('../src/config/db');
const jwt = require('jsonwebtoken');

const test = async () => {
  try {
    console.log('\n=== DEBUG USUARIOS Y PLANTAS ===\n');

    // Ver estructura de usuario
    const struturaUser = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name='usuario' ORDER BY ordinal_position
    `);
    
    console.log('✅ Estructura tabla usuario:');
    struturaUser.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));

    // Listar todos usuarios
    const usuarios = await pool.query(`
      SELECT u.id_usuario, u.nombre, u.apellido, u.id_rol, u.id_planta, p.nombre as nombre_planta
      FROM usuario u
      LEFT JOIN planta p ON u.id_planta = p.id_planta
      ORDER BY u.id_usuario
    `);
    
    console.log('\n✅ Usuarios en DB:');
    console.table(usuarios.rows);

    // Listar plantas
    const plantas = await pool.query(`
      SELECT id_planta, nombre
      FROM planta
      ORDER BY id_planta
    `);
    
    console.log('\n✅ Plantas en DB:');
    console.table(plantas.rows);

    // Ver distribución de faenas por planta
    const faenasXPlanta = await pool.query(`
      SELECT 
        t.id_planta,
        p.nombre as nombre_planta,
        COUNT(DISTINCT f.id_faena) as total_faenas,
        COUNT(DISTINCT CASE WHEN NOT EXISTS(
          SELECT 1 FROM decomiso d 
          JOIN faena_detalle fd2 ON d.id_faena_detalle = fd2.id_faena_detalle 
          WHERE fd2.id_faena = f.id_faena
        ) THEN f.id_faena END) as faenas_sin_decomiso
      FROM faena f
      JOIN tropa t ON f.id_tropa = t.id_tropa
      LEFT JOIN planta p ON t.id_planta = p.id_planta
      GROUP BY t.id_planta, p.nombre
      ORDER BY t.id_planta
    `);
    
    console.log('\n✅ Distribución de faenas por planta:');
    console.table(faenasXPlanta.rows);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
};

test();

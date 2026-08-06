/**
 * Script para listar usuarios en la BD
 * Uso: node scripts/list-users.js
 */

const pool = require('../src/db');

async function listUsers() {
  try {
    console.log('\n=== USUARIOS EN LA BD ===\n');

    const result = await pool.query(`
      SELECT 
        id_usuario,
        email,
        nombre,
        apellido,
        id_rol,
        id_planta
      FROM usuario
      LIMIT 10
    `);

    if (result.rows.length === 0) {
      console.log('❌ No hay usuarios en la BD');
      return;
    }

    console.log(`✅ Encontrados ${result.rows.length} usuarios:\n`);
    result.rows.forEach((user, idx) => {
      console.log(`${idx + 1}. ${user.email}`);
      console.log(`   Nombre: ${user.nombre} ${user.apellido}`);
      console.log(`   ID: ${user.id_usuario}`);
      console.log(`   Rol: ${user.id_rol}`);
      console.log(`   Planta: ${user.id_planta || 'N/A'}`);
      console.log('');
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

listUsers();

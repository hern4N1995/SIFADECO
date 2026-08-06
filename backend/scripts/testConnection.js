// scripts/testConnection.js
const pool = require('../src/db');

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa:', res.rows[0]);
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err);
  } finally {
    await pool.end();
  }
})();

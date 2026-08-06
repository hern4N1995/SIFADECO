// backend/src/config/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT && Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  // Habilitar SSL para proveedores que lo requieren (Render, Heroku, etc.)
  ssl: {
    // En producción idealmente provee la CA; para evitar errores con certificados
    // auto-firmados usamos rejectUnauthorized: false. Reemplazar por CA cuando sea posible.
    rejectUnauthorized: false,
  },
});

pool
  .connect()
  .then(() => console.log('✅ Conectado a PostgreSQL'))
  .catch((err) => console.error('❌ Error de conexión:', err));

module.exports = pool;

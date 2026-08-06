// scripts/createUser.js
const bcrypt = require('bcryptjs');
const pool = require('../src/db'); // adaptá el path si tu db.js está en otro lugar

(async () => {
  const hashedPassword = await bcrypt.hash('ministerio', 10);
  await pool.query(
    `INSERT INTO usuario (dni, nombre, apellido, contrasenia, email, id_rol) 
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [87654321, 'hernan', 'Alegre', hashedPassword, 'hernan@example.com', 1]
  );
  console.log('Usuario creado correctamente');
  process.exit();
})();

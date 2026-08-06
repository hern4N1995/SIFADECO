const http = require('http');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'S1f4D3c0*2o2S-Min_0F_Production';

// Token de prueba con id_planta
const token = jwt.sign(
  {
    id_usuario: 4,
    rol: 1,
    id_planta: 1
  },
  JWT_SECRET,
  { expiresIn: '30d' }
);

console.log('\n=== TEST ENDPOINT faenas-sin-decomiso ===\n');
console.log('Token generado:', token);
console.log('Token payload: id_usuario=4, rol=1, id_planta=1\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/faena/faenas-sin-decomiso',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data);
    
    try {
      const parsed = JSON.parse(data);
      console.log('\n✅ Parsed response:');
      console.table(parsed);
      console.log('\nTotal records:', Array.isArray(parsed) ? parsed.length : 0);
    } catch (e) {
      console.log('❌ Error parsing JSON');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
});

req.end();

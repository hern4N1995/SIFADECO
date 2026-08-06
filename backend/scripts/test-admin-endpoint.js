const jwt = require('jsonwebtoken');
const pool = require('../src/db');
const http = require('http');

const JWT_SECRET = 'S1f4D3c0*2o2S-Min_0F_Production';

// Test endpoint directly with admin token
async function test() {
  try {
    // Create a test admin token
    const token = jwt.sign(
      { 
        id_usuario: 4, 
        rol: 1, 
        id_planta: 1 
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );
    
    console.log('Testing with admin token');
    console.log('Decoded:', jwt.verify(token, JWT_SECRET));
    
    // Make HTTP request
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/faena/faenas-sin-decomiso?limit=100',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          console.log('\nEndpoint response:');
          // The endpoint returns an array directly, not { data: [] }
          const records = Array.isArray(json) ? json : (json.data || []);
          console.log(`Records returned: ${records.length}`);
          if (records.length > 0) {
            console.log('First 3 records:');
            records.slice(0, 3).forEach(f => {
              console.log(`  - Faena ${f.id_faena}: ${f.fecha_faena}, Planta: ${f.nombre_planta}`);
            });
          }
          process.exit(0);
        } catch (e) {
          console.error('Parse error:', e.message);
          console.error('Response:', data);
          process.exit(1);
        }
      });
    });
    
    req.on('error', (e) => {
      console.error('Request error:', e.message);
      process.exit(1);
    });
    
    req.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
}

test();

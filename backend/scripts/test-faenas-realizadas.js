/**
 * Test del endpoint /faena/faenas-realizadas CON autenticación
 * Primero hace login, luego testea el endpoint
 * Uso: node scripts/test-faenas-realizadas.js
 */

const http = require('http');

// Datos de prueba para login
const LOGIN_DATA = {
  email: 'hernan@example.com',
  password: 'ministerio',
};

async function makeRequest(method, path, headers = {}, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function test() {
  try {
    console.log('\n=== PASO 1: LOGIN ===\n');
    console.log('Intentando login con:', LOGIN_DATA);

    const loginRes = await makeRequest('POST', '/api/auth/login', {}, LOGIN_DATA);
    
    if (loginRes.status !== 200) {
      console.log(`❌ Login falló. Status: ${loginRes.status}`);
      console.log('Respuesta:', loginRes.body);
      console.log('\n⚠️ Verifica que exista un usuario con:');
      console.log(`  Email: ${LOGIN_DATA.email}`);
      console.log(`  Password: ${LOGIN_DATA.password}`);
      return;
    }

    const loginData = JSON.parse(loginRes.body);
    const token = loginData.token;

    if (!token) {
      console.log('❌ No se obtuvo token en la respuesta');
      console.log('Respuesta:', loginData);
      return;
    }

    console.log('✅ Login exitoso');
    console.log('Token:', token.substring(0, 50) + '...');

    console.log('\n=== PASO 2: LLAMAR /faena/faenas-realizadas ===\n');

    const faenasRes = await makeRequest(
      'GET',
      '/api/faena/faenas-realizadas?limit=10&offset=0',
      {
        'Authorization': `Bearer ${token}`,
      }
    );

    console.log(`Status: ${faenasRes.status}`);
    console.log(`Headers:`, faenasRes.headers);
    console.log(`Body (${faenasRes.body.length} bytes):\n`);

    try {
      const data = JSON.parse(faenasRes.body);
      console.log(JSON.stringify(data, null, 2));

      if (Array.isArray(data)) {
        console.log(`\n✅ Retorna array con ${data.length} faenas`);
        if (data.length > 0) {
          console.log('\n📋 Estructura del primer item:');
          console.log(JSON.stringify(data[0], null, 2));
        } else {
          console.log('\n⚠️ Array vacío - No hay faenas en la BD');
        }
      } else if (data.error) {
        console.log(`\n❌ Error retornado por el backend: ${data.error}`);
      }
    } catch (err) {
      console.log('Respuesta (raw):');
      console.log(faenasRes.body);
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();

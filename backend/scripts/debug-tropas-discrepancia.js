/**
 * Debug: Comparar datos entre endpoints /tropas y /tropas/detalle-agrupado
 * Para entender por qué hay discrepancias en cantidad de registros
 */

const http = require('http');

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
          body: data,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test() {
  try {
    console.log('\n=== LOGIN ===\n');
    const loginRes = await makeRequest('POST', '/api/auth/login', {}, LOGIN_DATA);
    const loginData = JSON.parse(loginRes.body);
    const token = loginData.token;
    console.log('✅ Login exitoso\n');

    console.log('=== 1. GET /api/tropas (lista básica) ===\n');
    const tropasRes = await makeRequest('GET', '/api/tropas', {
      'Authorization': `Bearer ${token}`,
    });
    const tropasData = JSON.parse(tropasRes.body);
    const tropasCount = Array.isArray(tropasData) ? tropasData.length : 0;
    console.log(`Respuesta: ${tropasCount} tropas\n`);
    if (tropasCount > 0) {
      console.log('Primeras 3:');
      tropasData.slice(0, 3).forEach((t, idx) => {
        console.log(`  ${idx + 1}. Tropa #${t.id} (n_tropa: ${t.n_tropa})`);
      });
    }

    console.log('\n=== 2. GET /api/tropas/1/detalle-agrupado (detalle de tropa #1) ===\n');
    if (tropasCount > 0) {
      const tropaId = tropasData[0].id;
      const detalleRes = await makeRequest('GET', `/api/tropas/${tropaId}/detalle-agrupado`, {
        'Authorization': `Bearer ${token}`,
      });
      const detalleData = JSON.parse(detalleRes.body);
      console.log('Estructura:', JSON.stringify(detalleData, null, 2).substring(0, 500));
    }

    console.log('\n=== 3. GET /api/tropas/detalle-todas (todos los detalles en 1 query) ===\n');
    const todosRes = await makeRequest('GET', '/api/tropas/detalle-todas', {
      'Authorization': `Bearer ${token}`,
    });
    const todosData = JSON.parse(todosRes.body);
    const todosCount = Array.isArray(todosData) ? todosData.length : 0;
    console.log(`Respuesta: ${todosCount} items (detalles individuales)\n`);

    // Agrupar por id_tropa
    const detallesPorTropa = new Map();
    todosData.forEach((item) => {
      if (!detallesPorTropa.has(item.id_tropa)) {
        detallesPorTropa.set(item.id_tropa, []);
      }
      detallesPorTropa.get(item.id_tropa).push(item);
    });

    const uniqueTropas = detallesPorTropa.size;
    console.log(`Tropas únicas en detalle-todas: ${uniqueTropas}\n`);

    console.log('=== ANÁLISIS ===');
    console.log(`\n/api/tropas devuelve: ${tropasCount} tropas`);
    console.log(`/api/tropas/detalle-todas devuelve: ${todosCount} items (detalles individuales)`);
    console.log(`Agrupados en: ${uniqueTropas} tropas únicas\n`);

    if (tropasCount !== uniqueTropas) {
      console.log('⚠️  DISCREPANCIA: Las cantidades no coinciden');
      console.log(`   - Tropas en /tropas: ${tropasCount}`);
      console.log(`   - Tropas en /detalle-todas: ${uniqueTropas}`);
    } else {
      console.log('✅ Las cantidades coinciden');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

test();

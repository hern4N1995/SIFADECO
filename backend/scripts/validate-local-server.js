#!/usr/bin/env node
/**
 * Script de validación de configuración de fechas para servidor local
 * USO: node validate-local-server.js
 * Ejecutar después de migrar BD y código a servidor local
 */

const pg = require('pg');

async function validateLocalServer() {
  console.log('\n🔍 VALIDACIÓN DE CONFIGURACIÓN LOCAL - FECHAS\n');
  console.log('=' .repeat(60));
  
  // Obtener conexión desde variables de entorno
  const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || 'sistema_faena',
    ssl: process.env.DB_SSL === 'true' ? true : false
  });

  try {
    await client.connect();
    console.log('\n✅ Conectado a base de datos local');
    console.log(`   Host: ${process.env.DB_HOST || 'localhost'}`);
    console.log(`   Base de datos: ${process.env.DB_NAME || 'sistema_faena'}`);

    // TEST 1: Timezone del servidor
    const tzRes = await client.query('SHOW timezone;');
    const dbTimezone = tzRes.rows[0].TimeZone;
    console.log('\n' + '='.repeat(60));
    console.log('📍 TEST 1: Timezone del Servidor PostgreSQL');
    console.log('='.repeat(60));
    console.log(`Timezone: ${dbTimezone}`);
    
    if (dbTimezone === 'UTC' || dbTimezone === 'GMT') {
      console.log('✅ CORRECTO: Timezone está en UTC (compatible con Neon)');
    } else {
      console.log('⚠️  ADVERTENCIA: Timezone no es UTC');
      console.log('   Recomendación: Cambiar a UTC para consistencia con Neon');
      console.log(`   SQL: ALTER DATABASE ${process.env.DB_NAME} SET timezone = 'UTC';`);
    }

    // TEST 2: NOW() y su formato
    const nowRes = await client.query(`
      SELECT 
        NOW() as now_utc,
        NOW()::text as now_text,
        CURRENT_TIMESTAMP as current_ts,
        CURRENT_DATE as current_date
    `);
    console.log('\n' + '='.repeat(60));
    console.log('⏰ TEST 2: Formato de Hora Actual');
    console.log('='.repeat(60));
    console.log(`NOW():              ${nowRes.rows[0].now_utc}`);
    console.log(`NOW()::text:        ${nowRes.rows[0].now_text}`);
    console.log(`CURRENT_TIMESTAMP:  ${nowRes.rows[0].current_ts}`);
    console.log(`CURRENT_DATE:       ${nowRes.rows[0].current_date}`);
    
    if (nowRes.rows[0].now_text.includes('+00') || nowRes.rows[0].now_text.includes('Z')) {
      console.log('✅ CORRECTO: Hora incluye indicación de zona (UTC)');
    } else if (!nowRes.rows[0].now_text.includes('+')) {
      console.log('⚠️  ADVERTENCIA: NOW()::text no incluye zona horaria');
      console.log('   Esto es normal si PostgreSQL tiene TIMESTAMP WITHOUT TIME ZONE');
    }

    // TEST 3: Tipos de columnas de fecha
    const schemaRes = await client.query(`
      SELECT 
        table_name,
        column_name, 
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name IN ('tropa', 'planta', 'decomiso', 'faena')
        AND (column_name LIKE '%fecha%' OR column_name LIKE '%date%')
      ORDER BY table_name, ordinal_position
    `);
    console.log('\n' + '='.repeat(60));
    console.log('🔍 TEST 3: Tipos de Datos de Fecha en Tablas');
    console.log('='.repeat(60));
    
    if (schemaRes.rows.length === 0) {
      console.log('❌ ERROR: No se encontraron columnas de fecha');
      console.log('   Asegúrate de que la BD está correctamente restaurada');
    } else {
      let hasIssue = false;
      schemaRes.rows.forEach(row => {
        const tableCol = `${row.table_name}.${row.column_name}`;
        const type = row.data_type;
        const nullable = row.is_nullable ? 'NULL' : 'NOT NULL';
        
        console.log(`  ${tableCol.padEnd(35)} → ${type.padEnd(20)} (${nullable})`);
        
        if (type === 'timestamp without time zone') {
          hasIssue = true;
        }
      });
      
      if (hasIssue) {
        console.log('\n⚠️  ADVERTENCIA: Detectadas columnas TIMESTAMP WITHOUT TIME ZONE');
        console.log('   Recomendación: Cambiar a TIMESTAMP WITH TIME ZONE o DATE');
      } else {
        console.log('\n✅ CORRECTO: Tipos de datos son compatibles');
      }
    }

    // TEST 4: Ejemplo real de fecha
    const dateExampleRes = await client.query(`
      SELECT 
        fecha_ingreso,
        fecha_ingreso::text as fecha_text,
        EXTRACT(YEAR FROM fecha_ingreso) as year,
        EXTRACT(MONTH FROM fecha_ingreso) as month,
        EXTRACT(DAY FROM fecha_ingreso) as day
      FROM tropa 
      WHERE fecha_ingreso IS NOT NULL
      LIMIT 1
    `);
    
    console.log('\n' + '='.repeat(60));
    console.log('📅 TEST 4: Ejemplo Real de Fecha en Tabla tropa');
    console.log('='.repeat(60));
    
    if (dateExampleRes.rows.length > 0) {
      const row = dateExampleRes.rows[0];
      console.log(`Valor raw:      ${row.fecha_ingreso}`);
      console.log(`::text:         ${row.fecha_text}`);
      console.log(`Componentes:    ${String(row.day).padStart(2, '0')}/${String(row.month).padStart(2, '0')}/${row.year}`);
      console.log('✅ Tabla contiene datos');
    } else {
      console.log('⚠️  No hay datos en tabla tropa.fecha_ingreso');
      console.log('   (Esto es normal si acaba de restaurar la BD)');
    }

    // TEST 5: Node.js timezone
    console.log('\n' + '='.repeat(60));
    console.log('⚙️ TEST 5: Configuración de Node.js');
    console.log('='.repeat(60));
    console.log(`TZ environment:  ${process.env.TZ || 'No configurado'}`);
    console.log(`Node timezone:   ${Intl.DateTimeFormat().resolvedOptions().timeZone}`);
    
    if (process.env.TZ === 'UTC') {
      console.log('✅ CORRECTO: Node.js está configurado en UTC');
    } else {
      console.log('⚠️  ADVERTENCIA: Node.js NO está en UTC');
      console.log('   Recomendación: Agregar TZ=UTC en .env del backend');
    }

    // RESULTADO FINAL
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADO FINAL');
    console.log('='.repeat(60));
    
    const checks = [
      ['Timezone PostgreSQL', dbTimezone === 'UTC' || dbTimezone === 'GMT'],
      ['Tipos de fecha válidos', schemaRes.rows.every(r => r.data_type !== 'timestamp without time zone')],
      ['Node.js en UTC', process.env.TZ === 'UTC'],
      ['Base de datos accesible', true]
    ];
    
    const allPassed = checks.every(c => c[1]);
    
    checks.forEach(([check, passed]) => {
      console.log(`${passed ? '✅' : '❌'} ${check}`);
    });
    
    if (allPassed) {
      console.log('\n🎉 VALIDACIÓN COMPLETADA: Todo está configurado correctamente');
      console.log('   El código de fechas debería funcionar sin cambios');
    } else {
      console.log('\n⚠️  VALIDACIÓN CON ADVERTENCIAS');
      console.log('   Ver recomendaciones arriba');
      console.log('   Ver AUDIT_NEON_Y_MIGRACION_SERVIDOR_LOCAL.md para más detalles');
    }

    await client.end();
  } catch (err) {
    console.error('\n❌ ERROR DE CONEXIÓN:', err.message);
    console.error('\nVerifica:');
    console.error('  1. PostgreSQL está ejecutándose');
    console.error('  2. Archivo .env existe y tiene credenciales correctas');
    console.error('  3. Base de datos está restaurada');
    process.exit(1);
  }
}

validateLocalServer();

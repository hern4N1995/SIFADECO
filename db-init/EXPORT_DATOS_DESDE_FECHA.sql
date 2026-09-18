-- ============================================================================
-- SCRIPT DE EXPORTACIÓN E IMPORTACIÓN DE DATOS POR FECHA
-- ============================================================================
-- Propósito: Extraer datos desde una fecha específica (2026-09-01 hasta hoy)
-- Incluye: Tropas, Faenas, Decomisos, Productores, Titulares, y sus detalles
-- BD Origen: sistema_faenadb
-- BD Destino: sifadeco_db
-- ============================================================================

-- ============================================================================
-- PARTE 1: EXPORTAR DATOS DESDE LA BD ORIGEN
-- ============================================================================
-- Ejecuta esto en: sistema_faenadb
-- Resultado: Genera scripts INSERT que puedes ejecutar en sifadeco_db

-- Variables de configuración
\set FECHA_INICIO '2026-09-01'
\set BD_ORIGEN 'sistema_faenadb'
\set BD_DESTINO 'sifadeco_db'

-- ============================================================================
-- 1. EXPORTAR PRODUCTORES (incluyen tropas)
-- ============================================================================
-- Buscar todos los productores que tienen tropas desde la fecha especificada
\echo '-- ===== PRODUCTORES ====='

WITH tropas_fecha AS (
  SELECT DISTINCT t.id_productor
  FROM tropa t
  WHERE t.fecha_ingreso >= :'FECHA_INICIO'::date
)
SELECT 
  'INSERT INTO productor (id_productor, nombre, rut, telefono, email, direccion) VALUES (' ||
  id_productor || ', ' ||
  quote_literal(nombre) || ', ' ||
  quote_literal(rut) || ', ' ||
  CASE WHEN telefono IS NULL THEN 'NULL' ELSE quote_literal(telefono) END || ', ' ||
  CASE WHEN email IS NULL THEN 'NULL' ELSE quote_literal(email) END || ', ' ||
  CASE WHEN direccion IS NULL THEN 'NULL' ELSE quote_literal(direccion) END || ');'
FROM productor
WHERE id_productor IN (SELECT id_productor FROM tropas_fecha)
ORDER BY id_productor;

-- ============================================================================
-- 2. EXPORTAR TITULARES DE FAENA
-- ============================================================================
\echo '-- ===== TITULARES DE FAENA ====='

WITH faenas_fecha AS (
  SELECT DISTINCT t.id_titular
  FROM faena f
  JOIN tropa t ON f.id_tropa = t.id_tropa
  WHERE f.fecha_faena >= :'FECHA_INICIO'::date
)
SELECT 
  'INSERT INTO titular_faena (id_titular, nombre, rut) VALUES (' ||
  id_titular || ', ' ||
  quote_literal(nombre) || ', ' ||
  quote_literal(rut) || ');'
FROM titular_faena
WHERE id_titular IN (SELECT id_titular FROM faenas_fecha)
ORDER BY id_titular;

-- ============================================================================
-- 3. EXPORTAR TROPAS
-- ============================================================================
\echo '-- ===== TROPAS ====='

SELECT 
  'INSERT INTO tropa (id_tropa, n_tropa, dte_dtu, guia_policial, fecha_alta, fecha_ingreso, id_planta, id_productor, estado) VALUES (' ||
  id_tropa || ', ' ||
  n_tropa || ', ' ||
  quote_literal(dte_dtu) || ', ' ||
  CASE WHEN guia_policial IS NULL THEN 'NULL' ELSE quote_literal(guia_policial) END || ', ' ||
  CASE WHEN fecha_alta IS NULL THEN 'NULL' ELSE quote_literal(fecha_alta) END || ', ' ||
  CASE WHEN fecha_ingreso IS NULL THEN 'NULL' ELSE quote_literal(fecha_ingreso) END || ', ' ||
  id_planta || ', ' ||
  id_productor || ', ' ||
  quote_literal(COALESCE(estado, 'activa')) || ');'
FROM tropa
WHERE fecha_ingreso >= :'FECHA_INICIO'::date
ORDER BY id_tropa;

-- ============================================================================
-- 4. EXPORTAR TROPAS DETALLE
-- ============================================================================
\echo '-- ===== TROPA DETALLE ====='

SELECT 
  'INSERT INTO tropa_detalle (id_tropa_detalle, id_tropa, cantidad_ingreso, precio_unitario) VALUES (' ||
  id_tropa_detalle || ', ' ||
  id_tropa || ', ' ||
  COALESCE(cantidad_ingreso, 0) || ', ' ||
  COALESCE(precio_unitario, 0) || ');'
FROM tropa_detalle
WHERE id_tropa IN (
  SELECT id_tropa FROM tropa WHERE fecha_ingreso >= :'FECHA_INICIO'::date
)
ORDER BY id_tropa_detalle;

-- ============================================================================
-- 5. EXPORTAR FAENAS
-- ============================================================================
\echo '-- ===== FAENAS ====='

SELECT 
  'INSERT INTO faena (id_faena, id_tropa, id_titular, fecha_faena, cantidad_faena) VALUES (' ||
  id_faena || ', ' ||
  id_tropa || ', ' ||
  CASE WHEN id_titular IS NULL THEN 'NULL' ELSE id_titular::text END || ', ' ||
  quote_literal(fecha_faena) || ', ' ||
  COALESCE(cantidad_faena, 0) || ');'
FROM faena
WHERE fecha_faena >= :'FECHA_INICIO'::date
ORDER BY id_faena;

-- ============================================================================
-- 6. EXPORTAR FAENA DETALLE
-- ============================================================================
\echo '-- ===== FAENA DETALLE ====='

SELECT 
  'INSERT INTO faena_detalle (id_faena_detalle, id_faena, id_categoria_especie, cantidad_faena, precio_unitario) VALUES (' ||
  id_faena_detalle || ', ' ||
  id_faena || ', ' ||
  id_categoria_especie || ', ' ||
  COALESCE(cantidad_faena, 0) || ', ' ||
  COALESCE(precio_unitario, 0) || ');'
FROM faena_detalle
WHERE id_faena IN (
  SELECT id_faena FROM faena WHERE fecha_faena >= :'FECHA_INICIO'::date
)
ORDER BY id_faena_detalle;

-- ============================================================================
-- 7. EXPORTAR DECOMISOS
-- ============================================================================
\echo '-- ===== DECOMISOS ====='

SELECT 
  'INSERT INTO decomiso (id_decomiso, id_faena, cantidad_decomiso, fecha_decomiso, motivo_decomiso) VALUES (' ||
  id_decomiso || ', ' ||
  id_faena || ', ' ||
  COALESCE(cantidad_decomiso, 0) || ', ' ||
  quote_literal(fecha_decomiso) || ', ' ||
  CASE WHEN motivo_decomiso IS NULL THEN 'NULL' ELSE quote_literal(motivo_decomiso) END || ');'
FROM decomiso
WHERE id_faena IN (
  SELECT id_faena FROM faena WHERE fecha_faena >= :'FECHA_INICIO'::date
)
ORDER BY id_decomiso;

-- ============================================================================
-- 8. EXPORTAR DECOMISO DETALLE
-- ============================================================================
\echo '-- ===== DECOMISO DETALLE ====='

SELECT 
  'INSERT INTO decomiso_detalle (id_decomiso_detalle, id_decomiso, id_parte_decomisada, cantidad_afectada) VALUES (' ||
  id_decomiso_detalle || ', ' ||
  id_decomiso || ', ' ||
  id_parte_decomisada || ', ' ||
  COALESCE(cantidad_afectada, 0) || ');'
FROM decomiso_detalle
WHERE id_decomiso IN (
  SELECT id_decomiso FROM decomiso d
  JOIN faena f ON d.id_faena = f.id_faena
  WHERE f.fecha_faena >= :'FECHA_INICIO'::date
)
ORDER BY id_decomiso_detalle;

-- ============================================================================
-- FIN DE EXPORTACIÓN
-- ============================================================================

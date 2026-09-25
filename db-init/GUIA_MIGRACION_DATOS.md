# 📋 GUÍA COMPLETA: MIGRACIÓN DE DATOS ENTRE BASES DE DATOS

## Resumen
Extraerás datos desde tu base de datos actual (`sistema_faenadb`) desde la fecha **2026-09-01 hasta hoy** e importarás todo a tu base de datos limpia en el servidor (`sifadeco_db`).

---

## 📊 Datos que se migran:

1. **Productores** - Todos los que tienen tropas desde 2026-09-01
2. **Tropas** - Todas las cargadas desde 2026-09-01 (con su estado)
3. **Tropa Detalle** - Detalles de cada tropa
4. **Titulares de Faena** - Todos los asociados a faenas desde la fecha
5. **Faenas** - Todas las registradas desde 2026-09-01
6. **Faena Detalle** - Detalles de cada faena
7. **Decomisos** - Todos los decomisos de faenas desde la fecha
8. **Decomiso Detalle** - Detalles de cada decomiso

---

## 🛠️ MÉTODO 1: Usando pgAdmin o DBeaver (RECOMENDADO - MÁS FÁCIL)

### Paso 1: Generar el SQL de Exportación en BD Origen

1. Abre pgAdmin o DBeaver
2. Conecta a tu BD origen: `sistema_faenadb`
3. Ve a la sección de Query/SQL
4. Ejecuta este query para ver cuántos datos se van a exportar:

```sql
-- Verificar cantidad de datos a exportar
SELECT 'TROPAS' as tipo, COUNT(*) as cantidad 
FROM tropa 
WHERE fecha_ingreso >= '2026-09-01'::date

UNION ALL

SELECT 'FAENAS', COUNT(*) 
FROM faena 
WHERE fecha_faena >= '2026-09-01'::date

UNION ALL

SELECT 'DECOMISOS', COUNT(*) 
FROM decomiso 
WHERE id_faena IN (
  SELECT id_faena FROM faena 
  WHERE fecha_faena >= '2026-09-01'::date
);
```

5. Deberías ver números como:
   ```
   TROPAS    | 25
   FAENAS    | 150
   DECOMISOS | 45
   ```

### Paso 2: Exportar los datos

En pgAdmin/DBeaver, ejecuta el siguiente script:

```sql
-- ========== EXPORTAR PRODUCTORES ==========
SELECT p.* FROM productor p
WHERE p.id_productor IN (
  SELECT DISTINCT t.id_productor FROM tropa t
  WHERE t.fecha_ingreso >= '2026-09-01'::date
)
ORDER BY p.id_productor;

-- ========== EXPORTAR TROPAS ==========
SELECT t.* FROM tropa t
WHERE t.fecha_ingreso >= '2026-09-01'::date
ORDER BY t.id_tropa;

-- ========== EXPORTAR TROPA DETALLE ==========
SELECT td.* FROM tropa_detalle td
WHERE td.id_tropa IN (
  SELECT t.id_tropa FROM tropa t
  WHERE t.fecha_ingreso >= '2026-09-01'::date
)
ORDER BY td.id_tropa_detalle;

-- ========== EXPORTAR FAENAS ==========
SELECT f.* FROM faena f
WHERE f.fecha_faena >= '2026-09-01'::date
ORDER BY f.id_faena;

-- ========== EXPORTAR FAENA DETALLE ==========
SELECT fd.* FROM faena_detalle fd
WHERE fd.id_faena IN (
  SELECT f.id_faena FROM faena f
  WHERE f.fecha_faena >= '2026-09-01'::date
)
ORDER BY fd.id_faena_detalle;

-- ========== EXPORTAR DECOMISOS ==========
SELECT d.* FROM decomiso d
WHERE d.id_faena IN (
  SELECT f.id_faena FROM faena f
  WHERE f.fecha_faena >= '2026-09-01'::date
)
ORDER BY d.id_decomiso;

-- ========== EXPORTAR DECOMISO DETALLE ==========
SELECT dd.* FROM decomiso_detalle dd
WHERE dd.id_decomiso IN (
  SELECT d.id_decomiso FROM decomiso d
  JOIN faena f ON d.id_faena = f.id_faena
  WHERE f.fecha_faena >= '2026-09-01'::date
)
ORDER BY dd.id_decomiso_detalle;

-- ========== EXPORTAR TITULARES DE FAENA ==========
SELECT tf.* FROM titular_faena tf
WHERE tf.id_titular IN (
  SELECT DISTINCT f.id_titular FROM faena f
  WHERE f.fecha_faena >= '2026-09-01'::date
)
ORDER BY tf.id_titular;
```

3. Copia cada resultado (uno por uno) en un archivo SQL ordenado:

```sql
-- archivo: datos_migracion_2026-09-01.sql

-- ========== PRODUCTORES ==========
[Pegar aquí los productores]

-- ========== TITULARES DE FAENA ==========
[Pegar aquí los titulares]

-- ========== TROPAS ==========
[Pegar aquí las tropas]

-- ========== TROPA DETALLE ==========
[Pegar aquí tropa_detalle]

-- ========== FAENAS ==========
[Pegar aquí las faenas]

-- ========== FAENA DETALLE ==========
[Pegar aquí faena_detalle]

-- ========== DECOMISOS ==========
[Pegar aquí decomisos]

-- ========== DECOMISO DETALLE ==========
[Pegar aquí decomiso_detalle]
```

### Paso 3: Importar en BD Destino

1. Conecta a tu BD destino: `sifadeco_db`
2. Abre el archivo `datos_migracion_2026-09-01.sql`
3. Ejecuta todo el contenido (Ctrl + Enter o botón Run)
4. Verifica que se insertaron correctamente

---

## 🛠️ MÉTODO 2: Usando Terminal/PowerShell

### Paso 1: Exportar datos con comando psql

```powershell
# Reemplaza valores según tu configuración
$FechaInicio = "2026-09-01"
$BDOrigen = "sistema_faenadb"
$Usuario = "postgres"
$Host = "localhost"
$ArchivoSalida = "export_datos_$FechaInicio.sql"

# Ejecutar exportación
psql -h $Host -U $Usuario -d $BDOrigen -f "db-init/EXPORT_DATOS_DESDE_FECHA.sql" > $ArchivoSalida
```

### Paso 2: Importar en BD destino

```powershell
$BDDestino = "sifadeco_db"
$ArchivoImportar = "export_datos_2026-09-01.sql"

psql -h $Host -U $Usuario -d $BDDestino -f $ArchivoImportar
```

---

## ✅ VERIFICACIÓN POST-MIGRACIÓN

Después de importar, ejecuta estos queries en `sifadeco_db` para verificar:

```sql
-- Contar registros importados
SELECT 'Productores' as tabla, COUNT(*) FROM productor
UNION ALL
SELECT 'Tropas', COUNT(*) FROM tropa
UNION ALL
SELECT 'Tropa Detalle', COUNT(*) FROM tropa_detalle
UNION ALL
SELECT 'Titulares', COUNT(*) FROM titular_faena
UNION ALL
SELECT 'Faenas', COUNT(*) FROM faena
UNION ALL
SELECT 'Faena Detalle', COUNT(*) FROM faena_detalle
UNION ALL
SELECT 'Decomisos', COUNT(*) FROM decomiso
UNION ALL
SELECT 'Decomiso Detalle', COUNT(*) FROM decomiso_detalle;

-- Verificar que las fechas están correctas
SELECT 
  MIN(fecha_ingreso) as primera_tropa,
  MAX(fecha_ingreso) as ultima_tropa
FROM tropa;

SELECT 
  MIN(fecha_faena) as primera_faena,
  MAX(fecha_faena) as ultima_faena
FROM faena;

-- Verificar integridad referencial
SELECT COUNT(*) as tropas_huerfanas 
FROM tropa 
WHERE id_productor NOT IN (SELECT id_productor FROM productor);

SELECT COUNT(*) as faenas_huerfanas 
FROM faena 
WHERE id_tropa NOT IN (SELECT id_tropa FROM tropa);

SELECT COUNT(*) as decomisos_huerfanos 
FROM decomiso 
WHERE id_faena NOT IN (SELECT id_faena FROM faena);
```

---

## 🚨 CONSIDERACIONES IMPORTANTES

### 1. Integridad Referencial
- Los datos se exportan en **orden correcto de dependencias**
- Primero productores y titulares, luego tropas, luego faenas, luego decomisos
- **Importante**: La BD destino debe estar **limpia** o tener IDs diferentes

### 2. Si hay conflictos de IDs
Si encuentras errores de duplicados (ej: `duplicate key value violates unique constraint`):

**Opción A**: Borrar datos existentes antes de importar
```sql
-- En sifadeco_db, ANTES de importar
DELETE FROM decomiso_detalle;
DELETE FROM decomiso;
DELETE FROM faena_detalle;
DELETE FROM faena;
DELETE FROM tropa_detalle;
DELETE FROM tropa;
DELETE FROM titular_faena;
DELETE FROM productor;
```

**Opción B**: Reasignar IDs en los datos exportados (más complejo)

### 3. Respetar Secuencias
Después de importar, actualiza las secuencias de IDs:

```sql
-- En sifadeco_db, DESPUÉS de importar datos
SELECT setval('tropa_id_tropa_seq', (SELECT MAX(id_tropa) FROM tropa));
SELECT setval('faena_id_faena_seq', (SELECT MAX(id_faena) FROM faena));
SELECT setval('decomiso_id_decomiso_seq', (SELECT MAX(id_decomiso) FROM decomiso));
-- etc...
```

---

## 📁 Archivos disponibles en el proyecto

- **EXPORT_DATOS_DESDE_FECHA.sql** - Script SQL de exportación
- **migrate-data.ps1** - Script PowerShell automatizado
- **Esta guía** - Instrucciones detalladas

---

## ❓ Preguntas frecuentes

### ¿Qué datos se pierden si solo exporto desde 2026-09-01?
Se pierden datos anteriores a esa fecha. Si quieres **todo**, cambia la fecha a '2000-01-01' en los scripts.

### ¿Puedo hacer esto sin afectar la BD origen?
Sí, solo estamos leyendo datos, no modificando nada en la BD origen.

### ¿Qué pasa si la importación falla a mitad?
PostgreSQL tiene transacciones: si falla un INSERT, toda la transacción se revierte.

### ¿Cómo actualizo la BD destino con nuevos datos después?
Simplemente ejecuta de nuevo los scripts con una fecha más reciente.

---

## 🔧 Soporte

Si encuentras errores, proporciona:
1. El mensaje de error exacto
2. El nombre de la tabla donde falló
3. El comando que ejecutaste

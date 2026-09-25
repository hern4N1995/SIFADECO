# COMANDOS RÁPIDOS - MIGRACIÓN DE DATOS SIFADECO

## 📋 Información de tu migración:
- **Fecha inicio:** 2026-09-01
- **BD Origen:** sistema_faenadb
- **BD Destino:** sifadeco_db
- **Host:** localhost (ajusta según sea necesario)
- **Puerto:** 5432
- **Usuario:** postgres

---

## 🔍 PASO 0: Verificar cantidad de datos a migrar

```sql
SELECT 'TROPAS' as tipo, COUNT(*) as cantidad FROM tropa WHERE fecha_ingreso >= '2026-09-01'::date
UNION ALL
SELECT 'FAENAS', COUNT(*) FROM faena WHERE fecha_faena >= '2026-09-01'::date
UNION ALL
SELECT 'DECOMISOS', COUNT(*) FROM decomiso 
  WHERE id_faena IN (SELECT id_faena FROM faena WHERE fecha_faena >= '2026-09-01'::date)
UNION ALL
SELECT 'PRODUCTORES', COUNT(*) FROM productor 
  WHERE id_productor IN (SELECT DISTINCT id_productor FROM tropa WHERE fecha_ingreso >= '2026-09-01'::date)
UNION ALL
SELECT 'TITULARES', COUNT(*) FROM titular_faena 
  WHERE id_titular IN (SELECT DISTINCT id_titular FROM faena WHERE fecha_faena >= '2026-09-01'::date);
```

**Ejecuta esto en:** `sistema_faenadb`

---

## 📤 PASO 1A: Exportar Productores (ejecuta en BD origen)

```sql
\copy (
  SELECT p.* FROM productor p
  WHERE p.id_productor IN (
    SELECT DISTINCT t.id_productor FROM tropa t
    WHERE t.fecha_ingreso >= '2026-09-01'::date
  )
  ORDER BY p.id_productor
) TO '/tmp/export_productores.csv' WITH (FORMAT csv, HEADER);
```

---

## 📤 PASO 1B: Exportar Titulares (ejecuta en BD origen)

```sql
\copy (
  SELECT tf.* FROM titular_faena tf
  WHERE tf.id_titular IN (
    SELECT DISTINCT f.id_titular FROM faena f
    WHERE f.fecha_faena >= '2026-09-01'::date
  )
  ORDER BY tf.id_titular
) TO '/tmp/export_titulares.csv' WITH (FORMAT csv, HEADER);
```

---

## 📤 PASO 1C: Exportar Tropas (ejecuta en BD origen)

```sql
\copy (
  SELECT t.* FROM tropa t
  WHERE t.fecha_ingreso >= '2026-09-01'::date
  ORDER BY t.id_tropa
) TO '/tmp/export_tropas.csv' WITH (FORMAT csv, HEADER);
```

---

## 📤 PASO 1D: Exportar Tropa Detalle (ejecuta en BD origen)

```sql
\copy (
  SELECT td.* FROM tropa_detalle td
  WHERE td.id_tropa IN (
    SELECT t.id_tropa FROM tropa t
    WHERE t.fecha_ingreso >= '2026-09-01'::date
  )
  ORDER BY td.id_tropa_detalle
) TO '/tmp/export_tropa_detalle.csv' WITH (FORMAT csv, HEADER);
```

---

## 📤 PASO 1E: Exportar Faenas (ejecuta en BD origen)

```sql
\copy (
  SELECT f.* FROM faena f
  WHERE f.fecha_faena >= '2026-09-01'::date
  ORDER BY f.id_faena
) TO '/tmp/export_faenas.csv' WITH (FORMAT csv, HEADER);
```

---

## 📤 PASO 1F: Exportar Faena Detalle (ejecuta en BD origen)

```sql
\copy (
  SELECT fd.* FROM faena_detalle fd
  WHERE fd.id_faena IN (
    SELECT f.id_faena FROM faena f
    WHERE f.fecha_faena >= '2026-09-01'::date
  )
  ORDER BY fd.id_faena_detalle
) TO '/tmp/export_faena_detalle.csv' WITH (FORMAT csv, HEADER);
```

---

## 📤 PASO 1G: Exportar Decomisos (ejecuta en BD origen)

```sql
\copy (
  SELECT d.* FROM decomiso d
  WHERE d.id_faena IN (
    SELECT f.id_faena FROM faena f
    WHERE f.fecha_faena >= '2026-09-01'::date
  )
  ORDER BY d.id_decomiso
) TO '/tmp/export_decomisos.csv' WITH (FORMAT csv, HEADER);
```

---

## 📤 PASO 1H: Exportar Decomiso Detalle (ejecuta en BD origen)

```sql
\copy (
  SELECT dd.* FROM decomiso_detalle dd
  WHERE dd.id_decomiso IN (
    SELECT d.id_decomiso FROM decomiso d
    JOIN faena f ON d.id_faena = f.id_faena
    WHERE f.fecha_faena >= '2026-09-01'::date
  )
  ORDER BY dd.id_decomiso_detalle
) TO '/tmp/export_decomiso_detalle.csv' WITH (FORMAT csv, HEADER);
```

---

## 🧹 PASO 2: Limpiar BD destino (ANTES de importar)

**⚠️ ADVERTENCIA: ESTO BORRA DATOS, ASEGÚRATE DE HACER BACKUP PRIMERO**

Ejecuta esto en `sifadeco_db`:

```sql
-- Deshabilitar restricciones temporalmente
ALTER TABLE IF EXISTS decomiso_detalle DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS decomiso DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS faena_detalle DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS faena DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS tropa_detalle DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS tropa DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS titular_faena DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS productor DISABLE TRIGGER ALL;

-- Vaciar tablas
DELETE FROM decomiso_detalle;
DELETE FROM decomiso;
DELETE FROM faena_detalle;
DELETE FROM faena;
DELETE FROM tropa_detalle;
DELETE FROM tropa;
DELETE FROM titular_faena;
DELETE FROM productor;

-- Reabilitar restricciones
ALTER TABLE IF EXISTS decomiso_detalle ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS decomiso ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS faena_detalle ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS faena ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS tropa_detalle ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS tropa DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS titular_faena ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS productor ENABLE TRIGGER ALL;
```

---

## 📥 PASO 3: Importar en BD destino

Ejecuta estos comandos **en orden** en `sifadeco_db`:

```sql
-- 1. Importar productores
\copy productor FROM '/tmp/export_productores.csv' WITH (FORMAT csv, HEADER);

-- 2. Importar titulares
\copy titular_faena FROM '/tmp/export_titulares.csv' WITH (FORMAT csv, HEADER);

-- 3. Importar tropas
\copy tropa FROM '/tmp/export_tropas.csv' WITH (FORMAT csv, HEADER);

-- 4. Importar tropa_detalle
\copy tropa_detalle FROM '/tmp/export_tropa_detalle.csv' WITH (FORMAT csv, HEADER);

-- 5. Importar faenas
\copy faena FROM '/tmp/export_faenas.csv' WITH (FORMAT csv, HEADER);

-- 6. Importar faena_detalle
\copy faena_detalle FROM '/tmp/export_faena_detalle.csv' WITH (FORMAT csv, HEADER);

-- 7. Importar decomisos
\copy decomiso FROM '/tmp/export_decomisos.csv' WITH (FORMAT csv, HEADER);

-- 8. Importar decomiso_detalle
\copy decomiso_detalle FROM '/tmp/export_decomiso_detalle.csv' WITH (FORMAT csv, HEADER);
```

---

## ✅ PASO 4: Verificar importación exitosa

Ejecuta esto en `sifadeco_db`:

```sql
-- Contar registros
SELECT 'Productores' as tabla, COUNT(*) FROM productor
UNION ALL
SELECT 'Titulares', COUNT(*) FROM titular_faena
UNION ALL
SELECT 'Tropas', COUNT(*) FROM tropa
UNION ALL
SELECT 'Tropa Detalle', COUNT(*) FROM tropa_detalle
UNION ALL
SELECT 'Faenas', COUNT(*) FROM faena
UNION ALL
SELECT 'Faena Detalle', COUNT(*) FROM faena_detalle
UNION ALL
SELECT 'Decomisos', COUNT(*) FROM decomiso
UNION ALL
SELECT 'Decomiso Detalle', COUNT(*) FROM decomiso_detalle;

-- Verificar rangos de fechas
SELECT MIN(fecha_ingreso) as min, MAX(fecha_ingreso) as max FROM tropa;
SELECT MIN(fecha_faena) as min, MAX(fecha_faena) as max FROM faena;

-- Verificar integridad referencial
SELECT COUNT(*) FROM tropa WHERE id_productor NOT IN (SELECT id_productor FROM productor);
SELECT COUNT(*) FROM faena WHERE id_tropa NOT IN (SELECT id_tropa FROM tropa);
SELECT COUNT(*) FROM decomiso WHERE id_faena NOT IN (SELECT id_faena FROM faena);
```

---

## 🔧 Actualizar secuencias de IDs

Ejecuta esto **DESPUÉS** de importar, en `sifadeco_db`:

```sql
-- Actualizar secuencias para que los nuevos registros tengan IDs únicos
SELECT setval('productor_id_productor_seq', (SELECT MAX(id_productor) FROM productor) + 1);
SELECT setval('titular_faena_id_titular_seq', (SELECT MAX(id_titular) FROM titular_faena) + 1);
SELECT setval('tropa_id_tropa_seq', (SELECT MAX(id_tropa) FROM tropa) + 1);
SELECT setval('tropa_detalle_id_tropa_detalle_seq', (SELECT MAX(id_tropa_detalle) FROM tropa_detalle) + 1);
SELECT setval('faena_id_faena_seq', (SELECT MAX(id_faena) FROM faena) + 1);
SELECT setval('faena_detalle_id_faena_detalle_seq', (SELECT MAX(id_faena_detalle) FROM faena_detalle) + 1);
SELECT setval('decomiso_id_decomiso_seq', (SELECT MAX(id_decomiso) FROM decomiso) + 1);
SELECT setval('decomiso_detalle_id_decomiso_detalle_seq', (SELECT MAX(id_decomiso_detalle) FROM decomiso_detalle) + 1);
```

---

## 🐍 Alternativa: Script Python (automático)

Si prefieres automatizar todo, crea un archivo `migrate.py`:

```python
import psycopg2
from psycopg2 import sql
from datetime import datetime

# Configuración
DB_ORIGEN = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': 'tu_password',
    'database': 'sistema_faenadb'
}

DB_DESTINO = {
    'host': 'localhost',
    'port': 5432,
    'user': 'postgres',
    'password': 'tu_password',
    'database': 'sifadeco_db'
}

FECHA_INICIO = '2026-09-01'

def copiar_tabla(tabla, filtro_sql):
    try:
        # Conectar a DB origen
        conn_origen = psycopg2.connect(**DB_ORIGEN)
        cursor_origen = conn_origen.cursor()
        
        # Conectar a DB destino
        conn_destino = psycopg2.connect(**DB_DESTINO)
        cursor_destino = conn_destino.cursor()
        
        # Obtener datos
        query = f"SELECT * FROM {tabla} WHERE {filtro_sql}"
        cursor_origen.execute(query)
        datos = cursor_origen.fetchall()
        
        print(f"✓ {tabla}: {len(datos)} registros encontrados")
        
        conn_origen.close()
        conn_destino.close()
        
        return len(datos)
    except Exception as e:
        print(f"✗ Error en {tabla}: {e}")
        return 0

# Ejecutar migraciones
print("Iniciando migración...")
print(f"Fecha: {FECHA_INICIO} hasta hoy")
print()

total = 0
total += copiar_tabla('productor', "id_productor IN (SELECT DISTINCT id_productor FROM tropa WHERE fecha_ingreso >= '" + FECHA_INICIO + "'::date)")
total += copiar_tabla('tropa', f"fecha_ingreso >= '{FECHA_INICIO}'::date")
total += copiar_tabla('faena', f"fecha_faena >= '{FECHA_INICIO}'::date")
total += copiar_tabla('decomiso', f"id_faena IN (SELECT id_faena FROM faena WHERE fecha_faena >= '{FECHA_INICIO}'::date)")

print()
print(f"Migración completada: {total} registros totales")
```

Ejecuta con: `python migrate.py`

---

## 📞 Notas importantes

- En Windows, usa `C:\temp\` en lugar de `/tmp/`
- En pgAdmin, usa copiar/pegar en lugar de `\copy`
- Siempre haz **BACKUP** antes de limpiar la BD destino
- Los comandos `\copy` funcionan en psql
- Los comandos `COPY` funcionan en SQL directamente

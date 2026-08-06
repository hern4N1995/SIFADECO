# Optimizaciones de Performance - Sistema Faena 2.0

## Problema Identificado
- Timeout de 15 segundos al cargar algunas páginas
- Lentitud en endpoints con múltiples JOINs
- Sin índices en tablas principales

## Soluciones Implementadas

### 1. Frontend (src/services/api.js)
✅ **Timeout aumentado de 15s a 30s**
- Permite que queries más complejas tengan tiempo de responder
- Antes: `timeout: 15000`
- Después: `timeout: 30000`

### 2. Backend (src/controllers/decomisos.controller.js)
✅ **Query de listarDecomisos optimizada**
- Removida subquery `SUM(dd.animales_afectados)` que se ejecutaba por cada fila
- Agregado LIMIT 100 para evitar traer demasiados datos
- La lógica de agregación se realiza en el frontend

**Cambios:**
```sql
-- Antes: subquery sin límite
SELECT ... 
  (SELECT COALESCE(SUM(dd.animales_afectados), 0) 
   FROM decomiso_detalle dd 
   WHERE dd.id_decomiso = d.id_decomiso) AS cantidad_decomisada,

-- Después: LIMIT para evitar timeout
SELECT ... LIMIT 100;
```

### 3. Índices de Base de Datos (optimize-indexes.sql)
✅ **Archivo creado con índices necesarios para optimizar queries**

**Ejecutar en la base de datos:**
```bash
psql -U usuario -d sistema_faenasDB -f optimize-indexes.sql
```

**Índices principales agregados:**
- Claves foráneas (FK): decomiso, faena_detalle, tropa_detalle, tropa
- Tablas de detalles: decomiso_detalle, parte_decomisada
- Autenticación: usuario (email, estado)
- Índices compuestos para queries complejas

## Resultados Esperados
- ✅ Login más rápido
- ✅ Cargar DecomisosCargados en menos tiempo
- ✅ Menos timeouts al navegar entre páginas
- ✅ Mejor performance general

## Próximos Pasos (si aún es lento)
1. Implementar paginación verdadera en frontend (no traer todos los datos)
2. Agregar caché con Redis para datos que no cambian frecuentemente
3. Usar view en PostgreSQL para queries complejas frecuentes
4. Analizar con EXPLAIN ANALYZE las queries más lentas

## Monitoreo
Para verificar performance después de los cambios:
```javascript
// Agregar en api.js para monitorear tiempos
console.time('Request');
// ... request ...
console.timeEnd('Request');
```

# 📋 AUDIT NEON Y PLAN DE MIGRACIÓN A SERVIDOR LOCAL

**Fecha Audit:** 2026-09-09
**Sistema:** Sistema Faena 2.0
**Objetivo:** Documentar configuración actual en Neon y asegurar que la migración a servidor local mantenga consistencia de fechas

---

## 1. 🔍 CONFIGURACIÓN ACTUAL EN NEON (ESTADO COMPROBADO)

### PostgreSQL
- **Versión:** PostgreSQL 18.6 (c5250a2) on x86_64-pc-linux-gnu
- **Timezone del Servidor:** `GMT` (UTC)
- **Ubicación Servidor:** sa-east-1 (AWS - São Paulo)

### Tipos de Datos de Fecha
**CRÍTICO: Todas las columnas de fecha son tipo `date` (NO `timestamp`)**

```
tropa.fecha_ingreso       → date
tropa.fecha_alta          → date
planta.fecha_habilitacion → date
decomiso.fecha_decomiso   → date
faena.fecha_faena         → date
```

### Formato de Retorno de Fechas
```sql
SELECT NOW();
-- Retorna: 2026-09-09T12:15:17.624Z (ISO con Z = UTC)

SELECT NOW()::text;
-- Retorna: 2026-09-09 12:15:17.6246+00

-- Cuando se retorna una columna DATE:
SELECT fecha_ingreso FROM tropa;
-- Retorna: "2026-06-01" (solo YYYY-MM-DD, sin hora, sin zona)
```

---

## 2. 🔧 SOLUCIÓN IMPLEMENTADA EN FRONTEND

**Archivo:** `frontend/src/utils/dateFormatter.js`

### Funciones Agregadas

#### `formatDateFromDB(dateInput, locale = 'es-AR')`
- **Entrada:** Fecha de BD (ej: `"2026-06-01"` o `"2026-06-01T00:00:00Z"`)
- **Salida:** Formato local DD-MM-YYYY (ej: `"01-06-2026"`)
- **Lógica:** 
  - Si tiene zona (UTC), convierte a zona local primero
  - Si es DATE puro, trata como local
- **Usado en:** Visualización de fechas (read-only fields)

#### `formatDateForInput(dateInput)`
- **Entrada:** Fecha de BD (ej: `"2026-06-01"` o `"2026-06-01T00:00:00Z"`)
- **Salida:** Formato YYYY-MM-DD (ej: `"2026-06-01"`)
- **Lógica:**
  - Si tiene marca de hora (T), parsea como UTC y convierte a zona local
  - Si es YYYY-MM-DD puro, devuelve tal cual
  - Resultado se usa en `<input type="date">` que siempre espera local
- **Usado en:** Edición de fechas (inputs)

#### `formatDateForAPI(dateString)`
- **Entrada:** Valor de input type="date" (ej: `"2026-06-01"`)
- **Salida:** ISO con hora para API (ej: `"2026-06-01T00:00:00"`)
- **Lógica:** Solo agrega hora 00:00:00 si no la tiene
- **Usado en:** Envío de fechas al backend

### Páginas Actualizadas
1. `DetalleTropa.jsx` - fecha_ingreso
2. `PlantaAdmin.jsx` - fecha_habilitacion
3. `DecomisosCargadosPage.jsx` - fecha_decomiso
4. `FaenasRealizadasPage.jsx` - fecha_faena
5. `DetalleFaenaPage.jsx` - fecha_faena
6. `TropaAdminPage.jsx` - fecha_ingreso (si existe)

---

## 3. ⚠️ SUPUESTOS CRÍTICOS DEL CÓDIGO ACTUAL

```javascript
// El código ASUME que:
const dateFromDB = "2026-06-01";  // o "2026-06-01T00:00:00Z"
// Si tiene Z → es UTC
// Si no tiene hora → es local
```

**IMPORTANTE:** Este supuesto es VÁLIDO en Neon porque:
1. PostgreSQL retorna fechas sin ambigüedad (con Z si UTC, sin T si es DATE puro)
2. Neon está configurado como GMT (UTC)
3. Node.js/JavaScript interpreta correctamente ISO strings

---

## 4. ✅ VALIDACIÓN ACTUAL (NEON + VERCEL)

- ✅ Servidor BD en UTC (Neon GMT)
- ✅ Frontend en Argentina interpreta correctamente
- ✅ Input type="date" muestra fecha correcta
- ✅ Al guardar, se envía fecha correcta al backend
- ✅ Fechas se almacenan correctamente en BD

---

## 5. 🚨 RIESGOS DE MIGRACIÓN A SERVIDOR LOCAL

### Escenario 1: Servidor PostgreSQL con Timezone LOCAL ❌ RIESGO ALTO
```
Si configuras PostgreSQL con timezone = 'America/Argentina/Buenos_Aires'
ENTONCES: Neon retorna "2026-06-01+03:00" (con offset)
RESULTADO: Code FUNCIONA correctamente ✅ (JS maneja offset)
```

### Escenario 2: Servidor PostgreSQL con Timezone UTC ✅ SEGURO
```
Si configuras PostgreSQL con timezone = 'UTC' o 'GMT'
ENTONCES: Mismo comportamiento que Neon actualmente
RESULTADO: Code funciona SIN cambios ✅
```

### Escenario 3: Servidor PostgreSQL sin Timezone (TIMESTAMP sin zona) ❌ CRÍTICO
```
Si configuras columnas como TIMESTAMP WITHOUT TIME ZONE
ENTONCES: BD no sabe si es UTC o local
RESULTADO: Ambigüedad total ❌ (Code FALLARÁ)
SOLUCIÓN: Cambiar a TIMESTAMP WITH TIME ZONE o DATE + manejo en app layer
```

### Escenario 4: Node.js/Express con process.env.TZ diferente ❌ RIESGO
```
Si el servidor Node.js tiene TZ != servidor PostgreSQL
ENTONCES: Puede haber desalineación
RESULTADO: Problemas en operaciones de fecha en backend
```

---

## 6. 📋 CHECKLIST PARA MIGRACIÓN A SERVIDOR LOCAL

### Paso 1: ANTES DE MIGRAR (Documentación)
- [ ] Documentar timezone actual del servidor PostgreSQL local
- [ ] Verificar que todas las columnas DATE/TIMESTAMP tengan definición de zona
- [ ] Confirmar timezone de servidor OS (Windows/Linux)
- [ ] Definir si usarás UTC o local en la BD local

### Paso 2: CONFIGURACIÓN DE BASE DE DATOS
**RECOMENDACIÓN:** Mantener UTC como en Neon (MENOS cambios de código)

```sql
-- Verificar timezone del servidor
SHOW timezone;
-- Debería estar en 'UTC' o 'GMT'

-- Si está en local, cambiar a UTC:
ALTER DATABASE neondb SET timezone = 'UTC';

-- Verificar tipos de columnas
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE column_name LIKE '%fecha%' 
  AND table_name IN ('tropa', 'planta', 'decomiso', 'faena');
-- Todas deberían ser 'date' o 'timestamp with time zone'
```

### Paso 3: CONFIGURACIÓN DE NODE.JS/EXPRESS
En `backend/.env` o `backend/index.js`:
```bash
# .env
TZ=UTC

# O en code:
process.env.TZ = 'UTC';
```

### Paso 4: VALIDACIÓN POST-MIGRACIÓN
```bash
# 1. Verificar que NOW() sigue retornando UTC
SELECT NOW();

# 2. Verificar que fechas se retornan con formato consistente
SELECT fecha_ingreso FROM tropa LIMIT 1;

# 3. Verificar timezone de BD
SHOW timezone;

# 4. En frontend: Abrir DevTools y verificar logs
# [DetalleTropa] Fecha ingreso original: 2026-09-09 (sin Z = local)
# [DetalleTropa] formatDateForInput devuelve: 2026-09-09
# Input muestra: 09-09-2026 ✅
```

### Paso 5: TESTING FUNCIONAL
- [ ] Crear nueva tropa con fecha = hoy
- [ ] Editar tropa, verificar que fecha se muestre correctamente
- [ ] Cambiar fecha y guardar
- [ ] Verificar en BD que se guardó correctamente
- [ ] Repetir en PlantaAdmin, Decomiso, Faena
- [ ] Verificar en Vercel que sigue funcionando

---

## 7. 🔄 SI HAY PROBLEMAS POST-MIGRACIÓN

### Síntoma: Fechas aparecen -1 día
```
Causa probable: PostgreSQL local devuelve UTC pero código espera offset
Solución: Asegurar que formatDateForInput() recibe ISO string con Z o +offset
```

### Síntoma: Guardar fecha guarda -1 día en BD
```
Causa probable: Node.js está en timezone diferente a BD
Solución: Agregar process.env.TZ = 'UTC' en backend/index.js
```

### Síntoma: En Vercel funciona, en local no
```
Causa probable: Vercel usa UTC, servidor local no
Solución: Estandarizar timezone en ambos lados (ver Paso 2 y 3)
```

---

## 8. 📝 CAMBIOS DE CÓDIGO QUE PODRÍAN SER NECESARIOS

**Estos cambios SOLO son necesarios si NO sigues la recomendación de mantener UTC:**

```javascript
// backend/src/controllers/tropa.controller.js (línea 109)
// ACTUAL (puede fallar si backend no está en UTC):
fecha_alta: data.fecha_alta || new Date(),

// SI servidor local está en timezone diferente:
fecha_alta: data.fecha_alta || new Date().toISOString().split('T')[0],
```

```javascript
// frontend/src/utils/dateFormatter.js
// Agregar fallback si server no tiene timezone consistente:
export function formatDateForInput(dateInput) {
  // ... código actual ...
  
  // Si nada funciona, usar método de último recurso:
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';
  
  // Esto asume que la fecha está almacenada como "local" en BD
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  return `${yyyy}-${mm}-${dd}`;
}
```

---

## 9. 🎯 RESUMEN EJECUTIVO

| Aspecto | Neon (Actual) | Servidor Local (Recomendado) |
|---------|--|--|
| **BD Timezone** | UTC/GMT | UTC (igual que Neon) |
| **Tipo Fecha** | `date` | `date` (igual que Neon) |
| **Node.js TZ** | No especificado | `TZ=UTC` en .env |
| **Código Cambios** | Ninguno | Ninguno si sigues esto |
| **Vercel** | ✅ Funciona | Funcionará igual |

---

## 10. 📚 DOCUMENTACIÓN ADICIONAL

**Ver también:**
- `frontend/src/utils/dateFormatter.js` - Implementación detallada
- `.env` - Variables de conexión a Neon (actual)
- `backend/src/controllers/tropa.controller.js:109` - Punto crítico del backend

**Autor:** Copilot (Audit Automático)
**Última actualización:** 2026-09-09

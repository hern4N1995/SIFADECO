// GUÍA DE TESTING Y DEPLOYMENT - Eliminación de Tropas

## 🚀 Pasos para Ejecutar (Orden Crítico)

### 1️⃣ EJECUTAR MIGRACIÓN SQL (Primero)
```sql
-- Ejecutar en psql o en tu cliente PostgreSQL
\i db-init/migration_001_tropa_eliminacion.sql

-- Verificar que los cambios se aplicaron:
\d tropa
\d audit_tropa_eliminacion
```

**Cambios esperados:**
- Tabla `tropa` ahora tiene columnas: estado, usuario_solicita_eliminacion, fecha_solicita_eliminacion, etc.
- Nueva tabla `audit_tropa_eliminacion` con campos de auditoría
- FK de `tropa_detalle` ahora tiene ON DELETE CASCADE

### 2️⃣ VERIFICAR BACKEND (Sin redeploy necesario, ya está en código)
```bash
cd backend
npm start
```

**Rutas disponibles:**
- POST   /api/tropas-eliminacion/:tropaId/solicitar
- DELETE /api/tropas-eliminacion/:tropaId/confirmar
- GET    /api/tropas-eliminacion/pendientes
- GET    /api/tropas-eliminacion/:tropaId/auditoria
- POST   /api/tropas-eliminacion/:tropaId/cancelar

### 3️⃣ VERIFICAR FRONTEND (Sin redeploy necesario, ya está en código)
```bash
cd frontend
npm run dev
```

**Nuevo menú en Sidebar:**
- Para Rol 1 (Admin): Aparece "⏳ Tropas Pendientes" bajo Gestión Administrativa
- Para Rol 3 (Usuario): Botón "🗑️ Eliminar" en tabla TropasCargadas

---

## 🧪 TESTING MANUAL - Flujo Completo

### ESCENARIO 1: Solicitar Eliminación (Rol 3)

**Usuario:** rol 3 (usuario normal)
**Página:** /tropas-cargadas

1. Buscar una tropa en estado "activa"
2. Click en botón "🗑️ Eliminar"
3. Modal aparece con:
   - ⚠️ Advertencia en amarillo
   - Textarea para motivo (opcional)
   - Botones "Cancelar" y "Sí, Solicitar Eliminación"
4. Completar motivo (ej: "Error en datos")
5. Click en "Sí, Solicitar Eliminación"
6. **Esperado:**
   - ✅ Alert: "Solicitud de eliminación enviada..."
   - ✅ Tropa aparece con fondo amarillo
   - ✅ Tropa tiene strikethrough en la tabla
   - ✅ Botón "🗑️ Eliminar" desaparece
   - ✅ Badge "⏳ Pendiente" aparece

**Verificación en BD:**
```sql
SELECT * FROM tropa WHERE n_tropa = '[TROPA_NUMBER]';
-- estado debe ser: 'pendiente_eliminacion'
-- usuario_solicita_eliminacion: debe tener id_usuario
-- fecha_solicita_eliminacion: timestamp actual
```

---

### ESCENARIO 2: Ver Pendientes (Rol 1)

**Usuario:** rol 1 (admin)
**Página:** /admin/tropas-pendientes-eliminacion

1. Acceder a menú: Gestión Administrativa → Tropas Pendientes → Pendientes de Eliminación
2. **Esperado:**
   - Tabla mostrando todas las tropas con estado='pendiente_eliminacion'
   - Columnas: N° Tropa, Solicitante, Fecha Solicitud, Productor, Planta, Faenas, Decomisos
   - Botones: 📋 Auditoría, ✅ Confirmar, ❌ Rechazar

---

### ESCENARIO 3: Confirmar Eliminación (Rol 1)

**Usuario:** rol 1 (admin)
**Página:** /admin/tropas-pendientes-eliminacion

1. Click en botón "✅ Confirmar" de una tropa
2. Modal aparece con:
   - 🚨 Título rojo "Confirmar Eliminación"
   - ⚠️ Advertencia roja: "NO se puede deshacer"
   - Listado de qué se va a eliminar
3. Click en "Sí, Eliminar Definitivamente"
4. **Esperado:**
   - ✅ Tropa desaparece de la tabla
   - ✅ Alert: "Tropa eliminada completamente del sistema"
   - ✅ La página se recarga y la tropa ya no aparece en pendientes

**Verificación en BD:**
```sql
-- Tropa debe estar ELIMINADA
SELECT * FROM tropa WHERE n_tropa = '[TROPA_NUMBER]';
-- Resultado: NO ROWS

-- Faenas deben estar ELIMINADAS
SELECT * FROM faena WHERE id_tropa = [TROPA_ID];
-- Resultado: NO ROWS

-- Decomisos deben estar ELIMINADOS (verificar con faena_id)
SELECT * FROM decomiso WHERE id_faena IN (
  SELECT id_faena FROM faena WHERE id_tropa = [TROPA_ID]
);
-- Resultado: NO ROWS

-- Auditoría debe tener registro
SELECT * FROM audit_tropa_eliminacion WHERE n_tropa = '[TROPA_NUMBER]';
-- Debe mostrar: solicitud_eliminacion y confirmacion_eliminacion
```

---

### ESCENARIO 4: Rechazar Eliminación (Rol 1)

**Usuario:** rol 1 (admin)
**Página:** /admin/tropas-pendientes-eliminacion

1. Click en botón "❌ Rechazar" de una tropa
2. Modal aparece con:
   - Título "Rechazar Solicitud"
   - Textarea para motivo (opcional)
3. Click en "Rechazar Solicitud"
4. **Esperado:**
   - ✅ Tropa desaparece de la tabla de pendientes
   - ✅ Alert: "Solicitud rechazada. La tropa vuelve a estar activa."
   - ✅ Si vuelves a /tropas-cargadas, la tropa aparece nuevamente sin fondo amarillo
   - ✅ Botón "🗑️ Eliminar" vuelve a estar disponible

**Verificación en BD:**
```sql
SELECT * FROM tropa WHERE n_tropa = '[TROPA_NUMBER]';
-- estado debe ser: 'activa'
-- usuario_solicita_eliminacion: debe ser NULL
-- fecha_solicita_eliminacion: debe ser NULL

-- Auditoría debe tener registro de rechazo
SELECT * FROM audit_tropa_eliminacion WHERE n_tropa = '[TROPA_NUMBER]';
-- Debe mostrar: solicitud_eliminacion y cancelacion_solicitud
```

---

### ESCENARIO 5: Ver Auditoría (Rol 1)

**Usuario:** rol 1 (admin)
**Página:** /admin/tropas-pendientes-eliminacion

1. Click en botón "📋 Auditoría" de una tropa
2. Alert muestra historial completo:
   - Acciones: solicitud_eliminacion, cancelacion_solicitud, confirmacion_eliminacion
   - Para cada acción: usuario, fecha, detalles JSON

**Verificación en BD:**
```sql
SELECT 
  accion, 
  usuario_id, 
  fecha_accion, 
  detalles 
FROM audit_tropa_eliminacion 
WHERE n_tropa = '[TROPA_NUMBER]' 
ORDER BY fecha_accion;
```

---

## ⚠️ ERRORES COMUNES Y SOLUCIONES

### Error: "FK constraint violation on tropa_detalle"
**Causa:** Migración SQL no ejecutada correctamente
**Solución:**
```sql
-- Verificar FK actual
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'tropa_detalle';

-- Si no tiene ON DELETE CASCADE, ejecutar:
ALTER TABLE tropa_detalle 
DROP CONSTRAINT fk_id_tropa;

ALTER TABLE tropa_detalle 
ADD CONSTRAINT fk_id_tropa 
FOREIGN KEY (id_tropa) REFERENCES tropa(id_tropa) 
ON DELETE CASCADE;
```

### Error: "Token inválido" o "Acceso denegado por rol"
**Causa:** Middleware de autenticación fallando
**Solución:**
- Verificar que Authorization header tiene formato: `Bearer <token>`
- Verificar que JWT_SECRET está configurado en .env
- Verificar rol en token: `console.log(req.user)`

### Modal no aparece en TropasCargadas
**Causa:** Estado de React no actualizado
**Solución:**
- Limpiar cache del navegador (Ctrl+Shift+Del)
- Reiniciar servidor frontend: `npm run dev`

### Auditoría vacía después de confirmación
**Causa:** Transacción SQL no completada
**Solución:**
- Verificar logs del backend: `[tropaEliminacion]`
- Revisar que pool.query() no está fallando
- Ejecutar: `SELECT * FROM audit_tropa_eliminacion;`

---

## 📊 ESTADO ESPERADO FINAL

### Base de Datos
- ✅ Tabla `tropa` con 6 nuevas columnas
- ✅ Tabla `audit_tropa_eliminacion` con auditoría completa
- ✅ FK de `tropa_detalle` con ON DELETE CASCADE
- ✅ 6 índices creados para performance

### Backend
- ✅ 5 rutas en /api/tropas-eliminacion
- ✅ Controlador con 5 funciones transaccionales
- ✅ Validación de roles con middleware

### Frontend
- ✅ Botón eliminar en TropasCargadas (rol 3)
- ✅ Modal con confirmación
- ✅ Estilos amarillo + strikethrough para pendiente
- ✅ Página admin TropasPendientesEliminacion (rol 1)
- ✅ Menú en Sidebar visible solo para admin

### Auditoría
- ✅ Registro de solicitud (usuario, fecha, motivo)
- ✅ Registro de confirmación (usuario, fecha)
- ✅ Registro de rechazo (usuario, fecha, motivo)
- ✅ Detalles JSON con cantidad de faenas y decomisos

---

## 🔍 COMANDOS ÚTILES PARA DEBUG

```bash
# Backend logs
tail -f backend.log | grep tropaEliminacion

# Ver todas las tropas pendientes
psql -U usuario -d base_datos -c "
  SELECT n_tropa, estado, usuario_solicita_eliminacion, fecha_solicita_eliminacion 
  FROM tropa 
  WHERE estado = 'pendiente_eliminacion';"

# Ver auditoría completa
psql -U usuario -d base_datos -c "
  SELECT accion, usuario_id, fecha_accion, detalles 
  FROM audit_tropa_eliminacion 
  ORDER BY fecha_accion DESC;"

# Revertir tropa a activa (si algo sale mal)
psql -U usuario -d base_datos -c "
  UPDATE tropa 
  SET estado = 'activa',
      usuario_solicita_eliminacion = NULL,
      fecha_solicita_eliminacion = NULL
  WHERE n_tropa = '[NUMERO]';"
```

---

✅ **Implementación completada y lista para testing**

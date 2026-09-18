# 📦 RESUMEN: MIGRACIÓN DE DATOS SIFADECO

## Tu Configuración
```
Fecha inicio de migración: 2026-09-01
Base de datos origen: sistema_faenadb
Base de datos destino: sifadeco_db
Datos a migrar: Tropas, Faenas, Decomisos, Productores, Titulares
```

---

## 📁 Archivos Creados en `/db-init/`

### 1. **GUIA_MIGRACION_DATOS.md** (⭐ LEER PRIMERO)
- Guía completa con 2 métodos diferentes
- Explicaciones detalladas de cada paso
- Verificaciones y troubleshooting
- **Recomendado:** Lee este primero

### 2. **COMANDOS_MIGRACION_RAPIDOS.md** (⭐ COPIAR/PEGAR)
- Comandos listos para copiar y ejecutar
- Organizados por pasos numerados
- Incluye script Python alternativo
- **Recomendado:** Para ejecución rápida

### 3. **EXPORT_DATOS_DESDE_FECHA.sql**
- Script SQL de exportación avanzada
- Genera INSERT statements
- Útil para migraciones complejas

### 4. **migrate-data.ps1**
- Script PowerShell automatizado
- Ejecuta con: `.\migrate-data.ps1`
- (Requiere psql instalado)

---

## 🚀 INICIO RÁPIDO (5 minutos)

### Opción A: Usando pgAdmin/DBeaver (RECOMENDADO)

**1. Verifica cantidad de datos:**
```sql
-- Ejecuta en: sistema_faenadb
SELECT 'TROPAS' as tipo, COUNT(*) FROM tropa WHERE fecha_ingreso >= '2026-09-01'::date
UNION ALL
SELECT 'FAENAS', COUNT(*) FROM faena WHERE fecha_faena >= '2026-09-01'::date
UNION ALL
SELECT 'DECOMISOS', COUNT(*) FROM decomiso 
  WHERE id_faena IN (SELECT id_faena FROM faena WHERE fecha_faena >= '2026-09-01'::date);
```

**2. Copia los comandos de `COMANDOS_MIGRACION_RAPIDOS.md`**
- Sección PASO 1A-H: Exportar datos
- Sección PASO 2: Limpiar BD destino
- Sección PASO 3: Importar datos
- Sección PASO 4: Verificar

**3. Verifica:**
```sql
-- Ejecuta en: sifadeco_db
SELECT COUNT(*) FROM tropa;
SELECT COUNT(*) FROM faena;
SELECT COUNT(*) FROM decomiso;
```

---

## 🎯 Datos que se migran

| Tabla | Filtro | Relación |
|-------|--------|----------|
| **productor** | id_productor que tiene tropas desde 2026-09-01 | Base |
| **tropa** | fecha_ingreso >= 2026-09-01 | Depende de: productor |
| **tropa_detalle** | id_tropa de tropas migradas | Depende de: tropa |
| **titular_faena** | id_titular en faenas desde 2026-09-01 | Base |
| **faena** | fecha_faena >= 2026-09-01 | Depende de: tropa, titular_faena |
| **faena_detalle** | id_faena de faenas migradas | Depende de: faena |
| **decomiso** | id_faena de faenas migradas | Depende de: faena |
| **decomiso_detalle** | id_decomiso de decomisos migrados | Depende de: decomiso |

---

## ⚠️ Checklist pre-migración

- [ ] Tengo acceso a ambas bases de datos (origen y destino)
- [ ] Tengo las credenciales de PostgreSQL
- [ ] He hecho **BACKUP** de la BD destino
- [ ] He verificado que datos hay que migrar (PASO 0)
- [ ] Entiendo que esto sobrescribe datos en la BD destino
- [ ] Leo la guía completa en `GUIA_MIGRACION_DATOS.md`

---

## ✅ Checklist post-migración

- [ ] Ejecuté PASO 0 (verificar cantidad de datos)
- [ ] Ejecuté PASO 1A-H (exportar datos)
- [ ] Ejecuté PASO 2 (limpiar BD destino)
- [ ] Ejecuté PASO 3 (importar datos)
- [ ] Ejecuté PASO 4 (verificar números correctos)
- [ ] Actualicé las secuencias de IDs
- [ ] Verifiqué integridad referencial (sin registros huérfanos)
- [ ] Probé que la aplicación funciona con los nuevos datos

---

## 🛠️ Solución de problemas comunes

### "duplicate key value violates unique constraint"
**Causa:** Los IDs ya existen en la BD destino
**Solución:** Ejecuta el PASO 2 (limpiar datos) antes de importar

### "foreign key violation"
**Causa:** Faltan registros relacionados
**Solución:** Asegúrate de importar en el orden correcto: productores → titulares → tropas → faenas → decomisos

### "psql: command not found"
**Causa:** PostgreSQL no está en el PATH
**Solución:** 
- Windows: Agrega `C:\Program Files\PostgreSQL\15\bin` a las variables de entorno
- O usa pgAdmin/DBeaver en lugar de terminal

### Números no coinciden después de importar
**Causa:** Los datos podían estar duplicados en origen
**Solución:** 
1. Verifica con: `SELECT DISTINCT COUNT(*) FROM tabla`
2. Busca registros duplicados: `SELECT id, COUNT(*) FROM tabla GROUP BY id HAVING COUNT(*) > 1`

---

## 📞 Soporte

Si necesitas ayuda:

1. Proporciona el error exacto (cópialo completo)
2. Di qué paso estabas ejecutando
3. Confirma qué base de datos (origen/destino)
4. Adjunta la configuración (usuario, host, puerto)

---

## 📚 Archivos de referencia

- `EXPORT_DATOS_DESDE_FECHA.sql` - Queries de exportación
- `migrate-data.ps1` - Automatización en PowerShell
- `GUIA_MIGRACION_DATOS.md` - Guía completa (80+ líneas)
- `COMANDOS_MIGRACION_RAPIDOS.md` - Comandos listos (200+ líneas)

---

## 🎓 Próximos pasos después de la migración

1. **Actualizar aplicación:** El backend puede conectarse a `sifadeco_db` ahora
2. **Respaldar:** Haz BACKUP de `sifadeco_db` después de verificar
3. **Limpiar:** Puedes eliminar los archivos de exportación CSV (si no los necesitas)
4. **Documentar:** Mantén registro de cuándo se hizo la migración

---

¡Listo para migrar! 🚀

Comienza leyendo: `GUIA_MIGRACION_DATOS.md`
Luego ejecuta comandos de: `COMANDOS_MIGRACION_RAPIDOS.md`

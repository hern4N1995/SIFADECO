-- Migración 004: se quita el historial de modificaciones de tropa (migración 003)
-- y se habilita la corrección de registros de auditoría (solo superadmin).
-- Ejecutar una sola vez sobre la base sifadecodb (después de la 003).

-- 1. Quitar la tabla de historial de tropa creada por la migración 003
DROP TABLE IF EXISTS tropa_modificacion;

-- 2. Campos para registrar correcciones en audit_log
--    motivo ya existe (migración 003): ahora guarda el motivo de la corrección.
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS corregido_por INT;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS corregido_en TIMESTAMP;
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS valores_originales JSONB; -- { motivo, detalles } antes de la primera corrección

ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_corregido_por;
ALTER TABLE audit_log ADD CONSTRAINT fk_audit_log_corregido_por FOREIGN KEY (corregido_por)
  REFERENCES usuario(id_usuario) ON DELETE SET NULL;

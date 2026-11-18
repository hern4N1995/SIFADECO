-- Migración 005:
--   a) Revierte la corrección de registros de auditoría (la auditoría queda inmutable).
--   b) Crea el registro de correcciones de carga (solo superadmin corrige; cada cambio queda guardado).
-- Ejecutar una sola vez sobre la base sifadecodb (después de la 004).

-- a) Revertir campos de corrección en audit_log (migraciones 003 y 004)
ALTER TABLE audit_log DROP CONSTRAINT IF EXISTS fk_audit_log_corregido_por;
ALTER TABLE audit_log DROP COLUMN IF EXISTS corregido_por;
ALTER TABLE audit_log DROP COLUMN IF EXISTS corregido_en;
ALTER TABLE audit_log DROP COLUMN IF EXISTS valores_originales;
ALTER TABLE audit_log DROP COLUMN IF EXISTS motivo;

-- b) Registro de correcciones de carga (append-only: no se edita ni se borra desde la app)
CREATE TABLE IF NOT EXISTS correccion_carga (
  id_correccion   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha           TIMESTAMP NOT NULL DEFAULT NOW(),
  id_usuario      INT,
  rol             INT,
  entidad         VARCHAR(50) NOT NULL,   -- ej: 'decomiso_detalle'
  id_registro     INT NOT NULL,           -- id de la fila corregida
  id_decomiso     INT,                    -- para consultar el historial de un decomiso
  campo           VARCHAR(60) NOT NULL,   -- ej: 'id_afeccion'
  valor_antes     TEXT,
  valor_despues   TEXT,
  motivo          TEXT NOT NULL,
  CONSTRAINT fk_correccion_carga_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_correccion_carga_decomiso ON correccion_carga(id_decomiso);
CREATE INDEX IF NOT EXISTS idx_correccion_carga_registro ON correccion_carga(entidad, id_registro);
CREATE INDEX IF NOT EXISTS idx_correccion_carga_fecha    ON correccion_carga(fecha);

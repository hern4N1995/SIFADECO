-- Migración 003: motivo obligatorio en modificaciones de tropas
-- Ejecutar una sola vez sobre la base sifadecodb (después de la 002).

-- 1. Motivo visible en la auditoría general
ALTER TABLE audit_log ADD COLUMN IF NOT EXISTS motivo TEXT;

-- 2. Historial de modificaciones de tropa (motivo + valores antes/después)
--    Sin FK a tropa a propósito: el historial no se borra si se elimina la tropa.
CREATE TABLE IF NOT EXISTS tropa_modificacion (
  id_modificacion BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id_tropa        INT NOT NULL,
  id_usuario      INT,
  rol             INT,
  fecha           TIMESTAMP NOT NULL DEFAULT NOW(),
  motivo          TEXT NOT NULL,
  cambios         JSONB NOT NULL,        -- { campo: { antes, despues } }
  CONSTRAINT fk_tropa_modificacion_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_tropa_modificacion_tropa ON tropa_modificacion(id_tropa);
CREATE INDEX IF NOT EXISTS idx_tropa_modificacion_fecha ON tropa_modificacion(fecha);

-- Migration: Agregar funcionalidad de eliminación de tropas con auditoría
-- Fecha: 2026-09-16
-- Descripción: Soft delete + hard delete con auditoría y control de rol

-- ===================================
-- 1. Corregir constraint de TROPA_DETALLE
-- ===================================
-- Nota: El constraint actual NO tiene ON DELETE CASCADE, lo cual causa problemas
-- Si queremos eliminar una TROPA, falla si hay TROPA_DETALLE sin borrar primero

ALTER TABLE tropa_detalle 
  DROP CONSTRAINT fk_id_tropa;

ALTER TABLE tropa_detalle 
  ADD CONSTRAINT fk_id_tropa FOREIGN KEY (id_tropa) 
    REFERENCES tropa(id_tropa) ON DELETE CASCADE;

-- ===================================
-- 2. Agregar columnas a tabla TROPA
-- ===================================
ALTER TABLE tropa ADD COLUMN IF NOT EXISTS estado VARCHAR(20) DEFAULT 'activa';
ALTER TABLE tropa ADD COLUMN IF NOT EXISTS usuario_solicita_eliminacion INT;
ALTER TABLE tropa ADD COLUMN IF NOT EXISTS fecha_solicita_eliminacion TIMESTAMP;
ALTER TABLE tropa ADD COLUMN IF NOT EXISTS usuario_confirma_eliminacion INT;
ALTER TABLE tropa ADD COLUMN IF NOT EXISTS fecha_confirma_eliminacion TIMESTAMP;
ALTER TABLE tropa ADD COLUMN IF NOT EXISTS motivo_eliminacion TEXT;

-- Agregar indices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_tropa_estado ON tropa(estado);
CREATE INDEX IF NOT EXISTS idx_tropa_usuario_solicita ON tropa(usuario_solicita_eliminacion);

-- ===================================
-- 3. Crear tabla de auditoría
-- ===================================
CREATE TABLE IF NOT EXISTS audit_tropa_eliminacion (
  id_audit INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  id_tropa INT,
  n_tropa INT,
  accion VARCHAR(50),           -- 'solicitud_eliminacion', 'confirmacion_eliminacion'
  usuario_id INT,
  rol_usuario INT,
  fecha_accion TIMESTAMP DEFAULT NOW(),
  ip_address VARCHAR(45),       -- IPv4 o IPv6
  detalles JSONB,               -- Información adicional en JSON
  CONSTRAINT fk_audit_usuario FOREIGN KEY (usuario_id) 
    REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  CONSTRAINT fk_audit_tropa FOREIGN KEY (id_tropa) 
    REFERENCES tropa(id_tropa) ON DELETE SET NULL
);

-- Crear índices para auditoría
CREATE INDEX IF NOT EXISTS idx_audit_id_tropa ON audit_tropa_eliminacion(id_tropa);
CREATE INDEX IF NOT EXISTS idx_audit_usuario_id ON audit_tropa_eliminacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_audit_accion ON audit_tropa_eliminacion(accion);
CREATE INDEX IF NOT EXISTS idx_audit_fecha ON audit_tropa_eliminacion(fecha_accion);

-- ===================================
-- 4. Agregar comentarios a columnas
-- ===================================
COMMENT ON COLUMN tropa.estado IS 'Estado de la tropa: activa, pendiente_eliminacion';
COMMENT ON COLUMN tropa.usuario_solicita_eliminacion IS 'ID del usuario que solicitó la eliminación (rol 3)';
COMMENT ON COLUMN tropa.fecha_solicita_eliminacion IS 'Fecha/hora de la solicitud de eliminación';
COMMENT ON COLUMN tropa.usuario_confirma_eliminacion IS 'ID del usuario admin que confirmó la eliminación (rol 1)';
COMMENT ON COLUMN tropa.fecha_confirma_eliminacion IS 'Fecha/hora de la confirmación de eliminación';
COMMENT ON COLUMN tropa.motivo_eliminacion IS 'Motivo o descripción de la eliminación';

COMMENT ON TABLE audit_tropa_eliminacion IS 'Registro de auditoría para eliminaciones de tropas (soft delete y hard delete)';
COMMENT ON COLUMN audit_tropa_eliminacion.accion IS 'Tipo de acción: solicitud_eliminacion, confirmacion_eliminacion';
COMMENT ON COLUMN audit_tropa_eliminacion.detalles IS 'Información adicional en formato JSON (ej: cantidad de faenas, decomisos afectados)';

-- ===================================
-- 5. Verificación: Mostrar estructura actualizada
-- ===================================
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'tropa' AND column_name IN (
--   'estado', 'usuario_solicita_eliminacion', 'fecha_solicita_eliminacion',
--   'usuario_confirma_eliminacion', 'fecha_confirma_eliminacion', 'motivo_eliminacion'
-- )
-- ORDER BY ordinal_position;

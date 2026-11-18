-- Migración 002: rol Superadmin (id_rol = 4) y auditoría general de acciones
-- Ejecutar una sola vez sobre la base sifadecodb.
-- Nota: verificar antes que el id 4 no esté ocupado por otro rol:
--   SELECT id_rol, descripcion FROM rol_usuario ORDER BY id_rol;

-- ===================================
-- 1. Rol Superadmin
-- ===================================
INSERT INTO rol_usuario (id_rol, descripcion)
VALUES (4, 'Superadmin')
ON CONFLICT (id_rol) DO NOTHING;

-- ===================================
-- 2. Tabla de auditoría general
-- ===================================
CREATE TABLE IF NOT EXISTS audit_log (
  id_audit     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  fecha        TIMESTAMP NOT NULL DEFAULT NOW(),
  id_usuario   INT,
  rol          INT,
  metodo       VARCHAR(10) NOT NULL,      -- POST, PUT, PATCH, DELETE
  ruta         TEXT NOT NULL,             -- ej: /api/tropas/12
  status       INT,                       -- código HTTP de respuesta
  ip           VARCHAR(45),
  user_agent   TEXT,
  detalles     JSONB,                     -- body saneado (sin contraseñas ni tokens)
  CONSTRAINT fk_audit_log_usuario FOREIGN KEY (id_usuario)
    REFERENCES usuario(id_usuario) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_log_fecha   ON audit_log(fecha);
CREATE INDEX IF NOT EXISTS idx_audit_log_usuario ON audit_log(id_usuario);
CREATE INDEX IF NOT EXISTS idx_audit_log_metodo  ON audit_log(metodo);

COMMENT ON TABLE audit_log IS 'Auditoría de todas las operaciones de escritura de la API (solo superadmin puede consultarla)';

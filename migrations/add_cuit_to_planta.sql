-- Agregar columna CUIT a la tabla planta
-- Ejecutar este script si la columna aún no existe

-- Verificar si la columna ya existe (esto funcionará en PostgreSQL)
-- Si la columna ya existe, este script no causará error si se maneja adecuadamente

ALTER TABLE planta
ADD COLUMN IF NOT EXISTS cuit BIGINT;

-- Crear índice para búsquedas rápidas por CUIT
CREATE INDEX IF NOT EXISTS idx_planta_cuit ON planta(cuit);

-- Script para optimizar performance agregando índices

-- Índices en tablas principales para las queries más lentas
CREATE INDEX IF NOT EXISTS idx_decomiso_faena_detalle ON decomiso(id_faena_detalle);
CREATE INDEX IF NOT EXISTS idx_faena_detalle_faena ON faena_detalle(id_faena);
CREATE INDEX IF NOT EXISTS idx_faena_detalle_tropa_detalle ON faena_detalle(id_tropa_detalle);
CREATE INDEX IF NOT EXISTS idx_tropa_detalle_tropa ON tropa_detalle(id_tropa);
CREATE INDEX IF NOT EXISTS idx_tropa_fecha ON tropa(fecha);
CREATE INDEX IF NOT EXISTS idx_tropa_n_tropa ON tropa(n_tropa);
CREATE INDEX IF NOT EXISTS idx_tropa_id_planta ON tropa(id_planta);

-- Índices en tablas de joining
CREATE INDEX IF NOT EXISTS idx_decomiso_detalle_decomiso ON decomiso_detalle(id_decomiso);
CREATE INDEX IF NOT EXISTS idx_decomiso_detalle_parte ON decomiso_detalle(id_parte_decomisada);
CREATE INDEX IF NOT EXISTS idx_decomiso_detalle_afeccion ON decomiso_detalle(id_afeccion);
CREATE INDEX IF NOT EXISTS idx_parte_decomisada_tipo ON parte_decomisada(id_tipo_parte_deco);

-- Índices en tablas de faena
CREATE INDEX IF NOT EXISTS idx_faena_fecha ON faena(fecha_faena);
CREATE INDEX IF NOT EXISTS idx_faena_id_tropa ON faena(id_tropa);

-- Índices en usuario para login
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);
CREATE INDEX IF NOT EXISTS idx_usuario_estado ON usuario(estado);

-- Índices compuestos para queries más complejas
CREATE INDEX IF NOT EXISTS idx_faena_detalle_composite ON faena_detalle(id_faena, id_tropa_detalle);
CREATE INDEX IF NOT EXISTS idx_tropa_detalle_composite ON tropa_detalle(id_tropa, id_especie);

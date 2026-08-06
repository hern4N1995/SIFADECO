-- ============================================
-- SCRIPT DE OPTIMIZACIÓN: ÍNDICES DE BD
-- ============================================
-- Ejecutar este script en PostgreSQL para mejorar velocidad de queries
-- 
-- Impacto esperado:
-- - Queries 5-10x más rápidas
-- - Menos carga de CPU en BD
-- - Mejor performance al cargar datos
--
-- Tiempo de ejecución: ~2-5 segundos
-- ============================================

-- Índices para tabla USUARIO
CREATE INDEX IF NOT EXISTS idx_usuario_id_planta ON usuario(id_planta);
CREATE INDEX IF NOT EXISTS idx_usuario_estado ON usuario(estado);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON usuario(email);

-- Índices para tabla TROPA
CREATE INDEX IF NOT EXISTS idx_tropa_id_planta ON tropa(id_planta);
CREATE INDEX IF NOT EXISTS idx_tropa_fecha ON tropa(fecha);
CREATE INDEX IF NOT EXISTS idx_tropa_n_tropa ON tropa(n_tropa);

-- Índices para tabla TROPA_DETALLE
CREATE INDEX IF NOT EXISTS idx_tropa_detalle_id_tropa ON tropa_detalle(id_tropa);
CREATE INDEX IF NOT EXISTS idx_tropa_detalle_id_especie ON tropa_detalle(id_especie);

-- Índices para tabla FAENA
CREATE INDEX IF NOT EXISTS idx_faena_id_faena_detalle ON faena(id_faena_detalle);
CREATE INDEX IF NOT EXISTS idx_faena_estado ON faena(estado);
CREATE INDEX IF NOT EXISTS idx_faena_fecha ON faena(fecha);

-- Índices para tabla DECOMISO
CREATE INDEX IF NOT EXISTS idx_decomiso_id_faena_detalle ON decomiso(id_faena_detalle);
CREATE INDEX IF NOT EXISTS idx_decomiso_fecha ON decomiso(fecha_decomiso);

-- Índices para tabla DECOMISO_DETALLE
CREATE INDEX IF NOT EXISTS idx_decomiso_detalle_id_decomiso ON decomiso_detalle(id_decomiso);
CREATE INDEX IF NOT EXISTS idx_decomiso_detalle_id_parte ON decomiso_detalle(id_parte_decomisada);

-- Índices para tabla PLANTA
CREATE INDEX IF NOT EXISTS idx_planta_estado ON planta(estado);
CREATE INDEX IF NOT EXISTS idx_planta_nombre ON planta(nombre);

-- Índices para tabla ESPECIE
CREATE INDEX IF NOT EXISTS idx_especie_estado ON especie(estado);

-- Índices para tabla PROVINCIA
CREATE INDEX IF NOT EXISTS idx_provincia_estado ON provincia(estado);

-- Índices para tabla DEPARTAMENTO
CREATE INDEX IF NOT EXISTS idx_departamento_id_provincia ON departamento(id_provincia);
CREATE INDEX IF NOT EXISTS idx_departamento_estado ON departamento(estado);

-- Índices para tabla CATEGORIA_ESPECIE
CREATE INDEX IF NOT EXISTS idx_cat_especie_estado ON categoria_especie(estado);

-- Índices compuestos (para queries con múltiples condiciones)
CREATE INDEX IF NOT EXISTS idx_usuario_planta_estado ON usuario(id_planta, estado);
CREATE INDEX IF NOT EXISTS idx_tropa_planta_fecha ON tropa(id_planta, fecha);
CREATE INDEX IF NOT EXISTS idx_faena_detalle_estado ON faena(id_faena_detalle, estado);

-- Analizar estadísticas después de crear índices
ANALYZE usuario;
ANALYZE tropa;
ANALYZE tropa_detalle;
ANALYZE faena;
ANALYZE decomiso;
ANALYZE decomiso_detalle;
ANALYZE planta;
ANALYZE especie;
ANALYZE provincia;
ANALYZE departamento;

-- ============================================
-- Ver índices creados:
-- ============================================
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename NOT LIKE 'pg_%'
-- ORDER BY tablename, indexname;

-- ============================================
-- Ver tamaño de índices (para monitoreo):
-- ============================================
-- SELECT 
--   indexname,
--   pg_size_pretty(pg_relation_size(indexrelid)) AS size
-- FROM pg_indexes
-- JOIN pg_class ON pg_class.relname = indexname
-- WHERE schemaname = 'public'
-- ORDER BY pg_relation_size(indexrelid) DESC;

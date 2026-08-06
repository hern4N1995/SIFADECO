-- Agregar restricción UNIQUE a dte_dtu en tabla tropa
-- Esta migración primero consolida tropas duplicadas por dte_dtu

-- Paso 1: Ver duplicados existentes
SELECT dte_dtu, COUNT(*) as cantidad, array_agg(id_tropa ORDER BY id_tropa) as ids
FROM tropa 
WHERE dte_dtu IS NOT NULL 
GROUP BY dte_dtu 
HAVING COUNT(*) > 1
ORDER BY cantidad DESC;

-- Paso 2: Consolidar detalles de tropas duplicadas
WITH tropas_con_rn AS (
  SELECT 
    id_tropa,
    dte_dtu,
    fecha_alta,
    ROW_NUMBER() OVER (PARTITION BY dte_dtu ORDER BY fecha_alta DESC) as rn
  FROM tropa
  WHERE dte_dtu IS NOT NULL
),
id_tropa_principal AS (
  SELECT DISTINCT ON (dte_dtu) 
    dte_dtu,
    id_tropa as id_principal
  FROM tropas_con_rn
  WHERE rn = 1
)
UPDATE tropa_detalle td
SET id_tropa = ip.id_principal
FROM id_tropa_principal ip
WHERE EXISTS (
  SELECT 1 FROM tropas_con_rn tcr
  WHERE tcr.id_tropa = td.id_tropa 
    AND tcr.dte_dtu = ip.dte_dtu
    AND tcr.rn > 1
)
AND td.id_tropa IN (
  SELECT tcr.id_tropa FROM tropas_con_rn tcr
  WHERE tcr.dte_dtu = ip.dte_dtu AND tcr.rn > 1
);

-- Paso 3: Consolidar referencias en tabla faena
WITH tropas_con_rn AS (
  SELECT 
    id_tropa,
    dte_dtu,
    fecha_alta,
    ROW_NUMBER() OVER (PARTITION BY dte_dtu ORDER BY fecha_alta DESC) as rn
  FROM tropa
  WHERE dte_dtu IS NOT NULL
),
id_tropa_principal AS (
  SELECT DISTINCT ON (dte_dtu) 
    dte_dtu,
    id_tropa as id_principal
  FROM tropas_con_rn
  WHERE rn = 1
)
UPDATE faena f
SET id_tropa = ip.id_principal
FROM id_tropa_principal ip
WHERE EXISTS (
  SELECT 1 FROM tropas_con_rn tcr
  WHERE tcr.id_tropa = f.id_tropa 
    AND tcr.dte_dtu = ip.dte_dtu
    AND tcr.rn > 1
)
AND f.id_tropa IN (
  SELECT tcr.id_tropa FROM tropas_con_rn tcr
  WHERE tcr.dte_dtu = ip.dte_dtu AND tcr.rn > 1
);

-- Paso 4: Eliminar las tropas duplicadas
DELETE FROM tropa 
WHERE id_tropa IN (
  SELECT id_tropa FROM (
    SELECT 
      id_tropa,
      ROW_NUMBER() OVER (PARTITION BY dte_dtu ORDER BY fecha_alta DESC) as rn
    FROM tropa
    WHERE dte_dtu IS NOT NULL
  ) sub
  WHERE rn > 1
);

-- Paso 5: Agregar la restricción UNIQUE
ALTER TABLE tropa
ADD CONSTRAINT unique_dte_dtu UNIQUE (dte_dtu);

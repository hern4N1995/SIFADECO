#!/usr/bin/env powershell
<#
.SYNOPSIS
    Script de migración de datos SIFADECO desde una fecha específica
    
.DESCRIPTION
    Extrae datos desde una BD (sistema_faenadb) a partir de una fecha especificada
    e importa los datos a la BD destino (sifadeco_db)
    
.EXAMPLE
    .\migrate-data.ps1 -FechaInicio "2026-09-01" -BDOrigen "sistema_faenadb" -BDDestino "sifadeco_db"
#>

param(
    [string]$FechaInicio = "2026-09-01",
    [string]$BDOrigen = "sistema_faenadb",
    [string]$BDDestino = "sifadeco_db",
    [string]$Host_PG = "localhost",
    [int]$Puerto_PG = 5432,
    [string]$Usuario_PG = "postgres",
    [switch]$SoloExportar,
    [switch]$SoloImportar
)

# Colores para output
$Color_Info = "Cyan"
$Color_Exito = "Green"
$Color_Error = "Red"
$Color_Advertencia = "Yellow"

Write-Host "=" * 80 -ForegroundColor $Color_Info
Write-Host "SCRIPT DE MIGRACIÓN DE DATOS SIFADECO" -ForegroundColor $Color_Info
Write-Host "=" * 80 -ForegroundColor $Color_Info
Write-Host ""

# Variables
$FechaHoy = Get-Date -Format "yyyyMMdd_HHmmss"
$ArchivoExport = "export_datos_$($FechaInicio)_$FechaHoy.sql"
$Logs = @()

function Write-Log {
    param([string]$Mensaje, [string]$Tipo = "Info")
    
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $Linea = "[$Timestamp] [$Tipo] $Mensaje"
    
    switch ($Tipo) {
        "Exito" { Write-Host $Linea -ForegroundColor $Color_Exito }
        "Error" { Write-Host $Linea -ForegroundColor $Color_Error }
        "Advertencia" { Write-Host $Linea -ForegroundColor $Color_Advertencia }
        default { Write-Host $Linea -ForegroundColor $Color_Info }
    }
    
    $Logs += $Linea
}

Write-Log "Configuración de migración:"
Write-Log "  - Fecha inicio: $FechaInicio"
Write-Log "  - Base de datos origen: $BDOrigen"
Write-Log "  - Base de datos destino: $BDDestino"
Write-Log "  - Host PostgreSQL: $Host_PG"
Write-Log "  - Puerto: $Puerto_PG"
Write-Log "  - Usuario: $Usuario_PG"
Write-Log ""

# Función para ejecutar comandos psql
function Ejecutar-PSQL {
    param(
        [string]$Query,
        [string]$BaseDatos,
        [string]$Archivo = $null
    )
    
    try {
        $env:PGPASSWORD = Read-Host -Prompt "Ingresa la contraseña de PostgreSQL" -AsSecureString | ConvertFrom-SecureString -AsPlainText
        
        if ($Archivo) {
            Write-Log "Leyendo archivo: $Archivo"
            $Query = Get-Content -Path $Archivo -Raw
        }
        
        # Ejecutar psql
        $Query | psql -h $Host_PG -U $Usuario_PG -d $BaseDatos -p $Puerto_PG
        return $?
    }
    catch {
        Write-Log "Error ejecutando query: $_" "Error"
        return $false
    }
}

# ============================================================================
# PASO 1: EXPORTAR DATOS
# ============================================================================
if (-not $SoloImportar) {
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor $Color_Info
    Write-Host "PASO 1: EXPORTAR DATOS" -ForegroundColor $Color_Info
    Write-Host "=" * 80 -ForegroundColor $Color_Info
    Write-Host ""
    
    Write-Log "Conectando a $BDOrigen..."
    
    # Crear script de exportación
    $ExportScript = @"
-- Exportación de datos desde $FechaInicio
SET search_path TO public;

-- Verificar cantidad de datos a exportar
SELECT 'TROPAS' as tipo, COUNT(*) as cantidad FROM tropa WHERE fecha_ingreso >= '$FechaInicio'::date
UNION ALL
SELECT 'FAENAS' as tipo, COUNT(*) as cantidad FROM faena WHERE fecha_faena >= '$FechaInicio'::date
UNION ALL
SELECT 'DECOMISOS' as tipo, COUNT(*) as cantidad FROM decomiso 
  WHERE id_faena IN (SELECT id_faena FROM faena WHERE fecha_faena >= '$FechaInicio'::date);

-- Exportar datos en orden de dependencias
COPY (
  SELECT * FROM productor 
  WHERE id_productor IN (
    SELECT DISTINCT id_productor FROM tropa 
    WHERE fecha_ingreso >= '$FechaInicio'::date
  )
  ORDER BY id_productor
) TO STDOUT WITH (FORMAT csv, HEADER);

COPY (
  SELECT * FROM tropa 
  WHERE fecha_ingreso >= '$FechaInicio'::date 
  ORDER BY id_tropa
) TO STDOUT WITH (FORMAT csv, HEADER);

COPY (
  SELECT * FROM tropa_detalle 
  WHERE id_tropa IN (
    SELECT id_tropa FROM tropa 
    WHERE fecha_ingreso >= '$FechaInicio'::date
  )
  ORDER BY id_tropa_detalle
) TO STDOUT WITH (FORMAT csv, HEADER);

COPY (
  SELECT * FROM faena 
  WHERE fecha_faena >= '$FechaInicio'::date 
  ORDER BY id_faena
) TO STDOUT WITH (FORMAT csv, HEADER);

COPY (
  SELECT * FROM faena_detalle 
  WHERE id_faena IN (
    SELECT id_faena FROM faena 
    WHERE fecha_faena >= '$FechaInicio'::date
  )
  ORDER BY id_faena_detalle
) TO STDOUT WITH (FORMAT csv, HEADER);

COPY (
  SELECT * FROM decomiso 
  WHERE id_faena IN (
    SELECT id_faena FROM faena 
    WHERE fecha_faena >= '$FechaInicio'::date
  )
  ORDER BY id_decomiso
) TO STDOUT WITH (FORMAT csv, HEADER);

COPY (
  SELECT * FROM decomiso_detalle 
  WHERE id_decomiso IN (
    SELECT id_decomiso FROM decomiso d
    JOIN faena f ON d.id_faena = f.id_faena
    WHERE f.fecha_faena >= '$FechaInicio'::date
  )
  ORDER BY id_decomiso_detalle
) TO STDOUT WITH (FORMAT csv, HEADER);
"@

    # Guardar el script
    $ExportScript | Out-File -FilePath "export_query_$FechaHoy.sql" -Encoding UTF8
    Write-Log "Script de exportación guardado en: export_query_$FechaHoy.sql" "Exito"
    
    Write-Log "Ejecutando exportación desde $BDOrigen..."
    Write-Host ""
    Write-Host "Ejecuta este comando en tu terminal PostgreSQL:" -ForegroundColor $Color_Advertencia
    Write-Host ""
    Write-Host "psql -h $Host_PG -U $Usuario_PG -d $BDOrigen < export_query_$FechaHoy.sql > $ArchivoExport"
    Write-Host ""
    Write-Host "O desde pgAdmin/DBeaver, copia este script a export_query_$FechaHoy.sql" -ForegroundColor $Color_Advertencia
}

# ============================================================================
# PASO 2: IMPORTAR DATOS
# ============================================================================
if (-not $SoloExportar) {
    Write-Host ""
    Write-Host "=" * 80 -ForegroundColor $Color_Info
    Write-Host "PASO 2: IMPORTAR DATOS" -ForegroundColor $Color_Info
    Write-Host "=" * 80 -ForegroundColor $Color_Info
    Write-Host ""
    
    Write-Log "Esperando archivo de importación..."
    
    if (Test-Path $ArchivoExport) {
        Write-Log "Archivo encontrado: $ArchivoExport"
        
        Write-Host ""
        Write-Host "Ejecuta este comando para importar en la BD destino:" -ForegroundColor $Color_Advertencia
        Write-Host ""
        Write-Host "psql -h $Host_PG -U $Usuario_PG -d $BDDestino < $ArchivoExport"
        Write-Host ""
    }
    else {
        Write-Log "No se encontró $ArchivoExport" "Advertencia"
        Write-Log "Asegúrate de ejecutar primero la exportación" "Advertencia"
    }
}

# ============================================================================
# RESUMEN FINAL
# ============================================================================
Write-Host ""
Write-Host "=" * 80 -ForegroundColor $Color_Info
Write-Host "RESUMEN" -ForegroundColor $Color_Info
Write-Host "=" * 80 -ForegroundColor $Color_Info
Write-Host ""
Write-Log "Script completado"
Write-Log "Revisar archivo de log para más detalles"
Write-Host ""
Write-Host "Pasos siguientes:" -ForegroundColor $Color_Advertencia
Write-Host "1. Ejecuta la exportación desde la BD origen"
Write-Host "2. Verifica que el archivo $ArchivoExport se haya generado correctamente"
Write-Host "3. Ejecuta la importación en la BD destino"
Write-Host "4. Verifica los datos importados"

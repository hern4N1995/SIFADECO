import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import api from '../services/api';

/* ------------------------------------------------------------------ */
/*  SelectField estilizado                                            */
/* ------------------------------------------------------------------ */
function SelectField({ label, value, onChange, options, placeholder, isDisabled = false }) {
  const [isFocusing, setIsFocusing] = useState(false);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: '48px',
      minHeight: '48px',
      paddingLeft: '16px',
      paddingRight: '16px',
      backgroundColor: isDisabled ? '#f3f4f6' : '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: isFocusing && !isDisabled
        ? '0 0 0 1px #000'
        : state.isFocused && !isDisabled
          ? '0 0 0 4px #d1fae5'
          : 'none',
      transition: 'all 100ms ease',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.7 : 1,
      '&:hover': {
        borderColor: isDisabled ? '#e5e7eb' : '#6ee7b7',
      },
      '&:focus-within': {
        borderColor: isDisabled ? '#e5e7eb' : '#22c55e',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 0 0 2px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      fontSize: '14px',
      fontFamily: 'inherit',
      color: '#111827',
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: '14px',
      color: '#111827',
      margin: 0,
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '14px',
      color: '#6b7280',
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: '48px',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    }),
    option: (base, { isFocused }) => ({
      ...base,
      fontSize: '14px',
      padding: '10px 16px',
      backgroundColor: isFocused ? '#d1fae5' : '#fff',
      color: isFocused ? '#065f46' : '#111827',
    }),
  };

  return (
    <div className="flex flex-col">
      <label className="mb-2 font-semibold text-gray-700 text-sm">
        {label}
      </label>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        styles={customStyles}
        noOptionsMessage={() => 'Sin opciones'}
        components={{ IndicatorSeparator: () => null }}
        isDisabled={isDisabled}
        onFocus={() => {
          if (!isDisabled) {
            setIsFocusing(true);
            setTimeout(() => setIsFocusing(false), 50);
          }
        }}
      />
    </div>
  );
}

export default function InformesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [plantaSeleccionada, setPlantaSeleccionada] = useState('');
  const [plantas, setPlantas] = useState([]);
  const [dataByDay, setDataByDay] = useState({});
  const [enfermedades, setEnfermedades] = useState(new Set());
  const [rol, setRol] = useState(null);
  const [plantaDelUsuario, setPlantaDelUsuario] = useState(null);
  const [animalesFaenados, setAnimalesFaenados] = useState({});
  const [observaciones, setObservaciones] = useState('');
  const [titularesPorCategoria, setTitularesPorCategoria] = useState({});

  // Obtener rol y planta del usuario desde localStorage
  useEffect(() => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));

      if (userData) {
        const userRol = userData.rol || userData.id_rol;
        setRol(parseInt(userRol));

        // Usar id_planta del usuario (viene del backend)
        const plantaId = userData.id_planta;

        // Guardar la planta del usuario (solo si no es admin)
        if (parseInt(userRol) !== 1) {
          if (plantaId) {
            console.log(
              '[InformesPage] Usuario no-admin con planta asignada:',
              plantaId,
            );
            setPlantaDelUsuario(plantaId);
            setPlantaSeleccionada(plantaId);
          } else {
            console.warn(
              '[InformesPage] Usuario no-admin pero sin planta asignada',
            );
          }
        }
      }
    } catch (err) {
      console.error('[InformesPage] Error al obtener usuario:', err);
      setRol(null);
    }
  }, []);

  // Cargar plantas
  useEffect(() => {
    if (rol !== null && rol !== undefined) {
      loadPlantas();
      // Cargar observaciones guardadas
      const obsGuardadas = localStorage.getItem(
        `informe-observaciones-${mes}-${año}-${plantaSeleccionada || 'todas'}`,
      );
      if (obsGuardadas) {
        setObservaciones(obsGuardadas);
      } else {
        setObservaciones('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol]);

  // Cargar faenas y decomisos cuando cambien mes/año/planta
  useEffect(() => {
    if (rol !== null && rol !== undefined) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes, año, plantaSeleccionada, rol]);

  const loadPlantas = async () => {
    try {
      console.log('[InformesPage] Cargando plantas...');
      const response = await api.get('/plantas');
      console.log('[InformesPage] Plantas cargadas:', response.data);
      setPlantas(response.data || []);
    } catch (err) {
      console.error('[InformesPage] Error cargando plantas:', err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Obtener decomisos y faenas
      const decomisosRes = await api.get('/decomisos');
      const faenasRes = await api.get('/faena/faenas-realizadas');
      const detallesRes = await api.get('/faena/detalles-categorias');
      let decomisosData = decomisosRes.data || [];
      let faenasData = faenasRes.data?.faenas || faenasRes.data || [];
      let detallesFaenaData = detallesRes.data || [];

      console.log('[InformesPage] Decomisos crudos:', decomisosData);
      console.log(
        '[InformesPage] Rol:',
        rol,
        'Planta seleccionada:',
        plantaSeleccionada,
        'Planta del usuario:',
        plantaDelUsuario,
      );

      // Filtrar por mes, año y planta
      decomisosData = decomisosData.filter((d) => {
        try {
          const fecha = new Date(d.fecha_faena || d.fecha);
          if (isNaN(fecha.getTime())) return false;

          const esMesAño =
            fecha.getMonth() + 1 === parseInt(mes) &&
            fecha.getFullYear() === parseInt(año);

          if (!esMesAño) return false;

          // Si no es admin, filtrar solo por su planta
          if (rol !== 1) {
            // El usuario no-admin solo ve datos de su planta asignada
            return String(plantaDelUsuario) === String(d.id_planta);
          }

          // Si es admin y tiene plantaSeleccionada, filtrar por esa
          if (plantaSeleccionada && plantaSeleccionada !== '') {
            return String(plantaSeleccionada) === String(d.id_planta);
          }

          // Si es admin y no seleccionó planta, mostrar todas
          return true;
        } catch (err) {
          console.error('[InformesPage] Error filtrando fecha:', err);
          return false;
        }
      });

      console.log('[InformesPage] Decomisos después de filtro:', decomisosData);
      console.log('[InformesPage] Faenas datos crudos:', faenasData);

      // Procesar faenas para obtener animales faenados por día
      const animalesPorDia = {};

      faenasData.forEach((f) => {
        try {
          const fecha = new Date(f.fecha_faena);
          if (isNaN(fecha.getTime())) {
            console.log('[InformesPage] Faena sin fecha válida:', f);
            return;
          }

          const esMesAño =
            fecha.getMonth() + 1 === parseInt(mes) &&
            fecha.getFullYear() === parseInt(año);

          if (!esMesAño) return;

          // Filtrar por planta según rol
          if (rol !== 1) {
            if (String(plantaDelUsuario) !== String(f.id_planta)) return;
          } else if (plantaSeleccionada && plantaSeleccionada !== '') {
            if (String(plantaSeleccionada) !== String(f.id_planta)) return;
          }

          const dia = String(fecha.getDate()).padStart(2, '0');
          const cantidad = parseInt(f.total_faenado) || 0;

          console.log(
            `[InformesPage] Faena día ${dia}: cantidad=${cantidad}, faena:`,
            f,
          );

          if (!animalesPorDia[dia]) {
            animalesPorDia[dia] = 0;
          }

          if (cantidad > 0) {
            animalesPorDia[dia] += cantidad;
          }
        } catch (err) {
          console.error('[InformesPage] Error procesando faena:', err);
        }
      });

      console.log('[InformesPage] Animales por día:', animalesPorDia);
      setAnimalesFaenados(animalesPorDia);

      // Procesar faenas para obtener categorías por especie (dinámico)
      const categoriasAnimales = {};

      detallesFaenaData.forEach((detalle) => {
        try {
          const fecha = new Date(detalle.fecha_faena);
          if (isNaN(fecha.getTime())) return;

          const esMesAño =
            fecha.getMonth() + 1 === parseInt(mes) &&
            fecha.getFullYear() === parseInt(año);

          if (!esMesAño) return;

          // Filtrar por planta según rol
          if (rol !== 1) {
            if (String(plantaDelUsuario) !== String(detalle.id_planta)) return;
          } else if (plantaSeleccionada && plantaSeleccionada !== '') {
            if (String(plantaSeleccionada) !== String(detalle.id_planta))
              return;
          }

          // Procesar categoría de animal
          const especie = detalle.especie || 'Bovinos';
          const categoria = detalle.categoria_especie || 'Sin categoría';
          const cantidad = parseInt(detalle.cantidad_faena) || 0;

          console.log(
            `[InformesPage] Detalle faena - Especie: ${especie}, Categoría: ${categoria}, Cantidad: ${cantidad}`,
          );

          // Crear entrada de especie si no existe
          if (!categoriasAnimales[especie]) {
            categoriasAnimales[especie] = {};
          }

          // Crear entrada de categoría si no existe
          if (!categoriasAnimales[especie][categoria]) {
            categoriasAnimales[especie][categoria] = 0;
          }

          categoriasAnimales[especie][categoria] += cantidad;
        } catch (err) {
          console.error('[InformesPage] Error procesando categoría:', err);
        }
      });

      setTitularesPorCategoria(categoriasAnimales);

      // Agrupar datos por día y construir estructura
      const grouped = {};
      const enfermedadesSet = new Set();

      decomisosData.forEach((d) => {
        try {
          const fecha = new Date(d.fecha_faena || d.fecha);
          const dia = String(fecha.getDate()).padStart(2, '0');

          if (!grouped[dia]) {
            grouped[dia] = {
              totalAnimales: 0,
              decomisos: {},
            };
          }

          // Sumar animales afectados (solo si hay detalles de decomiso)
          if (d.animales_afectados) {
            grouped[dia].totalAnimales += parseInt(d.animales_afectados) || 0;
          }

          // Log para debug: mostrar qué datos tenemos
          if (!d.afeccion || !d.nombre_tipo_parte) {
            console.log('[InformesPage] Decomiso sin datos completos:', {
              id_decomiso: d.id_decomiso,
              afeccion: d.afeccion,
              nombre_tipo_parte: d.nombre_tipo_parte,
              nombre_parte: d.nombre_parte,
              animales_afectados: d.animales_afectados,
            });
          }

          // Organizar decomisos por enfermedad y tipo de parte (solo si hay detalle)
          if (d.afeccion && d.nombre_tipo_parte && d.nombre_parte) {
            const enfermedad = d.afeccion || 'Sin especificar';
            const tipoParte = d.nombre_tipo_parte || 'Otro';
            const nombreParte = d.nombre_parte || 'Parte';
            const cantidad = parseInt(d.cantidad) || 1;

            enfermedadesSet.add(enfermedad);

            if (!grouped[dia].decomisos[enfermedad]) {
              grouped[dia].decomisos[enfermedad] = {};
            }

            if (!grouped[dia].decomisos[enfermedad][tipoParte]) {
              grouped[dia].decomisos[enfermedad][tipoParte] = {};
            }

            if (!grouped[dia].decomisos[enfermedad][tipoParte][nombreParte]) {
              grouped[dia].decomisos[enfermedad][tipoParte][nombreParte] = 0;
            }

            grouped[dia].decomisos[enfermedad][tipoParte][nombreParte] +=
              cantidad;
          }
        } catch (err) {
          console.error('[InformesPage] Error procesando decomiso:', err, d);
        }
      });

      console.log('[InformesPage] Datos agrupados:', grouped);
      console.log(
        '[InformesPage] Enfermedades encontradas:',
        Array.from(enfermedadesSet),
      );

      setDataByDay(grouped);
      setEnfermedades(enfermedadesSet);
    } catch (err) {
      console.error('[InformesPage] Error cargando datos:', err);
      setError(
        'No se pudieron cargar los datos: ' +
          (err.message || 'Error desconocido'),
      );
    } finally {
      setLoading(false);
    }
  };

  const getNombrePlanta = () => {
    if (rol === 1) {
      // Admin: mostrar nombre de la planta seleccionada o "Todas"
      if (!plantaSeleccionada || plantaSeleccionada === '') {
        return 'Todas las plantas';
      }
      const p = plantas.find(
        (pl) => String(pl.id_planta) === String(plantaSeleccionada),
      );
      return p ? p.nombre : 'Seleccione establecimiento';
    } else {
      // Usuario normal: mostrar solo su planta
      const p = plantas.find(
        (pl) => String(pl.id_planta) === String(plantaDelUsuario),
      );
      return p ? p.nombre : 'Cargando...';
    }
  };

  const meses = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];

  const años = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i,
  );

  const diasOrdenados = Object.keys(dataByDay).sort(
    (a, b) => parseInt(a) - parseInt(b),
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center drop-shadow mb-8">
          📋 Informe Mensual
        </h1>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Planta */}
            {rol === 1 ? (
              <SelectField
                label="Planta"
                value={
                  plantaSeleccionada
                    ? {
                        value: plantaSeleccionada,
                        label:
                          plantas.find(
                            (pl) =>
                              String(pl.id_planta) ===
                              String(plantaSeleccionada),
                          )?.nombre || 'Seleccione planta',
                      }
                    : { value: '', label: 'Todas' }
                }
                onChange={(option) =>
                  setPlantaSeleccionada(option?.value || '')
                }
                options={[
                  { value: '', label: 'Todas' },
                  ...plantas.map((p) => ({
                    value: p.id_planta,
                    label: p.nombre,
                  })),
                ]}
                placeholder="Seleccione planta"
              />
            ) : plantas.length > 0 ? (
              <SelectField
                label="Planta"
                value={{
                  value: String(plantaDelUsuario),
                  label: getNombrePlanta(),
                }}
                onChange={() => {}}
                options={[
                  {
                    value: String(plantaDelUsuario),
                    label: getNombrePlanta(),
                  },
                ]}
                placeholder="Tu planta"
                isDisabled={true}
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Planta
                </label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500">
                  Cargando plantas...
                </div>
              </div>
            )}

            {/* Mes */}
            <SelectField
              label="Mes"
              value={{ value: mes, label: meses[parseInt(mes) - 1] }}
              onChange={(option) => setMes(option?.value || 1)}
              options={meses.map((m, idx) => ({
                value: idx + 1,
                label: m,
              }))}
              placeholder="Seleccione mes"
            />

            {/* Año */}
            <SelectField
              label="Año"
              value={{ value: año, label: año.toString() }}
              onChange={(option) =>
                setAño(option?.value || new Date().getFullYear())
              }
              options={años.map((a) => ({
                value: a,
                label: a.toString(),
              }))}
              placeholder="Seleccione año"
            />

            {/* Botón Refrescar */}
            <div className="flex items-end">
              <button
                onClick={loadData}
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
              >
                {loading ? 'Cargando...' : 'Refrescar'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 no-print">
            {error}
          </div>
        )}

        {/* Contenedor principal del reporte */}
        <div
          id="report-content"
          className="bg-white rounded-lg shadow-md overflow-hidden"
        >
          {/* Botón de impresión */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-green-200 flex flex-col sm:flex-row justify-end items-end gap-2 sm:gap-3 md:gap-4 no-print">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg active:scale-95 text-xs sm:text-sm print:hidden whitespace-nowrap\"
              title="Imprimir informe"
            >
              <svg
                className="w-4 h-4\"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                />
              </svg>
              Imprimir
            </button>
          </div>

          {/* Contenido del reporte */}
          <div className="p-2 sm:p-4 md:p-8 overflow-x-auto w-full">
            {diasOrdenados.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-xs sm:text-sm">
                No hay datos registrados para este período
              </p>
            ) : (
              <>
                {/* 1. ENCABEZADO DE METADATOS */}
                <div className="text-center mb-4 sm:mb-8 pb-3 sm:pb-6 border-b-2 border-gray-300 print:break-after-avoid">
                  <h1 className="text-sm sm:text-lg md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3">
                    INFORME MENSUAL DE FAENAS Y DECOMISOS
                  </h1>
                  <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-2 sm:gap-4 md:gap-6 text-[10px] sm:text-xs md:text-sm text-gray-700">
                    <div>
                      <span className="font-semibold">Establecimiento:</span>{' '}
                      <span className="text-gray-600">{getNombrePlanta()}</span>
                    </div>
                    <div>
                      <span className="font-semibold">Mes:</span>{' '}
                      <span className="text-gray-600">
                        {meses[parseInt(mes) - 1]} {año}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] sm:text-xs md:text-sm text-gray-600">
                    <span className="font-semibold">
                      Total Tasa por Servicio:
                    </span>{' '}
                    <span className="text-gray-500">[Valor a calcular]</span>
                  </div>
                </div>

                {/* 2. TABLA DE FAENAS DIARIAS Y CAUSALES - LADO A LADO */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
                  {/* COLUMNA 1: FAENAS DIARIAS */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <div className="bg-green-100 px-2 sm:px-4 py-1 sm:py-2">
                      <h2 className="text-xs sm:text-sm font-bold text-gray-800">
                        FAENAS DIARIAS
                      </h2>
                    </div>
                    <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="px-2 sm:px-3 py-1 text-left font-semibold text-gray-700 border border-gray-300">
                            Día
                          </th>
                          <th className="px-2 sm:px-3 py-1 text-center font-semibold text-gray-700 border border-gray-300">
                            Animales
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(animalesFaenados)
                          .sort((a, b) => parseInt(a) - parseInt(b))
                          .map((dia) => (
                            <tr key={dia} className="border-b hover:bg-gray-50">
                              <td className="px-2 sm:px-3 py-1 text-left text-gray-800 border border-gray-300">
                                {dia}
                              </td>
                              <td className="px-2 sm:px-3 py-1 text-center text-gray-800 font-medium border border-gray-300">
                                {animalesFaenados[dia]}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-green-200 font-bold">
                          <td className="px-2 sm:px-3 py-1 text-left text-gray-800 border border-gray-300">
                            TOTAL
                          </td>
                          <td className="px-2 sm:px-3 py-1 text-center text-gray-800 border border-gray-300">
                            {Object.values(animalesFaenados).reduce(
                              (sum, cantidad) => sum + cantidad,
                              0,
                            )}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* COLUMNA 2: CAUSALES DE DECOMISOS */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <div className="bg-green-100 px-2 sm:px-4 py-1 sm:py-2">
                      <h2 className="text-xs sm:text-sm font-bold text-gray-800">
                        CAUSALES DE DECOMISOS
                      </h2>
                    </div>
                    <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse">
                      <thead>
                        <tr className="bg-green-100">
                          <th className="px-2 sm:px-3 py-1 text-left font-semibold text-gray-700 border border-gray-300">
                            Causa
                          </th>
                          <th className="px-2 sm:px-3 py-1 text-left font-semibold text-gray-700 border border-gray-300">
                            Detalle
                          </th>
                          <th className="px-2 sm:px-3 py-1 text-center font-semibold text-gray-700 border border-gray-300">
                            Cant.
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from(enfermedades)
                          .sort()
                          .map((enfermedad) => {
                            // Calcular total por enfermedad
                            let totalEnfermedad = 0;
                            const detalles = [];

                            diasOrdenados.forEach((dia) => {
                              const dayData = dataByDay[dia];
                              if (dayData.decomisos[enfermedad]) {
                                const tiposParteDelEnf = Object.keys(
                                  dayData.decomisos[enfermedad],
                                );
                                tiposParteDelEnf.forEach((tipoParte) => {
                                  Object.entries(
                                    dayData.decomisos[enfermedad][tipoParte],
                                  ).forEach(([nombreParte, cantidad]) => {
                                    totalEnfermedad += cantidad;
                                    detalles.push({
                                      tipo: tipoParte,
                                      parte: nombreParte,
                                      cantidad: cantidad,
                                    });
                                  });
                                });
                              }
                            });

                            return (
                              <React.Fragment key={enfermedad}>
                                {detalles.map((detalle, idx) => (
                                  <tr
                                    key={`${enfermedad}-${idx}`}
                                    className="border-b hover:bg-gray-50"
                                  >
                                    {idx === 0 && (
                                      <td
                                        rowSpan={detalles.length + 1}
                                        className="px-2 sm:px-3 py-1 text-left font-semibold text-gray-800 bg-blue-50 border border-gray-300 align-top text-[10px] sm:text-xs"
                                      >
                                        {enfermedad}
                                      </td>
                                    )}
                                    <td className="px-2 sm:px-3 py-1 text-left text-gray-700 border border-gray-300 text-[10px] sm:text-xs line-clamp-2">
                                      {detalle.tipo} - {detalle.parte}
                                    </td>
                                    <td className="px-2 sm:px-3 py-1 text-center text-gray-800 border border-gray-300 font-medium text-[10px] sm:text-xs">
                                      {detalle.cantidad}
                                    </td>
                                  </tr>
                                ))}
                                {/* Fila de subtotal por causa */}
                                <tr className="bg-green-100 font-bold border-b">
                                  <td className="px-2 sm:px-3 py-1 text-right text-green-800 border border-gray-300 text-[10px] sm:text-xs">
                                    Sub {enfermedad}:
                                  </td>
                                  <td className="px-2 sm:px-3 py-1 text-center text-green-800 border border-gray-300 text-[10px] sm:text-xs">
                                    {totalEnfermedad}
                                  </td>
                                </tr>
                              </React.Fragment>
                            );
                          })}
                      </tbody>
                      <tfoot>
                        <tr className="bg-green-200 font-bold border-t-2">
                          <td
                            colSpan="2"
                            className="px-2 sm:px-3 py-1 text-right text-gray-800 border border-gray-300 text-[10px] sm:text-xs"
                          >
                            TOTAL DEC.
                          </td>
                          <td className="px-2 sm:px-3 py-1 text-center text-gray-800 border border-gray-300 text-[10px] sm:text-xs">
                            {Array.from(enfermedades)
                              .sort()
                              .reduce((sum, enfermedad) => {
                                let totalEnfermedad = 0;
                                diasOrdenados.forEach((dia) => {
                                  const dayData = dataByDay[dia];
                                  if (dayData.decomisos[enfermedad]) {
                                    const tiposParteDelEnf = Object.keys(
                                      dayData.decomisos[enfermedad],
                                    );
                                    tiposParteDelEnf.forEach((tipoParte) => {
                                      Object.entries(
                                        dayData.decomisos[enfermedad][
                                          tipoParte
                                        ],
                                      ).forEach(([, cantidad]) => {
                                        totalEnfermedad += cantidad;
                                      });
                                    });
                                  }
                                });
                                return sum + totalEnfermedad;
                              }, 0)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>

                {/* 4. OBSERVACIONES */}
                <div className="mb-4 sm:mb-8">
                  <div className="border-t-2 border-gray-300 pt-2 sm:pt-4">
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800 mb-2 sm:mb-3 print:text-lg">
                      OBSERVACIONES
                    </h3>
                    <div className="mb-2">
                      <textarea
                        value={observaciones}
                        onChange={(e) => {
                          const texto = e.target.value.substring(0, 500);
                          setObservaciones(texto);
                          localStorage.setItem(
                            `informe-observaciones-${mes}-${año}-${
                              plantaSeleccionada || 'todas'
                            }`,
                            texto,
                          );
                        }}
                        placeholder="Observaciones adicionales (máximo 500 caracteres)..."
                        className="w-full p-2 sm:p-3 border-2 border-gray-300 bg-white text-gray-700 text-xs rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 transition-all hover:border-green-300 print:border-black"
                        rows="3"
                      />
                    </div>
                    <div className="text-right text-xs text-gray-500 print:hidden">
                      {observaciones.length} / 500
                    </div>
                  </div>
                </div>

                {/* 5. TABLA FINAL DE TITULARES - ANCHO COMPLETO */}
                <div className="mb-4 sm:mb-8">
                  <div className="bg-green-100 px-2 sm:px-4 py-1 sm:py-2 mb-3 rounded-t-lg">
                    <h2 className="text-xs sm:text-sm font-bold text-gray-800">
                      ESPECIES Y CATEGORÍAS DE ANIMALES FAENADOS
                    </h2>
                  </div>
                  {(() => {
                    // Obtener todas las especies y categorías únicas del objeto dinámico
                    const especies = Object.keys(titularesPorCategoria).sort();
                    const todasLasCategorias = new Set();

                    especies.forEach((especie) => {
                      Object.keys(titularesPorCategoria[especie] || {}).forEach(
                        (cat) => {
                          todasLasCategorias.add(cat);
                        },
                      );
                    });

                    const categoriasOrdenadas =
                      Array.from(todasLasCategorias).sort();

                    if (categoriasOrdenadas.length === 0) {
                      return (
                        <p className="text-gray-500 text-center py-4 text-xs sm:text-sm">
                          No hay faenas registradas
                        </p>
                      );
                    }

                    return (
                      <div className="overflow-x-auto rounded-b-lg border border-t-0 border-gray-200">
                        <table className="w-full text-[10px] sm:text-xs md:text-sm border-collapse">
                          <thead>
                            <tr className="bg-green-100">
                              <th className="px-2 sm:px-3 py-1 text-left font-semibold text-gray-700 border border-gray-300">
                                Especies
                              </th>
                              {categoriasOrdenadas.map((cat) => (
                                <th
                                  key={cat}
                                  className="px-2 sm:px-3 py-1 text-center font-semibold text-gray-700 border border-gray-300 whitespace-nowrap text-[10px] sm:text-xs"
                                >
                                  {cat.substring(0, 10)}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {especies.map((especie, idx) => {
                              const tieneItems = categoriasOrdenadas.some(
                                (cat) =>
                                  (titularesPorCategoria[especie]?.[cat] || 0) >
                                  0,
                              );
                              return tieneItems ? (
                                <tr
                                  key={especie}
                                  className={
                                    idx % 2 === 0
                                      ? 'bg-white hover:bg-gray-50'
                                      : 'bg-gray-50 hover:bg-gray-100'
                                  }
                                >
                                  <td className="px-2 sm:px-3 py-1 text-left text-gray-800 font-medium border border-gray-300 text-[10px] sm:text-xs\">
                                    {especie}
                                  </td>
                                  {categoriasOrdenadas.map((cat) => (
                                    <td
                                      key={`${especie}-${cat}`}
                                      className="px-2 sm:px-3 py-1 text-center text-gray-700 font-medium border border-gray-300 text-[10px] sm:text-xs\"
                                    >
                                      {titularesPorCategoria[especie]?.[cat] ||
                                        0}
                                    </td>
                                  ))}
                                </tr>
                              ) : null;
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-green-200 font-bold">
                              <td className="px-2 sm:px-3 py-1 text-left text-gray-800 border border-gray-300 text-[10px] sm:text-xs">
                                TOTALES
                              </td>
                              {categoriasOrdenadas.map((cat) => (
                                <td
                                  key={`total-${cat}`}
                                  className="px-2 sm:px-3 py-1 text-center text-gray-800 border border-gray-300 text-[10px] sm:text-xs"
                                >
                                  {especies.reduce(
                                    (sum, esp) =>
                                      sum +
                                      (titularesPorCategoria[esp]?.[cat] || 0),
                                    0,
                                  )}
                                </td>
                              ))}
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          /* Ocultar elementos específicos que no queremos imprimir */
          .no-print {
            display: none !important;
          }
          
          /* Ocultar componentes globales del Layout */
          nav,
          header,
          aside,
          footer,
          [class*="sidebar"],
          [class*="Sidebar"],
          [class*="nav"],
          [class*="Nav"],
          [class*="header"],
          [class*="Header"],
          [class*="footer"],
          [class*="Footer"],
          /* Ocultar botones flotantes y menús desplegables */
          [class*="mobile"],
          [class*="Mobile"],
          [class*="hamburger"],
          [class*="menu"],
          [class*="Menu"],
          button[class*="rounded-full"],
          .rounded-full,
          [class*="toggle"],
          [class*="Toggle"],
          [class*="dropdown"],
          [class*="Dropdown"] {
            display: none !important;
          }
          
          /* Configuración general de página */
          body {
            background: white;
            margin: 0;
            padding: 0;
          }
          
          /* Contenedor del reporte */
          #report-content {
            width: 100%;
            max-width: 100%;
            box-shadow: none;
            border-radius: 0;
            page-break-inside: avoid;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Botón de impresión oculto */
          .print\\:hidden {
            display: none !important;
          }
          
          /* Estilos para tablas de impresión */
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
            margin-bottom: 5px;
            font-size: 8pt;
          }
          
          thead {
            page-break-inside: avoid;
            background-color: #dcfce7 !important;
            color: #1f2937;
          }
          
          thead th {
            border: 1px solid #000 !important;
            padding: 3pt;
            text-align: left;
            font-weight: bold;
            font-size: 8pt;
          }
          
          tbody tr {
            page-break-inside: avoid;
            border: 1px solid #000 !important;
          }
          
          tbody td {
            border: 1px solid #000 !important;
            padding: 2pt 3pt;
            font-size: 7pt;
            height: auto;
            line-height: 1.2;
          }
          
          tfoot {
            background-color: #bbf7d0 !important;
            font-weight: bold;
            page-break-inside: avoid;
          }
          
          tfoot td {
            border: 1px solid #000 !important;
            padding: 2pt 3pt;
            font-size: 8pt;
          }
          
          /* Estilos para encabezados */
          h1 {
            page-break-after: avoid;
            font-size: 14pt;
            margin-bottom: 5px;
            margin-top: 0;
          }
          
          h2, h3 {
            page-break-after: avoid;
            margin-top: 4px;
            margin-bottom: 3px;
          }
          
          h2 {
            font-size: 10pt;
          }
          
          h3 {
            font-size: 9pt;
          }
          
          /* Estilos para contenido */
          div {
            page-break-inside: avoid;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          p {
            margin: 2px 0 !important;
            font-size: 8pt;
          }
          
          /* Bordes */
          .border-b, .border-t-2, .border {
            border-color: #000 !important;
          }
          
          /* Ocultar contenedores del layout */
          .min-h-screen {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
          }
          
          .max-w-7xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Ocultar cualquier padding/margin en contenedores externos */
          main {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Márgenes de impresión */
          @page {
            margin: 0.2in;
            size: A4 portrait;
          }
          
          /* Scroll */
          .overflow-x-auto {
            overflow: visible !important;
          }
        }
      `}</style>
    </div>
  );
}

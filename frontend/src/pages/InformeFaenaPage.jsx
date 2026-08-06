import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import Select from 'react-select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
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

// Página Informe de Faena — ahora con datos dinámicos y filtros
export default function InformeFaenaPage() {
  const navigate = useNavigate();

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [idEspecie, setIdEspecie] = useState('');
  const [idProvincia, setIdProvincia] = useState('');
  const [idPlanta, setIdPlanta] = useState('');

  const [especies, setEspecies] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [plantas, setPlantas] = useState([]);

  const [user, setUser] = useState(null);

  const [period, setPeriod] = useState('6'); // meses

  const [faenas, setFaenas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [totalTropas, setTotalTropas] = useState(0);
  const [tropasFaenadasCompletas, setTropasFaenadasCompletas] = useState(0);
  const [totalUnidades, setTotalUnidades] = useState(0);
  const [totalFaenados, setTotalFaenados] = useState(0);
  const [totalPorTropa, setTotalPorTropa] = useState({});

  useEffect(() => {
    // cargar especies, provincias y plantas al montar
    let mounted = true;
    (async () => {
      try {
        const [espRes, provRes, plantRes] = await Promise.all([
          api.get('/especies'),
          api.get('/provincias'),
          api.get('/plantas'),
        ]);
        if (!mounted) return;

        console.log('[InformeFaenaPage] Plantas cargadas:', plantRes.data);

        // Handle user permissions
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            setUser(user);
            const userRol = parseInt(user.rol || 0);
            if (userRol !== 1 && user.id_planta) {
              // Non-admin: auto-select their plant
              setIdPlanta(String(user.id_planta));
            }
          }
        } catch (e) {
          console.error('Error obteniendo usuario:', e);
        }

        setEspecies(espRes.data || []);
        setProvincias(provRes.data || []);
        setPlantas(plantRes.data || []);
        setInitialLoad(false);
      } catch (err) {
        // no bloquear la UI; mostrar vacío si falla
        console.error('Error cargando filtros:', err);
      }
    })();
    return () => (mounted = false);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Construir parámetros de consulta
      const params = {};
      // Mapear semántica: UI `desde` actúa como límite superior (<=), UI `hasta` como límite inferior (>=).
      // Backend `desde` = lower bound (>=), `hasta` = upper bound (<=).
      if (desde && hasta) {
        const low = desde < hasta ? desde : hasta;
        const high = desde > hasta ? desde : hasta;
        params.desde = low;
        params.hasta = high;
      } else if (desde) {
        // UI 'desde' -> backend 'hasta' (upper bound)
        params.hasta = desde;
      } else if (hasta) {
        // UI 'hasta' -> backend 'desde' (lower bound)
        params.desde = hasta;
      }
      if (idEspecie && idEspecie !== '') params.id_especie = idEspecie;
      if (idProvincia && idProvincia !== '') params.id_provincia = idProvincia;
      
      // Usar la planta seleccionada en el filtro, o la del usuario si es no-admin y no selecciona nada
      let plantaAFiltrar = idPlanta;
      if (!plantaAFiltrar && user?.rol !== 1) {
        // No-admin sin selección: usar su planta asignada
        plantaAFiltrar = String(user?.id_planta || '');
      }
      
      if (plantaAFiltrar && plantaAFiltrar !== '') {
        params.id_planta = plantaAFiltrar;
      }

      console.log('[InformeFaenaPage] Llamando API con params:', params);
      const res = await api.get('/faena/faenas-realizadas', { params });
      console.log('[InformeFaenaPage] Respuesta recibida:', res.data);
      
      // Procesar respuesta
      const payload = res.data?.faenas ?? res.data ?? [];
      const totalFaenados = res.data?.total_faenados ?? 0;
      const totalTropasRes = res.data?.total_tropas ?? 0;
      const tropasFaenadasCompletasRes = res.data?.tropas_faenadas_completas ?? 0;
      const totalUnidadesRes = res.data?.total_unidades ?? 0;
      
      setFaenas(payload);
      setTotalFaenados(totalFaenados);
      setTotalTropas(totalTropasRes);
      setTropasFaenadasCompletas(tropasFaenadasCompletasRes);
      setTotalUnidades(totalUnidadesRes);
    } catch (err) {
      console.error(
        'Error al obtener faenas realizadas:',
        err?.response ?? err.message
      );
      setFaenas([]);
    } finally {
      setLoading(false);
    }
  };

  // Efecto separado: cuando initialLoad se pone en false, hacer el primer fetch
  useEffect(() => {
    if (initialLoad || !user) return;
    console.log('[InformeFaenaPage] Disparando fetchData después de initialLoad');
    fetchData();
  }, [initialLoad, user]);

  // Efecto: cuando cambian los filtros, hacer fetch (solo si ya no es initialLoad)
  useEffect(() => {
    if (initialLoad || !user) return;
    console.log('[InformeFaenaPage] Disparando fetchData por cambio de filtros');
    fetchData();
  }, [desde, hasta, idEspecie, idProvincia, idPlanta]);

  // Función para resetear filtros a valores vacíos (por defecto)
  const resetearFiltros = () => {
    setDesde('');
    setHasta('');
    setIdEspecie('');
    setIdProvincia('');
    setIdPlanta('');
    console.log('[InformeFaenaPage] Filtros reseteados a valores vacíos');
  };

  const estadosOrden = ['pendiente', 'finalizada'];

  // Totales calculados a partir de faenas
  const totals = useMemo(() => {
    const total = faenas.length;

    // Calcular sum_faenado por tropa
    const sumFaenadoByTropa = faenas.reduce((acc, f) => {
      acc[f.tropa_id] = (acc[f.tropa_id] || 0) + Number(f.total_faenado || 0);
      return acc;
    }, {});

    const byEstadoAnimales = {
      finalizada: totalFaenados,
      pendiente: totalUnidades - totalFaenados,
    };

    const byEstado = faenas.reduce((acc, f) => {
      const est = (f.estado || f.estado_faena || 'finalizada').toString();
      acc[est] = (acc[est] || 0) + 1;
      return acc;
    }, {});
    const byPlanta = faenas.reduce((acc, f) => {
      const planta = f.nombre_planta || `Planta ${f.id_planta || ''}`;
      acc[planta] = (acc[planta] || 0) + 1;
      return acc;
    }, {});

    return { total, byEstado, byEstadoAnimales, byPlanta };
  }, [faenas, totalPorTropa]);

  // datos de tendencia (construidos a partir de faenas - simple agrupación por mes)
  const tendencia = useMemo(() => {
    const map = {};
    faenas.forEach((f) => {
      const d = new Date(f.fecha_faena || f.fecha || Date.now());
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        '0'
      )}`;
      map[key] = (map[key] || 0) + 1;
    });
    const entries = Object.entries(map).sort();
    const numMonths = period === 'all' ? entries.length : parseInt(period);
    const filteredEntries = entries.slice(-numMonths);
    return {
      data: filteredEntries.map(([mes, valor]) => ({ mes, valor })),
    };
  }, [faenas, period]);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header con título principal y botón volver */}
        <div className="flex items-center justify-between mb-6 no-print">
          <button
            onClick={() => navigate('/informes')}
            className="p-2 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 shadow-sm"
            aria-label="Volver a informes"
            title="Volver a informes"
          >
            <HiArrowLeft size={20} />
          </button>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
            📊 Informe de Faena
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Barra de navegación y filtros - NO IMPRIMIR */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Fechas */}
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 bg-gray-50 h-12 transition-all hover:border-emerald-300"
                aria-label="Desde"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-4 focus:ring-emerald-200 focus:border-emerald-500 bg-gray-50 h-12 transition-all hover:border-emerald-300"
                aria-label="Hasta"
              />
            </div>

            {/* Especie */}
            <SelectField
              label="Especie"
              value={
                {
                  value: idEspecie,
                  label: idEspecie === '' ? 'Todas' : (especies.find((s) => String(s.id_especie) === String(idEspecie))?.descripcion || 'Seleccione especie'),
                }
              }
              onChange={(option) => setIdEspecie(option?.value || '')}
              options={[
                { value: '', label: 'Todas' },
                ...especies.map((s) => ({
                  value: s.id_especie,
                  label: s.descripcion,
                })),
              ]}
              placeholder="Seleccione especie"
            />

            {/* Provincia */}
            <SelectField
              label="Provincia"
              value={
                {
                  value: idProvincia,
                  label: idProvincia === '' ? 'Todas' : (provincias.find((p) => String(p.id) === String(idProvincia))?.descripcion || 'Seleccione provincia'),
                }
              }
              onChange={(option) => setIdProvincia(option?.value || '')}
              options={[
                { value: '', label: 'Todas' },
                ...provincias.map((p) => ({
                  value: p.id,
                  label: p.descripcion,
                })),
              ]}
              placeholder="Seleccione provincia"
            />

            {/* Planta */}
            {parseInt(user?.rol || 0) === 1 ? (
              <SelectField
                label="Planta"
                value={
                  idPlanta
                    ? {
                        value: String(idPlanta),
                        label:
                          plantas.find(
                            (p) =>
                              parseInt(p.id_planta) ===
                              parseInt(idPlanta),
                          )?.nombre || 'Seleccione planta',
                      }
                    : { value: '', label: 'Todas' }
                }
                onChange={(option) => {
                  console.log('[InformeFaenaPage] onChange planta:', option);
                  setIdPlanta(option?.value ? String(option.value) : '');
                }}
                options={[
                  { value: '', label: 'Todas' },
                  ...plantas.map((p) => ({
                    value: String(p.id_planta),
                    label: p.nombre,
                  })),
                ]}
                placeholder="Seleccione planta"
              />
            ) : (
              <SelectField
                label="Planta"
                value={{
                  value: String(user?.id_planta || ''),
                  label: plantas.find(
                    (p) => parseInt(p.id_planta) === parseInt(user?.id_planta || 0)
                  )?.nombre || 'Planta asignada',
                }}
                onChange={() => {}}
                options={[
                  {
                    value: String(user?.id_planta || ''),
                    label: plantas.find(
                      (p) => parseInt(p.id_planta) === parseInt(user?.id_planta || 0)
                    )?.nombre || 'Planta asignada',
                  },
                ]}
                placeholder="Tu planta"
                isDisabled={true}
              />
            )}

            {/* Botón Filtrar */}
            <div className="flex items-end gap-2">
              <button
                onClick={fetchData}
                className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm font-medium shadow-sm h-12"
              >
                {loading ? 'Filtrando...' : 'Filtrar'}
              </button>
              <button
                onClick={resetearFiltros}
                className="px-4 py-2 bg-gray-400 hover:bg-gray-500 text-white rounded-lg transition-colors text-sm font-medium shadow-sm h-12 whitespace-nowrap"
                title="Resetear filtros a valores por defecto"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
          {/* Botón de impresión */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-2 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 border-b border-green-200 flex flex-col sm:flex-row justify-end items-end gap-2 sm:gap-3 md:gap-4 no-print mb-4">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-all duration-200 font-medium shadow-md hover:shadow-lg active:scale-95 text-xs sm:text-sm print:hidden whitespace-nowrap"
              title="Imprimir informe"
            >
              <svg
                className="w-4 h-4"
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

          {/* Título principal del informe */}
          <div className="px-4 sm:px-6 py-6 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Informe de Faenas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              {/* Establecimiento */}
              <div>
                <span className="font-semibold">Establecimiento:</span>{' '}
                {(() => {
                  console.log('[InformeFaenaPage] Renderizando establecimiento:', {
                    idPlanta,
                    user: user?.role,
                    plantas: plantas.length,
                  });
                  
                  if (plantas.length === 0) return 'Cargando...';
                  
                  // Mostrar según lo que está seleccionado en el filtro
                  if (!idPlanta || idPlanta === '') {
                    return 'Todas las plantas';
                  }
                  
                  const plantaSeleccionada = plantas.find(
                    (p) => parseInt(p.id_planta) === parseInt(idPlanta)
                  );
                  
                  return plantaSeleccionada?.nombre || 'No encontrada';
                })()}
              </div>

              {/* Período */}
              <div>
                <span className="font-semibold">Período:</span>{' '}
                {desde && hasta
                  ? (() => {
                      // Agregar 1 día para compensar el problema de timezone
                      const desdeDate = new Date(desde + 'T00:00:00');
                      const hastaDate = new Date(hasta + 'T00:00:00');
                      return `${desdeDate.toLocaleDateString('es-AR')} - ${hastaDate.toLocaleDateString('es-AR')}`;
                    })()
                  : 'Sin filtro'}
              </div>

              {/* Especie */}
              <div>
                <span className="font-semibold">Especie:</span>{' '}
                {idEspecie && especies.length > 0
                  ? (() => {
                      const especie = especies.find((e) => parseInt(e.id_especie) === parseInt(idEspecie));
                      return especie?.descripcion || 'No encontrada';
                    })()
                  : 'Todas'}
              </div>

              {/* Provincia */}
              <div>
                <span className="font-semibold">Provincia:</span>{' '}
                {idProvincia && provincias.length > 0
                  ? (() => {
                      const provincia = provincias.find((p) => parseInt(p.id) === parseInt(idProvincia));
                      return provincia?.descripcion || 'No encontrada';
                    })()
                  : 'Todas'}
              </div>
            </div>
          </div>

          {/* Top summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide">
                Total tropas
              </div>
              <div className="text-2xl font-bold mt-1">{totalTropas}</div>
            </div>

            <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide">
                Cantidad animales tropa
              </div>
              <div className="text-2xl font-bold mt-1">{totalUnidades}</div>
            </div>

            <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide">
                Tropas faenadas en su total
              </div>
              <div className="text-2xl font-bold mt-1">
                {tropasFaenadasCompletas}
              </div>
            </div>

            <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide">
                Total animales faenados
              </div>
              <div className="text-2xl font-bold mt-1">{totalFaenados}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Distribución por estado (simple bar) */}
            <div className="col-span-1 lg:col-span-2 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-semibold mb-3 text-gray-900">
                Distribución por estado de animales
              </h3>
              <div className="space-y-2">
                {estadosOrden.map((estado) => {
                  const distribucionData = totals.byEstadoAnimales;
                  const count = distribucionData[estado] || 0;
                  const totalForPct = Object.values(
                    totals.byEstadoAnimales
                  ).reduce((a, b) => a + b, 0);
                  const pct = totalForPct
                    ? Math.round((count / totalForPct) * 100)
                    : 0;
                  return (
                    <div key={estado} className="flex items-center gap-3">
                      <div className="w-24 text-xs capitalize text-gray-700 font-medium">
                        {estado}
                      </div>
                      <div className="flex-1 bg-white rounded-full h-3 overflow-hidden shadow-inner border">
                        <div
                          className="h-3 rounded-full bg-green-500 transition-all duration-300"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="w-8 text-right text-xs font-medium text-gray-600">
                        {count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tendencias (sparkline simple) */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-gray-900">
                  Tendencia mensual
                </h3>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 py-1 text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  aria-label="Período"
                >
                  <option value="3">3M</option>
                  <option value="6">6M</option>
                  <option value="12">12M</option>
                  <option value="all">Todo</option>
                </select>
              </div>
              <div className="w-full h-32">
                <ResponsiveContainer width="100%" height="100%" minHeight={128}>
                  <LineChart data={tendencia.data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="mes"
                      stroke="#6b7280"
                      fontSize={12}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      stroke="#6b7280"
                      fontSize={12}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#f9fafb',
                        border: '1px solid #d1d5db',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla por planta */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h3 className="text-base font-semibold mb-3 text-gray-900">
              Faenas por planta
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wide">
                    <th className="py-2 pr-4">Planta</th>
                    <th className="py-2 pr-4">Cantidad</th>
                    <th className="py-2 pr-4">% del total</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {Object.entries(totals.byPlanta).map(([planta, cnt]) => (
                    <tr key={planta} className="border-t border-gray-200">
                      <td className="py-2 pr-4 font-medium">{planta}</td>
                      <td className="py-2 pr-4">{cnt}</td>
                      <td className="py-2 pr-4">
                        {Math.round((cnt / totals.total) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Nota explicativa */}
          <div className="mt-4 text-xs text-gray-500 text-center">
            <p>
              Este informe ofrece una visión rápida del desempeño operativo. Los
              datos se actualizan según los filtros aplicados.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @page {
          size: A4;
          margin: 0;
          padding: 0;
          margin-top: 0;
          margin-bottom: 0;
          margin-left: 0;
          margin-right: 0;
        }

        @media print {
          /* Ocultar elementos que no queremos en la impresión */
          .no-print {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          /* Ocultar header y footer del navegador y aplicación */
          html {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background-color: white !important;
            color: #1f2937;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
          }

          /* Ocultar elemento header y footer de la aplicación */
          header,
          nav,
          footer {
            display: none !important;
          }

          /* Contenedor principal */
          .bg-gray-50 {
            background-color: white !important;
            margin: 10mm 10mm 0 10mm !important;
            padding: 0 !important;
          }

          .max-w-6xl {
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .bg-white {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Título principal con espacio */
          h1 {
            margin-top: 0 !important;
            margin-bottom: 10mm !important;
            page-break-after: avoid !important;
          }

          /* Tablas */
          table {
            width: 100%;
            border-collapse: collapse;
            page-break-inside: avoid;
          }

          th,
          td {
            border: 1px solid #d1d5db;
            padding: 8px;
          }

          th {
            background-color: #f3f4f6;
            font-weight: bold;
          }

          /* Evitar saltos de página en elementos importantes */
          .bg-green-600 {
            page-break-inside: avoid;
          }

          /* Gráficos */
          svg {
            max-width: 100%;
          }

          /* Asegurar que el contenido fluya bien */
          * {
            page-break-inside: avoid;
          }

          /* Asegurar que no haya espacios en blanco */
          div[class*="max-w-6xl"] {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

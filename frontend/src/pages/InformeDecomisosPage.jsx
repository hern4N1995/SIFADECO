import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';
import Select from 'react-select';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
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
          ? '0 0 0 4px #bbf7d0'
          : 'none',
      transition: 'all 100ms ease',
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.7 : 1,
      '&:hover': {
        borderColor: isDisabled ? '#e5e7eb' : '#86efac',
      },
      '&:focus-within': {
        borderColor: isDisabled ? '#e5e7eb' : '#16a34a',
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
      backgroundColor: isFocused ? '#dcfce7' : '#fff',
      color: isFocused ? '#14532d' : '#111827',
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

// Página Informe de Decomisos — con datos dinámicos y filtros
export default function InormeDecomisosPage() {
  const navigate = useNavigate();

  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [idPlanta, setIdPlanta] = useState('');
  const [idAfeccion, setIdAfeccion] = useState('');
  const [destinoDecomiso, setDestinoDecomiso] = useState('');

  const [plantas, setPlantas] = useState([]);
  const [afecciones, setAfecciones] = useState([]);
  const [destinos, setDestinos] = useState([]);

  const [user, setUser] = useState(null);
  const [period, setPeriod] = useState('6'); // meses

  const [decomisos, setDecomisos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Métricas agregadas
  const [totalDecomisos, setTotalDecomisos] = useState(0);
  const [totalPeso, setTotalPeso] = useState(0);
  const [totalAnimales, setTotalAnimales] = useState(0);

  useEffect(() => {
    // Cargar plantas y afecciones al montar
    let mounted = true;
    (async () => {
      try {
        const [plantRes, afecRes] = await Promise.all([
          api.get('/plantas'),
          api.get('/afecciones'),
        ]);
        if (!mounted) return;

        console.log('[InormeDecomisosPage] Plantas cargadas:', plantRes.data);
        console.log('[InormeDecomisosPage] Afecciones cargadas:', afecRes.data);

        // Handle user permissions
        try {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            console.log('[InormeDecomisosPage] Usuario obtenido:', userData);
            setUser(userData);
            const userRol = parseInt(userData.rol || 0);
            if (userRol !== 1 && userData.id_planta) {
              // No-admin: auto-select their plant
              setIdPlanta(String(userData.id_planta));
            }
          }
        } catch (e) {
          console.error('Error obteniendo usuario:', e);
        }

        setPlantas(plantRes.data || []);
        setAfecciones(afecRes.data || []);

        // Extraer destinos únicos de decomisos
        const destModulos = new Set();
        destModulos.add('Incineración');
        destModulos.add('Enterramiento');
        destModulos.add('Alimento Animal');
        destModulos.add('Otros');
        setDestinos(Array.from(destModulos));

        setInitialLoad(false);
      } catch (err) {
        console.error('Error cargando datos:', err);
        setInitialLoad(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};

      // Rango de fechas correcto: desde = límite inferior, hasta = límite superior
      if (desde && hasta) {
        const low = desde < hasta ? desde : hasta;
        const high = desde > hasta ? desde : hasta;
        params.desde = low;
        params.hasta = high;
      } else if (desde) {
        params.desde = desde;
      } else if (hasta) {
        params.hasta = hasta;
      }

      if (idAfeccion && idAfeccion !== '') params.id_afeccion = idAfeccion;
      if (destinoDecomiso && destinoDecomiso !== '') params.destino_decomiso = destinoDecomiso;

      // Usar planta seleccionada o la del usuario si no es admin
      let plantaAFiltrar = idPlanta;
      if (!plantaAFiltrar && user?.rol !== 1) {
        plantaAFiltrar = String(user?.id_planta || '');
      }

      if (plantaAFiltrar && plantaAFiltrar !== '') {
        params.id_planta = plantaAFiltrar;
      }

      const res = await api.get('/decomisos', { params });

      const payload = res.data || [];

      // Procesar datos y calcular métricas
      let totalPes = 0;
      let totalAnim = 0;
      const idsUnicos = new Set();

      payload.forEach((d) => {
        if (d.id_decomiso) idsUnicos.add(Number(d.id_decomiso));
        totalPes += Number(d.peso_kg || 0);
        totalAnim += Number(d.animales_afectados || 0);
      });

      setDecomisos(payload);
      setCurrentPage(1);
      setTotalDecomisos(idsUnicos.size);
      setTotalPeso(totalPes);
      setTotalAnimales(totalAnim);
    } catch (err) {
      console.error('Error al obtener decomisos:', err?.response ?? err.message);
      setDecomisos([]);
      setTotalDecomisos(0);
      setTotalPeso(0);
      setTotalAnimales(0);
    } finally {
      setLoading(false);
    }
  };

  // Efecto para primer fetch después de cargar datos
  useEffect(() => {
    if (initialLoad || !user) return;
    console.log('[InormeDecomisosPage] Disparando fetchData después de initialLoad');
    fetchData();
  }, [initialLoad, user]);

  // Efecto para fetch cuando cambian filtros
  useEffect(() => {
    if (initialLoad || !user) return;
    console.log('[InormeDecomisosPage] Disparando fetchData por cambio de filtros');
    fetchData();
  }, [desde, hasta, idPlanta, idAfeccion, destinoDecomiso]);

  const resetearFiltros = () => {
    setDesde('');
    setHasta('');
    setIdAfeccion('');
    setDestinoDecomiso('');

    if (user?.rol === 1) {
      setIdPlanta('');
    } else {
      setIdPlanta(String(user?.id_planta || ''));
    }

    console.log('[InormeDecomisosPage] Filtros reseteados');
  };

  // Totales y agrupaciones calculadas
  const totals = useMemo(() => {
    const total = decomisos.length;

    const byAfeccion = decomisos.reduce((acc, d) => {
      // Mostrar afección con especie si está disponible
      const afec = d.afeccion || 'Sin especificar';
      const especie = d.especie ? ` (${d.especie})` : '';
      const key = `${afec}${especie}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const byDestino = decomisos.reduce((acc, d) => {
      const dest = d.destino_decomiso || 'Sin especificar';
      acc[dest] = (acc[dest] || 0) + 1;
      return acc;
    }, {});

    const byPlanta = decomisos.reduce((acc, d) => {
      const planta = d.nombre_planta || `Planta ${d.id_planta || ''}`;
      const key = `${planta}|${d.id_decomiso ?? 'sin-id'}`;

      if (!acc[planta]) {
        acc[planta] = new Set();
      }

      acc[planta].add(key);
      return acc;
    }, {});

    const byPlantaCount = Object.fromEntries(
      Object.entries(byPlanta).map(([planta, ids]) => [planta, ids.size]),
    );

    // Peso por afeccion (incluyendo especie)
    const pesoByAfeccion = decomisos.reduce((acc, d) => {
      const afec = d.afeccion || 'Sin especificar';
      const especie = d.especie ? ` (${d.especie})` : '';
      const key = `${afec}${especie}`;
      acc[key] = (acc[key] || 0) + Number(d.peso_kg || 0);
      return acc;
    }, {});

    return { total, byAfeccion, byDestino, byPlanta: byPlantaCount, pesoByAfeccion };
  }, [decomisos]);

  // Datos de tendencia (decomisos únicos por mes - conteo por id_decomiso)
  const tendencia = useMemo(() => {
    const map = {};
    
    decomisos.forEach((d) => {
      // Solo procesar si hay una fecha válida
      let fecha = null;
      
      // Evitar strings "null" y valores inválidos
      if (d.fecha_decomiso && d.fecha_decomiso !== 'null' && d.fecha_decomiso !== null) {
        fecha = new Date(d.fecha_decomiso);
      } else if (d.fecha_ingreso && d.fecha_ingreso !== 'null' && d.fecha_ingreso !== null) {
        fecha = new Date(d.fecha_ingreso);
      }
      
      // Si la fecha no es válida, saltar este registro
      if (!fecha || isNaN(fecha.getTime())) {
        return;
      }
      
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      // Usar Set para contar id_decomiso únicos por mes
      if (!map[key]) {
        map[key] = new Set();
      }
      if (d.id_decomiso) {
        map[key].add(Number(d.id_decomiso));
      }
    });
    
    // Convertir Sets a números para el gráfico
    const entries = Object.entries(map)
      .map(([mes, ids]) => [mes, ids.size])
      .sort();
    
    const numMonths = period === 'all' ? entries.length : parseInt(period);
    const filteredEntries = entries.slice(-numMonths);
    
    return {
      data: filteredEntries.map(([mes, valor]) => ({ mes, valor })),
    };
  }, [decomisos, period]);

  // Datos para gráfico de peso por afeccion
  const pesoChartData = useMemo(() => {
    return Object.entries(totals.pesoByAfeccion)
      .map(([afeccion, peso]) => ({ name: afeccion, peso }))
      .sort((a, b) => b.peso - a.peso)
      .slice(0, 8);
  }, [totals.pesoByAfeccion]);

  // Datos para gráfico de pie (destino)
  const destinoChartData = useMemo(() => {
    return Object.entries(totals.byDestino).map(([destino, count]) => ({
      name: destino,
      value: count,
    }));
  }, [totals.byDestino]);

  const COLORS = ['#16a34a', '#22c55e', '#10b981', '#84cc16', '#4ade80', '#2dd4bf', '#34d399', '#65a30d'];

  // Helper: Obtener el nombre de la planta del usuario (del localStorage directamente)
  const userPlantName = (() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData?.id_planta && plantas.length > 0) {
          const plantaEncontrada = plantas.find(
            (p) => String(p.id_planta) === String(userData.id_planta)
          );
          console.log('[userPlantName] Usuario ID planta:', userData.id_planta, 'Plantas disponibles:', plantas.length, 'Encontrada:', plantaEncontrada?.nombre);
          return plantaEncontrada?.nombre || null;
        }
      }
    } catch (e) {
      console.error('[userPlantName] Error:', e);
    }
    return null;
  })();

  const sortedDecomisos = useMemo(() => {
    return [...decomisos].sort((a, b) => {
      const fechaA = new Date(a.fecha_decomiso || a.fecha_ingreso || 0).getTime();
      const fechaB = new Date(b.fecha_decomiso || b.fecha_ingreso || 0).getTime();
      return fechaB - fechaA;
    });
  }, [decomisos]);

  const totalPages = Math.max(1, Math.ceil(sortedDecomisos.length / itemsPerPage));
  const paginatedDecomisos = sortedDecomisos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <div className="bg-gray-50 min-h-full">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
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
            📊 Informe de Decomisos
          </h1>
          <div className="w-10"></div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 no-print">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            {/* Fechas */}
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">Desde</label>
              <input
                type="date"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-4 focus:ring-green-200 focus:border-green-500 bg-gray-50 h-12 transition-all hover:border-green-300"
                aria-label="Desde"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">Hasta</label>
              <input
                type="date"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="border-2 border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-4 focus:ring-green-200 focus:border-green-500 bg-gray-50 h-12 transition-all hover:border-green-300"
                aria-label="Hasta"
              />
            </div>

            {/* Afección */}
            <SelectField
              label="Afección"
              value={
                (() => {
                  if (idAfeccion === '') return { value: '', label: 'Todas' };
                  const found = afecciones.find((a) => String(a.id_afeccion) === String(idAfeccion));
                  return {
                    value: idAfeccion,
                    label: found ? `${found.descripcion} (${found.especie})` : 'Seleccione',
                  };
                })()
              }
              onChange={(option) => setIdAfeccion(option?.value || '')}
              options={[
                { value: '', label: 'Todas' },
                ...afecciones.map((a) => ({
                  value: String(a.id_afeccion),
                  label: `${a.descripcion} (${a.especie})`,
                })),
              ]}
              placeholder="Seleccione afección"
            />

            {/* Destino */}
            <SelectField
              label="Destino"
              value={
                {
                  value: destinoDecomiso,
                  label: destinoDecomiso === '' ? 'Todos' : destinoDecomiso,
                }
              }
              onChange={(option) => setDestinoDecomiso(option?.value || '')}
              options={[
                { value: '', label: 'Todos' },
                ...destinos.map((d) => ({
                  value: d,
                  label: d,
                })),
              ]}
              placeholder="Seleccione destino"
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
                  label: userPlantName || (plantas.length === 0 ? 'Cargando...' : 'Planta asignada'),
                }}
                onChange={() => {}}
                options={[
                  {
                    value: String(user?.id_planta || ''),
                    label: userPlantName || (plantas.length === 0 ? 'Cargando...' : 'Planta asignada'),
                  },
                ]}
                placeholder="Tu planta"
                isDisabled={true}
              />
            )}

            {/* Botones */}
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
                title="Resetear filtros"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>

        {/* Main card */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 sm:p-6">
          {/* Botón impresión */}
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

          {/* Título */}
          <div className="px-4 sm:px-6 py-6 border-b border-gray-200">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 text-center">
              Informe de Decomisos
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
              <div>
                <span className="font-semibold">Establecimiento:</span>{' '}
                {plantas.length === 0
                  ? 'Cargando...'
                  : !idPlanta || idPlanta === ''
                    ? 'Todas las plantas'
                    : plantas.find((p) => parseInt(p.id_planta) === parseInt(idPlanta))?.nombre || 'No encontrada'}
              </div>
              <div>
                <span className="font-semibold">Período:</span>{' '}
                {desde && hasta
                  ? `${new Date(desde + 'T00:00:00').toLocaleDateString('es-AR')} - ${new Date(hasta + 'T00:00:00').toLocaleDateString('es-AR')}`
                  : 'Sin filtro'}
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide">
                Total decomisos
              </div>
              <div className="text-2xl font-bold mt-1">{totalDecomisos}</div>
            </div>

            <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide">
                Peso total (kg)
              </div>
              <div className="text-2xl font-bold mt-1">{totalPeso.toFixed(2)}</div>
            </div>

            <div className="bg-green-600 text-white rounded-lg p-3 shadow-sm">
              <div className="text-xs font-medium uppercase tracking-wide">
                Animales afectados
              </div>
              <div className="text-2xl font-bold mt-1">{totalAnimales}</div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Tendencia temporal */}
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
                      stroke="#16a34a"
                      strokeWidth={3}
                      dot={{ fill: '#16a34a', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#16a34a', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Destino decomiso (Pie) */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                Decomisos por destino
              </h3>
              <div className="w-full h-32">
                <ResponsiveContainer width="100%" height="100%" minHeight={128}>
                  <PieChart>
                    <Pie
                      data={destinoChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={45}
                      fill="#16a34a"
                      dataKey="value"
                    >
                      {destinoChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Peso por afección (Bar) */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              Peso decomisado por afección (Top 8)
            </h3>
            <div className="w-full h-40">
              <ResponsiveContainer width="100%" height="100%" minHeight={160}>
                <BarChart data={pesoChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    stroke="#6b7280"
                    fontSize={12}
                    tick={{ fontSize: 10 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis stroke="#6b7280" fontSize={12} tick={{ fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#f9fafb',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="peso" fill="#16a34a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla por planta */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <h3 className="text-base font-semibold mb-3 text-gray-900">
              Decomisos por planta
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
                        {Math.round((cnt / (totals.total || 1)) * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Tabla detallada de decomisos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mb-4">
            <h3 className="text-base font-semibold mb-3 text-gray-900">
              Detalle de decomisos
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wide">
                    <th className="py-2 px-2 sm:px-4">Fecha</th>
                    <th className="py-2 px-2 sm:px-4">Tropa</th>
                    <th className="py-2 px-2 sm:px-4">Planta</th>
                    <th className="py-2 px-2 sm:px-4">Afección</th>
                    <th className="py-2 px-2 sm:px-4">Cantidad</th>
                    <th className="py-2 px-2 sm:px-4">Peso (kg)</th>
                    <th className="py-2 px-2 sm:px-4">Animales</th>
                    <th className="py-2 px-2 sm:px-4">Destino</th>
                  </tr>
                </thead>
                <tbody className="text-gray-900">
                  {paginatedDecomisos.map((d, idx) => (
                    <tr key={`${currentPage}-${idx}`} className="border-t border-gray-200 hover:bg-gray-100">
                      <td className="py-2 px-2 sm:px-4">
                        {new Date(d.fecha_decomiso || d.fecha_ingreso || 0).toLocaleDateString('es-AR')}
                      </td>
                      <td className="py-2 px-2 sm:px-4">{d.n_tropa || '-'}</td>
                      <td className="py-2 px-2 sm:px-4">{d.nombre_planta || '-'}</td>
                      <td className="py-2 px-2 sm:px-4">
                        <div className="flex flex-col">
                          <span className="font-medium">{d.afeccion || '-'}</span>
                          {d.especie && <span className="text-xs text-gray-600">{d.especie}</span>}
                        </div>
                      </td>
                      <td className="py-2 px-2 sm:px-4">{d.cantidad || 0}</td>
                      <td className="py-2 px-2 sm:px-4">{Number(d.peso_kg || 0).toFixed(2)}</td>
                      <td className="py-2 px-2 sm:px-4">{d.animales_afectados || 0}</td>
                      <td className="py-2 px-2 sm:px-4">{d.destino_decomiso || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
                <p className="text-xs text-gray-600">
                  Mostrando {paginatedDecomisos.length} de {sortedDecomisos.length} decomisos
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>
                  <span className="text-xs font-medium text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Nota */}
          <div className="text-xs text-gray-500 text-center">
            <p>
              Este informe ofrece una visión general del decomiso operativo. Los
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
          .no-print {
            display: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

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

          header,
          nav,
          footer {
            display: none !important;
          }

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

          h1 {
            margin-top: 0 !important;
            margin-bottom: 10mm !important;
            page-break-after: avoid !important;
          }

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

          .bg-green-600 {
            page-break-inside: avoid;
          }

          svg {
            max-width: 100%;
          }

          * {
            page-break-inside: avoid;
          }

          div[class*="max-w-6xl"] {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}

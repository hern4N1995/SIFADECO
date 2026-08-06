import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener?.('change', listener);
    return () => media.removeEventListener?.('change', listener);
  }, [query]);
  return matches;
};

function SelectField({
  label,
  value,
  options = [],
  onChange,
  placeholder = '',
  className = '',
}) {
  const [isFocusing, setIsFocusing] = useState(false);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: '48px',
      minHeight: '48px',
      paddingLeft: '12px',
      paddingRight: '12px',
      backgroundColor: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: isFocusing
        ? '0 0 0 1px #000'
        : state.isFocused
        ? '0 0 0 4px #d1fae5'
        : 'none',
      transition: 'all 50ms ease',
      '&:hover': { borderColor: '#96f1b7' },
      '&:focus-within': { borderColor: '#22c55e' },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 6px',
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
    placeholder: (base) => ({ ...base, fontSize: '14px', color: '#6b7280' }),
    indicatorsContainer: (base) => ({ ...base, height: '48px' }),
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
    <div className={`flex flex-col ${className}`} style={{ minWidth: 0 }}>
      {label && (
        <label className="mb-2 font-semibold text-gray-700 text-sm">
          {label}
        </label>
      )}
      <Select
        value={value}
        onChange={(sel) => onChange(sel)}
        options={options}
        placeholder={placeholder}
        styles={customStyles}
        noOptionsMessage={() => 'Sin opciones'}
        components={{ IndicatorSeparator: () => null }}
        onFocus={() => {
          setIsFocusing(true);
          setTimeout(() => setIsFocusing(false), 50);
        }}
      />
    </div>
  );
}

const FaenaPage = () => {
  const [tropas, setTropas] = useState([]);
  const [filtroBusqueda, setFiltroBusqueda] = useState('');
  const [filterDesde, setFilterDesde] = useState('');
  const [filterHasta, setFilterHasta] = useState('');
  const [sortField, setSortField] = useState('fecha'); // 'fecha' | 'n_tropa'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [totalFaenar, setTotalFaenar] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redirigiendoId, setRedirigiendoId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rol, setRol] = useState(null);
  const [plantaDelUsuario, setPlantaDelUsuario] = useState(null);
  const navigate = useNavigate();

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
  const rowsPerPageOptions = [4, 7, 10, 20];
  const [rowsPerPage, setRowsPerPage] = useState(20);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setRowsPerPage(window.matchMedia('(max-width: 767px)').matches ? 4 : 20);
    }
  }, []);

  // Normaliza datos básicos de la tropa (lo mínimo)
  const normalizeBasic = (r) => {
    let planta = null;
    if (r.planta)
      planta =
        typeof r.planta === 'object' ? r.planta : { nombre: String(r.planta) };
    else if (r.planta_nombre) planta = { nombre: r.planta_nombre };
    else if (r.planta_id) planta = { id: r.planta_id, nombre: null };

    return {
      id_tropa: r.id_tropa ?? r.id ?? null,
      n_tropa: r.n_tropa || r.nTropa || r.nro_tropa || r.nro || '',
      fecha: r.fecha || r.fecha_ingreso || r.created_at || null,
      dte_dtu: r.dte_dtu || r.dte || r.dtu || null,
      guia_policial: r.guia_policial || r.guia || null,
      productor: r.productor || r.productor_nombre || r.razon_social || null,
      departamento: r.departamento || r.nombre_departamento || null,
      titular_faena: r.titular || r.titular_faena || null,
      especie: r.especie ?? null, // se intentará completar con detalle
      total_a_faenar:
        r.total_a_faenar != null ? Number(r.total_a_faenar) : null, // se completará con detalle si no viene
      id_faena: r.id_faena ?? r.idFaena ?? null,
      planta,
      __raw: r,
    };
  };

  // Pide lista de tropas filtrada por planta del usuario (ruta protegida)
  // Esta lógica ahora está en el useEffect de abajo con proper cleanup

  useEffect(() => {
    // Obtener rol y planta del usuario desde localStorage
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        const userRol = userData.rol || userData.id_rol;
        setRol(parseInt(userRol));
        
        // Usar id_planta del usuario (viene del backend)
        if (parseInt(userRol) !== 1) {
          setPlantaDelUsuario(userData.id_planta);
        }
      }
    } catch (err) {
      console.error('[FaenaPage] Error al obtener usuario:', err);
      setRol(1); // Default a admin para mostrar datos
    }
  }, []);

  useEffect(() => {
    if (rol === null) return;

    // Usar AbortController para cancelar peticiones si el componente se desmonta
    const controller = new AbortController();
    let isMounted = true;

    const fetchTropasPorPlantaWithCleanup = async () => {
      if (!isMounted) return;

      setLoading(true);
      try {
        // Si es admin, obtener todas las tropas; si no, filtradas por su planta
        const endpoint = rol === 1 ? '/tropas' : '/tropas/por-planta';
        console.log('[FaenaPage] Usando endpoint:', endpoint, 'Rol:', rol);

        const res = await api.get(endpoint, { signal: controller.signal });
        
        if (!isMounted) return;

        const data = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        const basics = data.map(normalizeBasic);

        // Usar batching para obtener detalles: máximo 10 peticiones paralelas
        const batchSize = 10;
        const detalleMap = new Map();

        for (let i = 0; i < basics.length; i += batchSize) {
          if (!isMounted) return;

          const batch = basics.slice(i, i + batchSize);
          const batchNum = Math.floor(i / batchSize) + 1;
          const totalBatches = Math.ceil(basics.length / batchSize);
          
          console.log(`[FaenaPage] Batch ${batchNum}/${totalBatches} (${batch.length} tropas)`);
          
          const batchPromises = batch.map((t) =>
            api
              .get(`/tropas/${t.id_tropa}/detalle-agrupado`, { signal: controller.signal })
              .then((r) => ({ status: 'fulfilled', id: t.id_tropa, data: r.data }))
              .catch((err) => {
                console.warn(`[FaenaPage] getDetalleAgrupado failed for tropa ${t.id_tropa}`);
                return { status: 'rejected', id: t.id_tropa, error: err };
              })
          );

          const detalles = await Promise.allSettled(batchPromises);

          // Procesar resultados
          for (const p of detalles) {
            if (p.status === 'fulfilled' && p.value?.status === 'fulfilled' && p.value?.data) {
              detalleMap.set(p.value.id, p.value.data);
            }
          }

          // Delay pequeño entre batches (50ms) para no sobrecargar servidor
          if (i + batchSize < basics.length) {
            await new Promise((resolve) => setTimeout(resolve, 50));
          }
        }

        if (!isMounted) return;

        // Consolidar: combinar info de tropa + detalle
        const consolidated = basics.map((t) => {
          const det = detalleMap.get(t.id_tropa) ?? null;
          if (!det) return t;

          let categorias = [];
          if (Array.isArray(det.categorias)) categorias = det.categorias;
          else if (Array.isArray(det)) categorias = det;
          else if (Array.isArray(det.data)) categorias = det.data;

          let especie = t.especie;
          if (!especie && categorias.length > 0) {
            const first = categorias.find(
              (c) =>
                c.especie ||
                c.nombre_especie ||
                c.nombre_categoria ||
                c.especie_nombre
            );
            especie =
              first?.especie ??
              first?.nombre_especie ??
              first?.especie_nombre ??
              null;
          }

          // Calcular total: suma de remanentes (lo que falta faenar)
          const total = categorias.reduce(
            (sum, c) => sum + (Number(c.remanente ?? c.cantidad ?? 0) || 0),
            0
          );

          return {
            ...t,
            especie: especie || 'Especie',
            total_a_faenar: total != null ? Number(total) : t.total_a_faenar,
          };
        });

        // Filtrar según criterio: si total_a_faenar existe, mostrar >0
        const disponibles = consolidated.filter(
          (t) =>
            t.id_tropa != null &&
            (t.total_a_faenar == null ? true : t.total_a_faenar > 0)
        );

        // Ordenar por fecha desc
        const ordenadas = disponibles.slice().sort((a, b) => {
          const da = a.fecha ? new Date(a.fecha) : new Date(0);
          const db = b.fecha ? new Date(b.fecha) : new Date(0);
          const dateCompare = db - da;
          if (dateCompare !== 0) return dateCompare;
          return (b.id_tropa || 0) - (a.id_tropa || 0);
        });

        const totalGeneral = ordenadas.reduce(
          (acc, t) =>
            acc +
            (Number.isFinite(Number(t.total_a_faenar))
              ? Number(t.total_a_faenar)
              : 0),
          0
        );

        if (isMounted) {
          setTropas(ordenadas);
          setTotalFaenar(totalGeneral);
          setLoading(false);
        }
      } catch (err) {
        // Ignorar AbortError
        if (err.name === 'AbortError') {
          console.log('[FaenaPage] Petición cancelada (componente desmontado)');
          return;
        }

        console.error('Error al cargar tropas:', err);
        if (isMounted) {
          setTropas([]);
          setTotalFaenar(0);
          setLoading(false);
        }
      }
    };

    fetchTropasPorPlantaWithCleanup();

    // Cleanup: cancelar peticiones si el componente se desmonta
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [rol, plantaDelUsuario]);

  const handleFaenar = (t) => {
    setRedirigiendoId(t.id_tropa);
    const destino = t.id_faena
      ? `/faena/${t.id_faena}`
      : `/faena/nueva/${t.id_tropa}`;
    navigate(destino);
  };

  const formatDate = (f) => {
    if (!f) return '—';
    try {
      // Evitar problemas de zona horaria
      if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}/.test(f)) {
        const [year, month, day] = f.split('T')[0].split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return date.toLocaleDateString('es-AR');
      }
      return new Date(f).toLocaleDateString('es-AR');
    } catch (e) {
      return '—';
    }
  };

  const parseDateString = (v) => {
    if (!v) return null;
    try {
      // Si viene en formato YYYY-MM-DD (input date), crear fecha local sin hora
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
        const [y, m, d] = v.split('-').map((x) => Number(x));
        return new Date(y, m - 1, d);
      }
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };

  const dateOnly = (d) => {
    if (!d) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  };

  const esTropaVencida = (t) => {
    if (!t.fecha) return false;
    const fechaTropa = new Date(t.fecha);
    const hoy = new Date();
    const diferenciaDias = (hoy - fechaTropa) / (1000 * 60 * 60 * 24);
    return (
      diferenciaDias > 2 &&
      (t.total_a_faenar == null ? false : t.total_a_faenar > 0)
    );
  };

  const plantaLabel = (t) => {
    if (!t) return '—';
    if (t.planta && typeof t.planta === 'object') {
      return t.planta.nombre ?? (t.planta.id ? `Planta #${t.planta.id}` : '—');
    }
    return t.planta_nombre ?? t.planta ?? '—';
  };

  const normalizeText = (value) =>
    String(value ?? '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  const tropasFiltradas = tropas.filter((t) => {
    const query = normalizeText(filtroBusqueda.trim());
    if (!query) return true;

    const searchable = normalizeText(
      [t.n_tropa, t.productor, t.departamento, t.especie].join(' ')
    );
    return searchable.includes(query);
  });

  // Aplicar filtro por rango de fechas (usar solo la parte fecha, inclusivo)
  const tropasFiltradasPorFecha = tropasFiltradas.filter((t) => {
    if (!filterDesde && !filterHasta) return true;
    const tDateRaw = parseDateString(t.fecha);
    if (!tDateRaw) return false;
    const tDate = dateOnly(tDateRaw).getTime();

    const desdeRaw = filterDesde ? parseDateString(filterDesde) : null;
    const hastaRaw = filterHasta ? parseDateString(filterHasta) : null;
    const desdeMs = desdeRaw ? dateOnly(desdeRaw).getTime() : null;
    const hastaMs = hastaRaw ? dateOnly(hastaRaw).getTime() : null;

    // Nuevo comportamiento: `Desde` <= (upper), `Hasta` >= (lower).
    // Si ambos presentes, tomar rango inclusivo entre ambas fechas.
    let low = null;
    let high = null;
    if (filterDesde && !filterHasta) {
      high = desdeMs; // fechas <= Desde
    } else if (!filterDesde && filterHasta) {
      low = hastaMs; // fechas >= Hasta
    } else if (filterDesde && filterHasta) {
      low = Math.min(desdeMs, hastaMs);
      high = Math.max(desdeMs, hastaMs);
    }

    if (low != null && tDate < low) return false;
    if (high != null && tDate > high) return false;
    return true;
  });

  // Aplicar ordenamiento
  const tropasOrdenadas = tropasFiltradasPorFecha.slice().sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortField === 'n_tropa') {
      const na = Number(a.n_tropa) || 0;
      const nb = Number(b.n_tropa) || 0;
      return dir * (na - nb);
    }
    // por fecha (por defecto)
    const da = parseDateString(a.fecha) || new Date(0);
    const db = parseDateString(b.fecha) || new Date(0);
    return dir * (da - db);
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [filtroBusqueda, rowsPerPage, filterDesde, filterHasta, sortField, sortOrder]);

  const TropaCard = ({ t }) => (
    <div
      className={`rounded-xl shadow border p-4 mb-4 ${
        esTropaVencida(t)
          ? 'bg-red-300 border-red-500'
          : 'bg-white border-slate-200'
      }`}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-slate-500">{formatDate(t.fecha)}</span>
        <span className="text-sm font-semibold text-green-800">
          Tropa #{t.n_tropa}
        </span>
      </div>
      <div className="text-sm text-slate-700 space-y-1">
        <p>
          <strong>DTE/DTU:</strong> {t.dte_dtu || '—'}
        </p>
        <p>
          <strong>Planta:</strong> {plantaLabel(t)}
        </p>
        <p>
          <strong>Productor:</strong> {t.productor || '—'}
        </p>
        <p>
          <strong>Departamento:</strong> {t.departamento || '—'}
        </p>
        <p>
          <strong>Titular Faena:</strong> {t.titular_faena || '—'}
        </p>
        <p>
          <strong>Especie:</strong> {t.especie || '—'}
        </p>
        <p>
          <strong>Total a faenar:</strong> {t.total_a_faenar ?? '—'}
        </p>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => handleFaenar(t)}
          disabled={redirigiendoId === t.id_tropa}
          className={`text-sm px-3 py-2 rounded font-semibold transition ${
            redirigiendoId === t.id_tropa
              ? 'bg-green-300 text-white cursor-not-allowed'
              : 'bg-green-700 text-white hover:bg-green-800'
          }`}
        >
          {redirigiendoId === t.id_tropa ? 'Redirigiendo...' : 'Faenar'}
        </button>
      </div>
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(tropasOrdenadas.length / rowsPerPage));
  const paginatedTropas = tropasOrdenadas.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center text-slate-800 drop-shadow mb-6">
          📋 Tropas a Faenar
        </h1>

        <div className="max-w-7xl mx-auto px-1 mb-3 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div className="w-full md:max-w-lg">
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Buscar por tropa, productor, departamento o especie
            </label>
            <input
              type="text"
              value={filtroBusqueda}
              onChange={(e) => setFiltroBusqueda(e.target.value)}
              placeholder="Ej: 852, Carlos Rodríguez, Barranqueras, Bovinos"
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-white transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
            />
          </div>

          <div className="flex flex-col gap-2">
            <SelectField
              label="Filas"
              value={{ value: rowsPerPage, label: String(rowsPerPage) }}
              options={rowsPerPageOptions.map((value) => ({
                value,
                label: String(value),
              }))}
              onChange={(sel) => setRowsPerPage(Number(sel?.value ?? rowsPerPage))}
              className={isMobile ? '' : 'w-28'}
              placeholder="Filas"
            />
          </div>

          <div className="flex gap-3 items-end">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-1">Desde</label>
              <input
                type="date"
                value={filterDesde}
                onChange={(e) => setFilterDesde(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-1">Hasta</label>
              <input
                type="date"
                value={filterHasta}
                onChange={(e) => setFilterHasta(e.target.value)}
                className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => {
                  setFilterDesde('');
                  setFilterHasta('');
                  setFiltroBusqueda('');
                }}
                className="ml-2 px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition"
              >
                Limpiar filtros
              </button>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-600 mb-1">Ordenar</label>
              <div className="flex gap-2">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="fecha">Fecha</option>
                  <option value="n_tropa">N° Tropa</option>
                </select>
                <select
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none"
                >
                  <option value="desc">Descendente</option>
                  <option value="asc">Ascendente</option>
                </select>
              </div>
            </div>
          </div>

          
        </div>

        <div className="max-w-7xl mx-auto px-1 mb-3 flex justify-end">
          <div className="text-right">
            <p className="text-sm font-semibold text-green-700">
              Total general a faenar:{' '}
              <span className="text-green-900">{totalFaenar}</span>
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Registros visibles: {tropasOrdenadas.length}
            </p>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
        </div>
      ) : tropasFiltradas.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">
          <p className="text-lg">No hay tropas disponibles para faenar.</p>
        </div>
      ) : isMobile ? (
        <div className="max-w-2xl mx-auto">
          {paginatedTropas.map((t) => (
            <TropaCard
              key={t.id_tropa ?? `${t.n_tropa}-${Math.random()}`}
              t={t}
            />
          ))}
        </div>
      ) : (
        <div className="flex justify-center px-2 md:px-4">
          <div className="w-full max-w-7xl overflow-x-auto overflow-y-auto max-h-[560px] rounded-xl shadow-xl ring-1 ring-slate-200 bg-white">
            <table className="w-full table-auto text-sm text-center text-slate-700">
              <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">DTE/DTU</th>
                  <th className="px-3 py-2">Planta</th>
                  <th className="px-3 py-2">Nº Tropa</th>
                  <th className="px-3 py-2">Productor</th>
                  <th className="px-3 py-2">Departamento</th>
                  <th className="px-3 py-2">Titular Faena</th>
                  <th className="px-3 py-2">Especie</th>
                  <th className="px-3 py-2">Total a faenar</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTropas.map((t) => (
                  <tr
                    key={t.id_tropa ?? `${t.n_tropa}-${Math.random()}`}
                    className={`border-b last:border-b-0 transition-colors ${
                      esTropaVencida(t)
                        ? 'bg-red-400 hover:bg-red-500'
                        : 'bg-white hover:bg-green-50'
                    }`}
                  >
                    <td className="px-3 py-2 font-medium">
                      {formatDate(t.fecha)}
                    </td>
                    <td className="px-3 py-2">{t.dte_dtu || '—'}</td>
                    <td className="px-3 py-2">{plantaLabel(t)}</td>
                    <td className="px-3 py-2 font-semibold text-green-800">
                      {t.n_tropa || '—'}
                    </td>
                    <td className="px-3 py-2">{t.productor || '—'}</td>
                    <td className="px-3 py-2">{t.departamento || '—'}</td>
                    <td className="px-3 py-2">{t.titular_faena || '—'}</td>
                    <td className="px-3 py-2">{t.especie || '—'}</td>
                    <td className="px-3 py-2 font-semibold">
                      {t.total_a_faenar ?? '—'}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => handleFaenar(t)}
                        disabled={redirigiendoId === t.id_tropa}
                        className={`text-xs px-1 py-0.5 rounded font-semibold transition ${
                          redirigiendoId === t.id_tropa
                            ? 'bg-green-300 text-white cursor-not-allowed'
                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                        }`}
                      >
                        {redirigiendoId === t.id_tropa
                          ? 'Redir...'
                          : 'Faenar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tropasFiltradas.length > rowsPerPage && (
        <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
          <button
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
            className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
              currentPage === 1
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
            }`}
          >
            ← Anterior
          </button>
          {[...Array(Math.min(3, totalPages))].map((_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                  currentPage === page
                    ? 'bg-green-700 text-white shadow'
                    : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                }`}
              >
                {page}
              </button>
            );
          })}
          {totalPages > 3 && (
            <>
              <span className="text-slate-500 text-xs">…</span>
              <button
                onClick={() => setCurrentPage(totalPages)}
                className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                  currentPage === totalPages
                    ? 'bg-green-700 text-white shadow'
                    : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                }`}
              >
                {totalPages}
              </button>
            </>
          )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
              currentPage === totalPages
                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
            }`}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default FaenaPage;

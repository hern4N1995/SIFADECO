import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

/* SelectField compatible con react-select */
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
      paddingLeft: '8px',
      paddingRight: '8px',
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
      padding: '0 3px',
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

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(
    () => window.matchMedia(query).matches
  );
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

export default function FaenasADecomisar() {
  const [faenas, setFaenas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redirigiendoId, setRedirigiendoId] = useState(null);
  const [rol, setRol] = useState(null);
  const [plantaDelUsuario, setPlantaDelUsuario] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 20);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFaena, setPreviewFaena] = useState(null);
  const [previewDetalles, setPreviewDetalles] = useState([]);

  // filtro por día relativo: 'actual' | 'anterior' | 'siguiente' | 'todas'
  const [dayFilterMode, setDayFilterMode] = useState('todas');

  // filtros de fecha y hora
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterTimeStart, setFilterTimeStart] = useState('');
  const [filterTimeEnd, setFilterTimeEnd] = useState('');

  // Obtener rol y planta del usuario desde localStorage
  useEffect(() => {
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
      console.error('[FaenasADecomisar] Error al obtener usuario:', err);
      setRol(1); // Default a admin para mostrar datos
    }
  }, []);

  // fetch inicial
  const fetchFaenas = async () => {
    setLoading(true);
    try {
      console.log('[FaenasADecomisar] Cargando faenas sin decomiso');
      const res = await api.get('/faena/faenas-sin-decomiso?limit=100');
      
      const data = res.data;
      let arr = Array.isArray(data) ? data : Array.isArray(data?.faenas) ? data.faenas : [];
      
      // Filtrar por planta del usuario (si no es admin)
      if (rol !== 1 && plantaDelUsuario) {
        console.log('[FaenasADecomisar] Filtrando por planta del usuario:', plantaDelUsuario);
        arr = arr.filter(
          (f) =>
            String(f.id_planta) === String(plantaDelUsuario)
        );
        console.log('[FaenasADecomisar] Después de filtrar:', arr.length, 'faenas');
      } else if (rol === 1) {
        console.log('[FaenasADecomisar] Admin - mostrando todas las faenas');
      }
      
      const conFaenados = arr.filter((f) => Number(f.total_faenado) > 0);
      const ordenadas = [...conFaenados].sort(
        (a, b) => new Date(b.fecha_faena) - new Date(a.fecha_faena)
      );

      // Normalizar fecha_faena a fecha local y ms para filtros
      const normalizadas = ordenadas.map((f) => {
        const parsed = parseDateString(f.fecha_faena);
        if (parsed) {
          const y = parsed.getFullYear();
          const m = parsed.getMonth();
          const day = parsed.getDate();
          return { ...f, fecha_local: `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, fecha_local_ms: new Date(y, m, day).getTime() };
        }
        return { ...f, fecha_local: null, fecha_local_ms: null };
      });

      setFaenas(normalizadas);
      setCurrentPage(1);
    } catch (err) {
      console.error('[FaenasADecomisar] Error al cargar faenas:', err?.response?.data || err.message);
      setFaenas([]);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rol !== null) {
      fetchFaenas();
    }

    const handleResize = () => {
      setRowsPerPage(window.matchMedia('(max-width: 767px)').matches ? 3 : 6);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rol, plantaDelUsuario]);

  const formatDate = (f) => (f ? new Date(f).toLocaleDateString('es-AR') : '—');

  const parseDateString = (v) => {
    if (!v) return null;
    try {
      // If string starts with YYYY-MM-DD (optionally followed by time),
      // parse as local date to avoid timezone shifts from ISO timestamps
      if (typeof v === 'string') {
        const m = /^\d{4}-\d{2}-\d{2}/.exec(v);
        if (m) {
          const [y, mm, dd] = m[0].split('-').map((x) => Number(x));
          return new Date(y, mm - 1, dd);
        }
      }
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };

  const dateOnlyMs = (d) => {
    if (!d) return null;
    const dt = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return dt.getTime();
  };

  const endOfDayMs = (d) => {
    if (!d) return null;
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999).getTime();
  };

  const timeStringToSeconds = (t) => {
    if (!t) return null;
    // Expect HH:MM or HH:MM:SS
    const parts = String(t).split(':').map((x) => Number(x));
    if (parts.length < 2) return null;
    const hh = parts[0] || 0;
    const mm = parts[1] || 0;
    const ss = parts[2] || 0;
    return hh * 3600 + mm * 60 + ss;
  };

  // Intercambiar fechas si el usuario las pone invertidas.
  // Ejecutar en onBlur para no interferir mientras escribe.
  // No swap: preservamos lo que ingreso el usuario y aceptamos rango invertido.
  // El filtrado construirá un rango inclusivo usando min/max.

  const handleDecomisar = (f) => {
    setRedirigiendoId(f.id_faena);
    navigate(`/decomisos/nuevo/${f.id_faena}`);
  };

  const handlePreview = async (f) => {
    try {
      console.log('[FaenasADecomisar] Cargando detalles de faena:', f.id_faena);
      const res = await api.get(`/tropas/${f.id_tropa}/detalle`);
      console.log('[FaenasADecomisar] Detalles faena:', res.data);
      
      let detalles = res.data;
      if (detalles && typeof detalles === 'object') {
        if (Array.isArray(detalles)) {
          setPreviewDetalles(detalles);
        } else if (Array.isArray(detalles.data)) {
          setPreviewDetalles(detalles.data);
        } else if (Array.isArray(detalles.categorias)) {
          setPreviewDetalles(detalles.categorias);
        } else {
          setPreviewDetalles([]);
        }
      } else if (Array.isArray(detalles)) {
        setPreviewDetalles(detalles);
      }
      
      setPreviewFaena(f);
      setPreviewOpen(true);
    } catch (err) {
      console.error('[FaenasADecomisar] Error al cargar detalles:', err);
      setPreviewDetalles([]);
    }
  };

  // --- fechas únicas (YYYY-MM-DD) descendentes ---
  const uniqueDatesDesc = useMemo(() => {
    const s = new Set();
    for (const f of faenas) {
      if (!f?.fecha_faena) continue;
      const d = parseDateString(f.fecha_faena);
      if (!d) continue;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const da = String(d.getDate()).padStart(2, '0');
      s.add(`${y}-${m}-${da}`);
    }
    return Array.from(s).sort((a, b) => (a < b ? 1 : -1)); // descendente
  }, [faenas]);

  // Mapeo: index 0 = más reciente, index1 = anteúltimo, index2 = ante-anteúltimo
  const mostRecentDate = uniqueDatesDesc.length > 0 ? uniqueDatesDesc[0] : null;
  const previousDate = uniqueDatesDesc.length > 1 ? uniqueDatesDesc[1] : null; // anteúltima
  const nextDate = uniqueDatesDesc.length > 2 ? uniqueDatesDesc[2] : null; // ante-anteúltima

  // seleccionar fecha usada según el modo (null = sin filtro por fecha)
  const selectedDateForFilter = useMemo(() => {
    if (dayFilterMode === 'todas') return null;
    if (dayFilterMode === 'actual') return mostRecentDate;
    if (dayFilterMode === 'anterior') return previousDate;
    if (dayFilterMode === 'siguiente') return nextDate;
    return null;
  }, [dayFilterMode, mostRecentDate, previousDate, nextDate]);

  // filtrar por la fecha seleccionada (si aplica)
  const filteredFaenas = useMemo(() => {
    let result = faenas;

    // Filtro por día relativo
    if (selectedDateForFilter) {
      result = result.filter((f) => {
        if (!f?.fecha_local) return false;
        return f.fecha_local === selectedDateForFilter;
      });
    }

    // Filtro por rango de fechas y horas (usar parsing local y rango inclusivo)
    if (filterDateStart || filterDateEnd || filterTimeStart || filterTimeEnd) {
      const desdeDate = parseDateString(filterDateStart);
      const hastaDate = parseDateString(filterDateEnd);
      const desdeStartMs = desdeDate ? dateOnlyMs(desdeDate) : null;
      const desdeEndMs = desdeDate ? endOfDayMs(desdeDate) : null;
      const hastaStartMs = hastaDate ? dateOnlyMs(hastaDate) : null;
      const hastaEndMs = hastaDate ? endOfDayMs(hastaDate) : null;

      // Nuevo comportamiento:
      // - `Desde` actúa como límite superior (<=). `Hasta` actúa como límite inferior (>=).
      // - Si solo hay `Desde` -> fechas <= Desde.
      // - Si solo hay `Hasta` -> fechas >= Hasta.
      // - Si hay ambos -> rango inclusivo entre las dos fechas (min..max).
      let low = null;
      let high = null;

      if (desdeDate && !hastaDate) {
        high = desdeEndMs; // <= Desde
        low = null;
      } else if (!desdeDate && hastaDate) {
        low = hastaStartMs; // >= Hasta
        high = null;
      } else if (desdeDate && hastaDate) {
        const minDateMs = Math.min(desdeStartMs, hastaStartMs);
        const maxStartMs = Math.max(desdeStartMs, hastaStartMs);
        const maxEndMs = endOfDayMs(new Date(maxStartMs));
        low = minDateMs;
        high = maxEndMs;
      }

      const timeStartSec = timeStringToSeconds(filterTimeStart);
      const timeEndSec = timeStringToSeconds(filterTimeEnd);

      result = result.filter((f) => {
        if (!f?.fecha_local_ms) return false;
        const faenaMs = f.fecha_local_ms;
        const faenaDateMs = f.fecha_local_ms;

        if (low !== null && faenaMs < low) return false;
        if (high !== null && faenaMs > high) return false;

        // Hora filters: only apply when the faena date is equal to the corresponding filter date
        if ((timeStartSec != null || timeEndSec != null) && (desdeStartMs != null || hastaStartMs != null)) {
          const faenaDtFull = parseDateString(f.fecha_faena);
          if (!faenaDtFull) return false;
          if (timeStartSec != null && desdeStartMs != null && faenaDateMs === desdeStartMs) {
            const faenaSec = faenaDtFull.getHours() * 3600 + faenaDtFull.getMinutes() * 60 + faenaDtFull.getSeconds();
            if (faenaSec < timeStartSec) return false;
          }
          if (timeEndSec != null && hastaStartMs != null && faenaDateMs === hastaStartMs) {
            const faenaSec = faenaDtFull.getHours() * 3600 + faenaDtFull.getMinutes() * 60 + faenaDtFull.getSeconds();
            if (faenaSec > timeEndSec) return false;
          }
        }

        return true;
      });
    }

    return result;
  }, [faenas, selectedDateForFilter, filterDateStart, filterDateEnd, filterTimeStart, filterTimeEnd]);

  // paginación calculada
  const totalPages = Math.max(
    1,
    Math.ceil(filteredFaenas.length / rowsPerPage)
  );

  // asegurar currentPage válido cuando cambian totalPages o rowsPerPage
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  // reset página al cambiar filtro o cuando cambian los datos
  useEffect(() => {
    setCurrentPage(1);
  }, [dayFilterMode, selectedDateForFilter, rowsPerPage, faenas.length, filterDateStart, filterDateEnd, filterTimeStart, filterTimeEnd]);

  const paginatedFaenas = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredFaenas.slice(start, start + rowsPerPage);
  }, [filteredFaenas, currentPage, rowsPerPage]);

  // --- paginación: ventana centrada con ellipsis ---
  const getPageButtons = () => {
    const maxButtons = 7;
    if (totalPages <= maxButtons)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = new Set();
    pages.add(1);
    pages.add(totalPages);

    const side = 2;
    let start = Math.max(2, currentPage - side);
    let end = Math.min(totalPages - 1, currentPage + side);

    if (currentPage <= 1 + side) {
      start = 2;
      end = Math.min(totalPages - 1, 2 + side * 2);
    }
    if (currentPage >= totalPages - side) {
      start = Math.max(2, totalPages - (2 + side * 2));
      end = totalPages - 1;
    }

    for (let p = start; p <= end; p++) pages.add(p);

    return Array.from(pages).sort((a, b) => a - b);
  };

  const renderPageButtons = () => {
    const pages = getPageButtons();
    const elems = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const prev = pages[i - 1];
      if (i > 0 && page - prev > 1) {
        elems.push(
          <span key={`ellipsis-${i}`} className="text-slate-500 px-2">
            …
          </span>
        );
      }
      elems.push(
        <button
          key={page}
          onClick={() => setCurrentPage(page)}
          aria-current={currentPage === page ? 'page' : undefined}
          className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
            currentPage === page
              ? 'bg-green-700 text-white shadow'
              : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
          }`}
        >
          {page}
        </button>
      );
    }
    return elems;
  };

  // Helper: manejar toggle con posibilidad de deseleccionar (click en activo -> 'todas')
  const handleToggle = (mode) => {
    if (dayFilterMode === mode) {
      setDayFilterMode('todas');
      return;
    }
    setDayFilterMode(mode);
  };

  /* -------------------------
     Render helpers / styles
     ------------------------- */
  const FaenaCard = ({ f }) => (
    <div
      className="rounded-lg shadow-sm border p-3 mb-3 bg-white border-slate-200"
      style={{
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        whiteSpace: 'normal',
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs text-slate-500">
          {formatDate(f.fecha_faena)}
        </span>
        <span className="text-sm font-semibold text-green-800">
          Faena #{f.id_faena}
        </span>
      </div>
      <div className="text-sm text-slate-700 space-y-1">
        <p className="whitespace-normal break-words">
          <strong>DTE/DTU:</strong> {f.dte_dtu || '—'}
        </p>
        <p className="whitespace-normal break-words">
          <strong>Planta:</strong> {plantaLabel(f)}
        </p>
        <p className="whitespace-normal break-words">
          <strong>Guía Policial:</strong> {f.guia_policial || '—'}
        </p>
        <p className="whitespace-normal break-words">
          <strong>Productor:</strong> {f.productor || '—'}
        </p>
        <p className="whitespace-normal break-words">
          <strong>Departamento:</strong> {f.departamento || '—'}
        </p>
        <p className="whitespace-normal break-words">
          <strong>Titular Faena:</strong> {f.titular_faena || '—'}
        </p>
        <p className="whitespace-normal break-words">
          <strong>Especie:</strong> {f.especie || '—'}
        </p>
        <p className="whitespace-normal break-words">
          <strong>Total faenado:</strong> {f.total_faenado ?? '—'}
        </p>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          onClick={() => handlePreview(f)}
          className="text-sm px-3 py-2 rounded font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
          title="Previsualizar datos"
        >
          Ver
        </button>
        <button
          onClick={() => handleDecomisar(f)}
          disabled={redirigiendoId === f.id_faena}
          className={`text-sm px-3 py-2 rounded font-semibold transition ${
            redirigiendoId === f.id_faena
              ? 'bg-green-300 text-white cursor-not-allowed'
              : 'bg-green-700 text-white hover:bg-green-800'
          }`}
        >
          {redirigiendoId === f.id_faena ? 'Redirigiendo...' : 'Decomisar'}
        </button>
      </div>
    </div>
  );

  const plantaLabel = (f) => {
    if (!f) return '—';
    // Buscar en diferentes estructuras posibles
    if (f.nombre_planta) return f.nombre_planta;
    if (f.planta && typeof f.planta === 'object') {
      return f.planta.nombre ?? (f.planta.id ? `Planta #${f.planta.id}` : '—');
    }
    if (f.planta_nombre) return f.planta_nombre;
    if (f.planta) return f.planta;
    return '—';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-6 box-border pb-24">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 text-center drop-shadow mb-6">
          🩺 Faenas a Decomisar
        </h1>

        {/* Controles: Filtros de Fecha y Hora + Selector de Filas */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="max-w-5xl mx-auto space-y-4">
            {/* Fila 1: Filtro de Fecha */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="filterDateStart" className="block text-xs font-semibold text-slate-700 mb-2">
                  Fecha Inicio
                </label>
                  <input
                    id="filterDateStart"
                    type="date"
                    value={filterDateStart}
                    onChange={(e) => setFilterDateStart(e.target.value)}
                    onInput={(e) => setFilterDateStart(e.target.value)}
                    className="w-full px-2 py-3 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
                  />
              </div>
              <div>
                <label htmlFor="filterDateEnd" className="block text-xs font-semibold text-slate-700 mb-2">
                  Fecha Fin
                </label>
                  <input
                    id="filterDateEnd"
                    type="date"
                    value={filterDateEnd}
                    onChange={(e) => setFilterDateEnd(e.target.value)}
                    onInput={(e) => setFilterDateEnd(e.target.value)}
                    className="w-full px-2 py-3 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
                  />
              </div>
              <div>
                <label htmlFor="filterTimeStart" className="block text-xs font-semibold text-slate-700 mb-2">
                  Hora Inicio
                </label>
                <input
                  id="filterTimeStart"
                  type="time"
                  value={filterTimeStart}
                  onChange={(e) => setFilterTimeStart(e.target.value)}
                  className="w-full px-2 py-3 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
                />
              </div>
              <div>
                <label htmlFor="filterTimeEnd" className="block text-xs font-semibold text-slate-700 mb-2">
                  Hora Fin
                </label>
                <input
                  id="filterTimeEnd"
                  type="time"
                  value={filterTimeEnd}
                  onChange={(e) => setFilterTimeEnd(e.target.value)}
                  className="w-full px-2 py-3 border-2 border-gray-200 rounded-lg text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
                />
              </div>
            </div>

            {/* Fila 2: Filtro por Día Relativo + Selector de Filas */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
              {/* Filtros de Día */}
              <div className="flex items-center gap-4 justify-center flex-wrap">
                <div className="flex items-center gap-2 select-none">
                  <span className="text-sm text-slate-700">Actual</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-pressed={dayFilterMode === 'actual'}
                    onClick={() => handleToggle('actual')}
                    onKeyDown={(e) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      handleToggle('actual')
                    }
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition ml-1 cursor-pointer ${
                      dayFilterMode === 'actual'
                        ? 'bg-green-700'
                        : 'bg-white border border-slate-300'
                    }`}
                    title="Mostrar faenas del día más reciente"
                    style={{ outline: 'none' }}
                  >
                    {dayFilterMode === 'actual' ? (
                      <svg
                        width="12"
                        height="9"
                        viewBox="0 0 12 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ pointerEvents: 'none' }}
                      >
                        <path
                          d="M1 4L4 7L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 select-none ${
                    !previousDate ? 'opacity-50' : ''
                  }`}
                >
                  <span className="text-sm text-slate-700">Anterior</span>
                  <span
                    role="button"
                    tabIndex={previousDate ? 0 : -1}
                    aria-pressed={dayFilterMode === 'anterior'}
                    onClick={() => previousDate && handleToggle('anterior')}
                    onKeyDown={(e) =>
                      previousDate &&
                      (e.key === 'Enter' || e.key === ' ') &&
                      handleToggle('anterior')
                    }
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition ml-1 cursor-pointer ${
                      dayFilterMode === 'anterior'
                        ? 'bg-green-700'
                        : 'bg-white border border-slate-300'
                    }`}
                    title={
                      previousDate
                        ? `Mostrar faenas de ${formatDate(previousDate)}`
                        : 'No hay fecha anterior disponible'
                    }
                    style={{ outline: 'none' }}
                  >
                    {dayFilterMode === 'anterior' ? (
                      <svg
                        width="12"
                        height="9"
                        viewBox="0 0 12 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ pointerEvents: 'none' }}
                      >
                        <path
                          d="M1 4L4 7L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                </div>

                <div
                  className={`flex items-center gap-2 select-none ${
                    !nextDate ? 'opacity-50' : ''
                  }`}
                >
                  <span className="text-sm text-slate-700">Siguiente</span>
                  <span
                    role="button"
                    tabIndex={nextDate ? 0 : -1}
                    aria-pressed={dayFilterMode === 'siguiente'}
                    onClick={() => nextDate && handleToggle('siguiente')}
                    onKeyDown={(e) =>
                      nextDate &&
                      (e.key === 'Enter' || e.key === ' ') &&
                      handleToggle('siguiente')
                    }
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition ml-1 cursor-pointer ${
                      dayFilterMode === 'siguiente'
                        ? 'bg-green-700'
                        : 'bg-white border border-slate-300'
                    }`}
                    title={
                      nextDate
                        ? `Mostrar faenas de ${formatDate(nextDate)}`
                        : 'No hay fecha siguiente disponible'
                    }
                    style={{ outline: 'none' }}
                  >
                    {dayFilterMode === 'siguiente' ? (
                      <svg
                        width="12"
                        height="9"
                        viewBox="0 0 12 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ pointerEvents: 'none' }}
                      >
                        <path
                          d="M1 4L4 7L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                </div>

                <div className="flex items-center gap-2 select-none">
                  <span className="text-sm text-slate-700">Todas</span>
                  <span
                    role="button"
                    tabIndex={0}
                    aria-pressed={dayFilterMode === 'todas'}
                    onClick={() => handleToggle('todas')}
                    onKeyDown={(e) =>
                      (e.key === 'Enter' || e.key === ' ') &&
                      handleToggle('todas')
                    }
                    className={`w-6 h-6 rounded-md flex items-center justify-center transition ml-1 cursor-pointer ${
                      dayFilterMode === 'todas'
                        ? 'bg-green-700'
                        : 'bg-white border border-slate-300'
                    }`}
                    title="Mostrar todas las faenas"
                    style={{ outline: 'none' }}
                  >
                    {dayFilterMode === 'todas' ? (
                      <svg
                        width="12"
                        height="9"
                        viewBox="0 0 12 9"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                        style={{ pointerEvents: 'none' }}
                      >
                        <path
                          d="M1 4L4 7L11 1"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : null}
                  </span>
                </div>
              </div>

              {/* Selector de Filas */}
              <div style={{ minWidth: 0 }} className="col-span-0.75 max-w-[90px]">
                <SelectField
                  label="Filas"
                  value={
                    [3, 6, 10, 15, 20, 50].includes(rowsPerPage)
                      ? { value: rowsPerPage, label: String(rowsPerPage) }
                      : null
                  }
                  options={[3, 6, 10, 15, 20, 50].map((v) => ({
                    value: v,
                    label: String(v),
                  }))}
                  onChange={(sel) =>
                    setRowsPerPage(Number(sel?.value ?? rowsPerPage))
                  }
                  className="w-full"
                  placeholder="Filas"
                />
              </div>
            </div>

            {/* Fila 3: Resumen de Resultados */}
            <div className="flex justify-center pt-4 border-t border-slate-200">
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-500">Resultados</span>
                <div className="text-sm font-semibold text-green-700">
                  {filteredFaenas.length} registro(s)
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        </div>
      ) : paginatedFaenas.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">
          <p className="text-base">No hay faenas con animales faenados.</p>
        </div>
      ) : (
        <>
          {isMobile ? (
            <div
              className="max-w-full mx-auto px-3"
              style={{ boxSizing: 'border-box' }}
            >
              {paginatedFaenas.map((f) => (
                <FaenaCard key={f.id_faena} f={f} />
              ))}
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="overflow-x-auto rounded-xl shadow-xl ring-1 ring-slate-200 max-w-full">
                <table
                  className="w-full text-sm text-center text-slate-700"
                  style={{ tableLayout: 'auto' }}
                >
                  <thead className="bg-green-700 text-white uppercase tracking-wide text-xs">
                    <tr>
                      <th className="px-3 py-2">Fecha</th>
                      <th className="px-3 py-2">DTE/DTU</th>
                      <th className="px-3 py-2">Planta</th>
                      <th className="px-3 py-2">Guía Policial</th>
                      <th className="px-3 py-2">Nº Tropa</th>
                      <th className="px-3 py-2">Productor</th>
                      <th className="px-3 py-2">Departamento</th>
                      <th className="px-3 py-2">Titular Faena</th>
                      <th className="px-3 py-2">Especie</th>
                      <th className="px-3 py-2">Faenados</th>
                      <th className="px-3 py-2">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedFaenas.map((f) => (
                      <tr
                        key={f.id_faena}
                        className="border-b last:border-b-0 bg-white hover:bg-green-50 transition"
                      >
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {formatDate(f.fecha_faena)}
                        </td>
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {f.dte_dtu || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {plantaLabel(f)}
                        </td>
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {f.guia_policial || '—'}
                        </td>
                        <td className="px-3 py-2 font-semibold text-green-800 whitespace-normal break-words">
                          {f.n_tropa || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {f.productor || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {f.departamento || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {f.titular_faena || '—'}
                        </td>
                        <td className="px-3 py-2 whitespace-normal break-words">
                          {f.especie || '—'}
                        </td>
                        <td className="px-3 py-2 font-semibold whitespace-normal break-words">
                          {f.total_faenado ?? '—'}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePreview(f)}
                              className="text-xs px-3 py-1 rounded font-semibold bg-blue-100 text-blue-800 hover:bg-blue-200 transition"
                              title="Previsualizar datos"
                            >
                              Ver
                            </button>
                            <button
                              onClick={() => handleDecomisar(f)}
                              disabled={redirigiendoId === f.id_faena}
                              className={`text-xs px-3 py-1 rounded font-semibold transition ${
                                redirigiendoId === f.id_faena
                                  ? 'bg-green-300 text-white cursor-not-allowed'
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                              }`}
                            >
                              {redirigiendoId === f.id_faena
                                ? 'Redirigiendo...'
                                : 'Decomisar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Paginación profesional */}
          {filteredFaenas.length > 0 && (
            <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                  currentPage === 1
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                }`}
              >
                ← Anterior
              </button>

              {renderPageButtons()}

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                  currentPage === totalPages
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                }`}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Preview */}
      {previewOpen && previewFaena && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">
                📋 Vista Previa - Faena #{previewFaena.id_faena}
              </h2>
              <button
                onClick={() => setPreviewOpen(false)}
                className="text-2xl text-slate-500 hover:text-slate-700 font-bold"
              >
                ✕
              </button>
            </div>

            {/* Información General */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b">
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 font-semibold">N° Tropa</p>
                <p className="text-lg font-bold text-slate-800">{previewFaena.n_tropa}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 font-semibold">Fecha Faena</p>
                <p className="text-lg font-bold text-slate-800">
                  {previewFaena.fecha_faena ? new Date(previewFaena.fecha_faena).toLocaleDateString('es-AR') : '—'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 font-semibold">Especie</p>
                <p className="text-lg font-bold text-slate-800">{previewFaena.especie || '—'}</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-xs text-slate-600 font-semibold">Total Faenado</p>
                <p className="text-lg font-bold text-green-700">{previewFaena.total_faenado || 0}</p>
              </div>
            </div>

            {/* Categorías y Cantidades */}
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">🐄 Categorías y Cantidades</h3>
              
              {previewDetalles.length > 0 ? (
                <div className="space-y-3">
                  {previewDetalles.map((det, idx) => (
                    <div key={idx} className="border-l-4 border-green-500 bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-slate-800">
                            {det.nombre || det.nombre_categoria || det.categoria || `Categoría ${idx + 1}`}
                          </p>
                          {det.especie && (
                            <p className="text-sm text-slate-600">
                              Especie: {det.especie}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-700">
                            {det.cantidad || det.remanente || 0}
                          </p>
                          <p className="text-xs text-slate-600">animales</p>
                        </div>
                      </div>
                      {det.remanente !== undefined && (
                        <div className="mt-2 pt-2 border-t border-green-200 text-sm">
                          <p className="text-slate-700">
                            Remanente: <span className="font-semibold">{det.remanente}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-500 py-8">
                  <p>No hay categorías disponibles</p>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setPreviewOpen(false)}
                className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition"
              >
                Cerrar
              </button>
              <button
                onClick={() => {
                  setPreviewOpen(false);
                  handleDecomisar(previewFaena);
                }}
                className="flex-1 px-4 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition"
              >
                Proceder a Decomisar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

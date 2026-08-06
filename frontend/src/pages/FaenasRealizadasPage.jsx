import React, { useEffect, useMemo, useState } from 'react';
import Select from 'react-select';
import api from '../services/api';

/* SelectField compatible con TropaForm (react-select) */
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

const EDICION_FAENA_VENTANA_HORAS = 48;
const EDICION_FAENA_VENTANA_MS = EDICION_FAENA_VENTANA_HORAS * 60 * 60 * 1000;

export default function FaenasRealizadasPage() {
  const [faenas, setFaenas] = useState([]);
  const [filtro, setFiltro] = useState({ desde: '', hasta: '', n_tropa: '' });
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [plantaDelUsuario, setPlantaDelUsuario] = useState(null);
  const [modalDetalle, setModalDetalle] = useState(null); // { loading, data, error }
  const [modalModificar, setModalModificar] = useState(null); // { loading, saving, data, error }

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const rowsPerPageOptions = [4, 7, 10, 20];
  const sortOptions = [
    { value: 'desc', label: 'Más recientes primero' },
    { value: 'asc', label: 'Más antiguas primero' },
  ];

  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortOrder, setSortOrder] = useState(sortOptions[0]); // objeto {value,label}
  const [sortField, setSortField] = useState('fecha'); // 'fecha' | 'n_tropa'

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mobile = window.matchMedia('(max-width: 767px)').matches;
      setRowsPerPage(mobile ? 4 : 20);
    }
  }, []);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalFaenados, setTotalFaenados] = useState(0);

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
      console.error('[FaenasRealizadasPage] Error al obtener usuario:', err);
      setRol(1); // Default a admin para mostrar datos
    }
  }, []);

  const fetchFaenas = async () => {
    setLoading(true);
    try {
      const params = {};
      const desdeUser = filtro.desde?.trim();
      const hastaUser = filtro.hasta?.trim();
      // Mapear semántica: en UI `desde` actúa como límite superior (<=) y `hasta` como límite inferior (>=).
      // El backend interpreta `desde` como lower bound (>=) y `hasta` como upper bound (<=).
      // Por eso, cuando el usuario provee solo `desde`, lo enviamos como `hasta` al backend.
      if (desdeUser && hastaUser) {
        // Ambos: construir rango inclusivo entre las dos fechas
        const low = desdeUser < hastaUser ? desdeUser : hastaUser;
        const high = desdeUser > hastaUser ? desdeUser : hastaUser;
        params.desde = low;
        params.hasta = high;
      } else if (desdeUser) {
        // UI 'desde' => backend 'hasta' (upper bound)
        params.hasta = desdeUser;
      } else if (hastaUser) {
        // UI 'hasta' => backend 'desde' (lower bound)
        params.desde = hastaUser;
      }
      if (filtro.n_tropa?.trim()) params.n_tropa = filtro.n_tropa;

      console.log('[FaenasRealizadasPage] Cargando con params:', params);
      
      const res = await api.get('/faena/faenas-realizadas', { params });
      console.log('[FaenasRealizadasPage] Respuesta recibida:', res.data);
      
      const data = res.data;
      let arr = Array.isArray(data)
        ? data
        : Array.isArray(data?.faenas)
        ? data.faenas
        : Array.isArray(data?.data)
        ? data.data
        : [];
      
      console.log('[FaenasRealizadasPage] Array procesado:', arr.length, 'faenas');

      // Log para debug: mostrar id_planta de las faenas
      if (arr.length > 0) {
        console.log('[FaenasRealizadasPage] Primeras faenas con id_planta:', arr.slice(0, 3).map(f => ({
          id_faena: f.id_faena,
          n_tropa: f.n_tropa,
          id_planta: f.id_planta,
          fecha: f.fecha_faena
        })));
      }

      // Filtrar por planta del usuario (si no es admin)
      if (rol !== 1 && plantaDelUsuario) {
        console.log('[FaenasRealizadasPage] Filtrando por planta del usuario:', plantaDelUsuario, 'Tipo:', typeof plantaDelUsuario);
        console.log('[FaenasRealizadasPage] Faenas ANTES de filtrar:', arr.length);
        arr = arr.filter((f) => {
          const match = String(f.id_planta) === String(plantaDelUsuario);
          if (!match) {
            console.log('[FaenasRealizadasPage] Faena RECHAZADA:', {
              id_faena: f.id_faena,
              id_planta: f.id_planta,
              plantaDelUsuario: plantaDelUsuario,
              match: match
            });
          }
          return match;
        });
        console.log('[FaenasRealizadasPage] Después de filtrar:', arr.length, 'faenas');
      } else if (rol === 1) {
        console.log('[FaenasRealizadasPage] Admin - mostrando todas las faenas');
      } else {
        console.log('[FaenasRealizadasPage] Warning - Rol no es admin pero no hay plantaDelUsuario. Rol:', rol, 'Planta:', plantaDelUsuario);
      }

      setFaenas(arr);

      const total = arr.reduce((acc, item) => {
        const v = Number(item.total_faenado ?? 0);
        return acc + (Number.isFinite(v) ? v : 0);
      }, 0);
      setTotalFaenados(total);
      setCurrentPage(1);
    } catch (err) {
      console.error('[FaenasRealizadasPage] Error al cargar faenas:', err?.response?.data || err.message);
      setFaenas([]);
      setTotalFaenados(0);
      setCurrentPage(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (rol !== null) {
      fetchFaenas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, rol, plantaDelUsuario]);

  useEffect(() => setCurrentPage(1), [rowsPerPage, sortOrder]);

  // Función para formatear fecha evitando desfase de zona horaria
  const formatDate = (f) => {
    if (!f) return '—';
    try {
      // Si viene como string "YYYY-MM-DD", parsearlo directamente sin New Date (que lo interpreta como UTC)
      if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}/.test(f)) {
        const [year, month, day] = f.split('T')[0].split('-');
        const date = new Date(year, parseInt(month) - 1, day);
        return date.toLocaleDateString('es-AR');
      }
      return new Date(f).toLocaleDateString('es-AR');
    } catch (e) {
      return '—';
    }
  };

  const parseFaenaDate = (f) => {
    if (!f) return null;
    try {
      if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f)) {
        const [year, month, day] = f.split('-').map(Number);
        return new Date(year, month - 1, day);
      }
      const d = new Date(f);
      return Number.isNaN(d.getTime()) ? null : d;
    } catch (e) {
      return null;
    }
  };

  const isEditableWithin48h = (fechaFaena) => {
    const fecha = parseFaenaDate(fechaFaena);
    if (!fecha) return false;
    return Date.now() <= fecha.getTime() + EDICION_FAENA_VENTANA_MS;
  };

  const handleDecomisar = (event, id_faena) => {
    event.preventDefault();
    event.stopPropagation();

    const targetPath = `/decomisos/nuevo/${id_faena}`;
    window.open(targetPath, '_blank', 'noopener,noreferrer');
  };

  const handleVerDetalle = async (id_faena) => {
    setModalDetalle({ loading: true, data: null, error: null });
    try {
      const res = await api.get(`/faena/${id_faena}/detalle`);
      setModalDetalle({ loading: false, data: res.data, error: null });
    } catch (err) {
      setModalDetalle({ loading: false, data: null, error: 'No se pudo cargar el detalle de la faena.' });
    }
  };

  const handleAbrirModificar = async (id_faena) => {
    const faenaSeleccionada = faenas.find(
      (f) => String(f.id_faena) === String(id_faena),
    );
    if (
      faenaSeleccionada &&
      !isEditableWithin48h(faenaSeleccionada.fecha_faena)
    ) {
      setModalModificar({
        loading: false,
        saving: false,
        data: null,
        error:
          'No se puede modificar esta faena porque superó la ventana de 48 horas.',
      });
      return;
    }

    setModalModificar({ loading: true, saving: false, data: null, error: null });
    try {
      const res = await api.get(`/faena/${id_faena}/detalle`);
      // Clonar categorías para edición local y conservar valor original
      const categorias = (res.data.categorias || []).map((c) => ({
        ...c,
        cantidad_original: Number(c.cantidad_faena || 0),
      }));
      setModalModificar({
        loading: false,
        saving: false,
        data: { ...res.data, categorias },
        error: null,
      });
    } catch (err) {
      setModalModificar({ loading: false, saving: false, data: null, error: 'No se pudo cargar los datos para modificar.' });
    }
  };

  const handleGuardarModificacion = async () => {
    if (!modalModificar?.data) return;

    if (!isEditableWithin48h(modalModificar.data.fecha_faena)) {
      setModalModificar((prev) => ({
        ...prev,
        saving: false,
        error:
          'La ventana de edición de 48 horas ya expiró para esta faena.',
      }));
      return;
    }

    setModalModificar((prev) => ({ ...prev, saving: true, error: null }));

    const categoriaExcedida = (modalModificar.data.categorias || []).find((c) =>
      Number(c.cantidad_faena || 0) > Number(c.max_permitido ?? Infinity),
    );
    if (categoriaExcedida) {
      setModalModificar((prev) => ({
        ...prev,
        saving: false,
        error: `La categoría ${categoriaExcedida.categoria} supera el máximo permitido (${categoriaExcedida.max_permitido}).`,
      }));
      return;
    }

    const totalModificado = (modalModificar.data.categorias || []).reduce(
      (acc, c) => acc + Number(c.cantidad_faena || 0),
      0,
    );
    try {
      await api.put(`/faena/${modalModificar.data.id_faena}`, {
        fecha_faena: modalModificar.data.fecha_faena,
        categorias: (modalModificar.data.categorias || []).map((c) => ({
          id_tropa_detalle: c.id_tropa_detalle,
          cantidad_faena: Number(c.cantidad_faena || 0),
        })),
      });

      setFaenas((prev) => {
        const actualizadas = prev.map((f) => {
          if (String(f.id_faena) !== String(modalModificar.data.id_faena)) {
            return f;
          }
          return {
            ...f,
            fecha_faena: modalModificar.data.fecha_faena,
            total_faenado: totalModificado,
          };
        });

        const nuevoTotalFaenados = actualizadas.reduce((acc, item) => {
          const v = Number(item.total_faenado ?? 0);
          return acc + (Number.isFinite(v) ? v : 0);
        }, 0);
        setTotalFaenados(nuevoTotalFaenados);

        return actualizadas;
      });

      setModalModificar(null);
    } catch (err) {
      const msg =
        err?.response?.data?.error || 'No se pudo guardar los cambios en la base de datos.';
      setModalModificar((prev) => ({ ...prev, saving: false, error: msg }));
    }
  };

  const obtenerCambiosCategorias = (categorias = []) => {
    return categorias
      .map((c) => {
        const original = Number(c.cantidad_original || 0);
        const nuevo = Number(c.cantidad_faena || 0);
        return {
          categoria: c.categoria,
          original,
          nuevo,
          diferencia: nuevo - original,
          cambio: nuevo !== original,
        };
      })
      .filter((c) => c.cambio);
  };

  const sortedFaenas = useMemo(() => {
    const copy = Array.isArray(faenas) ? [...faenas] : [];
    copy.sort((a, b) => {
      const sval = sortOrder?.value ?? 'desc';
      const dir = sval === 'desc' ? -1 : 1;
      if (sortField === 'n_tropa') {
        const na = Number(a?.n_tropa) || 0;
        const nb = Number(b?.n_tropa) || 0;
        return dir * (na - nb);
      }
      const da = a?.fecha_faena ? new Date(a.fecha_faena).getTime() : -Infinity;
      const db = b?.fecha_faena ? new Date(b.fecha_faena).getTime() : -Infinity;
      return dir * (da - db);
    });
    return copy;
  }, [faenas, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedFaenas.length / rowsPerPage));
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const paginatedFaenas = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return sortedFaenas.slice(start, start + rowsPerPage);
  }, [sortedFaenas, currentPage, rowsPerPage]);

  const getPageButtons = () => {
    const maxButtons = 7;
    if (totalPages <= maxButtons)
      return Array.from({ length: totalPages }, (_, i) => i + 1);

    const pages = new Set([1, totalPages]);
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
      if (i > 0 && page - prev > 1)
        elems.push(
          <span key={`ellipsis-${i}`} className="text-slate-500 px-2">
            …
          </span>
        );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 py-8 sm:px-6 lg:px-6">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-extrabold text-center text-slate-800 drop-shadow mb-6">
          Faenas Realizadas
        </h1>

        <div className="flex justify-center mb-4">
          <div className="w-full max-w-7xl">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 items-end">
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={filtro.desde}
                  onChange={(e) =>
                    setFiltro((s) => ({ ...s, desde: e.target.value }))
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 appearance-none"
                  style={{ minWidth: 0 }}
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm font-semibold text-slate-700 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filtro.hasta}
                  onChange={(e) =>
                    setFiltro((s) => ({ ...s, hasta: e.target.value }))
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 appearance-none"
                  style={{ minWidth: 0 }}
                />
              </div>

              <div className="flex flex-col max-w-[110px]">
                <label className="text-sm font-semibold text-slate-700 mb-1">
                  Nº Tropa
                </label>
                <input
                  type="text"
                  placeholder="Tropa"
                  value={filtro.n_tropa}
                  onChange={(e) =>
                    setFiltro((s) => ({ ...s, n_tropa: e.target.value }))
                  }
                  className="w-full border-2 border-gray-200 rounded-lg px-2 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
                  style={{ minWidth: 0 }}
                />
              </div>

              <div style={{ minWidth: 0 }} className="col-span-1">
                <SelectField
                  label="Orden"
                  value={sortOrder}
                  options={sortOptions}
                  onChange={(sel) => setSortOrder(sel)}
                  className={isMobile ? '' : 'w-full'}
                  placeholder="Orden"
                />
              </div>

              <div style={{ minWidth: 0 }} className="col-span-1">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-slate-700 mb-1">Ordenar por</label>
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value)}
                    className="w-full rounded-lg border-2 border-gray-200 px-2 py-3 text-sm bg-gray-50 focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none"
                  >
                    <option value="fecha">Fecha</option>
                    <option value="n_tropa">N° Tropa</option>
                  </select>
                </div>
              </div>

              <div style={{ minWidth: 0 }} className="col-span-1">
                <SelectField
                  label="Filas"
                  value={
                    rowsPerPageOptions.find((o) => o === rowsPerPage)
                      ? { value: rowsPerPage, label: String(rowsPerPage) }
                      : null
                  }
                  options={rowsPerPageOptions.map((v) => ({
                    value: v,
                    label: String(v),
                  }))}
                  onChange={(sel) =>
                    setRowsPerPage(Number(sel?.value ?? rowsPerPage))
                  }
                  className={isMobile ? '' : 'w-full'}
                  placeholder="Filas"
                />
              </div>

              <div style={{ minWidth: 0 }} className="col-span-1">
                <div className="flex items-end gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltro({ desde: '', hasta: '', n_tropa: '' })}
                    className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 text-sm hover:bg-slate-200 transition"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-1 mb-3 flex justify-end">
        <div className="text-right">
          <p className="text-sm font-semibold text-green-700">
            Total general faenados:{' '}
            <span className="text-green-900">{totalFaenados}</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">Registros visibles: {sortedFaenas.length}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700"></div>
        </div>
      ) : paginatedFaenas.length === 0 ? (
        <div className="text-center text-slate-500 mt-10">
          <p className="text-lg">No se encontraron faenas.</p>
        </div>
      ) : (
        <>
          <div className="hidden md:block w-full">
            <div
              className="overflow-x-auto rounded-xl shadow-xl ring-1 ring-slate-200 mx-auto max-w-7xl"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <table className="w-full text-xs text-center text-slate-700">
                <thead className="bg-green-700 text-white uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-1.5 py-2">Fecha</th>
                    <th className="px-1.5 py-2">DTE/DTU</th>
                    <th className="px-1.5 py-2">Planta</th>
                    <th className="px-1.5 py-2">Guía</th>
                    <th className="px-1.5 py-2">Nº Tropa</th>
                    <th className="px-1.5 py-2">Productor</th>
                    <th className="px-1.5 py-2">Depto.</th>
                    <th className="px-1.5 py-2">Titular</th>
                    <th className="px-1.5 py-2">Especie</th>
                    <th className="px-0 py-2 text-center">Faenado</th>
                    <th className="px-0.5 py-2">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedFaenas.map((f) => (
                    <tr
                      key={f.id_faena}
                      className="border-b last:border-b-0 transition-colors bg-white hover:bg-green-50"
                    >
                      <td className="px-1.5 py-2 text-[12px]">
                        {formatDate(f.fecha_faena)}
                      </td>
                      <td className="px-1.5 py-2 text-[12px]">{f.dte_dtu || '—'}</td>
                      <td className="px-1.5 py-2 text-[12px]">{plantaLabel(f)}</td>
                      <td className="px-1.5 py-2 text-[12px] truncate">{f.guia_policial || '—'}</td>
                      <td className="px-1.5 py-2 text-[12px] font-semibold text-green-800">
                        {f.n_tropa}
                      </td>
                      <td className="px-1.5 py-2 text-[12px] max-w-[80px] truncate">{f.productor}</td>
                      <td className="px-1.5 py-2 text-[12px] max-w-[60px] truncate">{f.departamento}</td>
                      <td className="px-1.5 py-2 text-[12px] max-w-[80px] truncate">{f.titular_faena}</td>
                      <td className="px-1.5 py-2 text-[12px]">{f.especie}</td>
                      <td className="px-0 py-2 text-[12px] font-bold text-center whitespace-nowrap">{f.total_faenado}</td>
                      <td className="px-0 py-2">
                        <div className="flex gap-0.5 justify-center">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVerDetalle(f.id_faena); }}
                            className="text-xs px-2 py-1 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition whitespace-nowrap"
                          >
                            Ver
                          </button>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAbrirModificar(f.id_faena); }}
                            disabled={!isEditableWithin48h(f.fecha_faena)}
                            title={
                              isEditableWithin48h(f.fecha_faena)
                                ? 'Modificar (habilitado dentro de las primeras 48 horas)'
                                : 'Edición no permitida: pasaron más de 48 horas desde la faena'
                            }
                            className={`text-xs px-2 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                              isEditableWithin48h(f.fecha_faena)
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            }`}
                          >
                            Modificar
                          </button>
                          <button
                            onClick={(e) => handleDecomisar(e, f.id_faena)}
                            className="text-xs px-2 py-1 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-semibold transition whitespace-nowrap"
                          >
                            Decomisar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden grid gap-4 mt-6">
            {paginatedFaenas.map((f) => (
              <div
                key={f.id_faena}
                className="bg-white rounded-2xl shadow-lg p-4 ring-1 ring-slate-200 transition-transform hover:scale-[1.01]"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-bold text-green-800">
                    Tropa {f.n_tropa}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(f.fecha_faena)}
                  </span>
                </div>
                <div className="text-sm text-slate-700 space-y-1">
                  <div>
                    <span className="font-medium">DTE/DTU:</span>{' '}
                    {f.dte_dtu || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Planta:</span>{' '}
                    {plantaLabel(f)}
                  </div>
                  <div>
                    <span className="font-medium">Guía:</span>{' '}
                    {f.guia_policial || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Productor:</span>{' '}
                    {f.productor || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Departamento:</span>{' '}
                    {f.departamento || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Titular:</span>{' '}
                    {f.titular_faena || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Especie:</span>{' '}
                    {f.especie || '—'}
                  </div>
                  <div>
                    <span className="font-medium">Faenado:</span>{' '}
                    {f.total_faenado ?? '—'}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => handleVerDetalle(f.id_faena)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 font-semibold transition"
                  >
                    Ver
                  </button>
                  <button
                    onClick={() => handleAbrirModificar(f.id_faena)}
                    disabled={!isEditableWithin48h(f.fecha_faena)}
                    title={
                      isEditableWithin48h(f.fecha_faena)
                        ? 'Modificar (habilitado dentro de las primeras 48 horas)'
                        : 'Edición no permitida: pasaron más de 48 horas desde la faena'
                    }
                    className={`text-sm px-3 py-1.5 rounded-lg font-semibold transition ${
                      isEditableWithin48h(f.fecha_faena)
                        ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                        : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    Modificar
                  </button>
                  <button
                    onClick={(e) => handleDecomisar(e, f.id_faena)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 font-semibold transition"
                  >
                    Decomisar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {sortedFaenas.length > 0 && (
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
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
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

      {/* Modal detalle de faena */}
      {modalDetalle && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setModalDetalle(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {modalDetalle.loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
              </div>
            ) : modalDetalle.error ? (
              <div className="text-center text-red-600">
                <p className="font-semibold">{modalDetalle.error}</p>
                <button
                  onClick={() => setModalDetalle(null)}
                  className="mt-4 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    Detalle de Faena
                  </h2>
                  <button
                    onClick={() => setModalDetalle(null)}
                    className="text-slate-400 hover:text-slate-700 text-2xl leading-none font-bold"
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                </div>

                {/* Cabecera */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-5">
                  <div>
                    <span className="font-semibold text-slate-600">Fecha:</span>{' '}
                    <span className="text-slate-800">{formatDate(modalDetalle.data.fecha_faena)}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">N° Tropa:</span>{' '}
                    <span className="text-green-800 font-bold">{modalDetalle.data.n_tropa}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">DTE/DTU:</span>{' '}
                    <span className="text-slate-800">{modalDetalle.data.dte_dtu || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Guía Policial:</span>{' '}
                    <span className="text-slate-800">{modalDetalle.data.guia_policial || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Planta:</span>{' '}
                    <span className="text-slate-800">{modalDetalle.data.nombre_planta || '—'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Especie:</span>{' '}
                    <span className="text-slate-800">{modalDetalle.data.especie || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-600">Productor:</span>{' '}
                    <span className="text-slate-800">{modalDetalle.data.productor || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-600">Titular:</span>{' '}
                    <span className="text-slate-800">{modalDetalle.data.titular_faena || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="font-semibold text-slate-600">Departamento:</span>{' '}
                    <span className="text-slate-800">{modalDetalle.data.departamento || '—'}</span>
                  </div>
                </div>

                {/* Categorías */}
                <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Categorías faenadas
                </h3>
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-green-700 text-white">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Especie</th>
                        <th className="px-4 py-2 font-semibold">Categoría</th>
                        <th className="px-4 py-2 font-semibold text-right">Cantidad</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(modalDetalle.data.categorias || []).map((cat, i) => (
                        <tr
                          key={i}
                          className="border-t border-slate-100 even:bg-slate-50"
                        >
                          <td className="px-4 py-2 text-slate-700">{cat.especie}</td>
                          <td className="px-4 py-2 text-slate-700">{cat.categoria}</td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-800">
                            {cat.cantidad_faena}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-green-50 border-t-2 border-green-200">
                        <td colSpan="2" className="px-4 py-2 font-bold text-green-800">Total</td>
                        <td className="px-4 py-2 text-right font-bold text-green-800">
                          {modalDetalle.data.total_faenado}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    onClick={() => setModalDetalle(null)}
                    className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold transition"
                  >
                    Cerrar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal modificar faena */}
      {modalModificar && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => !modalModificar.saving && setModalModificar(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {modalModificar.loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-600" />
              </div>
            ) : modalModificar.error && !modalModificar.data ? (
              <div className="text-center text-red-600">
                <p className="font-semibold">{modalModificar.error}</p>
                <button
                  onClick={() => setModalModificar(null)}
                  className="mt-4 px-4 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold"
                >
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    Modificar Faena
                  </h2>
                  <button
                    onClick={() => !modalModificar.saving && setModalModificar(null)}
                    className="text-slate-400 hover:text-slate-700 text-2xl leading-none font-bold"
                    aria-label="Cerrar"
                    disabled={modalModificar.saving}
                  >
                    ×
                  </button>
                </div>

                {/* Info cabecera */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4 bg-slate-50 rounded-xl p-3">
                  <div>
                    <span className="font-semibold text-slate-600">N° Tropa:</span>{' '}
                    <span className="font-bold text-green-800">{modalModificar.data.n_tropa}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-600">Especie:</span>{' '}
                    <span className="text-slate-800">{modalModificar.data.especie || '—'}</span>
                  </div>
                  <div className="col-span-2">
                    <label className="font-semibold text-slate-600 block mb-1">Fecha</label>
                    <input
                      type="date"
                      value={
                        modalModificar.data.fecha_faena
                          ? (() => {
                              const d = parseFaenaDate(modalModificar.data.fecha_faena);
                              return d ? d.toISOString().split('T')[0] : '';
                            })()
                          : ''
                      }
                      onChange={(e) =>
                        setModalModificar((prev) => ({
                          ...prev,
                          data: { ...prev.data, fecha_faena: e.target.value },
                        }))
                      }
                      disabled={modalModificar.saving}
                      className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:border-green-500 focus:ring-4 focus:ring-green-100 outline-none"
                    />
                  </div>
                </div>

                {/* Edición de categorías */}
                <h3 className="text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">
                  Cantidades faenadas
                </h3>
                <div className="space-y-2 mb-4">
                  {(modalModificar.data.categorias || []).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between gap-3 bg-slate-50 rounded-lg px-3 py-2">
                      <div className="flex-1">
                        <span className="text-sm text-slate-700">
                          <span className="font-semibold text-slate-800">{cat.especie}</span>
                          {' - '}
                          {cat.categoria}
                        </span>
                        <p className="text-xs text-slate-500 mt-1">
                          Max permitido: {cat.max_permitido ?? '—'}
                        </p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        max={cat.max_permitido ?? undefined}
                        value={cat.cantidad_faena}
                        onChange={(e) => {
                          const raw = Number(e.target.value);
                          const max = Number(cat.max_permitido ?? Infinity);
                          const normalizado = Number.isFinite(raw) ? raw : 0;
                          const val = Math.min(max, Math.max(0, normalizado));
                          setModalModificar((prev) => {
                            const categorias = prev.data.categorias.map((c, idx) =>
                              idx === i ? { ...c, cantidad_faena: val } : c
                            );
                            return { ...prev, data: { ...prev.data, categorias } };
                          });
                        }}
                        className="w-24 border-2 border-gray-200 rounded-lg px-3 py-1.5 text-sm text-right font-semibold focus:border-yellow-500 focus:ring-2 focus:ring-yellow-100 focus:outline-none"
                        disabled={modalModificar.saving}
                      />
                    </div>
                  ))}
                </div>

                {/* Total calculado */}
                <div className="flex justify-between items-center bg-green-50 rounded-lg px-4 py-2 mb-4">
                  <span className="font-bold text-green-800 text-sm">Total faenado</span>
                  <span className="font-bold text-green-800 text-sm">
                    {(modalModificar.data.categorias || []).reduce(
                      (acc, c) => acc + Number(c.cantidad_faena || 0), 0
                    )}
                  </span>
                </div>

                {/* Resumen de cambios para control */}
                {(() => {
                  const cambios = obtenerCambiosCategorias(modalModificar.data.categorias || []);
                  const variacionTotal = cambios.reduce((acc, c) => acc + c.diferencia, 0);
                  return (
                    <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <h4 className="text-sm font-bold text-slate-700 mb-2">
                        Resumen de cambios
                      </h4>
                      {cambios.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          No hay cambios pendientes.
                        </p>
                      ) : (
                        <>
                          <div className="space-y-1">
                            {cambios.map((cambio, idx) => (
                              <div
                                key={`${cambio.categoria}-${idx}`}
                                className="flex items-center justify-between text-sm"
                              >
                                <span className="text-slate-700">{cambio.categoria}</span>
                                <span className="font-semibold text-slate-800">
                                  {cambio.original} {'->'} {cambio.nuevo} ({cambio.diferencia >= 0 ? '+' : ''}{cambio.diferencia})
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                            <span className="font-semibold text-slate-700">Variación total</span>
                            <span className="font-bold text-slate-800">
                              {variacionTotal >= 0 ? '+' : ''}{variacionTotal}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                {modalModificar.error && (
                  <p className="text-sm text-red-600 mb-3 font-semibold">{modalModificar.error}</p>
                )}

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setModalModificar(null)}
                    disabled={modalModificar.saving}
                    className="px-5 py-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 font-semibold transition disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleGuardarModificacion}
                    disabled={modalModificar.saving}
                    className="px-5 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 font-semibold transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {modalModificar.saving ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Guardando...
                      </>
                    ) : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

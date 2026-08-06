import React, { useEffect, useRef, useState, useMemo } from 'react';
import Select from 'react-select';
import api from 'src/services/api';

/* ------------------------------------------------------------------ */
/*  SelectField estilizado                                            */
/* ------------------------------------------------------------------ */
function SelectField({ label, value, onChange, options, placeholder }) {
  const [isFocusing, setIsFocusing] = useState(false);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: '48px',
      minHeight: '48px',
      paddingLeft: '16px',
      paddingRight: '16px',
      backgroundColor: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: isFocusing
        ? '0 0 0 1px #000'
        : state.isFocused
        ? '0 0 0 4px #d1fae5'
        : 'none',
      transition: 'all 100ms ease',
      '&:hover': {
        borderColor: '#6ee7b7',
      },
      '&:focus-within': {
        borderColor: '#10b981',
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
      top: 'initial',
      transform: 'none',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
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
        onFocus={() => {
          setIsFocusing(true);
          setTimeout(() => setIsFocusing(false), 50);
        }}
      />
    </div>
  );
}

const AfeccionesAdmin = () => {
  const [afecciones, setAfecciones] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [descripcion, setDescripcion] = useState('');
  const [idEspecie, setIdEspecie] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const descripcionRef = useRef(null);

  // Modal edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayload, setEditingPayload] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = window.innerWidth < 768 ? 2 : 4;

  // Modal de resultado después de guardar
  const [modalResultado, setModalResultado] = useState({ abierto: false, tipo: '', mensaje: '' });

  // Filtro
  const [filtro, setFiltro] = useState('');

  const getTokenHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Verificar si una afección ya existe (para evitar duplicados)
  // Nota: Esta función ya no se usa, la validación se hace directamente contra datos frescos del servidor
  const afeccionExiste = (descripcion, idEspecie, excludeId = null) => {
    const idEspecieNum = parseInt(idEspecie, 10);
    const descLower = descripcion.toLowerCase().trim();
    
    return afecciones.some((a) => {
      const aId = a.id_afeccion ?? a.id;
      if (excludeId && aId === excludeId) return false;
      
      let aEspecieId = a.id_especie;
      if (!aEspecieId) aEspecieId = a.id_especie_id;
      if (!aEspecieId) aEspecieId = a.especie_id;
      
      aEspecieId = parseInt(aEspecieId ?? 0, 10);
      const aDesc = (a.descripcion ?? '').toLowerCase().trim();
      
      return aDesc === descLower && aEspecieId === idEspecieNum;
    });
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      await Promise.all([fetchAfecciones(), fetchEspecies()]);
      if (mounted) setLoading(false);
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const fetchAfecciones = async () => {
    try {
      const res = await api.get('/afecciones', { timeout: 10000 });
      const data = res?.data ?? [];
      setAfecciones(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching afecciones:', err);
      setError('No se pudieron cargar las afecciones');
    }
  };

  const fetchEspecies = async () => {
    try {
      const res = await api.get('/especies', { timeout: 10000 });
      const data = res?.data ?? [];
      setEspecies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching especies:', err);
      setError('No se pudieron cargar las especies');
    }
  };

  useEffect(() => {
    if (idEspecie && !editandoId) {
      descripcionRef.current?.focus();
    }
  }, [idEspecie, editandoId]);

  const iniciarEdicion = (a) => {
    const id = a.id_afeccion ?? a.id;
    // Buscar el id_especie comparando por nombre
    const nombreEspecie = a.especie ?? a.nombre_especie ?? '';
    const especieEncontrada = especies.find(
      (e) => (e.descripcion ?? e.nombre ?? '').toLowerCase() === nombreEspecie.toLowerCase()
    );
    const especieId = a.id_especie ?? a.id_especie_id ?? especieEncontrada?.id_especie ?? especieEncontrada?.id;
    
    setEditingPayload({
      id,
      descripcion: a.descripcion || '',
      id_especie: String(especieId || ''),
      especie: nombreEspecie,
    });
    setEditModalOpen(true);
  };

  const cancelarEdicion = () => {
    setDescripcion('');
    setIdEspecie('');
    setEditandoId(null);
  };

  const guardarEdicion = async () => {
    if (!editingPayload?.id_especie || !editingPayload?.descripcion.trim()) return;

    const descripcionNorm = normalizarTexto(editingPayload.descripcion);
    const idEspecieNum = parseInt(editingPayload.id_especie, 10);

    // Obtener el nombre de la especie seleccionada
    const especieSeleccionada = especies.find(
      (e) => (e.id_especie ?? e.id) === idEspecieNum
    );
    const nombreEspecieSeleccionada = especieSeleccionada?.descripcion ?? especieSeleccionada?.nombre ?? '';

    try {
      // Traer afecciones frescas del backend
      const resAfecciones = await api.get('/afecciones', { timeout: 10000 });
      const afeccionesActuales = Array.isArray(resAfecciones?.data) ? resAfecciones.data : [];

      console.log('Validando edición:', { descripcion: descripcionNorm, especie: nombreEspecieSeleccionada });

      // Validar que no sea un duplicado (excluyendo el actual)
      const existe = afeccionesActuales.some((a) => {
        const aId = a.id_afeccion ?? a.id;
        if (aId === editingPayload.id) return false; // Excluir el mismo registro

        const aDescNorm = normalizarTexto(a.descripcion);
        const aEspecieNorm = normalizarTexto(a.especie || '');
        const especieNorm = normalizarTexto(nombreEspecieSeleccionada);

        console.log('Comparando en edición:', { aDescNorm, descripcionNorm, aEspecieNorm, especieNorm });

        return aDescNorm === descripcionNorm && aEspecieNorm === especieNorm;
      });

      if (existe) {
        setModalResultado({
          abierto: true,
          tipo: 'error',
          mensaje: '❌ Esta afección ya existe para esta especie',
        });
        return;
      }

      // Encontrar la afección original
      const afeccionOriginal = afeccionesActuales.find(
        (a) => (a.id_afeccion ?? a.id) === editingPayload.id
      );

      const huboChanges =
        normalizarTexto(afeccionOriginal?.descripcion) !== descripcionNorm ||
        normalizarTexto(afeccionOriginal?.especie || '') !== normalizarTexto(nombreEspecieSeleccionada);

      const payload = {
        descripcion: descripcionNorm.charAt(0).toUpperCase() + descripcionNorm.slice(1),
        id_especie: idEspecieNum,
      };

      const res = await api.put(`/afecciones/${editingPayload.id}`, payload, {
        timeout: 10000,
      });
      if (!(res && res.status >= 200 && res.status < 300))
        throw new Error('Error al guardar');

      // Actualizar state
      await fetchAfecciones();

      setModalResultado({
        abierto: true,
        tipo: 'exito',
        mensaje: huboChanges
          ? '✅ Afección actualizada con éxito'
          : '⚠️ No hubo cambios en la afección',
      });

      setTimeout(() => {
        setEditModalOpen(false);
        setEditingPayload(null);
      }, 1500);
    } catch (err) {
      console.error('Error saving afección:', err);
      setModalResultado({
        abierto: true,
        tipo: 'error',
        mensaje: '❌ No se pudo guardar la afección',
      });
    }
  };

  // Normalizar string: remove acentos y espacios extras
  const normalizarTexto = (texto) => {
    return (texto ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFD') // Descomponer acentos
      .replace(/[\u0300-\u036f]/g, ''); // Remover marcas diacríticas
  };

  const handleGuardar = async () => {
    if (!idEspecie || !descripcion.trim()) return;

    const descripcionNorm = normalizarTexto(descripcion);
    const idEspecieNum = parseInt(idEspecie, 10);
    
    // Obtener el nombre de la especie seleccionada
    const especieSeleccionada = especies.find(
      (e) => (e.id_especie ?? e.id) === idEspecieNum
    );
    const nombreEspecieSeleccionada = especieSeleccionada?.descripcion ?? especieSeleccionada?.nombre ?? '';

    try {
      // Primero traer afecciones frescas del backend
      const resAfecciones = await api.get('/afecciones', { timeout: 10000 });
      const afeccionesActuales = Array.isArray(resAfecciones?.data) ? resAfecciones.data : [];
      
      console.log('=== VALIDANDO DUPLICADO ===');
      console.log('Buscando:', { 
        descripcion: descripcionNorm, 
        especie: nombreEspecieSeleccionada 
      });

      // Validar duplicado COMPARANDO POR NOMBRE DE ESPECIE
      const existe = afeccionesActuales.some((a) => {
        const aDescNorm = normalizarTexto(a.descripcion);
        const aEspecieNorm = normalizarTexto(a.especie || '');
        const especieNorm = normalizarTexto(nombreEspecieSeleccionada);
        
        const esIgual = aDescNorm === descripcionNorm && aEspecieNorm === especieNorm;
        
        console.log('Comparando:', { 
          aDesc: a.descripcion,
          aDescNorm,
          descripcionNorm,
          aEspecie: a.especie,
          aEspecieNorm,
          especieNorm,
          match: esIgual
        });
        
        return esIgual;
      });

      if (existe) {
        console.log('❌ Duplicado detectado');
        setModalResultado({
          abierto: true,
          tipo: 'error',
          mensaje: '❌ Esta afección ya existe para esta especie. No se pueden guardar duplicados',
        });
        return;
      }

      console.log('✅ No es duplicado, guardando...');

      const payload = {
        descripcion: descripcionNorm.charAt(0).toUpperCase() + descripcionNorm.slice(1),
        id_especie: idEspecieNum,
      };

      const res = await api.post('/afecciones', payload, { timeout: 10000 });
      if (!(res && res.status >= 200 && res.status < 300))
        throw new Error('Error al guardar');

      // Actualizar state con datos frescos
      await fetchAfecciones();
      
      setDescripcion('');
      setIdEspecie('');
      
      setModalResultado({
        abierto: true,
        tipo: 'exito',
        mensaje: '✅ Afección registrada con éxito',
      });
    } catch (err) {
      console.error('Error saving afección:', err);
      setModalResultado({
        abierto: true,
        tipo: 'error',
        mensaje: '❌ No se pudo guardar la afección',
      });
    }
  };

  const handleEliminar = async (id) => {
    setConfirmDelete({ open: true, id });
  };

  const performDeleteAfeccion = async (id) => {
    try {
      const res = await api.delete(`/afecciones/${id}`, { timeout: 10000 });
      if (!(res && res.status >= 200 && res.status < 300)) throw new Error('Error al eliminar');
      setAfecciones((prev) => prev.filter((a) => (a.id_afeccion ?? a.id) !== id));
      setModalResultado({
        abierto: true,
        tipo: 'exito',
        mensaje: '✅ Afección eliminada con éxito',
      });
    } catch (err) {
      console.error('Error deleting afección:', err);
      setModalResultado({
        abierto: true,
        tipo: 'error',
        mensaje: '❌ No se pudo eliminar la afección',
      });
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const visibles = useMemo(() => {
    // Filtrar por descripción y especie
    const filtroNorm = normalizarTexto(filtro);
    const filtradas = afecciones.filter((a) => {
      const descNorm = normalizarTexto(a.descripcion);
      const especieNorm = normalizarTexto(a.especie ?? a.nombre_especie ?? '');
      
      return descNorm.includes(filtroNorm) || especieNorm.includes(filtroNorm);
    });
    
    // Luego aplicar paginación
    return filtradas.slice(
      (paginaActual - 1) * itemsPorPagina,
      paginaActual * itemsPorPagina
    );
  }, [afecciones, paginaActual, filtro]);

  const totalPaginas = useMemo(() => {
    const filtroNorm = normalizarTexto(filtro);
    const filtradas = afecciones.filter((a) => {
      const descNorm = normalizarTexto(a.descripcion);
      const especieNorm = normalizarTexto(a.especie ?? a.nombre_especie ?? '');
      
      return descNorm.includes(filtroNorm) || especieNorm.includes(filtroNorm);
    });
    
    return Math.ceil(filtradas.length / itemsPorPagina);
  }, [afecciones, filtro]);
  const irPagina = (n) =>
    setPaginaActual(Math.min(Math.max(n, 1), totalPaginas));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:py-8 py-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center drop-shadow mb-8">
          🧬 Administración de Afecciones
        </h1>

        {/* Formulario institucional con sombra visible */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 space-y-4 mt-6 relative z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            Registrar nueva afección
          </h2>

          <SelectField
            label="1. Seleccioná la especie"
            value={
              especies.find((e) => String(e.id_especie ?? e.id) === idEspecie)
                ? {
                    value: idEspecie,
                    label:
                      especies.find(
                        (e) => String(e.id_especie ?? e.id) === idEspecie
                      )?.descripcion ?? 'Especie',
                  }
                : null
            }
            onChange={(selected) => setIdEspecie(selected?.value || '')}
            options={especies.map((e) => ({
              value: String(e.id_especie ?? e.id),
              label: e.descripcion ?? e.nombre ?? '',
            }))}
            placeholder="Seleccionar especie"
          />

          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700 text-sm">
              2. Ingresá el nombre de la afección
            </label>
            <input
              ref={descripcionRef}
              type="text"
              placeholder={
                idEspecie
                  ? 'Descripción de la afección'
                  : 'Seleccioná primero una especie'
              }
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={!idEspecie}
              className={`w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 ${
                !idEspecie ? 'bg-gray-100 cursor-not-allowed' : 'bg-gray-50'
              }`}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={handleGuardar}
              disabled={!idEspecie || !descripcion.trim()}
              className={`px-6 py-3 rounded-lg font-semibold transition shadow ${
                idEspecie && descripcion.trim()
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Guardar Afección
            </button>

            {editandoId && (
              <button
                onClick={cancelarEdicion}
                className="px-6 py-3 bg-slate-500 text-white rounded-lg font-semibold hover:bg-slate-600 transition shadow"
              >
                Cancelar
              </button>
            )}
          </div>

          {mensaje && (
            <div className="text-sm text-green-700 font-medium">
              {mensaje}
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Edit modal overlay */}
        {editModalOpen && editingPayload && (() => {
          // Encontrar la especie seleccionada comparando números
          const especieSeleccionada = editingPayload.id_especie
            ? especies.find((e) => {
                const eId = parseInt(e.id_especie ?? e.id ?? 0, 10);
                const pId = parseInt(editingPayload.id_especie ?? 0, 10);
                return eId === pId && eId !== 0;
              })
            : null;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)} />
              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Afección</h3>
                <div className="space-y-4">
                  <SelectField
                    label="Especie"
                    value={especieSeleccionada ? {
                      value: String(especieSeleccionada.id_especie ?? especieSeleccionada.id),
                      label: especieSeleccionada.descripcion ?? especieSeleccionada.nombre ?? 'Especie'
                    } : null}
                    onChange={(selected) => setEditingPayload((p) => ({ ...p, id_especie: selected?.value || '' }))}
                    options={especies.map((e) => ({
                      value: String(e.id_especie ?? e.id),
                      label: e.descripcion ?? e.nombre ?? '',
                    }))}
                    placeholder="Seleccionar especie"
                  />
                <div className="flex flex-col">
                  <label className="mb-2 font-semibold text-gray-700 text-sm">Descripción</label>
                  <input
                    type="text"
                    value={editingPayload.descripcion}
                    onChange={(e) => setEditingPayload((p) => ({ ...p, descripcion: e.target.value }))}
                    placeholder="Descripción de la afección"
                    className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={guardarEdicion} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Guardar</button>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Delete confirmation modal */}
        {confirmDelete.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete({ open: false, id: null })} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirmar eliminación</h3>
              <div className="text-sm text-gray-700 mb-6">¿Estás seguro que querés eliminar esta afección?</div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDelete({ open: false, id: null })} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={() => performDeleteAfeccion(confirmDelete.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">Eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de resultado después de guardar */}
        {modalResultado.abierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setModalResultado({ abierto: false, tipo: '', mensaje: '' })}
            />
            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm p-8 z-10 animate-in">
              <div
                className={`text-center space-y-4 ${
                  modalResultado.tipo === 'exito'
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                <div className="text-5xl">
                  {modalResultado.tipo === 'exito' ? '✅' : '❌'}
                </div>
                <p className="text-lg font-semibold text-gray-800">
                  {modalResultado.mensaje}
                </p>
              </div>
              <button
                onClick={() =>
                  setModalResultado({ abierto: false, tipo: '', mensaje: '' })
                }
                className="w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
              >
                Aceptar
              </button>
            </div>
          </div>
        )}

        {/* Filtro de búsqueda */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700 text-sm">
              🔍 Filtrar por Afección o Especie
            </label>
            <input
              type="text"
              placeholder="Buscar por nombre de afección o especie..."
              value={filtro}
              onChange={(e) => {
                setFiltro(e.target.value);
                setPaginaActual(1);
              }}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
            />
          </div>
        </div>

        {/* Tarjetas responsivas en móvil */}
        <div className="sm:hidden space-y-4">
          {visibles.map((a) => {
            const id = a.id_afeccion ?? a.id;
            return (
              <div
                key={id}
                className="bg-white p-4 rounded-xl shadow border border-gray-200"
              >
                <div className="space-y-1 text-sm text-gray-700">
                  <p>
                    <span className="font-semibold text-green-700">
                      {a.descripcion}
                    </span>
                  </p>
                  <p>
                    Especie:{' '}
                    <span className="font-medium text-gray-800">
                      {a.especie ?? a.nombre_especie ?? ''}
                    </span>
                  </p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => iniciarEdicion(a)}
                    className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(id)}
                    className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabla en desktop */}
        <div className="hidden sm:block overflow-x-auto rounded-xl shadow-xl ring-1 ring-gray-200">
          <table className="min-w-full text-sm text-gray-700">
            <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">
                  Afección
                </th>
                <th className="px-4 py-3 text-left font-semibold">Especie</th>
                <th className="px-4 py-3 text-center font-semibold">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visibles.map((a) => {
                const id = a.id_afeccion ?? a.id;
                return (
                  <tr key={id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">{a.descripcion}</td>
                    <td className="px-4 py-3">
                      {a.especie ?? a.nombre_especie ?? ''}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => iniciarEdicion(a)}
                          className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(id)}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación externa */}
        {totalPaginas > 1 && (
          <div className="mt-[-4px] flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={() => irPagina(paginaActual - 1)}
              disabled={paginaActual === 1}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                paginaActual === 1
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
              }`}
            >
              ← Anterior
            </button>

            {[...Array(Math.min(3, totalPaginas))].map((_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => irPagina(page)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                    paginaActual === page
                      ? 'bg-green-700 text-white shadow'
                      : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            {totalPaginas > 3 && (
              <>
                <span className="text-slate-500 text-sm">…</span>
                <button
                  onClick={() => irPagina(totalPaginas)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                    paginaActual === totalPaginas
                      ? 'bg-green-700 text-white shadow'
                      : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                  }`}
                >
                  {totalPaginas}
                </button>
              </>
            )}

            <button
              onClick={() => irPagina(paginaActual + 1)}
              disabled={paginaActual === totalPaginas}
              className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                paginaActual === totalPaginas
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
              }`}
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AfeccionesAdmin;

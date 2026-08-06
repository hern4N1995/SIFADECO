import React, { useState, useEffect, useRef, useMemo } from 'react';
import Select from 'react-select';
import api from 'src/services/api';
import AppNotification from 'src/components/AppNotification';

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
      transition: 'all 50ms ease',
      '&:hover': {
        borderColor: '#96f1b7',
      },
      '&:focus-within': {
        borderColor: '#22c55e',
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
        onFocus={() => {
          setIsFocusing(true);
          setTimeout(() => setIsFocusing(false), 50);
        }}
      />
    </div>
  );
}

export default function TitularAdmin() {
  const [titulares, setTitulares] = useState([]);
  const [provinciasDB, setProvinciasDB] = useState([]);
  const [nuevoTitular, setNuevoTitular] = useState({
    nombre: '',
    provincia: null,
    localidad: '',
    direccion: '',
    cuit: '',
  });
  const formRef = useRef(null);
  const [editandoId, setEditandoId] = useState(null);
  const [editado, setEditado] = useState({});
  const [esMovil, setEsMovil] = useState(window.innerWidth < 768);

  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [tipoFeedback, setTipoFeedback] = useState('success');
  const feedbackTimeoutRef = useRef(null);
  // Modal state for edit and confirm
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayload, setEditingPayload] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [paginaActual, setPaginaActual] = useState(1);
  const [busqueda, setBusqueda] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('recientes');
  const itemsPorPagina = esMovil ? 4 : 6;

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) {
        clearTimeout(feedbackTimeoutRef.current);
      }
    };
  }, []);

  const mostrarFeedback = (mensaje, tipo = 'success', duracion = 3200) => {
    setTipoFeedback(tipo);
    setMensajeFeedback(mensaje);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setMensajeFeedback(''), duracion);
  };

  useEffect(() => {
    let mounted = true;

    async function cargarDatos() {
      try {
        // Pedidos en paralelo con axios (usa baseURL de src/services/api)
        const [resProvincias, resTitulares] = await Promise.all([
          api.get('/provincias', { timeout: 10000 }),
          api.get('/titulares-faena', { timeout: 10000 }),
        ]);

        if (!mounted) return;

        const provincias = resProvincias?.data ?? [];
        const titularesData = resTitulares?.data ?? [];

        setProvinciasDB(Array.isArray(provincias) ? provincias : []);
        setTitulares(Array.isArray(titularesData) ? titularesData : []);
      } catch (err) {
        if (!mounted) return;
        // Ignorar cancelaciones si las hubiera
        if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;
        console.error('Error al cargar datos:', err);
        mostrarFeedback(
          'No pudimos cargar la información. Revisá internet e intentá de nuevo.',
          'error',
          4000
        );
      }
    }

    cargarDatos();

    return () => {
      mounted = false;
    };
  }, []);

  const normalizarCuit = (value) => value.replace(/\D/g, '').slice(0, 11);
  const formatearCuit = (value) => {
    const digits = normalizarCuit(String(value || ''));
    if (!digits) return '';
    const p1 = digits.slice(0, 2);
    const p2 = digits.slice(2, 10);
    const p3 = digits.slice(10, 11);
    if (digits.length <= 2) return p1;
    if (digits.length <= 10) return `${p1}-${p2}`;
    return `${p1}-${p2}-${p3}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'cuit' ? normalizarCuit(value) : value;
    setNuevoTitular({ ...nuevoTitular, [name]: nextValue });
  };

  const handleProvinciaChange = (selected) => {
    setNuevoTitular({ ...nuevoTitular, provincia: selected });
  };

  /* ---------- Agregar titular ---------- */
  const agregarTitular = async () => {
    // If editing, delegate to guardarEdicion
    if (editandoId) {
      await guardarEdicion();
      return;
    }
    if (
      !nuevoTitular.nombre ||
      !nuevoTitular.provincia ||
      !nuevoTitular.localidad
    ) {
      mostrarFeedback('Faltan datos: completá nombre, provincia y localidad.', 'error');
      return;
    }

    if (nuevoTitular.cuit && nuevoTitular.cuit.length !== 11) {
      mostrarFeedback('El CUIT debe tener 11 números.', 'error');
      return;
    }

    try {
      const payload = {
        nombre: nuevoTitular.nombre,
        id_provincia:
          Number.parseInt(
            nuevoTitular.provincia?.value ?? nuevoTitular.provincia,
            10
          ) || null,
        localidad: nuevoTitular.localidad,
        direccion: nuevoTitular.direccion || '',
        cuit: normalizarCuit(nuevoTitular.cuit || ''),
      };

      const res = await api.post('/titulares-faena', payload, {
        timeout: 10000,
      });
      const data = res?.data ?? null;

      if (data) {
        // Ensure provincia text is present (API may return only id_provincia)
        const provinciaDesc = provinciasDB.find(
          (p) => String(p.id) === String(data.id_provincia)
        )?.descripcion;
        const dataWithProvincia = {
          ...data,
          provincia:
            data.provincia ??
            provinciaDesc ??
            (nuevoTitular.provincia?.label || ''),
        };
        setTitulares((prev) =>
          Array.isArray(prev)
            ? [...prev, dataWithProvincia]
            : [dataWithProvincia]
        );
        setNuevoTitular({
          nombre: '',
          provincia: null,
          localidad: '',
          direccion: '',
          cuit: '',
        });
        setPaginaActual(1);
        mostrarFeedback('Listo. El titular se agregó correctamente.');
      } else {
        // fallback: recargar lista si la API no devuelve el recurso creado
        const listRes = await api.get('/titulares-faena', { timeout: 10000 });
        setTitulares(Array.isArray(listRes.data) ? listRes.data : []);
        setPaginaActual(1);
        mostrarFeedback('Listo. El titular se agregó correctamente.');
      }
    } catch (error) {
      console.error('Error al agregar titular:', error);
      mostrarFeedback(
        'No pudimos agregar el titular. Probá de nuevo en unos segundos.',
        'error',
        4200
      );
    }
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditado({});
    setNuevoTitular({
      nombre: '',
      provincia: null,
      localidad: '',
      direccion: '',
      cuit: '',
    });
  };

  const iniciarEdicion = (t) => {
    // open overlay modal for editing
    const provinciaOption = provinciasDB.find(
      (p) => String(p.id) === String(t.id_provincia) || p.descripcion === t.provincia
    );
    const payload = {
      id: t.id,
      nombre: t.nombre || '',
      provincia: provinciaOption ? { value: provinciaOption.id, label: provinciaOption.descripcion } : null,
      localidad: t.localidad || '',
      direccion: t.direccion || '',
      cuit: normalizarCuit(String(t.cuit || t.documento || '')),
    };
    setEditingPayload(payload);
    setEditModalOpen(true);
  };

  /* ---------- Guardar edición de titular (usando el formulario superior) ---------- */
  const guardarEdicion = async () => {
    if (!editingPayload?.id) return;
    try {
      const payload = {
        nombre: editingPayload.nombre,
        id_provincia: Number.parseInt(editingPayload.provincia?.value ?? editingPayload.provincia, 10) || null,
        localidad: editingPayload.localidad,
        direccion: editingPayload.direccion || '',
        cuit: normalizarCuit(editingPayload.cuit || ''),
      };

      if (payload.cuit && payload.cuit.length !== 11) {
        mostrarFeedback('El CUIT debe tener 11 números.', 'error');
        return;
      }

      const res = await api.put(`/titulares-faena/${editingPayload.id}`, payload, { timeout: 10000 });
      let updated = res?.data ?? { ...payload, id: editingPayload.id };
      const provinciaDesc2 = provinciasDB.find((p) => String(p.id) === String(updated.id_provincia))?.descripcion;
      updated = { ...updated, provincia: updated.provincia ?? provinciaDesc2 ?? (editingPayload.provincia?.label || '') };

      setTitulares((prev) => (Array.isArray(prev) ? prev.map((t) => (String(t.id) === String(editingPayload.id) ? { ...t, ...updated } : t)) : prev));
      setEditModalOpen(false);
      setEditingPayload(null);
      mostrarFeedback('Listo. Los cambios se guardaron correctamente.');
    } catch (error) {
      console.error('Error al guardar edición:', error);
      mostrarFeedback(
        'No pudimos guardar los cambios. Probá de nuevo.',
        'error',
        4200
      );
    }
  };

  /* ---------- Eliminar titular ---------- */
  const eliminarTitular = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const performDeleteTitular = async (id) => {
    try {
      const res = await api.delete(`/titulares-faena/${id}`, { timeout: 10000 });
      const status = res?.status ?? 0;
      if (status >= 200 && status < 300) {
        setTitulares((prev) => (Array.isArray(prev) ? prev.filter((t) => String(t.id) !== String(id)) : []));
        setPaginaActual(1);
        mostrarFeedback('Listo. El titular fue eliminado.');
      }
    } catch (error) {
      console.error('Error al eliminar titular:', error);
      mostrarFeedback(
        'No pudimos eliminar el titular. Probá de nuevo.',
        'error',
        4200
      );
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const titularesFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    let resultado = titulares;
    
    if (q) {
      resultado = resultado.filter((t) => {
        const cuitRaw = String(t.cuit || t.documento || '').toLowerCase();
        const cuitFmt = formatearCuit(t.cuit || t.documento || '').toLowerCase();
        return (
          (t.nombre || '').toLowerCase().includes(q) ||
          (t.localidad || '').toLowerCase().includes(q) ||
          (t.provincia || '').toLowerCase().includes(q) ||
          cuitRaw.includes(q) ||
          cuitFmt.includes(q)
        );
      });
    }
    
    // Aplicar ordenamiento
    switch (ordenamiento) {
      case 'recientes':
        resultado.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'antiguos':
        resultado.sort((a, b) => (a.id || 0) - (b.id || 0));
        break;
      case 'az':
        resultado.sort((a, b) => (a.nombre || '').localeCompare(b.nombre || ''));
        break;
      case 'za':
        resultado.sort((a, b) => (b.nombre || '').localeCompare(a.nombre || ''));
        break;
      default:
        break;
    }
    
    return resultado;
  }, [titulares, busqueda, ordenamiento]);

  const totalPaginas = Math.ceil(titularesFiltrados.length / itemsPorPagina);
  const visibles = titularesFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  const irPagina = (n) =>
    setPaginaActual(Math.min(Math.max(n, 1), totalPaginas));
  const paginaAnterior = () => irPagina(paginaActual - 1);
  const paginaSiguiente = () => irPagina(paginaActual + 1);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 drop-shadow">
          🧾 Administración de Titulares de Faena
        </h1>

        <AppNotification
          show={Boolean(mensajeFeedback)}
          message={mensajeFeedback}
          type={tipoFeedback}
          onClose={() => setMensajeFeedback('')}
          errorTitle="Atencion"
        />

        {/* Formulario */}
        <div
          ref={formRef}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Bloque superior */}
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Nombre / Razón Social
              </label>
              <input
                name="nombre"
                value={nuevoTitular.nombre}
                onChange={handleChange}
                placeholder="Nombre o Razón Social"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
              />
            </div>

            <SelectField
              label="Provincia"
              value={nuevoTitular.provincia}
              onChange={handleProvinciaChange}
              options={provinciasDB.map((p) => ({
                value: p.id,
                label: p.descripcion,
              }))}
              placeholder="Seleccione una provincia"
            />

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Localidad
              </label>
              <input
                name="localidad"
                value={nuevoTitular.localidad}
                onChange={handleChange}
                placeholder="Ej. Corrientes, Goya, etc."
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
              />
            </div>

            {/* Bloque inferior */}
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Dirección
              </label>
              <input
                name="direccion"
                value={nuevoTitular.direccion}
                onChange={handleChange}
                placeholder="Ej. Calle Falsa 123"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                CUIT
              </label>
              <input
                name="cuit"
                value={formatearCuit(nuevoTitular.cuit)}
                onChange={handleChange}
                maxLength={13}
                inputMode="numeric"
                pattern="\d{2}-\d{8}-\d{1}"
                placeholder="Ej. 20-12345678-9"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
              />
              <p className="text-red-600 text-xs mt-1 leading-tight">
                Si el número central tiene menos de 8 dígitos, complete con ceros a la izquierda.<br />
                Ejemplo: 20-008405430-2
              </p>
            </div>

            <div className="flex items-end gap-2">
              <button
                onClick={agregarTitular}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition text-sm font-semibold shadow"
              >
                {editandoId ? '💾 Guardar' : '➕ Agregar'}
              </button>
              {editandoId && (
                <button
                  onClick={cancelarEdicion}
                  className="w-full bg-slate-200 text-slate-700 px-4 py-3 rounded-lg hover:bg-slate-300 transition text-sm font-semibold shadow"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Edit modal overlay */}
        {editModalOpen && editingPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 z-10">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Editar Titular</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nombre</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={editingPayload.nombre}
                    onChange={(e) => setEditingPayload((p) => ({ ...p, nombre: e.target.value }))}
                  />
                </div>
                <div>
                  <SelectField
                    label="Provincia"
                    value={editingPayload.provincia}
                    onChange={(sel) => setEditingPayload((p) => ({ ...p, provincia: sel }))}
                    options={provinciasDB.map((p) => ({ value: p.id, label: p.descripcion }))}
                    placeholder="Seleccione..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Localidad</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={editingPayload.localidad}
                    onChange={(e) => setEditingPayload((p) => ({ ...p, localidad: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Dirección</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={editingPayload.direccion}
                    onChange={(e) => setEditingPayload((p) => ({ ...p, direccion: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">CUIT</label>
                  <input
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                    value={formatearCuit(editingPayload.cuit)}
                    onChange={(e) =>
                      setEditingPayload((p) => ({ ...p, cuit: normalizarCuit(e.target.value) }))
                    }
                    maxLength={13}
                    inputMode="numeric"
                    pattern="\d{2}-\d{8}-\d{1}"
                    placeholder="Ej. 20-12345678-9"
                  />
                  <p className="text-red-600 text-xs mt-1 leading-tight">
                    Si el número central tiene menos de 8 dígitos, complete con ceros a la izquierda.<br />
                    Ejemplo: 20-008405430-2
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={guardarEdicion} className="px-4 py-2 bg-green-600 text-white rounded">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete confirm modal */}
        {confirmDelete.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete({ open: false, id: null })} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirmar eliminación</h3>
              <div className="text-sm text-gray-700 mb-6">¿Estás seguro que querés eliminar este titular?</div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setConfirmDelete({ open: false, id: null })} className="px-4 py-2 border rounded">Cancelar</button>
                <button onClick={() => performDeleteTitular(confirmDelete.id)} className="px-4 py-2 bg-red-600 text-white rounded">Eliminar</button>
              </div>
            </div>
          </div>
        )}

        {/* Buscador */}
        <div className="flex flex-col sm:flex-row gap-3 items-end">
          <div className="flex-1 min-w-0 relative">
            <span className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
              </svg>
            </span>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              placeholder="Buscar por nombre, CUIT, localidad o provincia…"
              className="w-full pl-12 pr-10 py-3 rounded-xl border-2 border-gray-200 bg-white text-sm shadow-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 placeholder-gray-400"
            />
            {busqueda && (
              <button
                onClick={() => { setBusqueda(''); setPaginaActual(1); }}
                className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600 transition"
                aria-label="Limpiar búsqueda"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Selector de ordenamiento */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => { setOrdenamiento('recientes'); setPaginaActual(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                ordenamiento === 'recientes'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
              title="Más recientes primero"
            >
              🔄 Recientes
            </button>
            <button
              onClick={() => { setOrdenamiento('antiguos'); setPaginaActual(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                ordenamiento === 'antiguos'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
              title="Más antiguos primero"
            >
              📅 Antiguos
            </button>
            <button
              onClick={() => { setOrdenamiento('az'); setPaginaActual(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                ordenamiento === 'az'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
              title="Alfabético A-Z"
            >
              🔤 A-Z
            </button>
            <button
              onClick={() => { setOrdenamiento('za'); setPaginaActual(1); }}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                ordenamiento === 'za'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
              title="Alfabético Z-A"
            >
              🔤 Z-A
            </button>
          </div>
        </div>

        {busqueda && (
          <p className="-mt-6 text-xs text-gray-500">
            {titularesFiltrados.length === 0
              ? 'Sin resultados para esa búsqueda.'
              : `${titularesFiltrados.length} resultado${titularesFiltrados.length !== 1 ? 's' : ''} encontrado${titularesFiltrados.length !== 1 ? 's' : ''}.`}
          </p>
        )}

        {/* Listado */}
        {esMovil ? (
          <div className="space-y-4">
            {visibles.map((t) => (
              <div
                key={t.id}
                className="bg-white p-4 rounded-xl shadow border border-gray-200"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-1 text-sm text-gray-700">
                    <p className="font-semibold text-gray-800">{t.nombre}</p>
                    <p>
                      {t.provincia} — {t.localidad}
                    </p>
                    <p>{t.direccion}</p>
                    <p>CUIT: {t.cuit || t.documento ? formatearCuit(t.cuit || t.documento) : '—'}</p>
                  </div>
                  <div className="flex gap-2 ml-2">
                    <button
                      onClick={() => iniciarEdicion(t)}
                      className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => eliminarTitular(t.id)}
                      className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200 shadow-xl">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nombre</th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Provincia
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Localidad
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    Dirección
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">
                    CUIT
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibles.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">{t.nombre}</td>
                    <td className="px-4 py-3">{t.provincia}</td>
                    <td className="px-4 py-3">{t.localidad}</td>
                    <td className="px-4 py-3">{t.direccion}</td>
                    <td className="px-4 py-3">{t.cuit || t.documento ? formatearCuit(t.cuit || t.documento) : '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => iniciarEdicion(t)}
                          className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => eliminarTitular(t.id)}
                          className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                        >
                          🗑️ Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Paginación externa */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-2 flex-wrap">
            <button
              onClick={paginaAnterior}
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
              onClick={paginaSiguiente}
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
}

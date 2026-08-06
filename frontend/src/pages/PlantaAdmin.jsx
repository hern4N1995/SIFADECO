// src/components/PlantaAdmin.jsx
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import api from 'src/services/api';
import AppNotification from 'src/components/AppNotification';

/* ------------------------------------------------------------------ */
/*  SelectField con estilos visuales unificados                      */
/* ------------------------------------------------------------------ */
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  maxMenuHeight = 200,
}) {
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
        maxMenuHeight={maxMenuHeight}
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

/* ------------------------------------------------------------------ */
/*  Componente principal PlantaAdmin                                  */
/* ------------------------------------------------------------------ */
export default function PlantaAdmin() {
  const [plantas, setPlantas] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [nuevaPlanta, setNuevaPlanta] = useState({
    nombre: '',
    provincia: null,
    direccion: '',
    cuit: '',
    fecha_habilitacion: '',
    norma_legal: '',
    estado: true,
  });
  const [editandoId, setEditandoId] = useState(null);
  const [editado, setEditado] = useState({});
  const [esMovil, setEsMovil] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  const [filtroGeneral, setFiltroGeneral] = useState('');
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('');
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('');

  // Mensajes de feedback
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [tipoFeedback, setTipoFeedback] = useState('info'); // 'info', 'success', 'error'
  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [provinciasLoading, setProvinciasLoading] = useState(true);

  // Helper: Mostrar feedback en modal
  const mostrarFeedback = (mensaje, tipo = 'info') => {
    setMensajeFeedback(mensaje);
    setTipoFeedback(tipo);
    setFeedbackModalOpen(true);
  };

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /* ---------------------------
     Cargar plantas (usa instancia axios central)
     --------------------------- */
  useEffect(() => {
    let mounted = true;

    async function cargarPlantas() {
      try {
        const { data } = await api.get('/plantas'); // baseURL ya incluye /api si está configurado
        if (!mounted) return;
        const normalized = Array.isArray(data)
          ? data.map((p) => ({ 
              ...p, 
              id: p.id ?? p.id_planta,
              cuit: p.cuit ?? '' 
            }))
          : [];
        setPlantas(normalized);
      } catch (err) {
        if (!mounted) return;
        console.error('Error al cargar plantas:', err);
        mostrarFeedback('❌ Error al cargar plantas.', 'error');
      }
    }

    cargarPlantas();
    return () => {
      mounted = false;
    };
  }, []);

  /* ---------------------------
     Cargar provincias
     --------------------------- */
  useEffect(() => {
    let mounted = true;

    async function cargarProvincias() {
      try {
        setProvinciasLoading(true);
        const { data } = await api.get('/provincias');
        if (!mounted) return;
        console.log('Provincias cargadas:', data);
        const normalizadas = Array.isArray(data) 
          ? data.map((p) => ({ 
              ...p, 
              id: p.id ?? p.id_provincia,
              descripcion: p.descripcion ?? p.nombre
            }))
          : [];
        setProvincias(normalizadas);
        setProvinciasLoading(false);
      } catch (err) {
        if (!mounted) return;
        console.error('Error al cargar provincias:', err);
        mostrarFeedback('❌ Error al cargar provincias. ' + err.message, 'error');
        setProvinciasLoading(false);
      }
    }

    cargarProvincias();
    return () => {
      mounted = false;
    };
  }, []);

  // Helper: display date as dd/mm/yyyy (strip time if present)
  const formatDateForDisplay = (val) => {
    if (!val && val !== 0) return '—';
    const s = String(val);
    // If ISO with T, take left side
    const left = s.includes('T') ? s.split('T')[0] : s;
    if (/^\d{4}-\d{2}-\d{2}$/.test(left)) {
      const [y, m, d] = left.split('-');
      return `${d}/${m}/${y}`;
    }
    const dObj = new Date(s);
    if (isNaN(dObj.getTime())) return s;
    const dd = String(dObj.getDate()).padStart(2, '0');
    const mm = String(dObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dObj.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // Helper: Format CUIT (XX-XXXXXXXX-X)
  const formatCUIT = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
  };

  // Helper: Get today's date in yyyy-MM-dd format
  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let val = type === 'checkbox' ? checked : value;
    
    setNuevaPlanta((prev) => ({ ...prev, [name]: val }));
  };

  const handleProvinciaChange = (selected) => {
    setNuevaPlanta((prev) => ({ ...prev, provincia: selected }));
  };

  /* ---------------------------
     Agregar planta (usa api.post)
     --------------------------- */
  const agregarPlanta = async () => {
    // Validaciones
    if (!nuevaPlanta.nombre?.trim()) {
      mostrarFeedback('❌ El nombre es obligatorio.', 'error');
      return;
    }

    if (!nuevaPlanta.cuit?.trim()) {
      mostrarFeedback('❌ El CUIT es obligatorio.', 'error');
      return;
    }

    // Validar que CUIT tenga 11 dígitos (sin contar guiones)
    const cuitDigitos = nuevaPlanta.cuit.replace(/\D/g, '');
    if (cuitDigitos.length !== 11) {
      mostrarFeedback('❌ El CUIT debe tener 11 dígitos.', 'error');
      return;
    }

    if (!nuevaPlanta.fecha_habilitacion?.trim()) {
      mostrarFeedback('❌ La fecha de habilitación es obligatoria.', 'error');
      return;
    }

    // Validar que la fecha no sea futura
    const fechaIngresada = new Date(nuevaPlanta.fecha_habilitacion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaIngresada > hoy) {
      mostrarFeedback('❌ La fecha de habilitación no puede ser futura.', 'error');
      return;
    }

    try {
      const payload = {
        nombre: nuevaPlanta.nombre,
        id_provincia: nuevaPlanta.provincia?.value ?? null,
        direccion: nuevaPlanta.direccion,
        cuit: nuevaPlanta.cuit.replace(/\D/g, ''),
        fecha_habilitacion: nuevaPlanta.fecha_habilitacion,
        norma_legal: nuevaPlanta.norma_legal,
        estado: nuevaPlanta.estado,
      };

      const { data } = await api.post('/plantas', payload);

      // Ensure created item has normalized id field
      const created = { ...data, id: data.id ?? data.id_planta, cuit: data.cuit ?? '' };
      // Actualización segura del estado (no mutar el array original)
      setPlantas((prev) => (Array.isArray(prev) ? [...prev, created] : [created]));

      // Reset del formulario de manera explícita
      setNuevaPlanta({
        nombre: '',
        provincia: null,
        direccion: '',
        cuit: '',
        fecha_habilitacion: '',
        norma_legal: '',
        estado: true,
      });

      // Feedback de éxito
      mostrarFeedback('✅ Planta creada correctamente.', 'success');
    } catch (err) {
      console.error('Error al agregar planta:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error de conexión con el servidor.';
      mostrarFeedback(`❌ Error al crear la planta. ${msg}`, 'error');
    }
  };

  const iniciarEdicion = (planta) => {
    // Use modal-only editing to avoid mutating UI of other rows
    // Normalizar estructura de provincia para el editor si viene como objeto o string
    const provinciaValue =
      planta.provincia?.id ??
      planta.id_provincia ??
      planta.provincia?.value ??
      null;
    const provinciaLabel =
      planta.provincia?.nombre ??
      planta.provincia?.label ??
      planta.nombre_provincia ??
      null;

    const idVal = planta.id ?? planta.id_planta ?? null;

    // Normalize date to yyyy-MM-dd for <input type="date"> (remove timezone/time)
    const formatDateForInput = (val) => {
      if (!val) return '';
      const s = String(val);
      // If already in YYYY-MM-DD, return as-is
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
      // If ISO with T, take left side (already yyyy-mm-dd)
      if (s.includes('T')) return s.split('T')[0];
      // Try to parse ISO/date and use UTC to avoid local timezone shifts
      const d = new Date(s);
      if (isNaN(d.getTime())) return '';
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    };

    setEditado({
      ...planta,
      id: idVal,
      provincia:
        provinciaValue !== null
          ? { value: provinciaValue, label: provinciaLabel }
          : null,
      fecha_habilitacion: formatDateForInput(planta.fecha_habilitacion),
    });
    setEditandoId(idVal);
    setEditModalOpen(true);
  };

  const guardarEdicion = async () => {
    const targetId = editado?.id ?? editandoId;

    // Validaciones
    if (!editado?.nombre?.trim()) {
      mostrarFeedback('❌ El nombre es obligatorio.', 'error');
      return;
    }

    if (!editado?.cuit?.trim()) {
      mostrarFeedback('❌ El CUIT es obligatorio.', 'error');
      return;
    }

    // Validar que CUIT tenga 11 dígitos
    const cuitDigitos = editado.cuit.replace(/\D/g, '');
    if (cuitDigitos.length !== 11) {
      mostrarFeedback('❌ El CUIT debe tener 11 dígitos.', 'error');
      return;
    }

    if (!editado?.fecha_habilitacion?.trim()) {
      mostrarFeedback('❌ La fecha de habilitación es obligatoria.', 'error');
      return;
    }

    // Validar que la fecha no sea futura
    const fechaIngresada = new Date(editado.fecha_habilitacion);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaIngresada > hoy) {
      mostrarFeedback('❌ La fecha de habilitación no puede ser futura.', 'error');
      return;
    }

    const payload = {
      nombre: editado.nombre,
      id_provincia: editado?.provincia?.value ?? editado?.id_provincia ?? null,
      direccion: editado.direccion,
      cuit: editado.cuit?.replace(/\D/g, '') || null,
      fecha_habilitacion: editado?.fecha_habilitacion || null,
      norma_legal: editado.norma_legal,
      estado: Boolean(editado.estado),
    };

    try {
      if (!targetId) throw new Error('Missing planta id');
      const { data, status } = await api.put(`/plantas/${targetId}`, payload);

      const returnedId = data?.id ?? data?.id_planta ?? targetId;
      if (status >= 200 && status < 300 && String(returnedId) === String(targetId)) {
        setPlantas((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((p) => {
            const pId = p.id ?? p.id_planta ?? null;
            if (String(pId) === String(targetId)) {
              // merge returned data but preserve both id fields if present
              const merged = { ...p, ...data };
              if (!merged.id && merged.id_planta) merged.id = merged.id_planta;
              if (!merged.id_planta && merged.id) merged.id_planta = merged.id;
              return merged;
            }
            return p;
          });
        });
        setEditandoId(null);
        setEditado({});
        setEditModalOpen(false);
        mostrarFeedback('✅ Cambios guardados.', 'success');
      } else {
        console.warn('Respuesta inesperada al guardar edición', {
          status,
          data,
        });
        mostrarFeedback('❌ No se pudo guardar la edición.', 'error');
      }
    } catch (err) {
      console.error('Error al guardar edición:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error de conexión con el servidor.';
      mostrarFeedback(`❌ ${msg}`, 'error');
    }
  };

  const deshabilitarPlanta = (id) => {
    setConfirmDelete({ open: true, id });
  };

  const performDisablePlanta = async (id) => {
    try {
      const { status, data } = await api.delete(`/plantas/${id}`);

      if (status >= 200 && status < 300) {
        setPlantas((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((p) => {
            const pId = p.id ?? p.id_planta ?? null;
            if (String(pId) === String(id)) {
              const merged = {
                ...p,
                ...data,
                id: data.id ?? data.id_planta ?? p.id,
                cuit: data.cuit ?? p.cuit,
              };
              if (!merged.id_planta && merged.id) merged.id_planta = merged.id;
              return merged;
            }
            return p;
          });
        });
        mostrarFeedback('✅ Planta deshabilitada.', 'success');
      } else {
        const msg = data?.message || data?.error || 'Error al deshabilitar la planta.';
        console.warn('Delete responded with non-2xx:', status, msg);
        mostrarFeedback(`❌ ${msg}`, 'error');
      }
    } catch (err) {
      console.error('Error al deshabilitar planta:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error de conexión con el servidor.';
      mostrarFeedback(`❌ ${msg}`, 'error');
    } finally {
      setConfirmDelete({ open: false, id: null });
    }
  };

  const habilitarPlanta = async (id) => {
    try {
      const { status, data } = await api.put(`/plantas/${id}`, { estado: true });

      if (status >= 200 && status < 300) {
        setPlantas((prev) => {
          if (!Array.isArray(prev)) return prev;
          return prev.map((p) => {
            const pId = p.id ?? p.id_planta ?? null;
            if (String(pId) === String(id)) {
              const merged = {
                ...p,
                ...data,
                id: data.id ?? data.id_planta ?? p.id,
                cuit: data.cuit ?? p.cuit,
              };
              if (!merged.id_planta && merged.id) merged.id_planta = merged.id;
              return merged;
            }
            return p;
          });
        });
        mostrarFeedback('✅ Planta habilitada.', 'success');
      } else {
        const msg = data?.message || data?.error || 'Error al habilitar la planta.';
        console.warn('Put responded with non-2xx:', status, msg);
        mostrarFeedback(`❌ ${msg}`, 'error');
      }
    } catch (err) {
      console.error('Error al habilitar planta:', err);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Error de conexión con el servidor.';
      mostrarFeedback(`❌ ${msg}`, 'error');
    }
  };

  /* ---------------------------
     Filtrado seguro de plantas
     --------------------------- */
  const plantasFiltradas = plantas.filter((p) => {
    const filtroGenLower = filtroGeneral.toLowerCase();
    const nombre = (p.nombre || '').toString().toLowerCase();
    const provinciaNombre =
      (p.provincia && (p.provincia.nombre || p.provincia.label)) ||
      p.nombre_provincia ||
      '';
    const provinciaStr = provinciaNombre.toString().toLowerCase();
    const cuit = (p.cuit || '').toString();

    // Filtro general busca en nombre, provincia y CUIT (solo los que comienzan con)
    const coincideGeneral = 
      nombre.startsWith(filtroGenLower) ||
      provinciaStr.startsWith(filtroGenLower) ||
      cuit.startsWith(filtroGenLower);

    // Filtro de fecha por rango
    const fecha = (p.fecha_habilitacion || '').split('T')[0]; // Solo la fecha sin hora
    const coincideFecha = (() => {
      if (!filtroFechaDesde && !filtroFechaHasta) return true;
      if (filtroFechaDesde && filtroFechaHasta) {
        return fecha >= filtroFechaDesde && fecha <= filtroFechaHasta;
      }
      if (filtroFechaDesde) return fecha >= filtroFechaDesde;
      if (filtroFechaHasta) return fecha <= filtroFechaHasta;
      return true;
    })();

    return coincideGeneral && coincideFecha;
  });

  /* ---------------------------
     Render (UI)
     --------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 drop-shadow mb-6">
          🏭 Administración de Plantas
        </h1>
        <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 space-y-6">

          {provinciasLoading && (
            <div className="mb-4 text-sm text-blue-600">
              ⏳ Cargando provincias...
            </div>
          )}

          {/* Formulario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Nombre
              </label>
              <input
                name="nombre"
                value={nuevaPlanta.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <SelectField
              label="Provincia"
              value={
                nuevaPlanta.provincia
                  ? {
                      value: nuevaPlanta.provincia.value,
                      label: nuevaPlanta.provincia.label,
                    }
                  : null
              }
              onChange={handleProvinciaChange}
              options={provincias.map((p) => ({
                value: p.id ?? p.id_provincia,
                label: p.descripcion ?? p.nombre ?? `Provincia ${p.id}`,
              }))}
              placeholder="Seleccionar provincia"
            />

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Dirección
              </label>
              <input
                name="direccion"
                value={nuevaPlanta.direccion}
                onChange={handleChange}
                placeholder="Dirección"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                CUIT
              </label>
              <input
                name="cuit"
                value={formatCUIT(nuevaPlanta.cuit)}
                onChange={(e) => setNuevaPlanta((prev) => ({ ...prev, cuit: e.target.value.replace(/\D/g, '') }))}
                placeholder="XX-XXXXXXXX-X"
                maxLength="13"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
              <p className="text-red-600 text-xs mt-1 leading-tight">
                Si el número central tiene menos de 8 dígitos, complete con ceros a la izquierda.<br />
                Ejemplo: 20-008405430-2
              </p>
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Fecha Habilitación
              </label>
              <input
                type="date"
                name="fecha_habilitacion"
                value={nuevaPlanta.fecha_habilitacion}
                onChange={handleChange}
                max={getTodayDateString()}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Norma Legal
              </label>
              <input
                name="norma_legal"
                value={nuevaPlanta.norma_legal}
                onChange={handleChange}
                placeholder="Norma Legal"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  name="estado"
                  checked={Boolean(nuevaPlanta.estado)}
                  onChange={handleChange}
                />
                <span className="text-sm text-gray-700">Habilitada</span>
              </label>
            </div>
          </div>

          {/* Edit modal overlay */}
          {editModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)} />
              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl p-6 z-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Editar Planta</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2 font-semibold text-gray-700 text-sm">Nombre</label>
                    <input className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50" value={editado.nombre || ''} onChange={(e) => setEditado((p) => ({ ...p, nombre: e.target.value }))} />
                  </div>
                  <div>
                    <SelectField
                      label="Provincia"
                      value={editado.provincia ?? null}
                      onChange={(sel) => setEditado((p) => ({ ...p, provincia: sel }))}
                      options={provincias.map((p) => ({ 
                        value: p.id ?? p.id_provincia, 
                        label: p.descripcion ?? p.nombre ?? `Provincia ${p.id}`
                      }))}
                      placeholder="Seleccione..."
                    />
                  </div>
                  <div>
                    <label className="mb-2 font-semibold text-gray-700 text-sm">Dirección</label>
                    <input className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50" value={editado.direccion || ''} onChange={(e) => setEditado((p) => ({ ...p, direccion: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-2 font-semibold text-gray-700 text-sm">CUIT</label>
                    <input className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50" value={formatCUIT(editado.cuit?.toString() || '')} onChange={(e) => setEditado((p) => ({ ...p, cuit: e.target.value.replace(/\D/g, '') }))} maxLength="13" placeholder="XX-XXXXXXXX-X" />
                    <p className="text-red-600 text-xs mt-1 leading-tight">
                      Ingrese el CUIT con 11 dígitos.<br />
                      Ejemplo: 20-008405430-2
                    </p>
                  </div>
                  <div>
                    <label className="mb-2 font-semibold text-gray-700 text-sm">Fecha habilitación</label>
                    <input type="date" className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50" value={editado.fecha_habilitacion || ''} onChange={(e) => setEditado((p) => ({ ...p, fecha_habilitacion: e.target.value }))} max={getTodayDateString()} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="mb-2 font-semibold text-gray-700 text-sm">Norma legal</label>
                    <input className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50" value={editado.norma_legal || ''} onChange={(e) => setEditado((p) => ({ ...p, norma_legal: e.target.value }))} />
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 border rounded">Cancelar</button>
                  <button onClick={guardarEdicion} className="px-4 py-2 bg-green-600 text-white rounded">Guardar</button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm delete modal for planta */}
          {confirmDelete.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmDelete({ open: false, id: null })} />
              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Confirmar deshabilitación</h3>
                <div className="text-sm text-gray-700 mb-6">¿Estás seguro que querés deshabilitar esta planta?</div>
                <div className="flex justify-end gap-2">
                  <button onClick={() => setConfirmDelete({ open: false, id: null })} className="px-4 py-2 border rounded">Cancelar</button>
                  <button onClick={() => performDisablePlanta(confirmDelete.id)} className="px-4 py-2 bg-red-600 text-white rounded">Deshabilitar</button>
                </div>
              </div>
            </div>
          )}

          {/* Feedback modal overlay */}
          {feedbackModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/40" onClick={() => setFeedbackModalOpen(false)} />
              <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md p-6 z-10 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="text-3xl flex-shrink-0">
                    {tipoFeedback === 'success' && '✅'}
                    {tipoFeedback === 'error' && '❌'}
                    {tipoFeedback === 'info' && 'ℹ️'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${
                      tipoFeedback === 'success' ? 'text-green-700' : 
                      tipoFeedback === 'error' ? 'text-red-700' : 
                      'text-blue-700'
                    }`}>
                      {tipoFeedback === 'success' && 'Éxito'}
                      {tipoFeedback === 'error' && 'Error de validación'}
                      {tipoFeedback === 'info' && 'Información'}
                    </h3>
                    <p className="text-sm text-gray-700">{mensajeFeedback}</p>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button 
                    onClick={() => setFeedbackModalOpen(false)} 
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      tipoFeedback === 'success' ? 'bg-green-600 text-white hover:bg-green-700' : 
                      tipoFeedback === 'error' ? 'bg-red-600 text-white hover:bg-red-700' : 
                      'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={agregarPlanta}
              className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition text-sm font-semibold"
            >
              ➕ Agregar Planta
            </button>
          </div>

          {/* Filtros */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-600 ml-1 invisible">Filtrar</label>
              <input
                type="text"
                value={filtroGeneral}
                onChange={(e) => setFiltroGeneral(e.target.value)}
                placeholder="🔍 Filtrar por nombre, provincia o CUIT"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-xs text-gray-600 ml-1">Desde</label>
                <input
                  type="date"
                  value={filtroFechaDesde}
                  onChange={(e) => setFiltroFechaDesde(e.target.value)}
                  max={getTodayDateString()}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-600 ml-1">Hasta</label>
                <input
                  type="date"
                  value={filtroFechaHasta}
                  onChange={(e) => setFiltroFechaHasta(e.target.value)}
                  max={getTodayDateString()}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
                />
              </div>
            </div>
          </div>

          {/* Lista de plantas */}
          {esMovil ? (
            <div className="space-y-4">
              {plantasFiltradas.map((p) => (
                <div
                  key={p.id}
                  className="bg-gray-50 p-4 rounded-xl shadow border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1 space-y-1 text-sm text-gray-700">
                      <p className="font-semibold text-gray-800">{p.nombre}</p>
                      <p>{p.nombre_provincia || '—'}</p>
                      <p>{p.direccion || '—'}</p>
                      <p>CUIT: {formatCUIT(p.cuit?.toString() || '')}</p>
                      <p>Fecha: {formatDateForDisplay(p.fecha_habilitacion)}</p>
                      <p>Norma: {p.norma_legal || '—'}</p>
                      <p>
                        Estado:{' '}
                        {p.estado ? '✅ Habilitada' : '❌ Deshabilitada'}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-2">
                      <button
                        onClick={() => iniciarEdicion(p)}
                        className="w-24 h-10 px-3 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition flex items-center justify-center"
                      >
                        ✏️ Editar
                      </button>
                      {p.estado ? (
                        <button
                          onClick={() => deshabilitarPlanta(p.id)}
                          className="w-24 h-10 px-3 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition flex items-center justify-center"
                        >
                          🚫
                        </button>
                      ) : (
                        <button
                          onClick={() => habilitarPlanta(p.id)}
                          className="w-24 h-10 px-3 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition flex items-center justify-center"
                        >
                          ✅
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
              <table className="min-w-full text-sm text-gray-700">
                <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                  <tr className="h-16 align-middle">
                    <th className="px-4 py-3 text-left font-semibold align-middle">
                      Nombre
                    </th>
                    <th className="px-4 py-3 text-left font-semibold align-middle">
                      Provincia
                    </th>
                    <th className="px-4 py-3 text-left font-semibold align-middle">
                      Dirección
                    </th>
                    <th className="px-4 py-3 text-left font-semibold align-middle">CUIT</th>
                    <th className="px-4 py-3 text-left font-semibold align-middle">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold align-middle">
                      Norma Legal
                    </th>
                    <th className="px-4 py-3 text-center font-semibold align-middle">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-center font-semibold align-middle">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {plantasFiltradas.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 transition h-16 align-middle">
                      <td className="px-4 py-3 align-middle">{p.nombre}</td>
                      <td className="px-4 py-3 align-middle">{p.nombre_provincia || '—'}</td>
                      <td className="px-4 py-3 align-middle">{p.direccion || '—'}</td>
                      <td className="px-4 py-3 align-middle">{formatCUIT(p.cuit?.toString() || '')}</td>
                      <td className="px-4 py-3 align-middle">{formatDateForDisplay(p.fecha_habilitacion)}</td>
                      <td className="px-4 py-3 align-middle">{p.norma_legal || '—'}</td>
                      <td className="px-4 py-3 text-center align-middle">{p.estado ? '✅' : '❌'}</td>
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => iniciarEdicion(p)}
                            className="w-28 h-10 px-3 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition flex items-center justify-center"
                          >
                            ✏️ Editar
                          </button>
                          {p.estado ? (
                            <button
                              onClick={() => deshabilitarPlanta(p.id)}
                              className="w-28 h-10 px-3 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition flex items-center justify-center"
                            >
                              🚫 Deshabilitar
                            </button>
                          ) : (
                            <button
                              onClick={() => habilitarPlanta(p.id)}
                              className="w-28 h-10 px-3 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 transition flex items-center justify-center"
                            >
                              ✅ Habilitar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// AgregarUsuarioPage.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Select from 'react-select';
import api from '../services/api.js';
import AppNotification from 'src/components/AppNotification';

/* ------------------------------------------------------------------ */
/*  UI helpers: Modal + Toast                                         */
/* ------------------------------------------------------------------ */
function Modal({ open, title, children, onClose, actions }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        <div className="text-sm text-gray-700">{children}</div>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded border text-sm"
          >
            Cerrar
          </button>
          {actions}
        </div>
      </div>
    </div>
  );
}

function Toast({ show, type = 'success', text, onClose }) {
  return (
    <AppNotification
      show={show}
      message={text}
      type={type === 'success' ? 'success' : 'error'}
      onClose={onClose}
      errorTitle="Atencion"
    />
  );
}

/* ------------------------------------------------------------------ */
/*  SelectField                                                       */
/* ------------------------------------------------------------------ */
function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
  className = '',
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
      transition: 'all 100ms ease',
      '&:hover': { borderColor: '#6ee7b7' },
      '&:focus-within': { borderColor: '#10b981' },
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
    <div className={`flex flex-col ${className}`}>
      <label className="mb-2 font-semibold text-gray-700 text-sm">
        {label}
      </label>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        required={required}
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
/*  InputField                                                        */
/* ------------------------------------------------------------------ */
const InputField = ({
  label,
  name,
  value,
  onChange,
  required = false,
  type = 'text',
  className = '',
  placeholder = '',
  inputRef = null,
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-2 font-semibold text-gray-700 text-sm">{label}</label>
    <input
      ref={inputRef}
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
    />
  </div>
);

/* ------------------------------------------------------------------ */
/*  Roles y estados                                                   */
/* ------------------------------------------------------------------ */
const roles = [
  { id_rol: 2, nombre: 'Supervisor' },
  { id_rol: 3, nombre: 'Usuario' },
];
const estados = ['Activo', 'Inactivo'];

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
const AgregarUsuarioPage = () => {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    password: '',
    estado: 'Activo',
    id_rol: '',
    id_planta: '',
    n_telefono: '',
  });
  const [usuarios, setUsuarios] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [editandoId, setEditandoId] = useState(null);

  // UI feedback
  const [toast, setToast] = useState({
    show: false,
    type: 'success',
    text: '',
  });
  const showToast = (type, text, ms = 2500) => {
    setToast({ show: true, type, text });
    setTimeout(() => setToast({ show: false, type: 'success', text: '' }), ms);
  };

  const [modalError, setModalError] = useState({
    open: false,
    title: '',
    text: '',
  });
  const openErrorModal = (title, text) =>
    setModalError({ open: true, title, text });
  const closeErrorModal = () =>
    setModalError({ open: false, title: '', text: '' });

  const [modalSuccess, setModalSuccess] = useState({
    open: false,
    title: '',
    text: '',
  });
  const openSuccessModal = (title, text) =>
    setModalSuccess({ open: true, title, text });
  const closeSuccessModal = () =>
    setModalSuccess({ open: false, title: '', text: '' });

  const [confirmDelete, setConfirmDelete] = useState({
    open: false,
    id: null,
    nombre: '',
  });

  const [filtro, setFiltro] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarEstadoFilter, setMostrarEstadoFilter] = useState('Todos');
  const [ordenamiento, setOrdenamiento] = useState('recientes');

  // refs para scroll y foco
  const formRef = useRef(null);
  const nombreInputRef = useRef(null);

  /* ---------- Paginación ---------- */
  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina =
    typeof window !== 'undefined' && window.innerWidth < 768 ? 2 : 4;

  useEffect(() => {
    Promise.all([fetchUsuarios(), fetchPlantas()])
      .catch(() =>
        openErrorModal('Error inicial', 'No se pudieron cargar datos')
      )
      .finally(() => setLoading(false));
  }, []);

  // Obtener usuarios
  const fetchUsuarios = async () => {
    try {
      const res = await api.get('/usuarios', { params: { estado: 'all' } });
      const data = res.data;
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      setUsuarios([]);
      openErrorModal(
        'Error al listar usuarios',
        e?.response?.data?.error || e?.message || 'Intenta nuevamente'
      );
    }
  };

  // Obtener plantas
  const fetchPlantas = async () => {
    try {
      const res = await api.get('/plantas');
      const data = res.data;
      setPlantas(Array.isArray(data) ? data : []);
    } catch (e) {
      setPlantas([]);
      openErrorModal(
        'Error al listar plantas',
        e?.response?.data?.error || e?.message || 'Intenta nuevamente'
      );
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Validación antes de enviar: chequea campos requeridos y muestra modal si faltan
  const validateFormBeforeSubmit = () => {
    const missing = [];
    if (!form.nombre || String(form.nombre).trim() === '')
      missing.push('Nombre');
    if (!form.apellido || String(form.apellido).trim() === '')
      missing.push('Apellido');
    if (!form.dni || String(form.dni).trim() === '') missing.push('DNI');
    if (!form.email || String(form.email).trim() === '') missing.push('Email');
    // En tu caso comentaste que teléfono es obligatorio en el backend: validar aquí también
    if (!form.n_telefono || String(form.n_telefono).trim() === '')
      missing.push('Teléfono');
    if (!form.id_planta || String(form.id_planta).trim() === '')
      missing.push('Planta');
    if (!form.id_rol || String(form.id_rol).trim() === '') missing.push('Rol');

    if (missing.length > 0) {
      const human = missing.join(', ');
      openErrorModal(
        'Faltan datos obligatorios',
        `Completa los siguientes campos: ${human}.`
      );
      return false;
    }

    // validación simple de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(String(form.email))) {
      openErrorModal('Email inválido', 'Ingresa un correo electrónico válido.');
      return false;
    }

    // validación simple DNI numérico
    if (isNaN(Number(String(form.dni)))) {
      openErrorModal('DNI inválido', 'DNI debe ser numérico.');
      return false;
    }

    return true;
  };

  // Envío del formulario (crear / editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateFormBeforeSubmit()) return;

    // Validación: email único (case-insensitive). Permitir si estamos editando el mismo usuario.
    try {
      const emailNormalized = String(form.email || '')
        .trim()
        .toLowerCase();
      if (emailNormalized) {
        const exists = usuarios.some(
          (u) =>
            String(u.email || '')
              .trim()
              .toLowerCase() === emailNormalized &&
            // si editando, ignorar el propio registro
            String(u.id_usuario) !== String(editandoId ?? '')
        );
        if (exists) {
          openErrorModal(
            'Email duplicado',
            'Ya existe un usuario registrado con ese correo electrónico.'
          );
          return;
        }
      }
    } catch (e) {
      // Si por alguna razón falla la validación local, no bloquear el envío
      console.warn('Validación de email duplicado falló:', e);
    }

    const url = editandoId ? `/usuarios/${editandoId}` : '/usuarios';
    const method = editandoId ? 'put' : 'post';

    try {
      // Normalizar id_planta si viene como objeto Select
      const payload = { ...form };
      if (payload.id_planta && typeof payload.id_planta === 'object') {
        payload.id_planta =
          payload.id_planta.value ?? payload.id_planta.id_planta;
      }

      const res = await api[method](url, payload);
      // si necesitás leer res.data lo podés usar: const body = res.data;

      setForm({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        password: '',
        estado: 'Activo',
        id_rol: '',
        id_planta: '',
        n_telefono: '',
      });
      setEditandoId(null);
      setPaginaActual(1);
      await fetchUsuarios();
      openSuccessModal(
        'Cambios realizados',
        editandoId
          ? 'Usuario modificado correctamente.'
          : 'Usuario creado correctamente.'
      );
      showToast('success', 'Guardado');
    } catch (err) {
      openErrorModal(
        'No se pudo guardar',
        err?.response?.data?.error || err?.message || 'Revisa los datos.'
      );
    }
  };

  const tryReadJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  const handleEditar = (u) => {
    setForm({
      nombre: u.nombre,
      apellido: u.apellido,
      dni: u.dni,
      email: u.email,
      password: '',
      estado: normalizeLabel(u.estado),
      id_rol: u.id_rol,
      id_planta: parseInt(u.id_planta, 10) || '',
      n_telefono: u.n_telefono || '',
    });
    setEditandoId(u.id_usuario);

    // scroll suave con offset y foco
    try {
      if (formRef.current) {
        const OFFSET = window.innerWidth < 640 ? 72 : 112;
        const rect = formRef.current.getBoundingClientRect();
        const targetTop = rect.top + window.scrollY - OFFSET;
        window.scrollTo({ top: targetTop, behavior: 'smooth' });
      }
      setTimeout(() => {
        nombreInputRef.current?.focus();
      }, 300);
    } catch {}
  };

  const handleEliminar = async (id) => {
    setConfirmDelete({
      open: true,
      id,
      nombre:
        (usuarios.find((u) => u.id_usuario === id)?.nombre ?? '') +
        ' ' +
        (usuarios.find((u) => u.id_usuario === id)?.apellido ?? ''),
    });
  };

  // Eliminar / desactivar usuario
  const confirmEliminarNow = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ open: false, id: null, nombre: '' });
    if (!id) return;
    try {
      await api.put(`/usuarios/${id}`, { estado: false });
      await fetchUsuarios();
      openSuccessModal(
        'Perfil desactivado',
        'El usuario fue desactivado correctamente.'
      );
      showToast('success', 'Usuario desactivado');
      setMostrarEstadoFilter('Inactivos');
      setPaginaActual(1);
    } catch (err) {
      openErrorModal(
        'No se pudo desactivar el usuario',
        err?.response?.data?.error || err?.message || 'Intenta de nuevo.'
      );
    }
  };

  // utils: normalizar estado
  const isActivo = (raw) => {
    const v = raw;
    if (v === true) return true;
    if (v === false) return false;
    if (typeof v === 'number') return v === 1;
    const s = String(v ?? '')
      .trim()
      .toLowerCase();
    if (s === 'activo' || s === 'true' || s === '1') return true;
    if (s === 'inactivo' || s === 'false' || s === '0') return false;
    return false;
  };
  const estadoLabel = (raw) => (isActivo(raw) ? 'Activo' : 'Inactivo');
  const normalizeLabel = (raw) => (isActivo(raw) ? 'Activo' : 'Inactivo');

  // Toggle estado con fallback PUT y modales de feedback
  const handleToggleEstado = async (usuario) => {
    const nuevoEstado = isActivo(usuario.estado) ? 'Inactivo' : 'Activo';

    const normalizePlantaId = (raw) => {
      if (raw === null || raw === undefined) return null;
      if (typeof raw === 'number')
        return Number.isFinite(raw) && raw > 0 ? raw : null;
      const s = String(raw).trim();
      if (s === '') return null;
      const n = parseInt(s, 10);
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    try {
      // 1) PATCH mínimo (si existe)
      try {
        await api.patch(`/usuarios/${usuario.id_usuario}`, {
          estado: nuevoEstado,
        });
      } catch (err) {
        // 2) Fallback PUT con objeto completo usando memoria y planta válida
        const usuarioCompleto =
          usuarios.find(
            (u) => String(u.id_usuario) === String(usuario.id_usuario)
          ) || usuario;

        let idPlanta = normalizePlantaId(usuarioCompleto.id_planta);
        if (
          idPlanta == null &&
          usuarioCompleto.planta_nombre &&
          Array.isArray(plantas) &&
          plantas.length > 0
        ) {
          const match = plantas.find(
            (p) =>
              String(p.nombre || '')
                .trim()
                .toLowerCase() ===
              String(usuarioCompleto.planta_nombre || '')
                .trim()
                .toLowerCase()
          );
          idPlanta = normalizePlantaId(match?.id_planta);
        }
        if (idPlanta == null) idPlanta = normalizePlantaId(form.id_planta);
        if (idPlanta == null) {
          openErrorModal(
            'Planta inválida',
            'Asigna una planta válida (>0) al usuario antes de activar/inactivar.'
          );
          return;
        }

        const payloadPut = {
          ...usuarioCompleto,
          estado: nuevoEstado,
          id_planta: idPlanta,
        };
        delete payloadPut.planta_nombre;

        try {
          await api.put(`/usuarios/${usuario.id_usuario}`, payloadPut);
        } catch (putErr) {
          const errorMsg =
            putErr?.response?.data?.error ||
            putErr?.response?.data?.message ||
            putErr?.message ||
            'PUT failed';
          throw new Error(errorMsg);
        }
      }

      // Actualización optimista + refresh
      setUsuarios((prev) =>
        prev.map((u) =>
          String(u.id_usuario) === String(usuario.id_usuario)
            ? { ...u, estado: nuevoEstado }
            : u
        )
      );

      await fetchUsuarios();
      setMostrarEstadoFilter(
        nuevoEstado === 'Activo' ? 'Activos' : 'Inactivos'
      );
      setPaginaActual(1);

      openSuccessModal(
        nuevoEstado === 'Activo' ? 'Perfil activado' : 'Perfil desactivado',
        `Usuario ${usuario.nombre} ${
          usuario.apellido
        } ${nuevoEstado.toLowerCase()} correctamente.`
      );
      showToast(
        'success',
        nuevoEstado === 'Activo' ? 'Activado' : 'Inactivado'
      );
    } catch (err) {
      openErrorModal(
        'No se pudo actualizar el estado',
        (err && err.message) || 'Intenta nuevamente.'
      );
    }
  };

  /* ---------- Filtro + paginación ---------- */
  const usuariosFiltrados = useMemo(() => {
    const texto = filtro.toLowerCase();

    let resultado = usuarios
      .filter((u) => {
        if (mostrarEstadoFilter === 'Activos') return isActivo(u.estado);
        if (mostrarEstadoFilter === 'Inactivos') return !isActivo(u.estado);
        return true;
      })
      .filter(
        (u) =>
          String(u.dni ?? '')
            .toLowerCase()
            .includes(texto) ||
          (u.nombre || '').toLowerCase().includes(texto) ||
          (u.apellido || '').toLowerCase().includes(texto)
      );
    
    // Aplicar ordenamiento
    switch (ordenamiento) {
      case 'recientes':
        resultado.sort((a, b) => (b.id_usuario || 0) - (a.id_usuario || 0));
        break;
      case 'antiguos':
        resultado.sort((a, b) => (a.id_usuario || 0) - (b.id_usuario || 0));
        break;
      case 'az':
        resultado.sort((a, b) => 
          ((a.nombre || '') + ' ' + (a.apellido || '')).localeCompare((b.nombre || '') + ' ' + (b.apellido || ''))
        );
        break;
      case 'za':
        resultado.sort((a, b) => 
          ((b.nombre || '') + ' ' + (b.apellido || '')).localeCompare((a.nombre || '') + ' ' + (a.apellido || ''))
        );
        break;
      default:
        break;
    }
    
    return resultado;
  }, [usuarios, filtro, mostrarEstadoFilter, ordenamiento]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(usuariosFiltrados.length / itemsPorPagina)
  );
  const visibles = usuariosFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  /* ---------- Navegación ---------- */
  const irPagina = (n) =>
    setPaginaActual(Math.min(Math.max(n, 1), totalPaginas));

  /* ---------- Paginación ---------- */
  const renderPaginacion = () => {
    if (totalPaginas <= 1) return null;

    return (
      <div className="mt-8 flex justify-center items-center gap-2 flex-wrap">
        <button
          onClick={() => setPaginaActual((p) => Math.max(p - 1, 1))}
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
              onClick={() => setPaginaActual(page)}
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
              onClick={() => setPaginaActual(totalPaginas)}
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
          onClick={() => setPaginaActual((p) => Math.min(p + 1, totalPaginas))}
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
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Cargando datos...
      </div>
    );
  }

  /* ---------- Opciones Select ---------- */
  const plantaOptions = plantas
    .filter((p) => typeof p.id_planta !== 'undefined' && p.nombre)
    .map((p) => ({ value: String(p.id_planta), label: p.nombre }));
  const rolOptions = roles.map((r) => ({ value: r.id_rol, label: r.nombre }));
  const estadoOptions = estados.map((e) => ({ value: e, label: e }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:py-8 py-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center drop-shadow">
          {editandoId ? '👤 Modificar Usuario' : '👤 Agregar Usuario'}
        </h1>

        {/* Formulario */}
        <div
          ref={formRef}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6"
          style={{ scrollMarginTop: '112px' }}
        >
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <InputField
              label="Nombre"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              required
              placeholder="Ej. Juan, María, etc."
              inputRef={nombreInputRef}
            />
            <InputField
              label="Apellido"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              required
              placeholder="Ej. Pérez, Gómez, etc."
            />
            <InputField
              label="DNI"
              name="dni"
              type="number"
              value={form.dni}
              onChange={handleChange}
              required
              placeholder="Sin puntos ni espacios"
            />

            <InputField
              label="Teléfono"
              name="n_telefono"
              type="tel"
              value={form.n_telefono}
              onChange={handleChange}
              placeholder="Ej. 3794123456"
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="Ej. usuario@dominio.com"
            />
            <InputField
              label="Contraseña"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder={
                editandoId
                  ? 'Dejar vacío para mantener la actual'
                  : 'Mínimo 6 caracteres'
              }
            />

            <SelectField
              label="Planta"
              value={
                plantaOptions.find((o) => o.value === String(form.id_planta)) ||
                null
              }
              onChange={(selected) =>
                setForm((prev) => ({
                  ...prev,
                  id_planta: selected ? selected.value : '',
                }))
              }
              options={plantaOptions}
              placeholder="Seleccione una planta"
              required
            />
            <SelectField
              label="Rol"
              value={rolOptions.find((o) => o.value === form.id_rol) || null}
              onChange={(selected) =>
                setForm((prev) => ({
                  ...prev,
                  id_rol: selected ? selected.value : '',
                }))
              }
              options={rolOptions}
              placeholder="Seleccione un rol"
              required
            />
            <SelectField
              label="Estado"
              value={estadoOptions.find((o) => o.value === form.estado) || null}
              onChange={(selected) =>
                setForm((prev) => ({
                  ...prev,
                  estado: selected ? selected.value : 'Activo',
                }))
              }
              options={estadoOptions}
              placeholder="Seleccione el estado"
            />

            <div className="sm:col-span-3 flex justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow"
              >
                {editandoId ? 'Guardar Cambios' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>

        {/* Listado + Filtros + Paginación */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
            <span className="text-green-600 text-xl">📋</span>
            Usuarios Registrados
          </h2>

          <div className="mb-6 flex flex-col sm:flex-row gap-3 items-end">
            {/* Búsqueda */}
            <div className="w-72 min-w-0">
              <InputField
                label="Buscar por DNI, nombre o apellido"
                name="filtro"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Escriba para filtrar..."
              />
            </div>

            {/* Filtros de estado y ordenamiento apilados en la derecha */}
            <div className="flex flex-col gap-1 ml-auto">
              {/* Filtros de estado */}
              <div className="flex items-center gap-2">
                <label className="font-semibold text-xs text-gray-700 whitespace-nowrap">
                  Mostrar:
                </label>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => {
                      setMostrarEstadoFilter('Todos');
                      setPaginaActual(1);
                    }}
                    className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                      mostrarEstadoFilter === 'Todos'
                        ? 'bg-green-700 text-white shadow'
                        : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    onClick={() => {
                      setMostrarEstadoFilter('Activos');
                      setPaginaActual(1);
                    }}
                    className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                      mostrarEstadoFilter === 'Activos'
                        ? 'bg-green-700 text-white shadow'
                        : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                    }`}
                  >
                    Activos
                  </button>
                  <button
                    onClick={() => {
                      setMostrarEstadoFilter('Inactivos');
                      setPaginaActual(1);
                    }}
                    className={`px-2 py-1 rounded-full text-xs font-semibold transition ${
                      mostrarEstadoFilter === 'Inactivos'
                        ? 'bg-green-700 text-white shadow'
                        : 'bg-white text-green-700 border border-green-700 hover:bg-green-50'
                    }`}
                  >
                    Inact.
                  </button>
                </div>
              </div>

              {/* Selector de ordenamiento */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => { setOrdenamiento('recientes'); setPaginaActual(1); }}
                  className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                    ordenamiento === 'recientes'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                  }`}
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
                >
                  🔤 Z-A
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl ring-1 ring-gray-200">
            {visibles.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {visibles.map((u, idx) => (
                  <li
                    key={u.id_usuario}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 transition ${
                      idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    } hover:bg-green-50`}
                  >
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <span className="font-semibold text-green-700">
                          {u.nombre} {u.apellido}
                        </span>{' '}
                        — DNI: <span className="font-mono">{u.dni}</span>
                      </p>
                      <p>
                        <span className="text-gray-600">{u.email}</span> — Tel:{' '}
                        {u.n_telefono || '—'} — Rol:{' '}
                        <span className="font-medium text-gray-800">
                          {u.id_rol === 2
                            ? 'Supervisor'
                            : u.id_rol === 1
                            ? 'Super Usuario'
                            : 'Usuario'}
                        </span>
                      </p>
                      <p>
                        Planta:{' '}
                        <span className="font-medium text-gray-800">
                          {u.planta_nombre || `ID ${u.id_planta}`}
                        </span>{' '}
                        — Estado:{' '}
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            isActivo(u.estado)
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {estadoLabel(u.estado)}
                        </span>{' '}
                        — Creado:{' '}
                        <span className="text-gray-600">
                          {u.creado_en
                            ? new Date(u.creado_en).toLocaleDateString()
                            : '—'}
                        </span>
                      </p>
                    </div>

                    <div className="mt-3 sm:mt-0 flex gap-2">
                      <button
                        onClick={() => handleEditar(u)}
                        className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition flex items-center gap-1"
                      >
                        ✏️ Editar
                      </button>

                      <button
                        onClick={() => handleToggleEstado(u)}
                        className={`px-3 py-2 rounded-lg text-sm transition flex items-center gap-1 ${
                          isActivo(u.estado)
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {isActivo(u.estado) ? '🚫 Desactivar' : '✅ Activar'}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-6">
                No se encontraron usuarios.
              </p>
            )}
          </div>
        </div>

        {totalPaginas > 1 && (
          <div className="mt-[-8px] sm:mt-[-4px] flex justify-center items-center gap-2 flex-wrap">
            {renderPaginacion()}
          </div>
        )}
      </div>

      {/* Modales */}
      <Modal
        open={confirmDelete.open}
        title="Confirmar desactivación"
        onClose={() => setConfirmDelete({ open: false, id: null, nombre: '' })}
        actions={
          <button
            type="button"
            onClick={confirmEliminarNow}
            className="px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700"
          >
            Desactivar
          </button>
        }
      >
        <p>
          ¿Desactivar el perfil de “{confirmDelete.nombre}”? Podrás reactivarlo
          luego desde la lista de inactivos.
        </p>
      </Modal>

      <Modal
        open={modalError.open}
        title={modalError.title || 'Error'}
        onClose={closeErrorModal}
        actions={null}
      >
        <p>{modalError.text}</p>
      </Modal>

      <Modal
        open={modalSuccess.open}
        title={modalSuccess.title || 'Operación exitosa'}
        onClose={closeSuccessModal}
        actions={null}
      >
        <p>{modalSuccess.text}</p>
      </Modal>

      {/* Toast */}
      <Toast
        show={toast.show}
        type={toast.type}
        text={toast.text}
        onClose={() => setToast({ show: false, type: 'success', text: '' })}
      />
    </div>
  );
};

export default AgregarUsuarioPage;

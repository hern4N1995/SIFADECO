import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import api from 'src/services/api';
import AppNotification from 'src/components/AppNotification';

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

const estados = ['Activo', 'Inactivo'];

const normalizarEstado = (estado) => {
  if (typeof estado === 'boolean') return estado ? 'Activo' : 'Inactivo';
  const valor = String(estado || '').toLowerCase().trim();
  if (valor === 'activo' || valor === 'true' || valor === '1') return 'Activo';
  return 'Inactivo';
};

export default function VeterinariosPage() {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    matricula: '',
    dni: '',
    email: '',
    n_telefono: '',
    estado: 'Activo',
    id_planta: '',
    planta_nombre: '',
  });

  const [veterinarios, setVeterinarios] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [tipoFeedback, setTipoFeedback] = useState('success');
  const feedbackTimeoutRef = useRef(null);
  const [confirmAction, setConfirmAction] = useState({ open: false, vet: null, nuevoEstado: null });
  const [filtro, setFiltro] = useState('');
  const [esMovil, setEsMovil] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const mostrarFeedback = (mensaje, tipo = 'success', duracion = 3200) => {
    setTipoFeedback(tipo);
    setMensajeFeedback(mensaje);
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => setMensajeFeedback(''), duracion);
  };

  useEffect(() => {
    fetchVeterinarios();
    fetchPlantas();
  }, []);

  const fetchVeterinarios = async () => {
    try {
      const { data } = await api.get('/veterinarios');
      const lista = Array.isArray(data)
        ? data.map((v) => ({ ...v, estado: normalizarEstado(v.estado) }))
        : [];
      setVeterinarios(lista);
    } catch (err) {
      console.error('Error al cargar veterinarios:', err);
      mostrarFeedback('No se pudieron cargar los veterinarios', 'error');
      setVeterinarios([]);
    }
  };

  const fetchPlantas = async () => {
    try {
      const { data } = await api.get('/plantas');
      setPlantas(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar plantas:', err);
      mostrarFeedback('No se pudieron cargar las plantas', 'error');
      setPlantas([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setForm({
      nombre: '',
      apellido: '',
      matricula: '',
      dni: '',
      email: '',
      n_telefono: '',
      estado: 'Activo',
      id_planta: '',
      planta_nombre: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.nombre.trim() ||
      !form.apellido.trim() ||
      !form.matricula.trim()
    ) {
      mostrarFeedback('Nombre, apellido y matrícula son obligatorios', 'error');
      return;
    }

    try {
      if (editandoId) {
        await api.put(`/veterinarios/${editandoId}`, form);
        mostrarFeedback('Veterinario actualizado correctamente');
      } else {
        await api.post('/veterinarios', form);
        mostrarFeedback('Veterinario creado correctamente');
      }
      resetForm();
      setEditandoId(null);
      await fetchVeterinarios();
    } catch (err) {
      console.error('Error al guardar:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Error al guardar el veterinario';
      mostrarFeedback(msg, 'error');
    }
  };

  const iniciarEdicion = (v) => {
    setForm({
      nombre: v.nombre,
      apellido: v.apellido,
      matricula: v.matricula,
      dni: v.dni || '',
      email: v.email || '',
      n_telefono: v.n_telefono || '',
      estado: normalizarEstado(v.estado),
      id_planta: v.id_planta || '',
      planta_nombre: v.planta_nombre || '',
    });
    setEditandoId(v.id_veterinario || v.id);
  };

  const cambiarEstadoVeterinario = async (v, nuevoEstado) => {
    const id = v.id_veterinario || v.id;

    try {
      await api.patch(`/veterinarios/${id}/estado`, { estado: nuevoEstado });
      mostrarFeedback(
        nuevoEstado === 'Activo'
          ? 'Veterinario habilitado correctamente'
          : 'Veterinario deshabilitado correctamente'
      );
      if (editandoId === id) {
        resetForm();
        setEditandoId(null);
      }
      await fetchVeterinarios();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Error al cambiar el estado del veterinario';
      mostrarFeedback(msg, 'error');
    } finally {
      setConfirmAction({ open: false, vet: null, nuevoEstado: null });
    }
  };

  const solicitarCambioEstado = (v, nuevoEstado) => {
    setConfirmAction({ open: true, vet: v, nuevoEstado });
  };

  const eliminarVeterinario = (v) => solicitarCambioEstado(v, 'Inactivo');

  const veterinariosFiltrados = veterinarios.filter((v) => {
    const texto = filtro.toLowerCase();
    return (
      (v.nombre || '').toLowerCase().includes(texto) ||
      (v.apellido || '').toLowerCase().includes(texto) ||
      String(v.matricula || '')
        .toLowerCase()
        .includes(texto) ||
      String(v.dni || '')
        .toLowerCase()
        .includes(texto)
    );
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 drop-shadow mb-6">
          👩‍⚕️ {editandoId ? 'Modificar Veterinario' : 'Agregar Veterinario'}
        </h1>
        <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 space-y-6">

          <AppNotification
            show={Boolean(mensajeFeedback)}
            message={mensajeFeedback}
            type={tipoFeedback}
            onClose={() => setMensajeFeedback('')}
            errorTitle="Atención"
          />

          {/* Modal de confirmación de cambio de estado */}
          {confirmAction.open && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setConfirmAction({ open: false, vet: null, nuevoEstado: null })}
              />
              <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  {confirmAction.nuevoEstado === 'Inactivo' ? 'Deshabilitar veterinario' : 'Habilitar veterinario'}
                </h3>
                <p className="text-sm text-gray-700 mb-6">
                  {'¿Estás seguro que querés '}
                  {confirmAction.nuevoEstado === 'Inactivo' ? 'deshabilitar' : 'habilitar'} a{' '}
                  <strong>{confirmAction.vet?.nombre} {confirmAction.vet?.apellido}</strong>?
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setConfirmAction({ open: false, vet: null, nuevoEstado: null })}
                    className="px-4 py-2 border rounded text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => cambiarEstadoVeterinario(confirmAction.vet, confirmAction.nuevoEstado)}
                    className={`px-4 py-2 text-white text-sm rounded ${
                      confirmAction.nuevoEstado === 'Inactivo'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                  >
                    {confirmAction.nuevoEstado === 'Inactivo' ? 'Deshabilitar' : 'Habilitar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Formulario */}
          <form
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Nombre
              </label>
              <input
                name="nombre"
                value={form.nombre}
                onChange={handleChange}
                placeholder="Nombre"
                required
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Apellido
              </label>
              <input
                name="apellido"
                value={form.apellido}
                onChange={handleChange}
                placeholder="Apellido"
                required
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Matrícula
              </label>
              <input
                name="matricula"
                value={form.matricula}
                onChange={handleChange}
                placeholder="Matrícula"
                required
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                DNI
              </label>
              <input
                name="dni"
                value={form.dni}
                onChange={handleChange}
                placeholder="DNI"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <div className="flex flex-col">
              <label className="mb-2 font-semibold text-gray-700 text-sm">
                Teléfono
              </label>
              <input
                name="n_telefono"
                value={form.n_telefono}
                onChange={handleChange}
                placeholder="Teléfono"
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>

            <SelectField
              label="Planta"
              value={
                form.id_planta
                  ? {
                      value: String(form.id_planta),
                      label:
                        plantas.find(
                          (p) =>
                            String(p.id_planta ?? p.id) ===
                            String(form.id_planta)
                        )?.nombre ||
                        form.planta_nombre ||
                        `ID ${form.id_planta}`,
                    }
                  : null
              }
              onChange={(s) =>
                setForm((prev) => ({
                  ...prev,
                  id_planta: s?.value || '',
                  planta_nombre: s?.label || '',
                }))
              }
              options={plantas.map((p) => ({
                value: String(p.id_planta ?? p.id),
                label: p.nombre,
              }))}
              placeholder="Seleccionar planta"
            />

            <SelectField
              label="Estado"
              value={{ value: form.estado, label: form.estado }}
              onChange={(s) =>
                setForm((prev) => ({ ...prev, estado: s?.value || 'Activo' }))
              }
              options={estados.map((e) => ({ value: e, label: e }))}
              placeholder="Seleccionar estado"
            />

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition text-sm font-semibold"
              >
                {editandoId ? '💾 Guardar Cambios' : '➕ Guardar'}
              </button>
            </div>
          </form>

          {/* Lista de veterinarios */}
          {esMovil ? (
            <div className="space-y-4 mt-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Veterinarios Registrados
              </h3>
              <input
                type="text"
                placeholder="🔍 Buscar veterinario"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
              {veterinariosFiltrados.length > 0 ? (
                veterinariosFiltrados.map((v) => (
                  <div
                    key={v.id_veterinario || v.id}
                    className="bg-gray-50 p-4 rounded-xl shadow border border-gray-200"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 space-y-1 text-sm text-gray-700">
                        <p className="font-semibold text-gray-800">
                          {v.nombre} {v.apellido}
                        </p>
                        <p>Matrícula: {v.matricula}</p>
                        <p>DNI: {v.dni || '—'}</p>
                        <p>Email: {v.email || '—'}</p>
                        <p>Tel: {v.n_telefono || '—'}</p>
                        <p>
                          Planta: {v.planta_nombre || `ID ${v.id_planta || ''}`}
                        </p>
                        <p>Estado: {v.estado || '—'}</p>
                      </div>
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => iniciarEdicion(v)}
                          className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() =>
                            v.estado === 'Activo'
                              ? eliminarVeterinario(v)
                              : solicitarCambioEstado(v, 'Activo')
                          }
                          className={`px-3 py-2 rounded-lg text-white text-sm transition ${
                            v.estado === 'Activo'
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          {v.estado === 'Activo' ? '🗑️' : '♻️'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No se encontraron veterinarios.</p>
              )}
            </div>
          ) : (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Veterinarios Registrados
              </h3>
              <input
                type="text"
                placeholder="🔍 Buscar veterinario"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50 mb-4"
              />
              <div className="rounded-xl ring-1 ring-gray-200">
                <table className="w-full table-fixed text-sm text-gray-700">
                  <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                    <tr>
                      <th className="px-3 py-2 text-left font-semibold">
                        Nombre
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Matrícula
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">DNI</th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Contacto
                      </th>
                      <th className="px-3 py-2 text-left font-semibold">
                        Planta / Estado
                      </th>
                      <th className="px-3 py-2 text-center font-semibold">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {veterinariosFiltrados.map((v) => (
                      <tr
                        key={v.id_veterinario || v.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-3 py-2 truncate">
                          {v.nombre} {v.apellido}
                        </td>
                        <td className="px-3 py-2 truncate">{v.matricula}</td>
                        <td className="px-3 py-2 truncate">{v.dni || '—'}</td>
                        <td className="px-3 py-2 truncate">
                          {v.email || '-'} · {v.n_telefono || '-'}
                        </td>
                        <td className="px-3 py-2 truncate">
                          {v.planta_nombre || `ID ${v.id_planta || ''}`} ·{' '}
                          {normalizarEstado(v.estado) === 'Activo' ? '✅' : '❌'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex justify-center gap-2">
                            <button
                              onClick={() => iniciarEdicion(v)}
                              className="px-2 py-1 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() =>
                                v.estado === 'Activo'
                                  ? eliminarVeterinario(v)
                                  : solicitarCambioEstado(v, 'Activo')
                              }
                              className={`px-2 py-1 rounded-lg text-white text-sm transition ${
                                v.estado === 'Activo'
                                  ? 'bg-red-600 hover:bg-red-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700'
                              }`}
                            >
                              {v.estado === 'Activo' ? '🗑️' : '♻️'}
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
        </div>
      </div>
    </div>
  );
}

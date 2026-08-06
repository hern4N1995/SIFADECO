import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import api from 'src/services/api';

/* ------------------------------------------------------------------ */
/*  Modal Component para confirmaciones y mensajes                   */
/* ------------------------------------------------------------------ */
function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  type = 'confirm',
  action = 'confirm', // 'create', 'update', 'delete'
}) {
  if (!isOpen) return null;

  const isSuccess = type === 'success';
  const isError = type === 'error';

  const getConfirmButtonText = () => {
    if (action === 'create') return 'Crear';
    if (action === 'update') return 'Actualizar';
    if (action === 'delete') return 'Eliminar';
    return 'Confirmar';
  };

  const getConfirmButtonColor = () => {
    if (action === 'delete') return 'bg-red-600 hover:bg-red-700';
    if (action === 'create') return 'bg-green-600 hover:bg-green-700';
    if (action === 'update') return 'bg-blue-600 hover:bg-blue-700';
    return 'bg-green-600 hover:bg-green-700';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in">
        <div className="flex items-center justify-center mb-4">
          {isSuccess && <div className="text-4xl">✅</div>}
          {isError && <div className="text-4xl">❌</div>}
          {type === 'confirm' && <div className="text-4xl">⚠️</div>}
        </div>

        <h2 className="text-xl font-bold text-center text-gray-800 mb-2">
          {title}
        </h2>
        <p className="text-center text-gray-600 mb-6">{message}</p>

        <div className="flex gap-3 justify-center">
          {type === 'confirm' && (
            <>
              <button
                onClick={onCancel}
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className={`px-6 py-2 rounded-lg text-white transition font-semibold ${getConfirmButtonColor()}`}
              >
                {getConfirmButtonText()}
              </button>
            </>
          )}
          {(isSuccess || isError) && (
            <button
              onClick={onConfirm}
              className="px-6 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition font-semibold"
            >
              Aceptar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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

export default function EspecieAdmin() {
  const [especies, setEspecies] = useState([]);
  const [form, setForm] = useState({ descripcion: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [esMovil, setEsMovil] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
    action: 'confirm',
    onConfirm: null,
  });

  useEffect(() => {
    const handleResize = () => setEsMovil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    fetchEspecies().finally(() => setLoading(false));
  }, []);

  const fetchEspecies = async () => {
    try {
      const { data } = await api.get('/especies');
      setEspecies(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error al cargar especies:', err);
      setEspecies([]);
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: '❌ Error cargando especies',
        onConfirm: () => setModal({ ...modal, isOpen: false }),
      });
    }
  };

  const resetForm = () => {
    setForm({ descripcion: '' });
    setEditandoId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.descripcion.trim()) {
      setModal({
        isOpen: true,
        type: 'error',
        title: 'Error',
        message: '❌ La descripción es obligatoria',
        onConfirm: () => setModal({ ...modal, isOpen: false }),
      });
      return;
    }

    const payload = { descripcion: form.descripcion.trim() };

    setModal({
      isOpen: true,
      type: 'confirm',
      action: editandoId ? 'update' : 'create',
      title: editandoId ? 'Confirmar actualización' : 'Confirmar creación',
      message: editandoId
        ? '¿Deseas actualizar esta especie?'
        : '¿Deseas crear esta especie?',
      onConfirm: async () => {
        try {
          if (editandoId) {
            await api.put(`/especies/${editandoId}`, payload);
            setModal({
              isOpen: true,
              type: 'success',
              title: '¡Actualizado!',
              message: 'La especie se actualizó correctamente',
              onConfirm: () => {
                setModal({ ...modal, isOpen: false });
                resetForm();
                fetchEspecies();
              },
            });
          } else {
            await api.post('/especies', payload);
            setModal({
              isOpen: true,
              type: 'success',
              title: '¡Creado!',
              message: 'La especie se creó correctamente',
              onConfirm: () => {
                setModal({ ...modal, isOpen: false });
                resetForm();
                fetchEspecies();
              },
            });
          }
        } catch (err) {
          console.error('handleSubmit', err);
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Error al guardar la especie';
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: msg,
            onConfirm: () => setModal({ ...modal, isOpen: false }),
          });
        }
      },
    });
  };

  const iniciarEdicion = (e) => {
    setForm({ descripcion: e.descripcion });
    setEditandoId(e.id_especie);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const eliminar = (id) => {
    setModal({
      isOpen: true,
      type: 'confirm',
      action: 'delete',
      title: 'Eliminar Especie',
      message:
        '¿Estás seguro de que deseas eliminar esta especie? Esta acción no se puede deshacer.',
      onConfirm: async () => {
        try {
          await api.delete(`/especies/${id}`);
          setModal({
            isOpen: true,
            type: 'success',
            title: '¡Eliminado!',
            message: 'La especie se eliminó correctamente',
            onConfirm: () => {
              setModal({ ...modal, isOpen: false });
              if (editandoId === id) resetForm();
              fetchEspecies();
            },
          });
        } catch (err) {
          console.error('eliminar', err);
          const msg =
            err.response?.data?.message ||
            err.message ||
            'Error al eliminar la especie';
          setModal({
            isOpen: true,
            type: 'error',
            title: 'Error',
            message: msg,
            onConfirm: () => setModal({ ...modal, isOpen: false }),
          });
        }
      },
    });
  };

  const especiesFiltradas = especies.filter((e) =>
    (e.descripcion || '').toLowerCase().includes(filtro.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-lg">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ConfirmModal
        isOpen={modal.isOpen}
        type={modal.type}
        title={modal.title}
        message={modal.message}
        action={modal.action}
        onConfirm={() => {
          if (modal.onConfirm) modal.onConfirm();
          else setModal({ ...modal, isOpen: false });
        }}
        onCancel={() => setModal({ ...modal, isOpen: false })}
      />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-center text-gray-800 drop-shadow mb-6">
            🦁 {editandoId ? 'Editar Especie' : 'Agregar Especie'}
          </h1>
          <div className="w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6 space-y-6">

            {/* Formulario */}
            <form
              onSubmit={handleSubmit}
              className="max-w-4xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4"
            >
              <div className="flex flex-col sm:col-span-2">
                <label className="mb-1 sm:mb-2 font-semibold text-gray-700 text-xs sm:text-sm">
                  Descripción
                </label>
                <input
                  type="text"
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  placeholder="Descripción de la especie"
                  required
                  className="w-full border-2 border-gray-200 rounded-lg px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-green-600 text-white px-2 sm:px-4 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition text-xs sm:text-sm font-semibold"
                >
                  {editandoId ? '💾 Guardar Cambios' : '➕ Guardar'}
                </button>
              </div>
            </form>

            {/* Botón Limpiar */}
            <div className="flex justify-center">
              <button
                onClick={resetForm}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-semibold"
              >
                Limpiar
              </button>
            </div>

            {/* Lista de especies */}
            {esMovil ? (
              <div className="space-y-4 mt-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Especies Registradas
                </h3>
                <input
                  type="text"
                  placeholder="🔍 Buscar especie"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
                />
                {especiesFiltradas.length > 0 ? (
                  especiesFiltradas.map((e) => (
                    <div
                      key={e.id_especie}
                      className="bg-gray-50 p-2 sm:p-4 rounded-xl shadow border border-gray-200"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1 text-sm text-gray-700">
                          <p className="font-semibold text-gray-800">
                            {e.descripcion}
                          </p>
                          <p>ID: {e.id_especie}</p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          <button
                            onClick={() => iniciarEdicion(e)}
                            className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminar(e.id_especie)}
                            className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No se encontraron especies.</p>
                )}
              </div>
            ) : (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Especies Registradas
                </h3>
                <input
                  type="text"
                  placeholder="🔍 Buscar especie"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50 mb-4"
                />
                <div className="rounded-xl ring-1 ring-gray-200">
                  <table className="w-full table-fixed text-sm text-gray-700">
                    <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                      <tr>
                        <th className="px-3 py-2 text-left font-semibold">
                          ID
                        </th>
                        <th className="px-3 py-2 text-left font-semibold">
                          Descripción
                        </th>
                        <th className="px-3 py-2 text-center font-semibold">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {especiesFiltradas.map((e) => (
                        <tr
                          key={e.id_especie}
                          className="hover:bg-gray-50 transition"
                        >
                          <td className="px-3 py-2 truncate">{e.id_especie}</td>
                          <td className="px-3 py-2 truncate">
                            {e.descripcion}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => iniciarEdicion(e)}
                                className="px-2 py-1 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => eliminar(e.id_especie)}
                                className="px-2 py-1 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {especiesFiltradas.length === 0 && (
                  <p className="text-center text-gray-500 mt-4">
                    No se encontraron especies.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

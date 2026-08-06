import { useEffect, useState } from 'react';
import api from '../services/api';

/* ------------------------------------------------------------------ */
/*  InputField reutilizable                                           */
/* ------------------------------------------------------------------ */
const InputField = ({
  label,
  name,
  value,
  onChange,
  required = false,
  type = 'text',
  disabled = false,
  placeholder = '',
}) => (
  <div className="flex flex-col">
    <label className="mb-2 font-semibold text-gray-700 text-sm">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      disabled={disabled}
      placeholder={placeholder}
      className={`w-full border-2 rounded-lg px-4 py-3 text-sm transition-all duration-200 ${
        disabled
          ? 'bg-gray-100 border-gray-200 text-gray-500'
          : 'bg-gray-50 border-gray-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300'
      }`}
    />
  </div>
);

export default function PerfilPage() {
  const [usuario, setUsuario] = useState(null);
  const [form, setForm] = useState({ email: '', n_telefono: '' });
  const [editMode, setEditMode] = useState({ email: false, n_telefono: false });
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    api
      .get('/usuarios/perfil', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setUsuario(res.data);
        setForm({
          email: res.data.email,
          n_telefono: res.data.n_telefono || '',
        });
      })
      .catch(() => setMensaje('Error al cargar perfil.'));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const buildPayload = () => {
    const payload = {};
    if (form.email !== usuario.email) {
      payload.email = form.email;
    }
    if (form.n_telefono !== usuario.n_telefono) {
      payload.n_telefono = form.n_telefono;
    }
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    const payload = buildPayload();

    if (Object.keys(payload).length === 0) {
      setMensaje('⚠️ No hay cambios para guardar.');
      setLoading(false);
      return;
    }

    try {
      await api.put('/usuarios/perfil', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMensaje('✅ Datos actualizados correctamente.');
      setEditMode({ email: false, n_telefono: false });
    } catch (err) {
      console.error('❌ Error al actualizar perfil:', err);
      setMensaje('❌ Error al actualizar datos.');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = (field) => {
    setEditMode((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const cancelEdit = (field) => {
    setForm((prev) => ({ ...prev, [field]: usuario[field] || '' }));
    setEditMode((prev) => ({ ...prev, [field]: false }));
  };

  if (!usuario)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ Cargando perfil...
      </div>
    );

  const formatFecha = (f) =>
    new Date(f).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:py-8 py-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Encabezado */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center drop-shadow">
          👤 Mi Perfil
        </h1>

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {/* Datos no editables */}
            <InputField label="Nombre" value={usuario.nombre} disabled />
            <InputField label="Apellido" value={usuario.apellido} disabled />
            <InputField label="DNI" value={usuario.dni} disabled />
            <InputField
              label="Fecha de creación"
              value={formatFecha(usuario.creado_en)}
              disabled
            />
            <InputField label="Planta" value={usuario.planta} disabled />
            <InputField label="Rol" value={usuario.rol} disabled />

            {/* Email editable */}
            <div className="flex flex-col">
              <InputField
                label="Email"
                name="email"
                value={form.email}
                onChange={handleChange}
                disabled={!editMode.email}
                type="email"
              />
              <div className="mt-2 flex gap-2">
                {!editMode.email ? (
                  <button
                    type="button"
                    onClick={() => toggleEdit('email')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition shadow"
                  >
                    ✏️ Modificar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => cancelEdit('email')}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm hover:bg-gray-500 transition shadow"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Teléfono editable */}
            <div className="flex flex-col">
              <InputField
                label="Teléfono"
                name="n_telefono"
                value={form.n_telefono}
                onChange={handleChange}
                disabled={!editMode.n_telefono}
                type="tel"
              />
              <div className="mt-2 flex gap-2">
                {!editMode.n_telefono ? (
                  <button
                    type="button"
                    onClick={() => toggleEdit('n_telefono')}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition shadow"
                  >
                    ✏️ Modificar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => cancelEdit('n_telefono')}
                    className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm hover:bg-gray-500 transition shadow"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Botón guardar */}
            <div className="sm:col-span-2 flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || (!editMode.email && !editMode.n_telefono)}
                className={`px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition ${
                  loading || (!editMode.email && !editMode.n_telefono)
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>

          {/* Mensaje */}
          {mensaje && (
            <div className="mt-4 flex items-center gap-2 text-green-700">
              <span className="text-lg">✅</span>
              <span>{mensaje}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

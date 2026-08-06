import React, { useState, useEffect, useMemo } from 'react';
import api from 'src/services/api';

/* ------------------------------------------------------------------ */
/*  InputField institucional (igual que TropaForm / UsuarioPage)      */
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
  inputMode = 'text',
  maxLength = undefined,
  pattern = undefined,
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-2 font-semibold text-gray-700 text-sm">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      pattern={pattern}
      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
    />
  </div>
);

export default function ProductorAdmin() {
  const [nuevoProductor, setNuevoProductor] = useState({
    cuit: '',
    nombre: '',
  });
  const [productores, setProductores] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [ordenamiento, setOrdenamiento] = useState('recientes'); // recientes, antiguos, az, za
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal edit state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPayload, setEditingPayload] = useState(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const itemsPorPagina = window.innerWidth < 768 ? 2 : 4;

  useEffect(() => {
    fetchProductores().finally(() => setLoading(false));
  }, []);

  const fetchProductores = async () => {
    try {
      const res = await api.get('/productores', { timeout: 10000 });
      const data = res?.data ?? [];
      setProductores(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching productores:', err);
      setError('Error al cargar productores');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoProductor((prev) => ({ ...prev, [name]: value }));
  };

  // Normalizar CUIT: solo dígitos, máximo 11
  const normalizarCuit = (value) => value.replace(/\D/g, '').slice(0, 11);

  // Formatear CUIT para mostrar con guiones (XX-XXXXXXXX-X)
  const formatearCuit = (value) => {
    const digits = normalizarCuit(String(value || ''));
    if (digits.length <= 2) return digits;
    if (digits.length <= 10) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return `${digits.slice(0, 2)}-${digits.slice(2, 10)}-${digits.slice(10)}`;
  };

  // Manejar cambio en CUIT (solo números, formatea automáticamente)
  const handleCuitChange = (e) => {
    const { value } = e.target;
    const normalized = normalizarCuit(value);
    const formatted = formatearCuit(normalized);
    setNuevoProductor((prev) => ({ ...prev, cuit: formatted }));
  };

  // Manejar cambio en CUIT para edición
  const handleCuitChangeEdit = (e) => {
    const { value } = e.target;
    const normalized = normalizarCuit(value);
    const formatted = formatearCuit(normalized);
    setEditingPayload((prev) => ({ ...prev, cuit: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    // Validar que CUIT tenga exactamente 11 dígitos
    const cuitDigitos = normalizarCuit(nuevoProductor.cuit);
    if (cuitDigitos.length !== 11) {
      setError('El CUIT debe tener exactamente 11 dígitos.');
      return;
    }

    try {
      const res = await api.post('/productores', {
        cuit: cuitDigitos, // Guardar solo números
        nombre: nuevoProductor.nombre,
      }, {
        timeout: 10000,
      });
      if (!(res && res.status >= 200 && res.status < 300))
        throw new Error('Error al guardar productor');
      setMensaje('Productor creado ✅');
      setNuevoProductor({ cuit: '', nombre: '' });
      setPaginaActual(1);
      await fetchProductores();
    } catch (err) {
      console.error('Error saving productor:', err);
      setError(
        err?.response?.data?.message ||
          err.message ||
          'Error al guardar productor'
      );
    }
  };

  const handleEditar = (p) => {
    // Open modal with producer data - formatear CUIT para mostrar
    const cuitFormateado = formatearCuit(p.cuit);
    setEditingPayload({ id_productor: p.id_productor, cuit: cuitFormateado, nombre: p.nombre });
    setEditModalOpen(true);
  };

  const guardarEdicion = async () => {
    if (!editingPayload?.id_productor) return;
    setMensaje('');
    setError('');

    // Validar que CUIT tenga exactamente 11 dígitos
    const cuitDigitos = normalizarCuit(editingPayload.cuit);
    if (cuitDigitos.length !== 11) {
      setError('El CUIT debe tener exactamente 11 dígitos.');
      return;
    }

    try {
      const res = await api.put(`/productores/${editingPayload.id_productor}`, {
        cuit: cuitDigitos, // Guardar solo números
        nombre: editingPayload.nombre,
      }, { timeout: 10000 });
      if (!(res && res.status >= 200 && res.status < 300)) throw new Error('Error al guardar productor');
      // Update list directly
      setProductores((prev) =>
        prev.map((p) => (p.id_productor === editingPayload.id_productor ? { ...p, cuit: cuitDigitos, nombre: editingPayload.nombre } : p))
      );
      setMensaje('✅ Productor modificado');
      setTimeout(() => setMensaje(''), 3000);
      setEditModalOpen(false);
      setEditingPayload(null);
    } catch (err) {
      console.error('Error saving productor:', err);
      setError(err?.response?.data?.message || err.message || 'Error al guardar productor');
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este productor?')) return;
    try {
      console.log(`[ProductorAdmin] Eliminando productor ID: ${id}`);
      const res = await api.delete(`/productores/${id}`, { timeout: 10000 });
      console.log(`[ProductorAdmin] Respuesta DELETE:`, res.status, res.data);
      if (!(res && res.status >= 200 && res.status < 300))
        throw new Error('Error al eliminar productor');
      console.log(`[ProductorAdmin] Productor eliminado exitosamente`);
      setPaginaActual(1);
      await fetchProductores();
    } catch (err) {
      console.error('[ProductorAdmin] Error deleting productor:', err);
      const errorMsg = err?.response?.data?.details || err?.response?.data?.message || err.message || 'Error al eliminar productor';
      console.error('[ProductorAdmin] Error detallado:', errorMsg);
      setError(errorMsg);
    }
  };

  const productoresFiltrados = useMemo(() => {
    const texto = filtro.toLowerCase();
    let resultado = productores.filter(
      (p) =>
        p.cuit.toString().includes(texto) ||
        p.nombre.toLowerCase().includes(texto)
    );
    
    // Aplicar ordenamiento
    switch (ordenamiento) {
      case 'recientes':
        resultado.sort((a, b) => (b.id_productor || 0) - (a.id_productor || 0));
        break;
      case 'antiguos':
        resultado.sort((a, b) => (a.id_productor || 0) - (b.id_productor || 0));
        break;
      case 'az':
        resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
        break;
      case 'za':
        resultado.sort((a, b) => b.nombre.localeCompare(a.nombre));
        break;
      default:
        break;
    }
    
    return resultado;
  }, [productores, filtro, ordenamiento]);

  const totalPaginas = Math.ceil(productoresFiltrados.length / itemsPorPagina);
  const visibles = productoresFiltrados.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  const irPagina = (n) =>
    setPaginaActual(Math.min(Math.max(n, 1), totalPaginas));
  const paginaAnterior = () => irPagina(paginaActual - 1);
  const paginaSiguiente = () => irPagina(paginaActual + 1);

  const renderPaginacion = () => {
    if (totalPaginas <= 1) return null;

    return (
      <div className="mt-[-4px] flex justify-center items-center gap-2 flex-wrap">
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
    );
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Cargando productores...
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:py-8 py-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center drop-shadow mb-8">
          👤 Agregar Productor
        </h1>
        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            <div>
              <InputField
                label="CUIT"
                name="cuit"
                value={nuevoProductor.cuit}
                onChange={handleCuitChange}
                required
                placeholder="Ej. 20-12345678-9"
                inputMode="numeric"
                maxLength={14}
                pattern="\d{2}-\d{8}-\d{1}"
              />
              <p className="text-red-600 text-xs mt-1 leading-tight">
                Si el número central tiene menos de 8 dígitos, complete con ceros a la izquierda.<br />
                Ejemplo: 20-008405430-2
              </p>
            </div>
            <InputField
              label="Nombre"
              name="nombre"
              value={nuevoProductor.nombre}
              onChange={handleChange}
              required
              placeholder="Ej. Juan Pérez"
            />
            <div className="flex items-end justify-end">
              <button
                type="submit"
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow"
              >
                Guardar
              </button>
            </div>
          </form>

          {mensaje && (
            <div className="mt-4 flex items-center gap-2 text-green-700">
              <span className="text-lg">✅</span>
              <span>{mensaje}</span>
            </div>
          )}
          {error && (
            <div className="mt-4 flex items-center gap-2 text-red-700">
              <span className="text-lg">❌</span>
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Edit modal overlay */}
        {editModalOpen && editingPayload && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={() => setEditModalOpen(false)} />
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Editar Productor</h3>
              {error && (
                <div className="mb-4 flex items-center gap-2 text-red-700 text-sm">
                  <span className="text-lg">❌</span>
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <InputField
                    label="CUIT"
                    name="cuit"
                    value={editingPayload.cuit}
                    onChange={handleCuitChangeEdit}
                    placeholder="Ej. 20-12345678-9"
                    inputMode="numeric"
                    maxLength={14}
                    pattern="\d{2}-\d{8}-\d{1}"
                  />
                  <p className="text-red-600 text-xs mt-1 leading-tight">
                    Si el número central tiene menos de 8 dígitos, complete con ceros a la izquierda.<br />
                    Ejemplo: 20-008405430-2
                  </p>
                </div>
                <InputField
                  label="Nombre"
                  name="nombre"
                  value={editingPayload.nombre}
                  onChange={(e) => setEditingPayload((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setEditModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">Cancelar</button>
                <button onClick={guardarEdicion} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Guardar</button>
              </div>
            </div>
          </div>
        )}

        {/* Listado */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Productores Registrados
          </h2>
          
          {/* Controles de búsqueda y ordenamiento */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                placeholder="Buscar por CUIT o nombre"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
              />
            </div>
            
            {/* Selector de ordenamiento con opciones visuales */}
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

          <div className="mt-4 rounded-xl ring-1 ring-gray-200">
            {visibles.length > 0 ? (
              <ul className="divide-y divide-gray-100">
                {visibles.map((p) => (
                  <li
                    key={p.id_productor}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 hover:bg-gray-50 transition"
                  >
                    <div className="text-sm text-gray-700 space-y-1">
                      <p>
                        <span className="font-semibold">{p.nombre}</span> —
                        CUIT: {p.cuit}
                      </p>
                    </div>
                    <div className="mt-3 sm:mt-0 flex gap-2">
                      <button
                        onClick={() => handleEditar(p)}
                        className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleEliminar(p.id_productor)}
                        className="px-3 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 transition"
                      >
                        🗑️ Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-6">
                No se encontraron productores.
              </p>
            )}
          </div>
        </div>

        {/* Paginación externa */}
        {totalPaginas > 1 && renderPaginacion()}
      </div>
    </div>
  );
}

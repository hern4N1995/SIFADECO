import React, { useState, useEffect, useMemo, useRef } from 'react';

import api from 'src/services/api';
import AppNotification from 'src/components/AppNotification';

const InputField = ({
  label,
  name,
  value,
  onChange,
  required = false,
  type = 'text',
  className = '',
  placeholder = '',
  onFocus,
}) => (
  <div className={`flex flex-col ${className}`}>
    <label className="mb-2 font-semibold text-gray-700 text-sm">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      onFocus={onFocus}
      required={required}
      placeholder={placeholder}
      className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50"
    />
  </div>
);

// Simple modal overlay component
const ModalOverlay = ({ open, title, children, onClose, actions }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg p-6 z-10">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">{title}</h3>
        <div className="text-sm text-gray-700 mb-4">{children}</div>
        <div className="flex justify-end gap-2">{actions}</div>
      </div>
    </div>
  );
};

const todasLasProvincias = [
  'Buenos Aires',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
];

export default function ProvinciaAdmin() {
  const [provincias, setProvincias] = useState([]);
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [descripcionEditada, setDescripcionEditada] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);
  const [mensajeFeedback, setMensajeFeedback] = useState('');
  const [filtro, setFiltro] = useState('');
  const inputRef = useRef(null);

  const [paginaActual, setPaginaActual] = useState(1);
  const [ordenamiento, setOrdenamiento] = useState('recientes');
  const itemsPorPagina =
    window.innerWidth < 768 ? 4 : window.innerWidth < 1024 ? 6 : 8;

  useEffect(() => {
    fetchProvincias();
    const manejarClickFuera = (e) => {
      if (inputRef.current && !inputRef.current.contains(e.target)) {
        setMostrarSugerencias(false);
      }
    };
    document.addEventListener('mousedown', manejarClickFuera);
    return () => document.removeEventListener('mousedown', manejarClickFuera);
  }, []);

  // Modal overlay state for add/edit/delete confirmations
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | 'delete'
  const [modalPayload, setModalPayload] = useState({ id: null, descripcion: '' });

  const openAddModal = () => {
    // previous implementation opened an overlay for adding; keep add inline
    // to match requested behavior: directly call agregarProvincia
    agregarProvincia();
  };

  const openEditModal = (id, descripcion) => {
    setEditandoId(id);
    setDescripcionEditada(descripcion ?? '');
    setModalMode('edit');
    setModalPayload({ id, descripcion: descripcion ?? '' });
    setModalOpen(true);
  };

  const openDeleteModal = (id, descripcion) => {
    setModalMode('delete');
    setModalPayload({ id, descripcion });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setModalMode(null);
    setModalPayload({ id: null, descripcion: '' });
    setEditandoId(null);
    setDescripcionEditada('');
  };

  const fetchProvincias = async () => {
    try {
      const res = await api.get('/provincias');
      const data = res.data;
      setProvincias(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[ProvinciaAdmin] Error al cargar provincias:', err);
      setProvincias([]);
      setMensajeFeedback('❌ Error al cargar provincias.');
      setTimeout(() => setMensajeFeedback(''), 4000);
    }
  };

  const manejarBusqueda = (e) => {
    const texto = e.target.value;
    setNuevaDescripcion(texto);
    const filtradas = todasLasProvincias.filter((prov) =>
      prov.toLowerCase().includes(texto.toLowerCase())
    );
    setSugerencias(filtradas);
    setMostrarSugerencias(true);
    setMensajeFeedback('');
  };

  const seleccionarProvincia = (nombre) => {
    setNuevaDescripcion(nombre);
    setSugerencias([]);
    setMostrarSugerencias(false);
    setMensajeFeedback('');
  };

  const agregarProvincia = async () => {
    if (!nuevaDescripcion.trim()) return;
    const yaExiste = provincias.some(
      (p) =>
        p.descripcion.toLowerCase() === nuevaDescripcion.trim().toLowerCase()
    );
    if (yaExiste) {
      setMensajeFeedback('❌ La provincia ya está registrada.');
      setTimeout(() => setMensajeFeedback(''), 4000);
      return;
    }
    try {
      const { status, data } = await api.post('/provincias', {
        descripcion: nuevaDescripcion.trim(),
      });

      if (status >= 200 && status < 300) {
        setProvincias([...provincias, data]);
        setNuevaDescripcion('');
        setSugerencias([]);
        setMostrarSugerencias(false);
        setMensajeFeedback('✅ Provincia agregada correctamente.');
      } else {
        const msg = data?.message || data?.error || 'Error al agregar provincia.';
        setMensajeFeedback(`❌ ${msg}`);
        console.warn('Agregar provincia no 2xx:', status, msg);
      }
    } catch (err) {
      console.error('Error al agregar provincia:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error de conexión con el servidor.';
      setMensajeFeedback(`❌ ${msg}`);
    } finally {
      setTimeout(() => setMensajeFeedback(''), 4000);
    }
  };

  // abrir overlay para pedir confirmación de borrado
  const eliminarProvincia = (id) => {
    const prov = provincias.find((p) => String(p.id) === String(id));
    openDeleteModal(id, prov?.descripcion || '');
  };

  const performDelete = async (id) => {
    try {
      const { status, data } = await api.delete(`/provincias/${id}`);

      if (status >= 200 && status < 300) {
        setProvincias((prev) => prev.filter((p) => String(p.id) !== String(id)));
        setMensajeFeedback('✅ Provincia eliminada correctamente.');
      } else {
        const msg = data?.message || data?.error || 'Error al eliminar provincia.';
        setMensajeFeedback(`❌ ${msg}`);
        console.warn('Eliminar provincia no 2xx:', status, msg);
      }
    } catch (err) {
      console.error('Error al eliminar provincia:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error de conexión con el servidor.';
      setMensajeFeedback(`❌ ${msg}`);
    } finally {
      setTimeout(() => setMensajeFeedback(''), 4000);
      closeModal();
    }
  };

  const iniciarEdicion = (id, descripcionActual) => {
    openEditModal(id, descripcionActual);
  };

  const guardarEdicion = async () => {
    const nuevaDesc = (descripcionEditada || '').trim();
    if (!nuevaDesc) return;

    try {
      const payload = { descripcion: nuevaDesc };
      const { status, data } = await api.put(`/provincias/${editandoId}`, payload);

      if (status >= 200 && status < 300) {
        setProvincias((prev) =>
          prev.map((p) =>
            String(p.id) === String(editandoId)
              ? { ...p, descripcion: nuevaDesc }
              : p
          )
        );
        setEditandoId(null);
        setDescripcionEditada('');
        setMensajeFeedback('✅ Provincia modificada correctamente.');
        closeModal();
      } else {
        const msg = data?.message || data?.error || 'Error al editar provincia.';
        setMensajeFeedback(`❌ ${msg}`);
        console.warn('Editar provincia no 2xx:', status, msg);
      }
    } catch (err) {
      console.error('Error al editar provincia:', err);
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error de conexión con el servidor.';
      setMensajeFeedback(`❌ ${msg}`);
    } finally {
      setTimeout(() => setMensajeFeedback(''), 4000);
    }
  };

  const provinciasFiltradas = useMemo(() => {
    const texto = filtro.toLowerCase();
    let resultado = provincias.filter((p) =>
      p.descripcion.toLowerCase().includes(texto)
    );
    
    // Aplicar ordenamiento
    switch (ordenamiento) {
      case 'recientes':
        resultado.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
      case 'antiguos':
        resultado.sort((a, b) => (a.id || 0) - (b.id || 0));
        break;
      case 'az':
        resultado.sort((a, b) => (a.descripcion || '').localeCompare(b.descripcion || ''));
        break;
      case 'za':
        resultado.sort((a, b) => (b.descripcion || '').localeCompare(a.descripcion || ''));
        break;
      default:
        break;
    }
    
    return resultado;
  }, [provincias, filtro, ordenamiento]);

  const totalPaginas = Math.ceil(provinciasFiltradas.length / itemsPorPagina);
  const visibles = provinciasFiltradas.slice(
    (paginaActual - 1) * itemsPorPagina,
    paginaActual * itemsPorPagina
  );

  const irPagina = (n) =>
    setPaginaActual(Math.min(Math.max(n, 1), totalPaginas));
  const paginaAnterior = () => irPagina(paginaActual - 1);
  const paginaSiguiente = () => irPagina(paginaActual + 1);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:py-8 py-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Título fuera del contenedor */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 text-center drop-shadow">
          🗺️ Administración de Provincias
        </h1>

        <AppNotification
          show={Boolean(mensajeFeedback)}
          message={mensajeFeedback}
          type={mensajeFeedback.includes('✅') ? 'success' : 'error'}
          onClose={() => setMensajeFeedback('')}
          errorTitle="Atencion"
        />

        {/* Formulario */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative" ref={inputRef}>
              <InputField
                label="Nueva provincia"
                value={nuevaDescripcion}
                onChange={manejarBusqueda}
                placeholder="Ingresar provincia..."
              />
              {mostrarSugerencias && sugerencias.length > 0 && (
                <ul className="absolute z-10 bg-white border w-full mt-1 rounded-lg shadow-lg">
                  {sugerencias.map((prov, idx) => (
                    <li
                      key={idx}
                      onClick={() => seleccionarProvincia(prov)}
                      className="px-4 py-2 hover:bg-green-50 cursor-pointer"
                    >
                      {prov}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex items-end">
              <button
                onClick={openAddModal}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow"
              >
                Agregar
              </button>
            </div>
          </div>

        </div>

        {/* Tabla de provincias */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            📋 Listado de Provincias
          </h2>
          {/* Filtro de búsqueda y ordenamiento */}
          <div className="mb-4 flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 min-w-0">
              <InputField
                label="Buscar provincia"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                placeholder="Escriba para filtrar..."
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => { setOrdenamiento('recientes'); setPaginaActual(1); }}
                className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                  ordenamiento === 'recientes'
                    ? 'bg-green-700 text-white shadow-lg'
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
                    ? 'bg-green-700 text-white shadow-lg'
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
                    ? 'bg-green-700 text-white shadow-lg'
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
                    ? 'bg-green-700 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                }`}
                title="Alfabético Z-A"
              >
                🔤 Z-A
              </button>
            </div>
          </div>
          <div className="overflow-x-auto rounded-xl ring-1 ring-gray-200">
            <table className="min-w-full text-sm text-gray-700">
              <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">ID</th>
                  <th className="px-4 py-3 text-left">Provincia</th>
                  <th className="px-4 py-3 text-left">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((prov) => (
                  <tr
                    key={prov.id}
                    className="border-b last:border-b-0 hover:bg-gray-50 transition"
                  >
                    <td className="px-4 py-3 font-bold">{prov.id}</td>
                    <td className="px-4 py-3">
                      <span>{prov.descripcion}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => openEditModal(prov.id, prov.descripcion)}
                          className="px-3 py-2 rounded-lg bg-yellow-600 text-white text-sm hover:bg-yellow-700 transition"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => openDeleteModal(prov.id, prov.descripcion)}
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

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="mt-4 flex justify-center items-center gap-2 flex-wrap">
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

          {/* Overlay modal for add / edit / delete */}
          <ModalOverlay
            open={modalOpen}
            title={modalMode === 'edit' ? 'Editar provincia' : modalMode === 'delete' ? 'Confirmar eliminación' : ''}
            onClose={closeModal}
            actions={
              modalMode === 'edit' ? (
                <>
                  <button
                    onClick={closeModal}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => await guardarEdicion()}
                    className="px-3 py-1 bg-green-700 text-white rounded-md text-sm"
                  >
                    Guardar
                  </button>
                </>
              ) : modalMode === 'delete' ? (
                <>
                  <button
                    onClick={closeModal}
                    className="px-3 py-1 bg-slate-200 text-slate-700 rounded-md text-sm"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={async () => await performDelete(modalPayload.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded-md text-sm"
                  >
                    Eliminar
                  </button>
                </>
              ) : null
            }
          >
            {modalMode === 'edit' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                <input
                  value={descripcionEditada}
                  onChange={(e) => setDescripcionEditada(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm"
                />
              </div>
            )}
            {modalMode === 'delete' && (
              <div className="text-sm text-gray-700">
                ¿Estás seguro de que querés eliminar la provincia "{modalPayload.descripcion}"?
              </div>
            )}
          </ModalOverlay>

        </div>
      </div>
    </div>
  );
}

// src/components/EditorCorreccionGenerica.jsx
// Editor de correcciones para cualquier entidad registrada en el backend
// (tropa, faena, productor, departamento, planta, titular de faena, veterinario).
// Los campos y desplegables vienen del backend. Solo superadmin.
import { useEffect, useState } from 'react';
import api from '../services/api.js';

const MOTIVO_MIN = 10;

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleString('es-AR');
};

const nombreUsuario = (h) => {
  const nombre = [h.nombre, h.apellido].filter(Boolean).join(' ');
  return nombre || h.email || '—';
};

// Valor del backend → valor del input
const aInput = (tipo, v) => {
  if (v === null || v === undefined) return '';
  if (tipo === 'bool') return v ? 'true' : 'false';
  return String(v);
};

export default function EditorCorreccionGenerica({ clave }) {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [registro, setRegistro] = useState(null); // respuesta de GET /correcciones/:clave/:id
  const [form, setForm] = useState({});
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  // Al cambiar de tipo, limpiar la selección
  useEffect(() => {
    setBusqueda('');
    setResultados([]);
    setRegistro(null);
    setMensaje(null);
  }, [clave]);

  const buscar = async (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    if (!q) return;
    try {
      setBuscando(true);
      setMensaje(null);
      const { data } = await api.get(`/correcciones/${clave}/buscar`, { params: { q } });
      setResultados(Array.isArray(data) ? data : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al buscar' });
    } finally {
      setBuscando(false);
    }
  };

  const abrir = async (id) => {
    try {
      setMensaje(null);
      const { data } = await api.get(`/correcciones/${clave}/${id}`);
      setRegistro(data);
      const inicial = {};
      for (const c of data.campos) inicial[c.campo] = aInput(c.tipo, data.valores[c.campo]);
      setForm(inicial);
      setMotivo('');
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo abrir el registro' });
    }
  };

  const guardar = async () => {
    if (motivo.trim().length < MOTIVO_MIN) {
      setMensaje({ tipo: 'error', texto: `Indicá el motivo (mínimo ${MOTIVO_MIN} caracteres)` });
      return;
    }
    const body = { motivo: motivo.trim() };
    for (const c of registro.campos) {
      const v = form[c.campo];
      if (c.tipo === 'bool') body[c.campo] = v === 'true';
      else body[c.campo] = v === '' ? null : v;
    }

    try {
      setGuardando(true);
      const { data } = await api.put(`/correcciones/${clave}/${registro.id}`, body);
      setMensaje({ tipo: 'ok', texto: `Corrección guardada (${data.campos_corregidos.length} campo/s modificado/s)` });
      await abrir(registro.id);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo guardar la corrección' });
    } finally {
      setGuardando(false);
    }
  };

  const renderCampo = (c) => {
    const valor = form[c.campo] ?? '';
    const cambiar = (v) => setForm({ ...form, [c.campo]: v });
    const clases = 'mt-1 rounded-lg border border-gray-300 px-3 py-2 w-full';

    if (c.tipo === 'fk') {
      const opciones = registro.opciones[c.campo] || [];
      return (
        <select value={valor} onChange={(e) => cambiar(e.target.value)} className={clases}>
          {!c.requerido && <option value="">— Sin asignar —</option>}
          {opciones.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    }
    if (c.tipo === 'bool') {
      return (
        <select value={valor} onChange={(e) => cambiar(e.target.value)} className={clases}>
          <option value="true">Sí</option>
          <option value="false">No</option>
        </select>
      );
    }
    if (c.tipo === 'date') {
      return <input type="date" value={valor} onChange={(e) => cambiar(e.target.value)} className={clases} />;
    }
    if (c.tipo === 'int' || c.tipo === 'num') {
      return (
        <input
          type="number"
          step={c.tipo === 'num' ? 'any' : '1'}
          value={valor}
          onChange={(e) => cambiar(e.target.value)}
          className={clases}
        />
      );
    }
    return <input type="text" value={valor} onChange={(e) => cambiar(e.target.value)} className={clases} />;
  };

  return (
    <div>
      {mensaje && (
        <div
          className={`mb-4 rounded-lg px-4 py-3 ${
            mensaje.tipo === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={buscar} className="bg-white rounded-2xl shadow border border-gray-100 p-4 flex gap-3 mb-6">
        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, número, CUIT, matrícula o ID"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={buscando}
          className="rounded-lg bg-primary text-white px-5 py-2 font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </form>

      {resultados.length > 0 && (
        <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-x-auto mb-6">
          <table className="min-w-full text-sm">
            <tbody>
              {resultados.map((r) => (
                <tr key={r.id} className="border-t border-gray-100 first:border-t-0">
                  <td className="px-4 py-2 text-gray-500 w-24">#{r.id}</td>
                  <td className="px-4 py-2">{r.etiqueta}</td>
                  <td className="px-4 py-2 text-right">
                    <button type="button" onClick={() => abrir(r.id)} className="text-blue-600 hover:underline">
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {registro && (
        <>
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 sm:p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              {registro.entidad.titulo}: {registro.etiqueta}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {registro.campos.map((c) => (
                <label key={c.campo} className="flex flex-col text-sm text-gray-700">
                  <span>
                    {c.label}
                    {c.requerido && <span className="text-red-600"> *</span>}
                  </span>
                  {renderCampo(c)}
                </label>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Motivo de la corrección <span className="text-red-600">*</span>
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              maxLength={1000}
              placeholder="Ej: el productor fue cargado con el CUIT de otra persona; se verificó con la documentación"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className={`text-xs mb-4 ${motivo.trim().length >= MOTIVO_MIN ? 'text-gray-500' : 'text-red-600'}`}>
              Mínimo {MOTIVO_MIN} caracteres ({motivo.trim().length}/{MOTIVO_MIN})
            </p>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={guardar}
                disabled={guardando || motivo.trim().length < MOTIVO_MIN}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {guardando ? 'Guardando...' : 'Guardar corrección'}
              </button>
            </div>
          </div>

          <h2 className="text-lg font-bold text-gray-800 mb-3">Historial de correcciones</h2>
          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Campo</th>
                  <th className="px-4 py-3">Antes</th>
                  <th className="px-4 py-3">Después</th>
                  <th className="px-4 py-3">Motivo</th>
                </tr>
              </thead>
              <tbody>
                {registro.historial.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Este registro no tiene correcciones.
                    </td>
                  </tr>
                )}
                {registro.historial.map((h) => (
                  <tr key={h.id_correccion} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(h.fecha)}</td>
                    <td className="px-4 py-2">{nombreUsuario(h)}</td>
                    <td className="px-4 py-2">{registro.campos.find((c) => c.campo === h.campo)?.label || h.campo}</td>
                    <td className="px-4 py-2 break-all">{h.valor_antes ?? '—'}</td>
                    <td className="px-4 py-2 break-all">{h.valor_despues ?? '—'}</td>
                    <td className="px-4 py-2">{h.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

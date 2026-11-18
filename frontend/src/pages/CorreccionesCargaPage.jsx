// src/pages/CorreccionesCargaPage.jsx
// Corrección de errores de carga (ej: "el decomiso era otra afección").
// Solo superadmin (rol 4). Cada cambio queda registrado con su motivo.
import { useEffect, useState } from 'react';
import api from '../services/api.js';
import EditorCorreccionGenerica from '../components/EditorCorreccionGenerica.jsx';

const TIPOS = [
  { clave: 'decomisos', titulo: 'Decomisos' },
  { clave: 'tropa', titulo: 'Tropa' },
  { clave: 'faena', titulo: 'Faena' },
  { clave: 'productor', titulo: 'Productor' },
  { clave: 'departamento', titulo: 'Departamento' },
  { clave: 'planta', titulo: 'Planta' },
  { clave: 'titular_faena', titulo: 'Titular de faena' },
  { clave: 'veterinario', titulo: 'Veterinario' },
];

const MOTIVO_MIN = 10;

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleString('es-AR');
};

const formatearSoloFecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleDateString('es-AR');
};

const nombreUsuario = (h) => {
  const nombre = [h.nombre, h.apellido].filter(Boolean).join(' ');
  return nombre || h.email || '—';
};

const formularioDesde = (detalle) => ({
  id_parte_decomisada: String(detalle.id_parte_decomisada ?? ''),
  id_afeccion: String(detalle.id_afeccion ?? ''),
  cantidad: detalle.cantidad ?? '',
  animales_afectados: detalle.animales_afectados ?? '',
  peso_kg: detalle.peso_kg ?? '',
  destino_decomiso: detalle.destino_decomiso ?? '',
  observaciones: detalle.observaciones ?? '',
  motivo: '',
});

export default function CorreccionesCargaPage() {
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const [datosBase, setDatosBase] = useState({ partes: [], afecciones: [] });
  const [seleccionado, setSeleccionado] = useState(null); // respuesta de GET /correcciones/decomisos/:id
  const [cargando, setCargando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null); // { tipo: 'ok' | 'error', texto }
  const [entidadSel, setEntidadSel] = useState('decomisos');

  useEffect(() => {
    api
      .get('/decomisos/datos-base')
      .then(({ data }) => setDatosBase({ partes: data.partes || [], afecciones: data.afecciones || [] }))
      .catch((err) => {
        console.error('[Correcciones] Error al cargar datos base:', err);
        setMensaje({ tipo: 'error', texto: 'No se pudieron cargar partes y afecciones' });
      });
  }, []);

  const buscar = async (e) => {
    e.preventDefault();
    const q = busqueda.trim();
    if (!q) return;
    try {
      setBuscando(true);
      const { data } = await api.get('/correcciones/decomisos', { params: { q } });
      setResultados(Array.isArray(data) ? data : []);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'Error al buscar' });
    } finally {
      setBuscando(false);
    }
  };

  const abrirDecomiso = async (idDecomiso) => {
    try {
      setCargando(true);
      setMensaje(null);
      setEditandoId(null);
      const { data } = await api.get(`/correcciones/decomisos/${idDecomiso}`);
      setSeleccionado(data);
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo abrir el decomiso' });
    } finally {
      setCargando(false);
    }
  };

  const recargarSeleccionado = async () => {
    if (!seleccionado) return;
    await abrirDecomiso(seleccionado.decomiso.id_decomiso);
  };

  const iniciarEdicion = (detalle) => {
    setMensaje(null);
    setEditandoId(detalle.id_decomiso_detalle);
    setForm(formularioDesde(detalle));
  };

  const guardar = async (detalle) => {
    if (form.motivo.trim().length < MOTIVO_MIN) {
      setMensaje({ tipo: 'error', texto: `Indicá el motivo (mínimo ${MOTIVO_MIN} caracteres)` });
      return;
    }

    const body = {
      motivo: form.motivo.trim(),
      id_parte_decomisada: Number(form.id_parte_decomisada),
      id_afeccion: Number(form.id_afeccion),
      cantidad: form.cantidad === '' ? null : form.cantidad,
      animales_afectados: form.animales_afectados === '' ? null : form.animales_afectados,
      peso_kg: form.peso_kg === '' ? null : form.peso_kg,
      destino_decomiso: form.destino_decomiso,
      observaciones: form.observaciones,
    };

    try {
      setGuardando(true);
      const { data } = await api.put(`/correcciones/decomiso-detalle/${detalle.id_decomiso_detalle}`, body);
      setMensaje({ tipo: 'ok', texto: `Corrección guardada (${data.campos_corregidos.length} campo/s modificado/s)` });
      setEditandoId(null);
      await recargarSeleccionado();
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.response?.data?.message || 'No se pudo guardar la corrección' });
    } finally {
      setGuardando(false);
    }
  };

  const campoInput = (label, name, type = 'text') => (
    <label className="flex flex-col text-sm text-gray-700">
      {label}
      <input
        type={type}
        step={type === 'number' ? 'any' : undefined}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
      />
    </label>
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Correcciones de carga</h1>
      <p className="text-sm text-gray-500 mb-6">
        Corregí errores de datos ya cargados. Cada cambio queda registrado con su motivo y no puede borrarse.
      </p>

      <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-semibold text-gray-700">Tipo de registro</label>
        <select
          value={entidadSel}
          onChange={(e) => setEntidadSel(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2"
        >
          {TIPOS.map((t) => (
            <option key={t.clave} value={t.clave}>
              {t.titulo}
            </option>
          ))}
        </select>
      </div>

      {entidadSel !== 'decomisos' ? (
        <EditorCorreccionGenerica key={entidadSel} clave={entidadSel} />
      ) : (
        <>
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
          placeholder="N° de tropa, DTe/DTu o ID de decomiso"
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
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3">ID decomiso</th>
                <th className="px-4 py-3">Fecha decomiso</th>
                <th className="px-4 py-3">N° tropa</th>
                <th className="px-4 py-3">DTe/DTu</th>
                <th className="px-4 py-3">Fecha faena</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {resultados.map((r) => (
                <tr key={r.id_decomiso} className="border-t border-gray-100">
                  <td className="px-4 py-2">{r.id_decomiso}</td>
                  <td className="px-4 py-2">{formatearSoloFecha(r.fecha_decomiso)}</td>
                  <td className="px-4 py-2">{r.n_tropa}</td>
                  <td className="px-4 py-2">{r.dte_dtu}</td>
                  <td className="px-4 py-2">{formatearSoloFecha(r.fecha_faena)}</td>
                  <td className="px-4 py-2">
                    <button
                      type="button"
                      onClick={() => abrirDecomiso(r.id_decomiso)}
                      className="text-blue-600 hover:underline"
                    >
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cargando && <p className="text-gray-500">Cargando decomiso...</p>}

      {seleccionado && !cargando && (
        <>
          <div className="bg-white rounded-2xl shadow border border-gray-100 p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><span className="text-gray-500">Decomiso</span><div className="font-semibold">#{seleccionado.decomiso.id_decomiso}</div></div>
            <div><span className="text-gray-500">Fecha decomiso</span><div className="font-semibold">{formatearSoloFecha(seleccionado.decomiso.fecha_decomiso)}</div></div>
            <div><span className="text-gray-500">N° tropa</span><div className="font-semibold">{seleccionado.decomiso.n_tropa}</div></div>
            <div><span className="text-gray-500">DTe/DTu</span><div className="font-semibold">{seleccionado.decomiso.dte_dtu}</div></div>
          </div>

          <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-x-auto mb-6">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-left">
                <tr>
                  <th className="px-4 py-3">Parte</th>
                  <th className="px-4 py-3">Afección</th>
                  <th className="px-4 py-3">Cantidad</th>
                  <th className="px-4 py-3">Animales</th>
                  <th className="px-4 py-3">Peso (kg)</th>
                  <th className="px-4 py-3">Destino</th>
                  <th className="px-4 py-3">Observaciones</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {seleccionado.detalles.map((d) => (
                  <tr key={d.id_decomiso_detalle} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-2">{d.nombre_parte}</td>
                    <td className="px-4 py-2 font-semibold">{d.afeccion}</td>
                    <td className="px-4 py-2">{d.cantidad}</td>
                    <td className="px-4 py-2">{d.animales_afectados}</td>
                    <td className="px-4 py-2">{d.peso_kg}</td>
                    <td className="px-4 py-2">{d.destino_decomiso || '—'}</td>
                    <td className="px-4 py-2">{d.observaciones || '—'}</td>
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => iniciarEdicion(d)}
                        className="text-blue-600 hover:underline whitespace-nowrap"
                      >
                        Corregir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {editandoId !== null && form && (
            <div className="bg-white rounded-2xl shadow-lg border border-amber-300 p-4 sm:p-6 mb-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Corregir detalle #{editandoId}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                <label className="flex flex-col text-sm text-gray-700">
                  Parte decomisada
                  <select
                    value={form.id_parte_decomisada}
                    onChange={(e) => setForm({ ...form, id_parte_decomisada: e.target.value })}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
                  >
                    {datosBase.partes.map((p) => (
                      <option key={p.id_parte_decomisada} value={p.id_parte_decomisada}>
                        {p.nombre_parte}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col text-sm text-gray-700">
                  Afección
                  <select
                    value={form.id_afeccion}
                    onChange={(e) => setForm({ ...form, id_afeccion: e.target.value })}
                    className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
                  >
                    {datosBase.afecciones.map((a) => (
                      <option key={a.id_afeccion} value={a.id_afeccion}>
                        {a.descripcion} ({a.especie})
                      </option>
                    ))}
                  </select>
                </label>
                {campoInput('Cantidad', 'cantidad', 'number')}
                {campoInput('Animales afectados', 'animales_afectados', 'number')}
                {campoInput('Peso (kg)', 'peso_kg', 'number')}
                {campoInput('Destino', 'destino_decomiso')}
                <div className="md:col-span-2">{campoInput('Observaciones', 'observaciones')}</div>
              </div>

              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Motivo de la corrección <span className="text-red-600">*</span>
              </label>
              <textarea
                value={form.motivo}
                onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                rows={2}
                maxLength={1000}
                placeholder="Ej: el decomiso fue cargado con la afección equivocada; se confirmó con el registro de faena"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <p className={`text-xs mb-4 ${form.motivo.trim().length >= MOTIVO_MIN ? 'text-gray-500' : 'text-red-600'}`}>
                Mínimo {MOTIVO_MIN} caracteres ({form.motivo.trim().length}/{MOTIVO_MIN})
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditandoId(null)}
                  disabled={guardando}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={guardando || form.motivo.trim().length < MOTIVO_MIN}
                  onClick={() =>
                    guardar(seleccionado.detalles.find((d) => d.id_decomiso_detalle === editandoId))
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {guardando ? 'Guardando...' : 'Guardar corrección'}
                </button>
              </div>
            </div>
          )}

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
                {seleccionado.historial.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                      Este decomiso no tiene correcciones.
                    </td>
                  </tr>
                )}
                {seleccionado.historial.map((h) => (
                  <tr key={h.id_correccion} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(h.fecha)}</td>
                    <td className="px-4 py-2">{nombreUsuario(h)}</td>
                    <td className="px-4 py-2">{h.campo}</td>
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
        </>
      )}
    </div>
  );
}

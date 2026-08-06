import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDateFromDB } from '../utils/dateFormatter';
import ModalAccessible from '../components/ModalAccessible';

// Hook para detectar si es móvil
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(window.matchMedia(query).matches);
  useEffect(() => {
    const media = window.matchMedia(query);
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);
  return matches;
};

const DecomisoResumenPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resumen, setResumen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [showTropaModal, setShowTropaModal] = useState(false);
  const [tropaDecomisos, setTropaDecomisos] = useState([]);
  const [tropaLoading, setTropaLoading] = useState(false);
  const [tropaError, setTropaError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('ID de decomiso no válido');
      setLoading(false);
      return;
    }

    const fetchResumen = async () => {
      try {
        console.log('[DecomisoResumenPage] Cargando resumen para id:', id);
        const res = await api.get(`/decomisos/${id}/resumen`);
        console.log('[DecomisoResumenPage] Respuesta completa:', res.data);
        console.log('[DecomisoResumenPage] Tipo de respuesta:', typeof res.data, Array.isArray(res.data));
        
        let data = res.data;
        
        // Si viene wrapped, extraer
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          if (Array.isArray(data.data)) {
            data = data.data;
          } else if (Array.isArray(data.resumen)) {
            data = data.resumen;
          } else if (Array.isArray(data.rows)) {
            data = data.rows;
          }
        }
        
        console.log('[DecomisoResumenPage] Data final:', data);
        setResumen(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error('[DecomisoResumenPage] Error al cargar resumen:', err?.response?.data || err.message);
        console.error('[DecomisoResumenPage] Status:', err?.response?.status);
        setError('No se pudo cargar el resumen del decomiso');
        setLoading(false);
      }
    };

    fetchResumen();
  }, [id]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        ⏳ Cargando resumen...
      </div>
    );
  if (error)
    return (
      <p className="p-4 text-red-600 text-center font-semibold">❌ {error}</p>
    );
  if (resumen.length === 0)
    return (
      <p className="p-4 text-center text-slate-500">
        ⚠️ No se encontró información para este decomiso.
      </p>
    );

  const faena = resumen[0];
  // Buscar una fila que contenga fecha_decomiso explícita (por si el primer row no la tiene)
  const fechaDecomisoRaw = resumen.find((r) => r && (r.fecha_decomiso || r.fecha_decomiso === 0))?.fecha_decomiso;

  const formatFecha = (fecha) =>
    new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

  const totalIngresados = tropaDecomisos.length > 0
    ? (() => {
        const vals = tropaDecomisos.map((f) => Number(f.cantidad_tropa) || 0).filter((v) => v > 0);
        if (vals.length === 0) return (faena.cantidad_tropa ? Number(faena.cantidad_tropa) : 0);
        // Use the maximum reported cantidad_tropa (original ingreso), not sum across faenas
        return Math.max(...vals);
      })()
    : (faena.cantidad_tropa ? Number(faena.cantidad_tropa) : 0);

  const totalFaenados = tropaDecomisos.length > 0
    ? tropaDecomisos.reduce((s, f) => s + (Number(f.cantidad_faena) || 0), 0)
    : (faena.cantidad_faena ? Number(faena.cantidad_faena) : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:py-8 py-6">
      <div className="max-w-6xl mx-auto space-y-10">
        {/* Encabezado */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-center text-slate-800 drop-shadow">
          📋 Resumen de Decomiso
        </h1>

        {/* Tarjetas de faena */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card title="N° de Tropa" value={faena.n_tropa || '—'} />
          <Card title="DTE / DTU" value={faena.dte_dtu || '—'} />
          <Card title="Fecha de Decomiso" value={formatFecha(fechaDecomisoRaw || faena.fecha_decomiso || faena.fecha_faena || faena.fecha)} />
          <Card title="Faenados" value={faena.cantidad_faena || '—'} />
        </div>

        {/* Detalles del decomiso */}
        {isMobile ? (
          <div className="space-y-4">
            {resumen.map((r, i) => (
              <div
                key={i}
                className="bg-white rounded-xl shadow border border-slate-200 p-4 text-sm text-slate-700 space-y-1"
              >
                <p>
                  <strong>Tipo:</strong> {r.nombre_tipo_parte || '—'}
                </p>
                <p>
                  <strong>Parte:</strong> {r.nombre_parte || '—'}
                </p>
                <p>
                  <strong>Afección:</strong> {r.afeccion || '—'}
                </p>
                <p>
                  <strong>Cantidad:</strong> {r.cantidad || '—'}
                </p>
                <p>
                  <strong>Peso (kg):</strong> {r.peso_kg || '—'}
                </p>
                <p>
                  <strong>Animales:</strong> {r.animales_afectados || '—'}
                </p>
                <p>
                  <strong>Destino:</strong> {r.destino_decomiso || '—'}
                </p>
                <p>
                  <strong>Observaciones:</strong> {r.observaciones || '—'}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl shadow-xl border border-gray-100 bg-white overflow-x-auto">
            <table className="w-full text-sm text-center text-slate-700">
              <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                <tr>
                  <th className="px-3 py-2">Tipo</th>
                  <th className="px-3 py-2">Parte</th>
                  <th className="px-3 py-2">Afección</th>
                  <th className="px-3 py-2">Cantidad</th>
                  <th className="px-3 py-2">Peso (kg)</th>
                  <th className="px-3 py-2">Animales</th>
                  <th className="px-3 py-2">Destino</th>
                  <th className="px-3 py-2">Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map((r, i) => (
                  <tr
                    key={i}
                    className="border-b last:border-b-0 hover:bg-green-50"
                  >
                    <td className="px-3 py-2">{r.nombre_tipo_parte || '—'}</td>
                    <td className="px-3 py-2">{r.nombre_parte || '—'}</td>
                    <td className="px-3 py-2">{r.afeccion || '—'}</td>
                    <td className="px-3 py-2">{r.cantidad || '—'}</td>
                    <td className="px-3 py-2">{r.peso_kg || '—'}</td>
                    <td className="px-3 py-2">{r.animales_afectados || '—'}</td>
                    <td className="px-3 py-2">{r.destino_decomiso || '—'}</td>
                    <td className="px-3 py-2">{r.observaciones || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Botón volver */}
        <div className="flex justify-end pt-4">
          <button
            onClick={async () => {
                // Abrir modal con todos los decomisos de la tropa
                setTropaError('');
                setTropaLoading(true);
                setShowTropaModal(true);
                try {
                  const res = await api.get('/decomisos');
                  let arr = res.data;
                  if (arr && typeof arr === 'object' && !Array.isArray(arr)) {
                    if (Array.isArray(arr.data)) arr = arr.data;
                    else if (Array.isArray(arr.rows)) arr = arr.rows;
                    else if (Array.isArray(arr.decomisos)) arr = arr.decomisos;
                  }

                  arr = Array.isArray(arr) ? arr : [];

                  // Filtrar por nro de tropa
                  const nro = faena.n_tropa;
                  const matching = arr.filter((r) => String(r.n_tropa) === String(nro));

                  // PASO 1: Agrupar por id_decomiso primero (para sumar cantidades de múltiples detalles)
                  const decomisosMap = new Map();
                  matching.forEach((row) => {
                    const decoKey = row.id_decomiso != null ? String(row.id_decomiso) : `synth_${Math.random()}`;
                    if (!decomisosMap.has(decoKey)) {
                      decomisosMap.set(decoKey, {
                        id_decomiso: row.id_decomiso,
                        id_faena: row.id_faena,
                        n_tropa: row.n_tropa,
                        id_planta: row.id_planta,
                        nombre_planta: row.nombre_planta,
                        cantidad_tropa: row.cantidad_tropa,
                        cantidad_faena: row.cantidad_faena,
                        fecha_ingreso: row.fecha_ingreso,
                        fecha_faena: row.fecha_faena,
                        fecha_decomiso: row.fecha_decomiso,
                        cantidad_decomisada: 0,
                        detalles: [],
                      });
                    }
                    const deco = decomisosMap.get(decoKey);
                    // Sumar cantidad total decomisada
                    deco.cantidad_decomisada += row.cantidad ? Number(row.cantidad) : 0;

                    // Agregar detalle individual (puede haber múltiples por decomiso)
                    const detalle = {
                      id_decomiso_detalle: row.id_decomiso_detalle,
                      tipo_parte: row.nombre_tipo_parte || null,
                      parte: row.nombre_parte || null,
                      afeccion: row.afeccion || null,
                      cantidad: row.cantidad ? Number(row.cantidad) : 0,
                      peso_kg: row.peso_kg != null ? row.peso_kg : null,
                      animales_afectados: row.animales_afectados != null ? row.animales_afectados : null,
                      destino_decomiso: row.destino_decomiso || null,
                      observaciones: row.observaciones || null,
                    };

                    // Evitar duplicados si la misma fila se procesa dos veces
                    if (!deco.detalles.some((dt) => dt.id_decomiso_detalle === detalle.id_decomiso_detalle)) {
                      deco.detalles.push(detalle);
                    }
                  });

                  // PASO 2: Agrupar los decomisos por id_faena
                  const faenaMap = new Map();
                  Array.from(decomisosMap.values()).forEach((deco) => {
                    const faenaKey = String(deco.id_faena || `synth_${deco.id_decomiso}`);
                    if (!faenaMap.has(faenaKey)) {
                      faenaMap.set(faenaKey, {
                        id_faena: deco.id_faena,
                        n_tropa: deco.n_tropa,
                        id_planta: deco.id_planta,
                        nombre_planta: deco.nombre_planta,
                        cantidad_tropa: deco.cantidad_tropa,
                        cantidad_faena: deco.cantidad_faena,
                        fecha_ingreso: deco.fecha_ingreso,
                        fecha_faena: deco.fecha_faena,
                        decomisos: [],
                      });
                    }
                    faenaMap.get(faenaKey).decomisos.push(deco);
                  });

                  // PASO 3: Ordenar decomisos por fecha y asignar orden
                  const grouped = Array.from(faenaMap.values()).map((f) => {
                    const decomisosArr = f.decomisos
                      .sort((a, b) => {
                        const da = a.fecha_decomiso ? new Date(a.fecha_decomiso) : null;
                        const db = b.fecha_decomiso ? new Date(b.fecha_decomiso) : null;
                        if (da && db) return da - db;
                        if (da && !db) return -1;
                        if (!da && db) return 1;
                        return 0;
                      })
                      .map((d, idx) => ({ ...d, orden: idx + 1 }));

                    return {
                      ...f,
                      decomisos: decomisosArr,
                      total_decomisado: decomisosArr.reduce((s, it) => s + (it.cantidad_decomisada || 0), 0),
                    };
                  });

                  // Ordenar faenas por fecha_faena desc
                  grouped.sort((a, b) => {
                    const da = a.fecha_faena ? new Date(a.fecha_faena) : null;
                    const db = b.fecha_faena ? new Date(b.fecha_faena) : null;
                    if (da && db) return db - da;
                    if (da && !db) return -1;
                    if (!da && db) return 1;
                    return 0;
                  });

                  setTropaDecomisos(grouped);
                } catch (err) {
                  console.error('[DecomisoResumenPage] Error al cargar decomisos de la tropa:', err);
                  setTropaError('No se pudieron cargar los decomisos de la tropa');
                  setTropaDecomisos([]);
                } finally {
                  setTropaLoading(false);
                }
              }}
            className="mr-3 px-4 py-3 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition shadow"
          >
            Ver resumen completo de la tropa
          </button>
          <button
            onClick={() => navigate('/decomisos/cargados')}
            className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition shadow"
          >
            ⬅ Volver
          </button>
        </div>
        
        {/* Modal: resumen completo de la tropa */}
        {showTropaModal && (
          <ModalAccessible onClose={() => setShowTropaModal(false)}>
            <div className="w-full max-w-4xl lg:max-w-6xl mx-4 lg:mx-auto bg-white rounded-xl sm:rounded-2xl shadow-xl ring-1 ring-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 sm:py-4 border-b gap-2">
                <div className="min-w-0">
                  <h3 className="text-base sm:text-lg font-bold">Resumen completo - Tropa #{faena.n_tropa}</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Listado de decomisos registrados para esta tropa</p>
                </div>
                <button
                  onClick={() => setShowTropaModal(false)}
                  className="w-full sm:w-auto rounded-lg bg-slate-100 px-4 py-2 text-sm hover:bg-slate-200 flex-shrink-0"
                >
                  Cerrar
                </button>
              </div>

              <div className="p-3 sm:p-6 space-y-4 overflow-auto max-h-[calc(100vh-160px)]">
                {tropaLoading ? (
                  <p className="text-slate-500">Cargando...</p>
                ) : tropaError ? (
                  <p className="text-red-600">{tropaError}</p>
                ) : (
                  <>
                    <div className="grid gap-2 sm:gap-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
                        <div className="bg-slate-50 p-2 sm:p-3 rounded text-center sm:text-left">
                          <p className="text-xs text-slate-500">Total ingresados</p>
                          <p className="font-semibold text-slate-800">{totalIngresados || '—'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 sm:p-3 rounded text-center sm:text-left">
                          <p className="text-xs text-slate-500">Total faenados</p>
                          <p className="font-semibold text-slate-800">{totalFaenados || '—'}</p>
                        </div>
                        <div className="bg-slate-50 p-2 sm:p-3 rounded text-center sm:text-left">
                          <p className="text-xs text-slate-500">Total decomisados</p>
                          <p className="font-semibold text-slate-800">{tropaDecomisos.reduce((s, it) => s + (it.total_decomado || it.total_decomisado || 0), 0)}</p>
                        </div>
                      </div>

                      <div className="space-y-3 sm:space-y-4">
                        {tropaDecomisos.map((f, fi) => (
                          <div key={fi} className="border rounded-lg p-3 sm:p-4 bg-white hover:shadow-md transition">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold truncate">Faena #{f.id_faena || fi + 1} • Tropa {f.n_tropa}</p>
                                <p className="text-xs text-slate-500 truncate">Planta: {f.nombre_planta || f.id_planta || '—'}</p>
                              </div>
                              <div className="text-xs sm:text-sm bg-slate-50 p-2 rounded flex-shrink-0">
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                                  <div>
                                    <p className="text-slate-500">Ingreso</p>
                                    <p className="font-semibold">{formatDateFromDB(f.fecha_ingreso || f.fecha_faena || faena.fecha_faena) || '—'}</p>
                                  </div>
                                  <div>
                                    <p className="text-slate-500">Fecha faena</p>
                                    <p className="font-semibold">{formatDateFromDB(f.fecha_faena) || '—'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Tabla responsiva */}
                            <div className="overflow-x-auto -mx-3 sm:-mx-4 sm:mx-0">
                              <table className="w-full text-xs sm:text-sm text-slate-700">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                  <tr>
                                    <th className="px-2 sm:px-3 py-2 text-left">#</th>
                                    <th className="px-2 sm:px-3 py-2 text-left">Fecha decomiso</th>
                                    <th className="px-2 sm:px-3 py-2 text-left">Se decomisó</th>
                                    <th className="px-2 sm:px-3 py-2 text-left">Observaciones</th>
                                    <th className="px-2 sm:px-3 py-2 text-right">Decomisados</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {f.decomisos.map((d, di) => (
                                    <tr key={di} className="border-b last:border-b-0 hover:bg-slate-50">
                                      <td className="px-2 sm:px-3 py-2">{d.orden}°</td>
                                      <td className="px-2 sm:px-3 py-2">{formatDateFromDB(d.fecha_decomiso) || '—'}</td>
                                      <td className="px-2 sm:px-3 py-2 text-left">
                                        {Array.isArray(d.detalles) && d.detalles.length > 0 ? (
                                          d.detalles.map((dt, ii) => (
                                            <div key={ii} className="mb-1">
                                              <div className="font-medium text-sm truncate">{(dt.tipo_parte ? dt.tipo_parte + ' • ' : '') + (dt.parte || '—')}</div>
                                              <div className="text-xs text-slate-500 truncate">{dt.afeccion || '—'}</div>
                                              <div className="text-xs text-slate-700">Cant: {dt.cantidad || 0} · Peso: {dt.peso_kg != null ? dt.peso_kg : '—'} kg · Animales: {dt.animales_afectados != null ? dt.animales_afectados : '—'}</div>
                                              <div className="text-xs text-slate-500">Destino: {dt.destino_decomiso || '—'}</div>
                                            </div>
                                          ))
                                        ) : (
                                          <span className="text-slate-500">{d.id_decomiso || '—'}</span>
                                        )}
                                      </td>
                                      <td className="px-2 sm:px-3 py-2 text-left">
                                        {Array.isArray(d.detalles) && d.detalles.length > 0 ? (
                                          d.detalles.map((dt, ii) => (
                                            <div key={ii} className="mb-1 text-xs text-slate-700 truncate">{dt.observaciones || '—'}</div>
                                          ))
                                        ) : (
                                          <span className="text-slate-500">—</span>
                                        )}
                                      </td>
                                      <td className="px-2 sm:px-3 py-2 text-right">{d.cantidad_decomisada || 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </ModalAccessible>
        )}
      </div>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="bg-white rounded-xl shadow border border-slate-200 p-4 text-center">
    <p className="text-xs text-slate-500 mb-1">{title}</p>
    <p className="text-lg font-semibold text-slate-800">{value}</p>
  </div>
);

export default DecomisoResumenPage;

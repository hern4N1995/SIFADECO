// TropasPendientesEliminacion.jsx
// Página para que el admin (rol 1) vea y confirme/rechace solicitudes de eliminación

import { Fragment, useEffect, useState } from 'react';
import api from '../services/api.js';
import { formatDateFromDB } from '../utils/dateFormatter';

const leerDetallesAuditoria = (valor) => {
  if (valor && typeof valor === 'object') return valor;
  if (typeof valor !== 'string') return {};

  try {
    return JSON.parse(valor);
  } catch {
    return {};
  }
};

const PAGE_SIZE = 6;

export default function TropasPendientesEliminacion() {
  const [tropas, setTropas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalAccion, setModalAccion] = useState(null);
  const [auditoria, setAuditoria] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchTropasPendientes();
  }, []);

  const fetchTropasPendientes = async () => {
    try {
      setLoading(true);
      const response = await api.get('/tropas-eliminacion/pendientes');
      setTropas(Array.isArray(response.data) ? response.data : []);
      setError(null);
    } catch (err) {
      console.error('[TropasPendientes] Error al obtener tropas:', err);
      setError('Error al obtener tropas pendientes');
      setTropas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmarEliminacion = async (tropaId, nTropa) => {
    try {
      setProcesando(true);
      await api.delete(`/tropas-eliminacion/${tropaId}/confirmar`);
      
      // Remover de la lista
      setTropas(tropas.filter(t => t.id_tropa !== tropaId));
      setModalAccion(null);
      
      alert('Tropa eliminada completamente del sistema');
      await fetchTropasPendientes();
    } catch (err) {
      console.error('[TropasPendientes] Error al confirmar eliminación:', err);
      alert('Error: ' + (err.response?.data?.error || 'No se pudo eliminar la tropa'));
    } finally {
      setProcesando(false);
    }
  };

  const handleRechazarEliminacion = async (tropaId, nTropa) => {
    try {
      setProcesando(true);
      await api.post(`/tropas-eliminacion/${tropaId}/cancelar`, {
        motivo_rechazo: motivoRechazo,
      });
      
      // Actualizar lista
      setTropas(tropas.map(t => 
        t.id_tropa === tropaId 
          ? { ...t, estado: 'activa' }
          : t
      ).filter(t => t.estado !== 'activa' || t.id_tropa !== tropaId)); // Remove from pending list
      
      setModalAccion(null);
      setMotivoRechazo('');
      
      alert('Solicitud rechazada. La tropa vuelve a estar activa.');
      await fetchTropasPendientes();
    } catch (err) {
      console.error('[TropasPendientes] Error al rechazar eliminación:', err);
      alert('Error: ' + (err.response?.data?.error || 'No se pudo rechazar la solicitud'));
    } finally {
      setProcesando(false);
    }
  };

  const handleVerAuditoria = async (tropaId) => {
    setAuditoria({ loading: true, error: null, historial: [] });
    try {
      const response = await api.get(`/tropas-eliminacion/${tropaId}/auditoria`);
      setAuditoria({
        loading: false,
        error: null,
        historial: Array.isArray(response.data) ? response.data : [],
      });
    } catch (err) {
      console.error('[TropasPendientes] Error al obtener auditoría:', err);
      setAuditoria({
        loading: false,
        error: 'Error al obtener historial de auditoría',
        historial: [],
      });
    }
  };

  const totalPages = Math.max(1, Math.ceil(tropas.length / PAGE_SIZE));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedTropas = tropas.slice(
    (activePage - 1) * PAGE_SIZE,
    activePage * PAGE_SIZE
  );
  const visiblePages = [...new Set([
    1,
    activePage - 1,
    activePage,
    activePage + 1,
    totalPages,
  ])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((first, second) => first - second);

  const renderAcciones = (tropa) => (
    <div className="flex flex-wrap justify-center gap-2">
      <button
        type="button"
        onClick={() => handleVerAuditoria(tropa.id_tropa)}
        className="rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200"
        title="Ver historial de auditoría"
      >
        📋 Auditoría
      </button>
      <button
        type="button"
        onClick={() => setModalAccion({
          type: 'confirmar',
          tropaId: tropa.id_tropa,
          nTropa: tropa.n_tropa,
        })}
        className="rounded bg-red-100 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-200"
        title="Confirmar eliminación"
      >
        ✅ Confirmar
      </button>
      <button
        type="button"
        onClick={() => setModalAccion({
          type: 'rechazar',
          tropaId: tropa.id_tropa,
          nTropa: tropa.n_tropa,
        })}
        className="rounded bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
        title="Rechazar solicitud"
      >
        ❌ Rechazar
      </button>
    </div>
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] justify-center items-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 bg-gradient-to-br from-gray-50 to-gray-100 px-3 py-6 sm:px-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ⏳ Tropas Pendientes de Eliminación
          </h1>
          <p className="text-gray-600">
            Revisa las solicitudes de eliminación de tropas enviadas por los usuarios
          </p>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700 flex items-center justify-between gap-4">
            <p role="alert">{error}</p>
            <button
              type="button"
              onClick={fetchTropasPendientes}
              className="shrink-0 rounded border border-red-300 px-3 py-1.5 text-sm font-semibold hover:bg-red-100"
            >
              Reintentar
            </button>
          </div>
        ) : tropas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">✨ No hay tropas pendientes de eliminación</p>
            <p className="text-gray-400 text-sm mt-2">Todas las solicitudes han sido procesadas</p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl bg-white shadow-lg sm:block">
              <table className="w-full text-sm">
                <thead className="bg-yellow-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left">N° Tropa</th>
                    <th className="px-4 py-3 text-left">Solicitante</th>
                    <th className="px-4 py-3 text-left">Fecha Solicitud</th>
                    <th className="px-4 py-3 text-left">Productor</th>
                    <th className="px-4 py-3 text-left">Planta</th>
                    <th className="px-4 py-3 text-center">Faenas</th>
                    <th className="px-4 py-3 text-center">Decomisos</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {paginatedTropas.map((tropa) => (
                    <tr key={tropa.id_tropa} className="hover:bg-yellow-50">
                      <td className="px-4 py-3 font-bold text-yellow-700">
                        {tropa.n_tropa}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="font-medium text-gray-800">{tropa.usuario_solicita_nombre}</p>
                          <p className="text-gray-500 text-xs">{tropa.usuario_solicita_email}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>{new Date(tropa.fecha_solicita_eliminacion).toLocaleDateString()}</p>
                          <p className="text-gray-500 text-xs">
                            {new Date(tropa.fecha_solicita_eliminacion).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        {tropa.productor_nombre}
                      </td>
                      <td className="px-4 py-3">
                        {tropa.planta_nombre}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-blue-700">
                        {tropa.cant_faenas}
                      </td>
                      <td className="px-4 py-3 text-center font-semibold text-red-700">
                        {tropa.cant_decomisos}
                      </td>
                      <td className="px-4 py-3 text-center">{renderAcciones(tropa)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="space-y-3 sm:hidden">
              {paginatedTropas.map((tropa) => (
                <article
                  key={tropa.id_tropa}
                  className="rounded-lg border border-yellow-100 bg-white p-4 shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between gap-3 border-b border-gray-100 pb-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">N° Tropa</p>
                      <p className="break-words text-lg font-bold text-yellow-700">{tropa.n_tropa}</p>
                    </div>
                    <div className="shrink-0 text-right text-xs text-gray-500">
                      <p>{new Date(tropa.fecha_solicita_eliminacion).toLocaleDateString()}</p>
                      <p>{new Date(tropa.fecha_solicita_eliminacion).toLocaleTimeString()}</p>
                    </div>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
                    <div className="col-span-2 min-w-0">
                      <dt className="text-xs font-semibold text-gray-500">Solicitante</dt>
                      <dd className="break-words font-medium text-gray-800">{tropa.usuario_solicita_nombre || '—'}</dd>
                      <dd className="break-all text-xs text-gray-500">{tropa.usuario_solicita_email || '—'}</dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-xs font-semibold text-gray-500">Productor</dt>
                      <dd className="break-words text-gray-800">{tropa.productor_nombre || '—'}</dd>
                    </div>
                    <div className="col-span-2 min-w-0">
                      <dt className="text-xs font-semibold text-gray-500">Planta</dt>
                      <dd className="break-words text-gray-800">{tropa.planta_nombre || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-gray-500">Faenas</dt>
                      <dd className="font-semibold text-blue-700">{tropa.cant_faenas}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold text-gray-500">Decomisos</dt>
                      <dd className="font-semibold text-red-700">{tropa.cant_decomisos}</dd>
                    </div>
                  </dl>

                  <div className="mt-4 border-t border-gray-100 pt-3">
                    {renderAcciones(tropa)}
                  </div>
                </article>
              ))}
            </div>

            {tropas.length > PAGE_SIZE && (
              <nav aria-label="Paginación de tropas pendientes" className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  disabled={activePage === 1}
                  className="rounded-full border border-yellow-700 bg-white px-3 py-1.5 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  ← Anterior
                </button>
                {visiblePages.map((page, index) => (
                  <Fragment key={page}>
                    {index > 0 && visiblePages[index - 1] + 1 < page && (
                      <span aria-hidden="true" className="px-1 text-gray-500">…</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={activePage === page ? 'page' : undefined}
                      aria-label={`Página ${page}`}
                      className={`h-9 min-w-9 rounded-full px-3 text-sm font-semibold transition ${
                        activePage === page
                          ? 'bg-yellow-600 text-white shadow'
                          : 'border border-yellow-700 bg-white text-yellow-800 hover:bg-yellow-50'
                      }`}
                    >
                      {page}
                    </button>
                  </Fragment>
                ))}
                <button
                  type="button"
                  onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                  disabled={activePage === totalPages}
                  className="rounded-full border border-yellow-700 bg-white px-3 py-1.5 text-sm font-semibold text-yellow-800 transition hover:bg-yellow-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  Siguiente →
                </button>
              </nav>
            )}
          </>
        )}
      </div>

      {/* Modal de confirmación/rechazo */}
      {modalAccion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            {modalAccion.type === 'confirmar' ? (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-red-700">
                    🚨 Confirmar Eliminación
                  </h2>
                  <button
                    onClick={() => setModalAccion(null)}
                    className="text-gray-400 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-red-800 font-medium mb-2">
                    ⚠️ <strong>Última advertencia:</strong>
                  </p>
                  <ul className="text-xs text-red-700 space-y-1 list-disc list-inside">
                    <li>Se eliminará <strong>permanentemente</strong> la tropa {modalAccion.nTropa}</li>
                    <li>Se eliminarán TODAS las faenas y decomisos asociados</li>
                    <li>Esta acción <strong>NO se puede deshacer</strong></li>
                    <li>El registro quedará en auditoría para referencia</li>
                  </ul>
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() => setModalAccion(null)}
                    className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleConfirmarEliminacion(modalAccion.tropaId, modalAccion.nTropa)}
                    disabled={procesando}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold disabled:opacity-50"
                  >
                    {procesando ? 'Eliminando...' : 'Sí, Eliminar Definitivamente'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-lg font-bold text-gray-800">
                    ❌ Rechazar Solicitud
                  </h2>
                  <button
                    onClick={() => setModalAccion(null)}
                    className="text-gray-400 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-800">
                    La tropa <strong>{modalAccion.nTropa}</strong> volverá a estado <strong>activa</strong> y podrá seguir siendo utilizada.
                  </p>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Motivo del rechazo (opcional)
                  </label>
                  <textarea
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Ej: Los datos están correctos, se necesita revisar antes..."
                    className="w-full border-2 border-gray-200 rounded-lg px-3 py-2 text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none"
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    onClick={() => {
                      setModalAccion(null);
                      setMotivoRechazo('');
                    }}
                    className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleRechazarEliminacion(modalAccion.tropaId, modalAccion.nTropa)}
                    disabled={procesando}
                    className="px-5 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 font-semibold disabled:opacity-50"
                  >
                    {procesando ? 'Procesando...' : 'Rechazar Solicitud'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {auditoria && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 py-6">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="auditoria-title"
            className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
          >
            <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h2 id="auditoria-title" className="text-lg font-bold text-gray-900">
                  Auditoría de eliminación
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  Historial, datos de la tropa y acciones registradas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditoria(null)}
                className="rounded p-1 text-2xl leading-none text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Cerrar auditoría"
              >
                ×
              </button>
            </header>

            <div className="overflow-y-auto px-5 py-4">
              {auditoria.loading ? (
                <div className="py-10 text-center text-gray-500">Cargando auditoría...</div>
              ) : auditoria.error ? (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  {auditoria.error}
                </div>
              ) : auditoria.historial.length === 0 ? (
                <div className="py-10 text-center text-gray-500">No hay eventos de auditoría para esta tropa.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {auditoria.historial.map((evento) => {
                    const detalles = leerDetallesAuditoria(evento.detalles);
                    const mostrar = (valor) => valor || '—';

                    return (
                      <article key={evento.id_audit} className="py-5 first:pt-0 last:pb-0">
                        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-semibold text-gray-900">
                            {evento.accion === 'solicitud_eliminacion'
                              ? 'Solicitud de eliminación'
                              : evento.accion === 'confirmacion_eliminacion'
                                ? 'Eliminación confirmada'
                                : evento.accion}
                          </h3>
                          <time className="text-sm text-gray-500">
                            {new Date(evento.fecha_accion).toLocaleString()}
                          </time>
                        </div>

                        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-gray-500">N° de tropa</dt>
                            <dd className="font-medium text-gray-900">{mostrar(evento.n_tropa)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">DTE/DTU</dt>
                            <dd className="font-medium text-gray-900">{mostrar(detalles.dte_dtu)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Guía policial</dt>
                            <dd className="font-medium text-gray-900">{mostrar(detalles.guia_policial)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Productor</dt>
                            <dd className="font-medium text-gray-900">{mostrar(detalles.productor)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Titular de faena</dt>
                            <dd className="font-medium text-gray-900">{mostrar(detalles.titular_faena)}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-500">Usuario</dt>
                            <dd className="font-medium text-gray-900">
                              {evento.usuario_nombre || '—'}{evento.usuario_email ? ` (${evento.usuario_email})` : ''}
                            </dd>
                          </div>
                          {detalles.motivo && (
                            <div className="sm:col-span-2">
                              <dt className="text-gray-500">Motivo</dt>
                              <dd className="font-medium text-gray-900">{detalles.motivo}</dd>
                            </div>
                          )}
                        </dl>

                        {Array.isArray(detalles.resumen_animales) && detalles.resumen_animales.length > 0 ? (
                          <div className="mt-4 border-t border-gray-100 pt-4">
                            <h4 className="mb-2 text-sm font-semibold text-gray-800">
                              Animales por especie y categoría
                            </h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-[620px] w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                  <tr>
                                    <th className="px-3 py-2">Especie</th>
                                    <th className="px-3 py-2">Categoría</th>
                                    <th className="px-3 py-2 text-right">En tropa</th>
                                    <th className="px-3 py-2 text-right">Faenados</th>
                                    <th className="px-3 py-2 text-right">Afectados por decomiso</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {detalles.resumen_animales.map((fila, indice) => (
                                    <tr key={`${fila.especie}-${fila.categoria}-${indice}`}>
                                      <td className="px-3 py-2 text-gray-800">{fila.especie || '—'}</td>
                                      <td className="px-3 py-2 text-gray-800">{fila.categoria || '—'}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{Number(fila.cantidad_total) || 0}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{Number(fila.cantidad_faenada) || 0}</td>
                                      <td className="px-3 py-2 text-right tabular-nums">{Number(fila.animales_decomisados) || 0}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-4 border-t border-gray-100 pt-4 text-sm text-gray-500">
                            Este evento no tiene un desglose de animales por especie y categoría.
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

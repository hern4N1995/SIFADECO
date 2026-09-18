// TropasPendientesEliminacion.jsx
// Página para que el admin (rol 1) vea y confirme/rechace solicitudes de eliminación

import { useEffect, useState } from 'react';
import api from '../services/api.js';
import { formatDateFromDB } from '../utils/dateFormatter';

export default function TropasPendientesEliminacion() {
  const [tropas, setTropas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalAccion, setModalAccion] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);

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
    if (!window.confirm(`¿Confirmar eliminación definitiva de la tropa ${nTropa}? Esta acción no se puede deshacer.`)) {
      return;
    }

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
    try {
      const response = await api.get(`/tropas-eliminacion/${tropaId}/auditoria`);
      const historial = response.data;
      
      console.log('Historial de auditoría:', historial);
      
      let mensaje = 'Historial de Auditoría:\n\n';
      historial.forEach((audit, idx) => {
        mensaje += `${idx + 1}. ${audit.accion.toUpperCase()}\n`;
        mensaje += `   Fecha: ${new Date(audit.fecha_accion).toLocaleString()}\n`;
        mensaje += `   Usuario: ${audit.usuario_nombre} (${audit.usuario_email})\n`;
        if (audit.detalles) {
          const detalles = typeof audit.detalles === 'string' 
            ? JSON.parse(audit.detalles) 
            : audit.detalles;
          mensaje += `   Detalles: ${JSON.stringify(detalles, null, 2)}\n`;
        }
        mensaje += '\n';
      });
      
      alert(mensaje);
    } catch (err) {
      console.error('[TropasPendientes] Error al obtener auditoría:', err);
      alert('Error al obtener historial de auditoría');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ⏳ Tropas Pendientes de Eliminación
          </h1>
          <p className="text-gray-600">
            Revisa las solicitudes de eliminación de tropas enviadas por los usuarios
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-700">
            {error}
          </div>
        )}

        {tropas.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <p className="text-gray-500 text-lg">✨ No hay tropas pendientes de eliminación</p>
            <p className="text-gray-400 text-sm mt-2">Todas las solicitudes han sido procesadas</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
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
                  {tropas.map((tropa) => (
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
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center flex-wrap">
                          <button
                            onClick={() => handleVerAuditoria(tropa.id_tropa)}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200 font-semibold"
                            title="Ver historial de auditoría"
                          >
                            📋 Auditoría
                          </button>
                          <button
                            onClick={() => setModalAccion({ 
                              type: 'confirmar', 
                              tropaId: tropa.id_tropa, 
                              nTropa: tropa.n_tropa 
                            })}
                            className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 font-semibold"
                            title="Confirmar eliminación"
                          >
                            ✅ Confirmar
                          </button>
                          <button
                            onClick={() => setModalAccion({ 
                              type: 'rechazar', 
                              tropaId: tropa.id_tropa, 
                              nTropa: tropa.n_tropa 
                            })}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded hover:bg-gray-200 font-semibold"
                            title="Rechazar solicitud"
                          >
                            ❌ Rechazar
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

                <div className="flex justify-end gap-3">
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

                <div className="flex justify-end gap-3">
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
    </div>
  );
}

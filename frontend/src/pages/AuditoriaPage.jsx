// src/pages/AuditoriaPage.jsx
// Registro de auditoría general. Solo superadmin (rol 4). Solo lectura: no se corrige.
import { useEffect, useState } from 'react';
import api from '../services/api.js';

const LIMIT = 50;
const METODOS = ['', 'POST', 'PUT', 'PATCH', 'DELETE'];

const formatearFecha = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? String(valor) : d.toLocaleString('es-AR');
};

const nombreUsuario = (fila) => {
  if (!fila.id_usuario) return 'Sin sesión';
  const nombre = [fila.nombre, fila.apellido].filter(Boolean).join(' ');
  return nombre || fila.email || `Usuario ${fila.id_usuario}`;
};

const textoDetalles = (detalles) => {
  if (!detalles) return '';
  return typeof detalles === 'string' ? detalles : JSON.stringify(detalles);
};

export default function AuditoriaPage() {
  const [filas, setFilas] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({ metodo: '', ruta: '', desde: '', hasta: '' });
  const [aplicados, setAplicados] = useState(filtros);

  useEffect(() => {
    let cancelado = false;

    const cargar = async () => {
      try {
        setLoading(true);
        const params = { page, limit: LIMIT };
        Object.entries(aplicados).forEach(([k, v]) => {
          if (v) params[k] = v;
        });
        const { data } = await api.get('/auditoria', { params });
        if (cancelado) return;
        setFilas(Array.isArray(data?.data) ? data.data : []);
        setTotal(Number(data?.total) || 0);
        setError(null);
      } catch (err) {
        if (cancelado) return;
        console.error('[Auditoria] Error al cargar:', err);
        setError(err.response?.data?.message || 'No se pudo cargar la auditoría');
        setFilas([]);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    cargar();
    return () => {
      cancelado = true;
    };
  }, [page, aplicados]);

  const totalPaginas = Math.max(Math.ceil(total / LIMIT), 1);

  const aplicarFiltros = (e) => {
    e.preventDefault();
    setPage(1);
    setAplicados(filtros);
  };

  const limpiar = () => {
    const vacio = { metodo: '', ruta: '', desde: '', hasta: '' };
    setFiltros(vacio);
    setPage(1);
    setAplicados(vacio);
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Auditoría</h1>
      <p className="text-sm text-gray-500 mb-6">
        Registro de todas las altas, modificaciones y bajas realizadas en el sistema. Es de solo
        lectura. Para corregir datos cargados, usá Correcciones de carga.
      </p>

      <form
        onSubmit={aplicarFiltros}
        className="bg-white rounded-2xl shadow border border-gray-100 p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6"
      >
        <label className="flex flex-col text-sm text-gray-700">
          Acción
          <select
            value={filtros.metodo}
            onChange={(e) => setFiltros({ ...filtros, metodo: e.target.value })}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
          >
            {METODOS.map((m) => (
              <option key={m || 'todas'} value={m}>
                {m || 'Todas'}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Ruta contiene
          <input
            type="text"
            value={filtros.ruta}
            onChange={(e) => setFiltros({ ...filtros, ruta: e.target.value })}
            placeholder="ej: decomisos"
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Desde
          <input
            type="date"
            value={filtros.desde}
            onChange={(e) => setFiltros({ ...filtros, desde: e.target.value })}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <label className="flex flex-col text-sm text-gray-700">
          Hasta
          <input
            type="date"
            value={filtros.hasta}
            onChange={(e) => setFiltros({ ...filtros, hasta: e.target.value })}
            className="mt-1 rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-primary text-white px-4 py-2 font-semibold hover:opacity-90"
          >
            Filtrar
          </button>
          <button
            type="button"
            onClick={limpiar}
            className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
          >
            Limpiar
          </button>
        </div>
      </form>

      {error && <div className="mb-4 rounded-lg bg-red-50 text-red-700 px-4 py-3">{error}</div>}

      <div className="bg-white rounded-2xl shadow border border-gray-100 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Acción</th>
              <th className="px-4 py-3">Ruta</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  Cargando...
                </td>
              </tr>
            )}
            {!loading && filas.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                  No hay registros para los filtros seleccionados.
                </td>
              </tr>
            )}
            {!loading &&
              filas.map((fila) => (
                <tr key={fila.id_audit} className="border-t border-gray-100 align-top">
                  <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(fila.fecha)}</td>
                  <td className="px-4 py-2">{nombreUsuario(fila)}</td>
                  <td className="px-4 py-2">{fila.rol ?? '—'}</td>
                  <td className="px-4 py-2 font-semibold">{fila.metodo}</td>
                  <td className="px-4 py-2 break-all">{fila.ruta}</td>
                  <td className="px-4 py-2">{fila.status ?? '—'}</td>
                  <td className="px-4 py-2">{fila.ip || '—'}</td>
                  <td className="px-4 py-2 max-w-xs">
                    {fila.detalles ? (
                      <code className="text-xs break-all">{textoDetalles(fila.detalles)}</code>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
        <span>
          {total} registro{total === 1 ? '' : 's'} · página {page} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={page >= totalPaginas || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 disabled:opacity-40"
          >
            Siguiente
          </button>
        </div>
      </div>
    </div>
  );
}

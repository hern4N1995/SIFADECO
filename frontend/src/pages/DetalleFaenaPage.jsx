import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import DetalleFaenaForm from '../components/DetalleFaenaForm';

const DetableFaenaPage = () => {
  const { idTropa } = useParams();
  const navigate = useNavigate();
  const [faena, setFaena] = useState(null);
  const [modo] = useState('crear');
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // Función para formatear fecha evitando desfase de zona horaria
  const formatDate = (f) => {
    if (!f) return '—';
    try {
      // Si viene como string "YYYY-MM-DD", parsearlo directamente sin New Date (que lo interpreta como UTC)
      if (typeof f === 'string' && /^\d{4}-\d{2}-\d{2}/.test(f)) {
        const [year, month, day] = f.split('T')[0].split('-');
        const date = new Date(year, parseInt(month) - 1, day);
        return date.toLocaleDateString('es-AR');
      }
      return new Date(f).toLocaleDateString('es-AR');
    } catch (e) {
      return '—';
    }
  };

  useEffect(() => {
    // Usar AbortController para cancelar peticiones si el componente se desmonta
    const controller = new AbortController();
    let isMounted = true;

    const fetchTropaYDetalle = async () => {
      if (!idTropa) {
        console.error('[DetableFaenaPage] idTropa no proporcionado');
        if (isMounted) {
          setError('ID de tropa inválido');
          setLoading(false);
        }
        return;
      }

      try {
        if (isMounted) setLoading(true);

        // Obtener datos en paralelo (más rápido que secuencial)
        const [tropaRes, detalleRes] = await Promise.all([
          api.get(`/tropas/${idTropa}`, { signal: controller.signal }),
          api.get(`/tropas/${idTropa}/detalle`, { signal: controller.signal }),
        ]);

        // Si el componente se desmontó mientras esperábamos, no actualizar estado
        if (!isMounted) return;

        const tropa = tropaRes.data?.data || tropaRes.data || {};
        console.log('[DetableFaenaPage] Datos tropa:', tropa);

        let detalleData = detalleRes.data;
        console.log('[DetableFaenaPage] Respuesta detalle raw:', detalleRes.data);

        if (detalleData && typeof detalleData === 'object') {
          if (detalleData.data) detalleData = detalleData.data;
          if (!Array.isArray(detalleData)) {
            detalleData = detalleData.categorias || [];
          }
        }

        // Normalizar categorías: agregar campos faltantes
        const categoriasNormalizadas = Array.isArray(detalleData)
          ? detalleData.map((cat) => ({
              ...cat,
              id_tropa_detalle: cat.id_tropa_detalle || cat.id || null,
              nombre:
                cat.nombre ||
                cat.nombre_categoria ||
                cat.nombre_cat ||
                cat.categoria ||
                'Categoría sin nombre',
              cantidad: cat.cantidad || 0,
              remanente:
                cat.remanente ?? cat.remanente_total ?? (cat.cantidad || 0),
              especie: cat.especie || cat.nombre_especie || '',
            }))
          : [];

        console.log('[DetableFaenaPage] Categorías normalizadas:', categoriasNormalizadas);

        // Normalizar especie
        let especie = tropa.especie || tropa.nombre_especie || '';
        if (!especie && categoriasNormalizadas.length > 0) {
          especie = categoriasNormalizadas[0].especie || '';
        }

        // Construir objeto faena
        if (isMounted) {
          setFaena({
            id_tropa: idTropa,
            n_tropa: tropa.n_tropa || tropa.nTropa || '',
            dte_dtu: tropa.dte_dtu || tropa.dte || tropa.dtu || '',
            fecha: tropa.fecha || tropa.fecha_ingreso || new Date().toISOString(),
            especie: especie || 'Especie',
            categorias: categoriasNormalizadas,
          });
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        // Ignorar errores de AbortError (usuario navegó o componente se desmontó)
        if (err.name === 'AbortError') {
          console.log('[DetableFaenaPage] Petición cancelada (componente desmontado)');
          return;
        }

        console.error('[DetableFaenaPage] Error al cargar datos:', err);

        if (isMounted) {
          const errorMessage = err.response?.data?.error ||
            err.message ||
            'Error al cargar datos de la tropa. Intenta de nuevo.';
          setError(errorMessage);
          setFaena(null);
          setLoading(false);
        }
      }
    };

    fetchTropaYDetalle();

    // Cleanup: cancelar peticiones si el componente se desmonta
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [idTropa, retryCount]);

  // Función para reintentar cargar datos
  const handleRetry = () => {
    setError(null);
    setFaena(null);
    setLoading(true);
    setRetryCount((prev) => prev + 1);
  };

  const handleSubmit = async (datos) => {
    if (!faena?.id_tropa) {
      alert('❌ No se pudo obtener el ID de la tropa');
      return;
    }

    const payload = {
      id_tropa: faena.id_tropa,
      fecha_faena: datos.fecha,
      hora_faena: datos.hora || null,
      categorias: datos.categorias
        .filter((c) => c.cantidad > 0)
        .map((c) => ({
          id_tropa_detalle: c.id_tropa_detalle,
          cantidad: c.cantidad,
        })),
    };

    if (!payload.categorias.length) {
      alert('⚠️ Debes ingresar al menos una categoría con cantidad');
      return;
    }

    try {
      console.log('[DetalleFaenaPage] Enviando payload:', payload);

      const res = await api.post('/faena/registrar', payload);

      console.log('[DetalleFaenaPage] Respuesta exitosa:', res.data);
      alert('✅ Faena registrada correctamente');

      setResumen({
        id_faena: res.data.id_faena,
        fecha: datos.fecha,
        hora: datos.hora,
        n_tropa: faena.n_tropa,
        especie: faena.especie,
        categorias: datos.categorias,
      });
    } catch (err) {
      console.error('[DetalleFaenaPage] Error al guardar faena:', err);

      if (err.response?.status === 401) {
        alert('⚠️ Sesión expirada. Volvé a iniciar sesión.');
        navigate('/login');
        return;
      }

      if (err.response?.status === 403) {
        alert('🚫 No tenés permisos para registrar faenas');
        return;
      }

      if (err.response?.status === 400) {
        const errorMsg = err.response?.data?.error || 'Datos inválidos';
        alert(`❌ Error: ${errorMsg}`);
        return;
      }

      alert('❌ No se pudo guardar la faena. Intenta de nuevo.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-8">
          Faena
        </h1>

        {loading ? (
          <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 rounded-md text-center">
            <p className="font-semibold">Cargando datos de la tropa...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-400 text-red-800 p-4 rounded-md text-center">
            <p className="font-semibold mb-1">Error al cargar</p>
            <p className="mb-4 text-sm">{error}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 transition-colors"
              >
                🔄 Reintentar
              </button>
              <button
                onClick={() => navigate('/faena')}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              >
                🔙 Volver a Faena
              </button>
            </div>
          </div>
        ) : resumen ? (
          <ResumenFaena resumen={resumen} />
        ) : faena ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <Card title="N° de Tropa" value={faena.n_tropa} />
              <Card title="DTE / DTU" value={faena.dte_dtu} />
              <Card
                title="Fecha de ingreso"
                value={formatDate(faena.fecha)}
              />
            </div>

            <div className="mb-6">
              <span className="text-sm text-slate-500">Especie</span>
              <p className="text-2xl font-bold text-slate-800">
                {faena.especie}
              </p>
            </div>

            <DetalleFaenaForm
              modo={modo}
              faena={faena}
              onSubmit={handleSubmit}
            />
          </>
        ) : (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-md text-center">
            <p className="font-semibold mb-1">Sin animales registrados</p>
            <p>La tropa no tiene animales cargados para faenar.</p>
            <button
              onClick={() => navigate('/faena')}
              className="mt-4 px-4 py-2 rounded-lg bg-yellow-700 text-white hover:bg-yellow-800"
            >
              🔙 Volver a FaenaPage
            </button>
          </div>
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

const ResumenFaena = ({ resumen }) => (
  <div className="w-full max-w-3xl mx-auto space-y-6 bg-green-50 border border-green-200 rounded-xl p-6">
    <h2 className="text-xl font-bold text-green-800">
      ✅ Faena registrada correctamente
    </h2>
    <p>
      <strong>ID Faena:</strong> {resumen.id_faena}
    </p>
    <p>
      <strong>Tropa:</strong> {resumen.n_tropa}
    </p>
    <p>
      <strong>Fecha:</strong> {resumen.fecha}
    </p>
    <p>
      <strong>Especie:</strong> {resumen.especie}
    </p>
    <h3 className="font-semibold mt-4">Categorías faenadas:</h3>
    <ul className="list-disc pl-5 text-slate-700">
      {resumen.categorias.map((cat, i) => (
        <li key={i}>
          {cat.nombre || `Detalle ${cat.id_tropa_detalle}`}: {cat.cantidad}{' '}
          animales
        </li>
      ))}
    </ul>
    <button
      onClick={() => (window.location.href = '/faena')}
      className="mt-6 px-6 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
    >
      🔙 Volver a FaenaPage
    </button>
  </div>
);

export default DetableFaenaPage;

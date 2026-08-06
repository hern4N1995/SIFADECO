import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { formatDateFromDB } from '../utils/dateFormatter';

export default function InformeTropa() {
  const params = useParams();
  let tropaId =
    params?.tropaId ??
    params?.id ??
    params?.tropa_id ??
    params?.id_tropa ??
    null;

  // DEBUG: log params and current location to investigate undefined tropaId
  if (typeof window !== 'undefined') {
    try {
      console.log('InformeTropa initial params:', params);
      console.log('InformeTropa location href:', window.location.href);
      console.log('InformeTropa location pathname:', window.location.pathname);
      console.log('InformeTropa location search:', window.location.search);
    } catch (e) {
      // ignore
    }
  }

  // Fallback: revisar query string ?id= o ?tropaId=
  if (!tropaId && typeof window !== 'undefined') {
    try {
      const sp = new URLSearchParams(window.location.search);
      tropaId =
        sp.get('tropaId') ||
        sp.get('id') ||
        sp.get('tropa_id') ||
        sp.get('id_tropa') ||
        null;
    } catch (e) {
      // ignore
    }
  }
  // Normalizar y validar tropaId (evitar 'undefined' o 'null' string)
  if (typeof tropaId === 'string') {
    const t = tropaId.trim();
    if (
      t === '' ||
      t.toLowerCase() === 'undefined' ||
      t.toLowerCase() === 'null'
    ) {
      tropaId = null;
    } else {
      // extraer número si viene con otros caracteres
      const m = t.match(/(\d+)/);
      tropaId = m ? m[0] : t;
    }
  }
  const [tropaInfo, setTropaInfo] = useState({});
  const [detalle, setDetalle] = useState({
    especie: '',
    categorias: [],
    n_tropa: '',
    fecha: '',
    dte_dtu: '',
    titular: '',
  });

  useEffect(() => {
    if (!tropaId) {
      console.warn('InformeTropa: tropaId no disponible, omitiendo petición');
      setDetalle({
        especie: '',
        categorias: [],
        n_tropa: '',
        fecha: '',
        dte_dtu: '',
        titular: '',
      });
      return;
    }

    const idNum = Number(tropaId);
    if (!Number.isInteger(idNum) || idNum <= 0) {
      console.warn('InformeTropa: tropaId inválido ->', tropaId);
      setDetalle({
        especie: '',
        categorias: [],
        n_tropa: '',
        fecha: '',
        dte_dtu: '',
        titular: '',
      });
      return;
    }

    console.log(
      'InformeTropa: solicitando detalle agrupado para tropaId=',
      idNum
    );
    api
      .get(`/tropas/${idNum}/detalle-agrupado`)
      .then((res) => {
        console.log('InformeTropa: detalle agrupado recibido', res.data);
        setDetalle(res.data);
      })
      .catch((err) => {
        console.error('InformeTropa: error al obtener detalle agrupado', err);
        setDetalle({
          especie: '',
          categorias: [],
          n_tropa: '',
          fecha: '',
          dte_dtu: '',
          titular: '',
        });
      });
  }, [tropaId]);

  const { especie, categorias, n_tropa, fecha, dte_dtu, titular } = detalle;
  const totalOriginal = Array.isArray(categorias)
    ? categorias.reduce((acc, i) => acc + (Number(i.cantidad_total) || 0), 0)
    : 0;
  const totalEspecie = Array.isArray(categorias)
    ? categorias.reduce((acc, i) => acc + (Number(i.remanente) || 0), 0)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Título principal */}
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          📄 Informe de Tropa
        </h1>

        {/* Datos generales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Nº Tropa', value: n_tropa },
            {
              label: 'Fecha',
              value: formatDateFromDB(fecha),
            },
            { label: 'DTE/DTU', value: dte_dtu },
            { label: 'Titular', value: titular || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl shadow-md p-4">
              <label className="block text-sm font-semibold text-gray-600 mb-1">
                {label}
              </label>
              <input
                type="text"
                value={value || ''}
                disabled
                className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-800 focus:outline-none"
              />
            </div>
          ))}
        </div>

        {/* Detalle agrupado */}
        {!Array.isArray(categorias) || categorias.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-500">
              No se han registrado animales en esta tropa.
            </p>
          </div>
        ) : (() => {
          // Agrupar categorías por especie
          const especiesMap = {};
          categorias.forEach((cat) => {
            if (!especiesMap[cat.especie]) {
              especiesMap[cat.especie] = [];
            }
            especiesMap[cat.especie].push(cat);
          });
          const especies = Object.entries(especiesMap);

          return (
            <section className="space-y-8">
              {especies.map(([nombreEspecie, catsPorEspecie]) => {
                const totalEspecieActual = catsPorEspecie.reduce((acc, i) => acc + (Number(i.cantidad_total) || 0), 0);
                const totalRemanenteEspecie = catsPorEspecie.reduce((acc, i) => acc + (Number(i.remanente) || 0), 0);

                return (
                  <div key={nombreEspecie}>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">{nombreEspecie}</h2>

                    {/* Móvil: cards */}
                    <div className="sm:hidden space-y-3">
                      {catsPorEspecie.map((item) => (
                        <div
                          key={`${item.especie}-${item.nombre}`}
                          className="bg-white rounded-lg shadow p-4 border border-gray-100"
                        >
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium text-gray-700">
                              {item.nombre}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-gray-500">Original:</span>
                              <span className="ml-1 font-semibold text-gray-900">
                                {item.cantidad_total || 0}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Remanente:</span>
                              <span className="ml-1 font-semibold text-gray-900">
                                {item.remanente || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="bg-gray-100 rounded-lg p-4 border border-gray-200">
                        <div className="flex justify-between items-center font-bold text-sm mb-2">
                          <span>TOTAL {nombreEspecie} - Original</span>
                          <span>{totalEspecieActual}</span>
                        </div>
                        <div className="flex justify-between items-center font-bold text-sm">
                          <span>TOTAL {nombreEspecie} - Remanente</span>
                          <span>{totalRemanenteEspecie}</span>
                        </div>
                      </div>
                    </div>

                    {/* Escritorio: tabla */}
                    <div className="hidden sm:block overflow-x-auto">
                      <table className="min-w-full bg-white rounded-xl shadow-md border border-gray-200">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                              Categoría
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                              Cantidad Original
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                              Faenados
                            </th>
                            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                              Remanente
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {catsPorEspecie.map((item) => (
                            <tr key={`${item.especie}-${item.nombre}`} className="border-t border-gray-200">
                              <td className="px-4 py-3 text-sm text-gray-800">
                                {item.nombre}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                {item.cantidad_total || 0}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-orange-600">
                                {item.cantidad_faenada || 0}
                              </td>
                              <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                                {item.remanente || 0}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-100 font-bold text-sm border-t border-gray-300">
                            <td className="px-4 py-3">TOTAL {nombreEspecie}</td>
                            <td className="px-4 py-3 text-right">{totalEspecieActual}</td>
                            <td className="px-4 py-3 text-right text-orange-600">
                              {catsPorEspecie.reduce((acc, i) => acc + (Number(i.cantidad_faenada) || 0), 0)}
                            </td>
                            <td className="px-4 py-3 text-right">{totalRemanenteEspecie}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </section>
          );
        })()}
      </div>
    </div>
  );
}

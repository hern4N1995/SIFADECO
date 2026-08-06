import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const DetalleFaenaForm = ({ modo = 'crear', faena = {}, onSubmit }) => {
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [faenaPorCategoria, setFaenaPorCategoria] = useState({});
  const [feedback, setFeedback] = useState('');
  const [erroresPorCategoria, setErroresPorCategoria] = useState({});
  const [resumenFaena, setResumenFaena] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (modo === 'editar' && faena.fecha) setFecha(faena.fecha);
  }, [modo, faena]);

  useEffect(() => {
    if (faena?.categorias?.length > 0) {
      console.log('[DetalleFaenaForm] Categorías recibidas:', faena.categorias);
      // inicializamos como undefined para que el campo se muestre vacío
      const inicial = {};
      faena.categorias.forEach((cat) => {
        inicial[cat.id_tropa_detalle] = undefined;
      });
      setFaenaPorCategoria(inicial);
    }
  }, [faena]);

  // cleanedVal: '' -> undefined; otherwise integer >= 0
  const handleCantidadChange = (id_tropa_detalle, rawVal) => {
    const s = String(rawVal || '');
    const cleaned = s.replace(/\D+/g, ''); // elimina no-dígitos
    const cant =
      cleaned === '' ? undefined : Math.max(0, parseInt(cleaned, 10));
    
    // Encontrar el remanente de esta categoría
    const categoria = faena.categorias?.find(cat => cat.id_tropa_detalle === id_tropa_detalle);
    const remanente = categoria?.remanente || 0;
    
    // Validar si la cantidad excede el remanente
    if (cant !== undefined && cant > remanente) {
      setErroresPorCategoria(prev => ({
        ...prev,
        [id_tropa_detalle]: `⚠️ Excede el remanente de ${remanente} animales`
      }));
    } else {
      // Limpiar error si es válido
      setErroresPorCategoria(prev => {
        const newErrors = { ...prev };
        delete newErrors[id_tropa_detalle];
        return newErrors;
      });
    }
    
    setFaenaPorCategoria((prev) => ({
      ...prev,
      [id_tropa_detalle]: cant,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!fecha) return setFeedback('⚠️ La fecha es obligatoria');

    // Verificar si hay errores de validación
    if (Object.keys(erroresPorCategoria).length > 0) {
      return setFeedback('⚠️ Hay errores en las cantidades. Revisa los valores ingresados');
    }

    const detalles = (faena.categorias || [])
      .filter((cat) => {
        const v = faenaPorCategoria[cat.id_tropa_detalle];
        return typeof v === 'number' && v > 0;
      })
      .map((cat) => ({
        id_tropa_detalle: cat.id_tropa_detalle,
        cantidad: faenaPorCategoria[cat.id_tropa_detalle],
        nombre: cat.nombre,
        especie: cat.especie,
      }));

    if (!detalles.length) {
      return setFeedback(
        '⚠️ Debes ingresar al menos una categoría con cantidad'
      );
    }

    setFeedback('✅ Datos listos para enviar');
    setResumenFaena({
      fecha,
      hora,
      n_tropa: faena.n_tropa,
      especie: faena.especie,
      categorias: detalles,
    });

    onSubmit({ fecha, hora, categorias: detalles });
  };

  const preventDotAndMinus = (e) => {
    if (e.key === '.' || e.key === ',' || e.key === '-') {
      e.preventDefault();
    }
  };

  return (
    <>
      {resumenFaena ? (
        <div className="w-full max-w-3xl mx-auto space-y-6 bg-green-50 border border-green-200 rounded-xl p-6">
          <h2 className="text-xl font-bold text-green-800">
            ✅ Faena registrada correctamente
          </h2>
          <p>
            <strong>Tropa:</strong> {resumenFaena.n_tropa}
          </p>
          <p>
            <strong>Fecha:</strong> {resumenFaena.fecha}
          </p>
          <p>
            <strong>Hora:</strong> {resumenFaena.hora || '—'}
          </p>
          <p>
            <strong>Especie:</strong> {resumenFaena.especie}
          </p>
          <h3 className="font-semibold mt-4">Categorías faenadas:</h3>
          <ul className="list-disc pl-5 text-slate-700">
            {resumenFaena.categorias.map((cat, i) => (
              <li key={i}>
                {cat.nombre}: {cat.cantidad} animales
              </li>
            ))}
          </ul>
          <button
            onClick={() => navigate('/faena')}
            className="mt-6 px-6 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
          >
            🔙 Volver a FaenaPage
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-5xl mx-auto space-y-6"
        >
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Fecha de faena
            </label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
              className="w-full md:w-auto rounded-lg border-2 border-gray-200 px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Hora de faena (opcional)
            </label>
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="w-full md:w-auto rounded-lg border-2 border-gray-200 px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Categorías a faenar
            </label>

            {faena.categorias?.length === 0 ? (
              <div className="text-sm text-slate-500 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                No hay animales disponibles para faenar en esta tropa.
              </div>
            ) : (
              <>
                <div className="hidden md:block overflow-x-auto rounded-xl ring-1 ring-slate-200">
                  <table className="min-w-[700px] w-full text-sm text-left text-slate-700">
                    <thead className="bg-green-700 text-white text-xs uppercase tracking-wider">
                      <tr>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3 text-right">Remanente</th>
                        <th className="px-4 py-3 text-right">A faenar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {faena.categorias.map((cat) => (
                        <tr
                          key={cat.id_tropa_detalle}
                          className="bg-white border-b hover:bg-green-50"
                        >
                          <td className="px-4 py-3 font-medium">
                            {cat.nombre}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {cat.remanente}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="\d*"
                                min={0}
                                max={cat.remanente}
                                value={
                                  faenaPorCategoria[cat.id_tropa_detalle] !==
                                  undefined
                                    ? String(
                                        faenaPorCategoria[cat.id_tropa_detalle]
                                      )
                                    : ''
                                }
                                onKeyDown={preventDotAndMinus}
                                onChange={(e) =>
                                  handleCantidadChange(
                                    cat.id_tropa_detalle,
                                    e.target.value
                                  )
                                }
                                className={`w-24 rounded-lg border-2 px-4 py-3 text-right text-sm bg-gray-50 transition-all duration-200 focus:ring-4 focus:outline-none hover:border-green-300 ${
                                  erroresPorCategoria[cat.id_tropa_detalle]
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                                    : 'border-gray-200 focus:border-green-500 focus:ring-green-100'
                                }`}
                              />
                              {erroresPorCategoria[cat.id_tropa_detalle] && (
                                <p className="text-xs text-red-600 mt-1">
                                  {erroresPorCategoria[cat.id_tropa_detalle]}
                                </p>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="md:hidden space-y-3">
                  {faena.categorias.map((cat) => (
                    <div
                      key={cat.id_tropa_detalle}
                      className="bg-white rounded-xl shadow border border-slate-200 p-4"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-slate-800">
                          {cat.nombre}
                        </span>
                        <span className="text-sm text-slate-500">
                          Remanente: <b>{cat.remanente}</b>
                        </span>
                      </div>
                      <label className="block text-xs text-slate-500 mb-1">
                        A faenar
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="\d*"
                        min={0}
                        max={cat.remanente}
                        value={
                          faenaPorCategoria[cat.id_tropa_detalle] !== undefined
                            ? String(faenaPorCategoria[cat.id_tropa_detalle])
                            : ''
                        }
                        onKeyDown={preventDotAndMinus}
                        onChange={(e) =>
                          handleCantidadChange(
                            cat.id_tropa_detalle,
                            e.target.value
                          )
                        }
                        className={`w-full rounded-lg border-2 px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:ring-4 focus:outline-none hover:border-green-300 ${
                          erroresPorCategoria[cat.id_tropa_detalle]
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-100'
                            : 'border-gray-200 focus:border-green-500 focus:ring-green-100'
                        }`}
                      />
                      {erroresPorCategoria[cat.id_tropa_detalle] && (
                        <p className="text-xs text-red-600 mt-2 font-semibold">
                          {erroresPorCategoria[cat.id_tropa_detalle]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {feedback && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2">
              {feedback}
            </div>
          )}

          {faena.categorias?.length > 0 && (
            <button
              type="submit"
              className="w-full md:w-auto px-6 py-3 rounded-lg bg-green-700 text-white font-semibold hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 transition"
            >
              {modo === 'editar' ? 'Actualizar faena' : 'Registrar faena'}
            </button>
          )}
        </form>
      )}
    </>
  );
};

export default DetalleFaenaForm;

import { useState, useEffect } from 'react';
import api from '../services/api';
import Select from 'react-select';

export default function DetalleEspecieForm({
  idTropa,
  onSave,
  especies: especiesProp = [],
  defaultEspecieId = null,
}) {
  const [especies, setEspecies] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [especieSeleccionada, setEspecieSeleccionada] = useState(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null);

  const [detalle, setDetalle] = useState([]);
  const [cantidad, setCantidad] = useState('');
  const [loadingCategorias, setLoadingCategorias] = useState(false);
  const [error, setError] = useState('');

  const getTokenHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Normalizar opciones para react-select
  const mapEspeciesToOptions = (arr) =>
    (arr || []).map((e) => ({
      value: String(e.id_especie ?? e.id ?? ''),
      label: e.descripcion ?? e.nombre ?? '',
    }));

  // Si el padre pasa especies ya cargadas, preferirlas; si no, cargar desde API
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        if (Array.isArray(especiesProp) && especiesProp.length > 0) {
          if (mounted) setEspecies(especiesProp);
          return;
        }
        const res = await api.get('/especies', { headers: getTokenHeaders() });
        const data = Array.isArray(res.data) ? res.data : [];
        const activos = data.filter((e) =>
          e.hasOwnProperty('estado') ? Boolean(e.estado) : true
        );
        if (mounted) setEspecies(activos);
      } catch (err) {
        console.error('Error al obtener especies:', err);
        if (mounted) setEspecies([]);
      }
    };
    load();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [especiesProp]);

  // Preselección: si el padre entregó defaultEspecieId se usa; si no, buscar "bovino" en descripción
  useEffect(() => {
    if (!Array.isArray(especies) || especies.length === 0) return;

    // Si viene default explícito, seleccionarlo
    if (defaultEspecieId) {
      const idStr = String(defaultEspecieId);
      const found = especies.find(
        (e) => String(e.id_especie ?? e.id) === idStr
      );
      if (found) {
        setEspecieSeleccionada({
          value: String(found.id_especie ?? found.id),
          label: found.descripcion ?? found.nombre ?? '',
        });
        return;
      }
    }

    // Si no vino default, buscar "bovino" (case-insensitive, incluye variantes)
    const buscada = especies.find((e) => {
      const text = String(e.descripcion ?? e.nombre ?? '').toLowerCase();
      return text.includes('bovino') || text.includes('bovinos');
    });

    if (buscada) {
      setEspecieSeleccionada({
        value: String(buscada.id_especie ?? buscada.id),
        label: buscada.descripcion ?? buscada.nombre ?? '',
      });
    }
    // si no hay coincidencia, no cambiar selección
  }, [especies, defaultEspecieId]);

  // Cargar categorías cuando cambia especieSeleccionada
  useEffect(() => {
    if (!especieSeleccionada?.value) {
      setCategorias([]);
      setCategoriaSeleccionada(null);
      return;
    }

    let mounted = true;
    const loadCats = async () => {
      setLoadingCategorias(true);
      setError('');
      try {
        const res = await api.get(
          `/especies/${especieSeleccionada.value}/categorias`,
          {
            headers: getTokenHeaders(),
          }
        );
        const data = Array.isArray(res.data) ? res.data : [];
        if (mounted) {
          const normalized = data.map((c) => ({
            id: c.id_cat_especie ?? c.id ?? c.id_categoria,
            nombre: c.nombre ?? c.descripcion ?? c.descripcion_categoria ?? '',
          }));
          setCategorias(normalized);
          setCategoriaSeleccionada(null);
        }
      } catch (err) {
        console.error('Error al obtener categorías:', err);
        if (mounted) {
          setCategorias([]);
          setCategoriaSeleccionada(null);
          setError(
            err.response?.status === 404
              ? 'Sin categorías para esta especie'
              : 'No se pudieron cargar las categorías'
          );
        }
      } finally {
        if (mounted) setLoadingCategorias(false);
      }
    };

    loadCats();
    return () => (mounted = false);
  }, [especieSeleccionada]);

  const agregarDetalle = () => {
    setError('');
    if (!especieSeleccionada) {
      setError('Seleccioná una especie');
      return;
    }
    if (!categoriaSeleccionada) {
      setError('Seleccioná una categoría');
      return;
    }
    const cantidadNum = Number(cantidad);
    if (!cantidad || Number.isNaN(cantidadNum) || cantidadNum <= 0) {
      setError('Ingresá una cantidad válida (mayor a 0)');
      return;
    }

    const nuevo = {
      especie_id: especieSeleccionada.value,
      especie_nombre: especieSeleccionada.label,
      categoria_id: Number(categoriaSeleccionada.value),
      categoria_nombre: categoriaSeleccionada.label,
      cantidad: cantidadNum,
    };

    setDetalle((prev) => [...prev, nuevo]);
    setCategoriaSeleccionada(null);
    setCantidad('');
  };

  const guardarDetalles = async () => {
    if (detalle.length === 0) {
      alert('No hay detalles para guardar');
      return;
    }

    const payload = detalle.map((d) => ({
      id_especie: d.especie_id,
      id_cat_especie: d.categoria_id,
      cantidad: d.cantidad,
    }));

    try {
      await api.post(`/tropas/${idTropa}/detalle`, payload, {
        headers: getTokenHeaders(),
      });
      setDetalle([]);
      // mantener la especie seleccionada para flujo rápido; si querés resetear, descomenta la siguiente:
      // setEspecieSeleccionada(null);
      alert('Detalles guardados correctamente');
      if (typeof onSave === 'function') onSave();
    } catch (err) {
      console.error('Error al guardar detalles:', err);
      alert('Hubo un problema al guardar. Revisá la consola.');
    }
  };

  // estilos select (mantener apariencia)
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      height: '48px',
      minHeight: '48px',
      paddingLeft: '16px',
      paddingRight: '16px',
      backgroundColor: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: state.isFocused ? '0 0 0 4px rgba(16, 185, 129, 0.1)' : 'none',
      transition: 'all 200ms ease',
      '&:hover': { borderColor: '#6ee7b7' },
      '&:focus-within': { borderColor: '#10b981' },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 0 0 2px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: '14px',
      color: '#111827',
      margin: 0,
      top: 'initial',
      transform: 'none',
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: '14px',
      color: '#6b7280',
      margin: 0,
    }),
    indicatorsContainer: (base) => ({ ...base, height: '48px' }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
    }),
    option: (base, { isFocused }) => ({
      ...base,
      fontSize: '14px',
      padding: '10px 16px',
      backgroundColor: isFocused ? '#d1fae5' : '#fff',
      color: isFocused ? '#065f46' : '#111827',
    }),
  };

  return (
    <div className="space-y-6">
      {/* Especie */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Especie
        </label>
        <Select
          value={especieSeleccionada}
          onChange={(selected) => setEspecieSeleccionada(selected)}
          options={mapEspeciesToOptions(especies)}
          placeholder="Seleccionar especie"
          styles={customSelectStyles}
          noOptionsMessage={() => 'Sin opciones'}
          components={{ IndicatorSeparator: () => null }}
        />
      </div>

      {/* Categoría y Cantidad */}
      {especieSeleccionada && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Categoría
            </label>
            <Select
              value={categoriaSeleccionada}
              onChange={(selected) => setCategoriaSeleccionada(selected)}
              options={categorias.map((c) => ({
                value: String(c.id),
                label: c.nombre,
              }))}
              placeholder={
                loadingCategorias ? 'Cargando...' : 'Seleccionar categoría'
              }
              isDisabled={loadingCategorias}
              styles={customSelectStyles}
              noOptionsMessage={() => 'Sin opciones'}
              components={{ IndicatorSeparator: () => null }}
            />

            {!loadingCategorias && categorias.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                No hay categorías disponibles para esta especie.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Cantidad
            </label>
            <input
              type="number"
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm bg-gray-50 text-gray-800 focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition"
              min={1}
              disabled={!especieSeleccionada}
            />
          </div>

          <button
            onClick={agregarDetalle}
            className="bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 transition"
          >
            Agregar
          </button>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      {/* Detalle agregado */}
      {detalle.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-bold text-gray-800 mb-3">
            Detalle agregado
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow-md border border-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Especie
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">
                    Cantidad
                  </th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((d, i) => (
                  <tr
                    key={`${d.especie_id}-${d.categoria_id}-${i}`}
                    className="border-t border-gray-200"
                  >
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {d.especie_nombre || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {d.categoria_nombre || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium text-right">
                      {d.cantidad}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={guardarDetalles}
            className="mt-4 bg-green-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-200 transition"
          >
            Guardar todo
          </button>
        </div>
      )}
    </div>
  );
}

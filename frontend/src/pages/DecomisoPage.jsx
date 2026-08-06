import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import api from '../services/api';

/* Visual constants */
const INPUT_BASE_CLASS =
  'w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50';

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  maxMenuHeight = 200,
  required = false,
}) {
  const [isFocusing, setIsFocusing] = useState(false);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: '48px',
      minHeight: '48px',
      paddingLeft: '8px',
      paddingRight: '8px',
      backgroundColor: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      boxShadow: isFocusing
        ? '0 0 0 1px #000'
        : state.isFocused
        ? '0 0 0 4px #d1fae5'
        : 'none',
      transition: 'all 50ms ease',
      '&:hover': {
        borderColor: '#96f1b7',
      },
      '&:focus-within': {
        borderColor: '#22c55e',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 3px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      fontSize: '14px',
      fontFamily: 'inherit',
      color: '#111827',
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
    indicatorsContainer: (base) => ({
      ...base,
      height: '48px',
    }),
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
    <div className="flex flex-col">
      <label className="mb-2 font-semibold text-gray-700 text-sm">
        {label}
      </label>
      <Select
        value={value}
        onChange={onChange}
        options={options}
        placeholder={placeholder}
        maxMenuHeight={maxMenuHeight}
        required={required}
        styles={customStyles}
        noOptionsMessage={() => 'Sin opciones'}
        components={{ IndicatorSeparator: () => null }}
        onFocus={() => {
          setIsFocusing(true);
          setTimeout(() => setIsFocusing(false), 50);
        }}
      />
    </div>
  );
}

/* InputField */
function InputField({
  label,
  value,
  onChange,
  placeholder = '',
  type = 'text',
  as = 'input',
  className = '',
  step,
}) {
  if (as === 'textarea') {
    return (
      <div className={`flex flex-col ${className}`}>
        {label && (
          <label className="mb-2 font-semibold text-gray-700 text-sm">
            {label}
          </label>
        )}
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`${INPUT_BASE_CLASS} resize-vertical min-h-[72px]`}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="mb-2 font-semibold text-gray-700 text-sm">
          {label}
        </label>
      )}
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        type={type}
        step={step}
        className={INPUT_BASE_CLASS}
      />
    </div>
  );
}

/* Modal para crear afecciones */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black opacity-30" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ✖
        </button>
        {children}
      </div>
    </div>
  );
}

/* InlineCreateModal para Afecciones */
function InlineCreateModalAfeccion({
  especies = [],
  onCancel,
  onCreated,
  onNotify,
  afecciones = [],
}) {
  const [values, setValues] = useState({
    id_especie: '',
    descripcion: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isFocusing, setIsFocusing] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const validate = () => {
    return values.id_especie && values.descripcion?.trim();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  const handleCreate = async () => {
    if (!validate()) {
      setError('Completá los campos obligatorios correctamente.');
      if (onNotify) onNotify('error', 'Completá los campos obligatorios.');
      return;
    }

    // Verificar que no esté duplicada
    const descripcionNormalizada = values.descripcion.trim().toLowerCase();
    const especieStr = String(values.id_especie);
    const exists = afecciones.some(
      (a) =>
        String(a.id_especie ?? a.especie_id) === especieStr &&
        (a.descripcion ?? a.nombre ?? '').trim().toLowerCase() === descripcionNormalizada
    );

    if (exists) {
      setError('Esta afección ya está cargada.');
      if (onNotify) onNotify('error', 'Esta afección ya está cargada.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id_especie: Number(values.id_especie),
        descripcion: values.descripcion.trim(),
      };

      const res = await api.post('/afecciones', payload);
      console.log('[InlineCreateModalAfeccion] POST /afecciones', 'payload:', payload, 'resp:', res?.data);

      const raw = res?.data?.data ?? res?.data ?? null;
      const normalized =
        raw && typeof raw === 'object'
          ? {
              ...raw,
              id_afeccion: raw.id_afeccion ?? raw.id ?? raw.insertId ?? raw.id_insertado,
              id_especie: raw.id_especie ?? values.id_especie,
              descripcion: raw.descripcion ?? values.descripcion,
            }
          : null;

      if (
        res.status >= 200 &&
        res.status < 300 &&
        normalized &&
        normalized.id_afeccion
      ) {
        if (onNotify) onNotify('success', 'Afección creada correctamente');
        if (mounted.current && onCreated) await onCreated(normalized);
        setLoading(false);
        onCancel();
        return;
      }

      const errMsg =
        (raw && (raw.error || raw.mensaje || raw.message)) ||
        'Respuesta inesperada del servidor';
      setError(errMsg);
      if (onNotify) onNotify('error', errMsg);
      setLoading(false);
    } catch (err) {
      console.error('POST afeccion modal error', err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        (typeof err?.response?.data === 'string' ? err.response.data : null) ||
        err?.message ||
        'Error del servidor';
      setError(msg);
      if (onNotify) onNotify('error', msg);
      setLoading(false);
    }
  };

  const especieOptions = especies.map((e) => ({
    value: String(e.id_especie ?? e.id ?? ''),
    label: e.nombre ?? e.descripcion ?? '',
  }));

  const customStyles = {
    control: (base, state) => ({
      ...base,
      backgroundColor: '#f9fafb',
      border: '2px solid #e5e7eb',
      borderRadius: '0.5rem',
      minHeight: '48px',
      boxShadow: isFocusing
        ? '0 0 0 1px #000'
        : state.isFocused
        ? '0 0 0 4px #d1fae5'
        : 'none',
      transition: 'all 50ms ease',
      '&:hover': {
        borderColor: '#96f1b7',
      },
      '&:focus-within': {
        borderColor: '#22c55e',
      },
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '0 0 0 2px',
      height: '48px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (base) => ({
      ...base,
      margin: 0,
      padding: 0,
      fontSize: '14px',
      fontFamily: 'inherit',
      color: '#111827',
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
    indicatorsContainer: (base) => ({
      ...base,
      height: '48px',
    }),
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
    <div>
      <h3 className="text-lg font-semibold mb-3">Crear Afección</h3>

      <label className="mb-2 font-semibold text-gray-700 text-sm block">
        Especie
      </label>
      <Select
        name="id_especie"
        options={especieOptions}
        value={especieOptions.find((o) => o.value === String(values.id_especie)) || null}
        onChange={(sel) => setValues((p) => ({ ...p, id_especie: sel?.value ?? '' }))}
        placeholder="Seleccione especie"
        styles={customStyles}
        noOptionsMessage={() => 'Sin opciones'}
        components={{ IndicatorSeparator: () => null }}
        onFocus={() => {
          setIsFocusing(true);
          setTimeout(() => setIsFocusing(false), 50);
        }}
        className="mb-3"
      />

      <label className="mb-2 font-semibold text-gray-700 text-sm block">
        Descripción de la afección
      </label>
      <input
        name="descripcion"
        value={values.descripcion}
        onChange={handleChange}
        className={INPUT_BASE_CLASS + ' mb-3'}
        placeholder="Ej. Hidatidosis"
      />

      {error && <div className="text-red-600 mb-2 text-sm">{error}</div>}

      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleCreate}
          className="px-4 py-2 bg-green-600 text-white rounded"
          disabled={loading}
        >
          {loading ? 'Guardando...' : 'Crear y seleccionar'}
        </button>
      </div>
    </div>
  );
}

/* ReviewModal */
function ReviewModal({
  open,
  onClose,
  preview = [],
  payload = [],
  onConfirm,
  serverErrors = [],
}) {
  if (!open) return null;

  const totalLines = preview.length;
  const totalCantidad = preview.reduce(
    (s, d) => s + (Number(d.cantidad) || 0),
    0
  );
  const totalAnimales = preview.reduce(
    (s, d) => s + (Number(d.animales_afectados) || 0),
    0
  );
  const totalPeso = preview.reduce((s, d) => {
    const pRaw =
      d.peso_kg !== null && d.peso_kg !== undefined
        ? String(d.peso_kg).replace(',', '.')
        : null;
    const p = pRaw !== null ? Number(pRaw) : null;
    return s + (Number.isFinite(p) ? p : 0);
  }, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-4xl bg-white rounded-2xl shadow-2xl p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">
              Resumen antes de confirmar
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              Revisá las líneas y totales. Volvé a editar si algo no coincide.
            </p>
          </div>

          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-xs text-slate-500">Líneas</p>
              <p className="text-lg font-semibold text-slate-800">
                {totalLines}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total cantidad</p>
              <p className="text-lg font-semibold text-slate-800">
                {totalCantidad}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total animales</p>
              <p className="text-lg font-semibold text-slate-800">
                {totalAnimales || '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Total peso (kg)</p>
              <p className="text-lg font-semibold text-slate-800">
                {totalPeso ? String(totalPeso).replace('.', ',') : '—'}
              </p>
            </div>
          </div>
        </header>

        {serverErrors?.length > 0 && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
            <p className="font-medium">Error del servidor</p>
            <ul className="list-disc list-inside text-sm">
              {serverErrors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mb-3">
          <div className="overflow-x-auto rounded-md border border-slate-100">
            <table className="min-w-full text-sm text-slate-700">
              <thead className="bg-slate-100 text-xs text-slate-600 uppercase">
                <tr>
                  <th className="px-3 py-2 text-left">#</th>
                  <th className="px-3 py-2 text-left">Parte</th>
                  <th className="px-3 py-2 text-left">Tipo</th>
                  <th className="px-3 py-2 text-right">Cant</th>
                  <th className="px-3 py-2 text-right">Peso kg</th>
                  <th className="px-3 py-2 text-right">Animales</th>
                  <th className="px-3 py-2 text-left">Destino</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {preview.map((d, i) => {
                  const tipoLabel = String(
                    d.tipoLabel || d.id_tipo_parte_deco || ''
                  ).toLowerCase();
                  const tipoRes =
                    tipoLabel.includes('res') || tipoLabel.includes('res.');
                  const pesoRaw =
                    d.peso_kg !== null && d.peso_kg !== undefined
                      ? String(d.peso_kg)
                      : '';
                  const pesoPresent = pesoRaw !== '';
                  const pesoDisplay = pesoPresent
                    ? pesoRaw.replace('.', ',')
                    : null;
                  const pesoMissing = tipoRes && !pesoPresent;

                  return (
                    <tr key={i} className={pesoMissing ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 align-middle">{i + 1}</td>
                      <td className="px-3 py-2 align-middle">
                        {d.parteLabel || d.id_parte_decomisada || '—'}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        {d.tipoLabel || d.id_tipo_parte_deco || '—'}
                      </td>
                      <td className="px-3 py-2 text-right align-middle font-medium">
                        {d.cantidad ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {pesoMissing ? (
                          <span className="text-red-600">Falta</span>
                        ) : (
                          pesoDisplay ?? '—'
                        )}
                      </td>
                      <td className="px-3 py-2 text-right align-middle">
                        {d.animales_afectados ?? '—'}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        {d.destino_decomiso ?? '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md border hover:bg-slate-50"
          >
            Volver a editar
          </button>
          <button
            onClick={() => onConfirm(payload)}
            className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800"
          >
            Confirmar y guardar
          </button>
        </div>
      </div>
    </div>
  );
}

/* DecomisoPage (rest of the file kept exactly as in your original) */
export default function DecomisoPage() {
  const { id_faena } = useParams();
  const navigate = useNavigate();

  const [infoFaena, setInfoFaena] = useState(null);
  const [datosFaena, setDatosFaena] = useState([]);
  const [loading, setLoading] = useState(true);

  const [tiposParte, setTiposParte] = useState([]);
  const [partes, setPartes] = useState([]);
  const [afecciones, setAfecciones] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [modalForAfeccion, setModalForAfeccion] = useState(null);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);
  const currentDetailIndexRef = useRef(null);

  const [detalles, setDetalles] = useState([
    {
      id_tipo_parte_deco: '',
      id_parte_decomisada: '',
      id_afeccion: '',
      cantidad: '',
      animales_afectados: '',
      peso_kg: '',
      destino_decomiso: '',
      observaciones: '',
    },
  ]);

  const [errors, setErrors] = useState([]);
  const [success, setSuccess] = useState(null);

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPreviewData, setReviewPreviewData] = useState([]);
  const [reviewPayload, setReviewPayload] = useState([]);
  const [reviewServerErrors, setReviewServerErrors] = useState([]);

  const [fechaDecomiso, setFechaDecomiso] = useState('');
  const [fechaFaenaRaw, setFechaFaenaRaw] = useState('');

  useEffect(() => {
    const fetchDatos = async () => {
      try {
        setLoading(true);
        console.log('[DecomisoPage] Cargando datos para id_faena:', id_faena);

        const resFaena = await api.get(`/faena/${id_faena}/decomiso-datos`);
        console.log('[DecomisoPage] Respuesta faena:', resFaena.data);
        
        const faena = resFaena.data;
        if (Array.isArray(faena) && faena.length > 0) {
          // Obtener fecha raw para validación
          const fechaRaw = faena[0].fecha_faena
            ? new Date(faena[0].fecha_faena).toISOString().split('T')[0]
            : new Date().toISOString().split('T')[0];
          
          setFechaFaenaRaw(fechaRaw);
          setFechaDecomiso(new Date().toISOString().split('T')[0]); // Fecha actual del decomiso

          setInfoFaena({
            id_faena_detalle: faena[0].id_faena_detalle,
            n_tropa: faena[0].n_tropa,
            dte_dtu: faena[0].dte_dtu,
            fecha_faena: faena[0].fecha_faena
              ? new Date(faena[0].fecha_faena).toLocaleDateString('es-AR')
              : '—',
            faenados: faena.reduce(
              (acc, f) => acc + (Number(f.faenados) || 0),
              0
            ),
          });
          setDatosFaena(faena);
        }

        const resBase = await api.get('/decomisos/datos-base');
        console.log('[DecomisoPage] Respuesta datos-base:', resBase.data);
        
        const base = resBase.data;
        setTiposParte(Array.isArray(base?.tiposParte) ? base.tiposParte : []);
        setPartes(Array.isArray(base?.partes) ? base.partes : []);
        setAfecciones(Array.isArray(base?.afecciones) ? base.afecciones : []);

        // Cargar especies
        try {
          const resEspecies = await api.get('/especies');
          const especiesList = Array.isArray(resEspecies.data) ? resEspecies.data : [];
          setEspecies(especiesList);
        } catch (err) {
          console.warn('[DecomisoPage] Error cargando especies:', err.message);
          setEspecies([]);
        }
      } catch (e) {
        console.error('[DecomisoPage] Error cargando datos:', e?.response?.data || e.message);
        setErrors(['Error cargando datos iniciales. Reintentá más tarde.']);
      } finally {
        setLoading(false);
      }
    };
    fetchDatos();
  }, [id_faena]);

  const showToast = (type, text, ms = 3500) => {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToast({ type, text });
    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, ms);
  };

  const handleCreatedAfeccion = async (obj) => {
    try {
      const created = obj || {};
      const id = created.id_afeccion ?? created.id ?? null;
      const descripcion = created.descripcion ?? created.nombre ?? `Afección ${Date.now()}`;
      const id_especie = created.id_especie ?? null;

      // Buscar el nombre de la especie
      const especieObj = especies.find(
        (e) => String(e.id_especie) === String(id_especie)
      );
      const especie = especieObj?.descripcion || especieObj?.nombre || '';

      const finalId = id ? String(id) : `local-afec-${Date.now()}`;
      const newAfeccion = {
        id_afeccion: id ?? finalId,
        descripcion,
        id_especie,
        especie, // Agregar el nombre de la especie
      };

      setAfecciones((prev) => {
        const exists = prev.find(
          (a) =>
            String(a.id_afeccion) === String(newAfeccion.id_afeccion) ||
            (newAfeccion.descripcion &&
              String(a.descripcion ?? a.nombre).trim().toLowerCase() ===
                String(newAfeccion.descripcion).trim().toLowerCase())
        );
        if (exists) return prev;
        return [...prev, newAfeccion];
      });

      // Seleccionar automáticamente en el detalle actual
      const currentIdx = currentDetailIndexRef.current;
      if (currentIdx !== null && currentIdx !== undefined) {
        actualizarDetalle(currentIdx, 'id_afeccion', String(finalId));
      }

      showToast('success', 'Afección guardada y seleccionada.');
      setModalForAfeccion(null);
      currentDetailIndexRef.current = null;
    } catch (err) {
      console.error('handleCreatedAfeccion error', err);
      showToast('error', 'Creada, pero hubo un problema actualizando listas.');
      setModalForAfeccion(null);
      currentDetailIndexRef.current = null;
    }
  };

  const onlyDigits = (raw) =>
    raw == null ? '' : String(raw).replace(/\D/g, '');
  const onlyNumberWithComma = (raw) => {
    if (raw == null) return '';
    let s = String(raw);
    s = s.replace(/[^0-9,]/g, '');
    const parts = s.split(',');
    if (parts.length <= 1) return s;
    return parts.shift() + ',' + parts.join('');
  };

  const tipoEsRes = (id_tipo_parte_deco) => {
    if (!id_tipo_parte_deco) return false;
    const t = tiposParte.find(
      (x) => String(x.id_tipo_parte_deco) === String(id_tipo_parte_deco)
    );
    if (!t) return false;
    const nombre = String(t.nombre_tipo_parte ?? t.nombre ?? '').toLowerCase();
    return /\bres\b/.test(nombre) || /res/.test(nombre);
  };

  const actualizarDetalle = (index, campo, valor) => {
    setDetalles((prev) => {
      const copy = [...prev];
      const det = { ...copy[index] };
      if (campo === 'cantidad' || campo === 'animales_afectados')
        det[campo] = onlyDigits(valor);
      else if (campo === 'peso_kg') det.peso_kg = onlyNumberWithComma(valor);
      else det[campo] = valor;
      if (campo === 'id_tipo_parte_deco') {
        det.id_parte_decomisada = '';
        det.peso_kg = '';
      }
      copy[index] = det;
      return copy;
    });
    setErrors([]);
    setSuccess(null);
  };

  const agregarDetalle = () =>
    setDetalles((prev) => [
      ...prev,
      {
        id_tipo_parte_deco: '',
        id_parte_decomisada: '',
        id_afeccion: '',
        cantidad: '',
        animales_afectados: '',
        peso_kg: '',
        destino_decomiso: '',
        observaciones: '',
      },
    ]);

  const eliminarDetalle = (i) =>
    setDetalles((prev) => {
      const copy = prev.slice();
      copy.splice(i, 1);
      return copy.length
        ? copy
        : [
            {
              id_tipo_parte_deco: '',
              id_parte_decomisada: '',
              id_afeccion: '',
              cantidad: '',
              animales_afectados: '',
              peso_kg: '',
              destino_decomiso: '',
              observaciones: '',
            },
          ];
    });

  const tipoOptions = useMemo(
    () =>
      tiposParte.map((t) => ({
        value: t.id_tipo_parte_deco,
        label: (t.nombre_tipo_parte ?? t.nombre) || '—',
      })),
    [tiposParte]
  );
  const afeccOptions = useMemo(
    () =>
      afecciones.map((a) => {
        const nombre = a.descripcion || a.nombre || '—';
        const especie = a.especie || a.nombre_especie || a.species_name || '';
        const label = especie ? `${nombre} - ${especie}` : nombre;
        return {
          value: a.id_afeccion,
          label,
        };
      }),
    [afecciones]
  );
  const destinoOptions = useMemo(
    () => [
      { value: 'incineracion', label: 'Incineración' },
      { value: 'rendering', label: 'Rendering' },
      { value: 'entierro', label: 'Entierro' },
      { value: 'desnaturalizacion', label: 'Desnaturalización' },
      { value: 'otro', label: 'Otro' },
    ],
    []
  );
  const partesPorTipo = (id_tipo) =>
    partes
      .filter((p) => String(p.id_tipo_parte_deco) === String(id_tipo))
      .map((p) => ({
        value: p.id_parte_decomisada,
        label: p.nombre_parte || p.nombre || p.descripcion || '—',
        requiere_peso: p.requiere_peso,
      }));

  const openReview = () => {
    setErrors([]);
    setSuccess(null);

    const validationErrors = [];

    // Validar fecha del decomiso
    if (!fechaDecomiso) {
      validationErrors.push('La fecha del decomiso es obligatoria.');
    } else if (fechaFaenaRaw && fechaDecomiso < fechaFaenaRaw) {
      validationErrors.push(
        `La fecha del decomiso no puede ser anterior a la fecha de faena (${new Date(fechaFaenaRaw).toLocaleDateString('es-AR')}).`
      );
    }

    const preview = detalles.map((d, i) => {
      const row = i + 1;
      if (!d.id_parte_decomisada)
        validationErrors.push(
          `Detalle ${row}: Debés seleccionar la parte decomisada.`
        );
      if (!d.id_afeccion)
        validationErrors.push(`Detalle ${row}: Debés seleccionar la afección.`);
      if (!d.cantidad)
        validationErrors.push(
          `Detalle ${row}: La cantidad es obligatoria y debe ser un número entero mayor que 0.`
        );
      else if (Number(d.cantidad) <= 0)
        validationErrors.push(
          `Detalle ${row}: La cantidad debe ser mayor que 0.`
        );
      if (!d.destino_decomiso)
        validationErrors.push(
          `Detalle ${row}: Debés seleccionar el destino del decomiso.`
        );

      const tipoResFlag = tipoEsRes(d.id_tipo_parte_deco);
      if (tipoResFlag) {
        if (d.peso_kg === '' || d.peso_kg == null)
          validationErrors.push(
            `Detalle ${row}: Esta parte requiere ingresar el Peso (kg). Podés ingresar 0 o 0,0 si corresponde.`
          );
        else {
          const numeric = Number(String(d.peso_kg).replace(',', '.'));
          if (Number.isNaN(numeric) || numeric < 0)
            validationErrors.push(
              `Detalle ${row}: Peso inválido. Usá formato 1,56 o 0.`
            );
        }
      }

      const tipoLabel =
        (
          tiposParte.find(
            (t) => String(t.id_tipo_parte_deco) === String(d.id_tipo_parte_deco)
          ) || {}
        ).nombre_tipo_parte ||
        (
          tiposParte.find(
            (t) => String(t.id_tipo_parte_deco) === String(d.id_tipo_parte_deco)
          ) || {}
        ).nombre ||
        null;
      const parteLabel =
        (
          partes.find(
            (p) =>
              String(p.id_parte_decomisada) === String(d.id_parte_decomisada)
          ) || {}
        ).nombre_parte ||
        (
          partes.find(
            (p) =>
              String(p.id_parte_decomisada) === String(d.id_parte_decomisada)
          ) || {}
        ).nombre ||
        null;
      const afeccionLabel =
        (
          afecciones.find(
            (a) => String(a.id_afeccion) === String(d.id_afeccion)
          ) || {}
        ).descripcion ||
        (
          afecciones.find(
            (a) => String(a.id_afeccion) === String(d.id_afeccion)
          ) || {}
        ).nombre ||
        null;

      return {
        ...d,
        tipoLabel,
        parteLabel,
        afeccionLabel,
        peso_kg_display:
          d.peso_kg !== '' && d.peso_kg != null
            ? String(d.peso_kg).replace('.', ',')
            : null,
      };
    });

    if (validationErrors.length) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // IMPORTANT: Forzar peso_kg = 0 cuando está vacío o inválido para evitar null en DB
    const payloadToSend = detalles.map((d) => {
      const parsedPeso =
        d.peso_kg !== '' && d.peso_kg != null
          ? Number(String(d.peso_kg).replace(',', '.'))
          : NaN;
      const pesoNum = Number.isFinite(parsedPeso) ? parsedPeso : 0;
      return {
        id_faena_detalle: infoFaena.id_faena_detalle,
        fecha_decomiso: fechaDecomiso,
        id_tipo_parte_deco: d.id_tipo_parte_deco || null,
        id_parte_decomisada: d.id_parte_decomisada,
        id_afeccion: d.id_afeccion,
        cantidad: d.cantidad ? Number(d.cantidad) : null,
        animales_afectados: d.animales_afectados
          ? Number(d.animales_afectados)
          : null,
        peso_kg: pesoNum,
        destino_decomiso: d.destino_decomiso,
        observaciones: d.observaciones || null,
      };
    });

    setReviewPreviewData(preview);
    setReviewPayload(payloadToSend);
    setReviewServerErrors([]);
    setReviewOpen(true);
  };

  const confirmAndSave = async (payload) => {
    setReviewServerErrors([]);
    try {
      console.log('[DecomisoPage] Enviando decomiso:', payload);
      const res = await api.post('/decomisos', payload);
      const data = res.data;
      console.log('[DecomisoPage] Decomiso guardado:', data);
      setReviewOpen(false);
      setSuccess('Decomiso registrado correctamente.');
      if (data?.id_decomiso) navigate(`/decomisos/detalle/${data.id_decomiso}`);
    } catch (e) {
      console.error('[DecomisoPage] Error guardando decomiso:', e?.response?.data || e.message);
      const serverMsg =
        e?.response?.data?.error || e?.response?.data?.mensaje || 'Error desconocido del servidor';
      setReviewServerErrors([`Error del servidor: ${serverMsg}`]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:py-8 py-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 text-center mb-8">
          🧾 Registrar Decomisos
        </h1>

        {errors.length > 0 && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="font-semibold text-red-700 mb-2">
              No se pudo validar. Corregí los siguientes errores:
            </p>
            <ul className="list-disc list-inside text-sm text-red-700">
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {success && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
            {success}
          </div>
        )}

        {infoFaena && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card title="N° de Tropa" value={infoFaena.n_tropa} />
            <Card title="DTE / DTU" value={infoFaena.dte_dtu} />
            <Card title="Fecha de Faena" value={infoFaena.fecha_faena} />
            <Card title="Faenados" value={infoFaena.faenados} />
          </div>
        )}

        {datosFaena.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-4 mb-6">
            <h2 className="text-lg font-semibold text-slate-700 mb-3">
              🐄 Animales faenados
            </h2>
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="min-w-full text-sm text-slate-700">
                <thead className="bg-green-700 text-white uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-3 py-2 text-left">Especie</th>
                    <th className="px-3 py-2 text-left">Categoría</th>
                    <th className="px-3 py-2 text-center">Faenados</th>
                  </tr>
                </thead>
                <tbody>
                  {datosFaena.map((d) => (
                    <tr
                      key={d.id_tropa_detalle}
                      className="border-b last:border-b-0 hover:bg-green-50 transition"
                    >
                      <td className="px-3 py-2">{d.especie}</td>
                      <td className="px-3 py-2">{d.categoria}</td>
                      <td className="px-3 py-2 text-center font-bold">
                        {d.faenados}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Selector de Fecha del Decomiso */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 mb-6">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            📅 Fecha del Decomiso
          </label>
          <input
            type="date"
            value={fechaDecomiso}
            onChange={(e) => setFechaDecomiso(e.target.value)}
            min={fechaFaenaRaw}
            required
            className="w-full md:w-64 rounded-lg border-2 border-gray-200 px-4 py-3 text-sm bg-gray-50 transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300"
          />
          {fechaDecomiso && fechaFaenaRaw && fechaDecomiso < fechaFaenaRaw && (
            <p className="text-xs text-red-600 mt-2 font-semibold">
              ⚠️ La fecha del decomiso no puede ser anterior a la fecha de faena ({new Date(fechaFaenaRaw).toLocaleDateString('es-AR')})
            </p>
          )}
        </div>

        <div className="space-y-4">
          {detalles.map((detalle, idx) => {
            const partesOpts = partesPorTipo(detalle.id_tipo_parte_deco);
            const tipoOption =
              tipoOptions.find(
                (o) => String(o.value) === String(detalle.id_tipo_parte_deco)
              ) || null;
            const parteOption =
              partesOpts.find(
                (p) => String(p.value) === String(detalle.id_parte_decomisada)
              ) || null;
            const afeccionOption =
              afeccOptions.find(
                (a) => String(a.value) === String(detalle.id_afeccion)
              ) || null;
            const destinoOption =
              destinoOptions.find(
                (d) => String(d.value) === String(detalle.destino_decomiso)
              ) || null;
            const mostrarPeso = tipoEsRes(detalle.id_tipo_parte_deco);

            return (
              <div
                key={idx}
                className="relative bg-white p-4 rounded-2xl shadow-lg border border-slate-200 ring-1 ring-slate-100 transition hover:shadow-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4"
              >
                <div className="absolute top-3 right-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      currentDetailIndexRef.current = idx;
                      setModalForAfeccion('afeccion');
                    }}
                    className="text-green-700 bg-green-100 border border-green-200 px-3 py-1 rounded-md text-xs font-medium hover:bg-green-200"
                  >
                    Agregar +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('¿Eliminar este detalle?'))
                        eliminarDetalle(idx);
                    }}
                    className="text-red-600 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md text-sm font-medium shadow-sm"
                    aria-label={`Eliminar detalle ${idx + 1}`}
                  >
                    ✕
                  </button>
                </div>

                <SelectField
                  label="Tipo de parte"
                  value={tipoOption}
                  onChange={(s) =>
                    actualizarDetalle(idx, 'id_tipo_parte_deco', s?.value ?? '')
                  }
                  options={tipoOptions}
                  placeholder="Seleccione tipo"
                />

                <SelectField
                  label="Parte decomisada"
                  value={parteOption}
                  onChange={(s) =>
                    actualizarDetalle(
                      idx,
                      'id_parte_decomisada',
                      s?.value ?? ''
                    )
                  }
                  options={partesOpts.map((p) => ({
                    value: p.value,
                    label: p.label,
                  }))}
                  placeholder="Seleccione parte"
                  disabled={!detalle.id_tipo_parte_deco}
                />

                <div className="flex flex-col">
                  <SelectField
                    label="Afección"
                    value={afeccionOption}
                    onChange={(s) =>
                      actualizarDetalle(idx, 'id_afeccion', s?.value ?? '')
                    }
                    options={afeccOptions}
                    placeholder="Seleccione afección"
                  />
                </div>

                <InputField
                  label="Cantidad"
                  type="text"
                  value={detalle.cantidad}
                  onChange={(e) =>
                    actualizarDetalle(idx, 'cantidad', e.target.value)
                  }
                  placeholder="Sólo números enteros"
                />

                {mostrarPeso && (
                  <InputField
                    label="Peso (kg)"
                    type="text"
                    value={detalle.peso_kg}
                    onChange={(e) =>
                      actualizarDetalle(idx, 'peso_kg', e.target.value)
                    }
                    placeholder="Ej. 1,56 — podés ingresar 0"
                  />
                )}

                <InputField
                  label="Animales afectados"
                  type="text"
                  value={detalle.animales_afectados}
                  onChange={(e) =>
                    actualizarDetalle(idx, 'animales_afectados', e.target.value)
                  }
                  placeholder="Sólo números enteros"
                />

                <SelectField
                  label="Destino del decomiso"
                  value={destinoOption}
                  onChange={(s) =>
                    actualizarDetalle(idx, 'destino_decomiso', s?.value ?? '')
                  }
                  options={destinoOptions}
                  placeholder="Seleccione destino"
                />

                <InputField
                  label="Observaciones"
                  as="textarea"
                  value={detalle.observaciones}
                  onChange={(e) =>
                    actualizarDetalle(idx, 'observaciones', e.target.value)
                  }
                  placeholder="Observaciones opcionales"
                  className="md:col-span-3"
                />
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            type="button"
            onClick={agregarDetalle}
            className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg font-semibold hover:bg-slate-300 transition"
          >
            ➕ Agregar detalle
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={openReview}
              className="px-5 py-2 bg-green-700 text-white rounded-lg font-semibold hover:bg-green-800 transition shadow"
            >
              Guardar Decomisos
            </button>
          </div>
        </div>

        <ReviewModal
          open={reviewOpen}
          onClose={() => setReviewOpen(false)}
          preview={reviewPreviewData}
          payload={reviewPayload}
          onConfirm={confirmAndSave}
          serverErrors={reviewServerErrors}
        />

        {modalForAfeccion && (
          <Modal onClose={() => setModalForAfeccion(null)}>
            <InlineCreateModalAfeccion
              especies={especies}
              afecciones={afecciones}
              onCancel={() => setModalForAfeccion(null)}
              onCreated={handleCreatedAfeccion}
              onNotify={showToast}
            />
          </Modal>
        )}
      </div>
    </div>
  );
}

/* Presentational Card */
const Card = ({ title, value }) => (
  <div className="bg-white rounded-xl shadow border border-slate-200 p-4 text-center">
    <p className="text-xs text-slate-500 mb-1">{title}</p>
    <p className="text-lg font-semibold text-slate-800">{value}</p>
  </div>
);

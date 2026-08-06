import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import api from '../services/api'; // tu instancia axios
import AppNotification from './AppNotification';
import { formatDateForAPI } from '../utils/dateFormatter';

/* ---------- Visual constants ---------- */
const INPUT_BASE_CLASS =
  'w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50';

/* ---------- Helpers para inputs numéricos ---------- */
function onlyDigitsPaste(e) {
  const paste = (e.clipboardData || window.clipboardData).getData('text');
  if (!/^\d+$/.test(paste)) {
    e.preventDefault();
    const digits = paste.replace(/\D+/g, '');
    if (digits.length) {
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const value = el.value;
      const next = value.slice(0, start) + digits + value.slice(end);
      // programmatic set + trigger input event
      el.value = next;
      const ev = new Event('input', { bubbles: true });
      el.dispatchEvent(ev);
    }
  }
}

function onlyDigitsKeyDown(e) {
  const allowedKeys = [
    'Backspace',
    'Delete',
    'ArrowLeft',
    'ArrowRight',
    'Tab',
    'Home',
    'End',
  ];
  if (allowedKeys.includes(e.key)) return;
  // permitir Ctrl/Cmd + A/C/V/X
  if (
    (e.ctrlKey || e.metaKey) &&
    ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
  )
    return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

/* ---------- SelectField (local) ---------- */
function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = '',
  maxMenuHeight = 200,
  required = false,
  isDisabled = false,
  className = '',
}) {
  const [isFocusing, setIsFocusing] = useState(false);

  const customStyles = {
    control: (base, state) => ({
      ...base,
      height: '48px',
      minHeight: '48px',
      paddingLeft: '16px',
      paddingRight: '16px',
      backgroundColor: isDisabled ? '#f3f4f6' : '#f9fafb',
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
      display: 'flex',
      alignItems: 'center',
      cursor: isDisabled ? 'not-allowed' : 'default',
      opacity: isDisabled ? 0.85 : 1,
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
      cursor: 'pointer',
    }),
    indicatorSeparator: () => ({ display: 'none' }),
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {label && (
        <label className="mb-2 font-semibold text-gray-700 text-sm">
          {label}
        </label>
      )}
      <Select
        value={value ?? null}
        onChange={(sel) => onChange(sel ?? null)}
        options={options}
        placeholder={placeholder}
        maxMenuHeight={maxMenuHeight}
        required={required}
        styles={customStyles}
        noOptionsMessage={() => 'Sin opciones'}
        components={{ IndicatorSeparator: () => null }}
        isDisabled={isDisabled}
        onFocus={() => {
          if (!isDisabled) {
            setIsFocusing(true);
            setTimeout(() => setIsFocusing(false), 50);
          }
        }}
      />
    </div>
  );
}
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

/* ---------- InlineCreateModal (local) ---------- */
function InlineCreateModal({
  type,
  provincias = [],
  onCancel,
  onCreated,
  onNotify,
}) {
  const [values, setValues] = useState(() => {
    if (type === 'departamento')
      return { nombre_departamento: '', id_provincia: '' };
    if (type === 'productor') return { nombre: '', cuit: '' };
    if (type === 'titular')
      return {
        nombre: '',
        id_provincia: '',
        localidad: '',
        direccion: '',
        cuit: '',
      };
    return {};
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, [type]);

  const validate = () => {
    if (type === 'departamento')
      return values.nombre_departamento?.trim() && values.id_provincia;
    if (type === 'productor') return values.nombre?.trim() && values.cuit?.trim() && values.cuit.replace(/\D/g, '').length === 11;
    if (type === 'titular')
      return (
        values.nombre?.trim() && values.id_provincia && values.localidad?.trim()
      );
    return false;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((p) => ({ ...p, [name]: value }));
    setError(null);
  };

  // Formatear CUIT mientras se escribe (mostrar con guiones)
  const handleCuitChange = (e) => {
    const { value } = e.target;
    // Limpiar a solo números
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
    // Formatear con guiones
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    }
    if (cleaned.length > 10) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
    }
    setValues((p) => ({ ...p, cuit: formatted }));
    setError(null);
  };

  // headers con token para llamadas del modal
  const getTokenHeaders = () => {
    // El interceptor de api.js maneja automáticamente el token,
    // así que no es necesario pasar headers manualmente
    return {};
  };

  // provOptions para SelectField dentro del modal
  const provOptions = provincias.map((p) => ({
    value: String(p.id ?? p.id_provincia ?? ''),
    label: p.descripcion ?? p.nombre ?? '',
  }));

  const fetchAndMatchProductor = async (sent) => {
    try {
      const candidates = [
        '/productores',
        '/productores/productores',
        /* '/productores',
        '/productores/productores', */
      ];
      let list = [];
      for (const p of candidates) {
        try {
          const res = await api.get(p);
          if (res && Array.isArray(res.data)) {
            list = res.data;
            break;
          }
          if (res && res.data && Array.isArray(res.data.data)) {
            list = res.data.data;
            break;
          }
        } catch (e) {
          /* ignore */
        }
      }
      const normalized = (list || []).map((x) => ({
        id_productor: x.id_productor ?? x.id ?? null,
        nombre: x.nombre ?? x.razon_social ?? x.nombre_productor ?? '',
        cuit: x.cuit ?? null,
      }));
      if (sent.cuit) {
        const byCuit = normalized.find(
          (n) => n.cuit && String(n.cuit) === String(sent.cuit)
        );
        if (byCuit) return byCuit;
      }
      const name = sent.nombre?.trim()?.toLowerCase();
      if (name) {
        const byName = normalized.find(
          (n) => n.nombre && n.nombre.trim().toLowerCase() === name
        );
        if (byName) return byName;
        const byPartial = normalized.find(
          (n) => n.nombre && n.nombre.trim().toLowerCase().includes(name)
        );
        if (byPartial) return byPartial;
      }
      return null;
    } catch (err) {
      return null;
    }
  };
  const handleCreate = async () => {
    if (!validate()) {
      setError('Completá los campos obligatorios correctamente.');
      if (onNotify) onNotify('error', 'Completá los campos obligatorios.');
      return;
    }
    if (type === 'productor' && values.cuit && values.cuit.replace(/\D/g, '').length !== 11) {
      setError('El CUIT debe tener exactamente 11 dígitos.');
      if (onNotify) onNotify('error', 'El CUIT debe tener 11 dígitos.');
      return;
    }
    if (type === 'titular' && values.cuit && values.cuit.replace(/\D/g, '').length !== 11) {
      setError('El CUIT debe tener exactamente 11 dígitos.');
      if (onNotify) onNotify('error', 'El CUIT debe tener 11 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const endpoint =
        type === 'departamento'
          ? '/departamentos'
          : type === 'productor'
          ? '/productores'
          : '/titulares-faena';

      const payload =
        type === 'departamento'
          ? {
              nombre_departamento: values.nombre_departamento.trim(),
              id_provincia: Number(values.id_provincia),
            }
          : type === 'productor'
          ? { nombre: values.nombre.trim(), cuit: values.cuit.replace(/\D/g, '') || null }
          : {
              nombre: values.nombre.trim(),
              id_provincia: Number(values.id_provincia),
              localidad: values.localidad.trim(),
              direccion: values.direccion || null,
              cuit: values.cuit ? values.cuit.replace(/\D/g, '') : null,
            };

      const res = await api.post(endpoint, payload);
      console.log(
        '[InlineCreateModal] POST',
        endpoint,
        'payload:',
        payload,
        'resp:',
        res?.data
      );

      const raw = res?.data?.data ?? res?.data ?? null;
      const normalized =
        raw && typeof raw === 'object'
          ? {
              ...raw,
              // añade fallbacks típicos de insertId/id_insertado
              id_productor:
                raw.id_productor ?? raw.id ?? raw.insertId ?? raw.id_insertado,
              id_departamento:
                raw.id_departamento ??
                raw.id ??
                raw.insertId ??
                raw.id_insertado,
              id_titular_faena:
                raw.id_titular_faena ??
                raw.id ??
                raw.insertId ??
                raw.id_insertado,
            }
          : null;

      if (
        res.status >= 200 &&
        res.status < 300 &&
        normalized &&
        (normalized.id_productor ||
          normalized.id ||
          normalized.id_departamento ||
          normalized.id_titular_faena)
      ) {
        if (onNotify)
          onNotify(
            'success',
            type === 'productor'
              ? 'Productor creado correctamente'
              : type === 'departamento'
              ? 'Departamento creado correctamente'
              : 'Titular creado correctamente'
          );
        if (mounted.current && onCreated) await onCreated(normalized);
        setLoading(false);
        onCancel();
        return;
      }

      if (type === 'productor') {
        const matched = await fetchAndMatchProductor(payload);
        if (matched) {
          if (onNotify) onNotify('success', 'Productor creado correctamente');
          if (mounted.current && onCreated) await onCreated(matched);
          setLoading(false);
          onCancel();
          return;
        }
        const fallback = {
          id_productor: `local-prod-${Date.now()}`,
          nombre: payload.nombre,
          cuit: payload.cuit ?? null,
        };
        if (onNotify)
          onNotify(
            'success',
            'Productor creado (sin id devuelto) — seleccionado localmente'
          );
        if (mounted.current && onCreated) await onCreated(fallback);
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
      console.error('POST modal error', err);
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

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3">
        {type === 'departamento'
          ? 'Crear Departamento'
          : type === 'productor'
          ? 'Crear Productor'
          : 'Crear Titular Faena'}
      </h3>

      {type === 'departamento' && (
        <>
          <SelectField
            label="Provincia"
            value={
              provOptions.find(
                (o) => o.value === String(values.id_provincia)
              ) || null
            }
            onChange={(sel) =>
              setValues((p) => ({ ...p, id_provincia: sel ? sel.value : '' }))
            }
            options={provOptions}
            placeholder="Seleccione provincia"
            className="mb-2"
          />

          <label className="block text-sm font-medium text-gray-700">
            Nombre departamento
          </label>
          <input
            name="nombre_departamento"
            value={values.nombre_departamento}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. San Martín"
          />
        </>
      )}

      {type === 'productor' && (
        <>
          <label className="block text-sm font-medium text-gray-700">
            Nombre productor
          </label>
          <input
            name="nombre"
            value={values.nombre}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. Establecimiento Pérez"
          />
          <label className="block text-sm font-medium text-gray-700">
            CUIT
          </label>
          <input
            name="cuit"
            value={values.cuit}
            onChange={handleCuitChange}
            onKeyDown={onlyDigitsKeyDown}
            onPaste={onlyDigitsPaste}
            inputMode="numeric"
            pattern="\d{11}"
            maxLength={14}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="XX-XXXXXXXX-X"
          />
          <p className="text-red-600 text-xs mb-2 leading-tight">
            Si el número central tiene menos de 8 dígitos, complete con ceros a la izquierda.<br />
            Ejemplo: 20-008405430-2
          </p>
        </>
      )}

      {type === 'titular' && (
        <>
          <SelectField
            label="Provincia"
            value={
              provOptions.find(
                (o) => o.value === String(values.id_provincia)
              ) || null
            }
            onChange={(sel) =>
              setValues((p) => ({ ...p, id_provincia: sel ? sel.value : '' }))
            }
            options={provOptions}
            placeholder="Seleccione provincia"
            className="mb-2"
          />

          <label className="block text-sm font-medium text-gray-700">
            Nombre titular
          </label>
          <input
            name="nombre"
            value={values.nombre}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. Juan López"
          />

          <label className="block text-sm font-medium text-gray-700">
            Localidad
          </label>
          <input
            name="localidad"
            value={values.localidad}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. Corrientes"
          />

          <label className="block text-sm font-medium text-gray-700">
            Dirección (opcional)
          </label>
          <input
            name="direccion"
            value={values.direccion}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Calle 123"
          />

          <label className="block text-sm font-medium text-gray-700">
            CUIT (opcional)
          </label>
          <input
            name="cuit"
            value={values.cuit}
            onChange={handleCuitChange}
            onKeyDown={onlyDigitsKeyDown}
            onPaste={onlyDigitsPaste}
            inputMode="numeric"
            pattern="\d{11}"
            maxLength={14}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="XX-XXXXXXXX-X"
          />
          <p className="text-red-600 text-xs mb-2 leading-tight">
            Si el número central tiene menos de 8 dígitos, complete con ceros a la izquierda.<br />
            Ejemplo: 20-008405430-2
          </p>
        </>
      )}

      {error && <div className="text-red-600 mb-2">{error}</div>}

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
export default function TropaForm({ onCreated }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fecha_alta: '',
    fecha_ingreso: '',
    dte_dtu: '',
    guia_policial: '',
    n_tropa: '',
    id_departamento: '',
    id_planta: '',
    id_productor: '',
    id_titular_faena: '',
  });

  const [departamentos, setDepartamentos] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [productores, setProductores] = useState([]);
  const [titulares, setTitulares] = useState([]);
  const [provincias, setProvincias] = useState([]);

  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const [usuario, setUsuario] = useState(null);
  const [plantaAsignada, setPlantaAsignada] = useState(null);

  const [modalFor, setModalFor] = useState(null);
  const openerRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    loadInitial();
    return () => {
      mountedRef.current = false;
      if (toastTimer.current) {
        clearTimeout(toastTimer.current);
        toastTimer.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(type, text, ms = 3500) {
    if (toastTimer.current) {
      clearTimeout(toastTimer.current);
      toastTimer.current = null;
    }
    setToast({ type, text });
    toastTimer.current = setTimeout(() => {
      setToast(null);
      toastTimer.current = null;
    }, ms);
  }

  async function tryFetchProductoresList() {
    const candidates = [
      '/productores',
      '/productores/productores',
      '/productores',
      '/productores/productores',
    ];
    for (const path of candidates) {
      try {
        const res = await api.get(path);
        if (res && Array.isArray(res.data)) return res.data;
        if (res && res.data && Array.isArray(res.data.data))
          return res.data.data;
      } catch (e) {
        /* ignore */
      }
    }
    return [];
  }

  async function loadInitial() {
    try {
      const [userRes, depsRes, plantasRes, prodsRes, titsRes, provsRes] =
        await Promise.all([
          api.get('/usuarios/usuario-actual').catch(() => ({ data: null })),
          api.get('/departamentos').catch(() => ({ data: [] })),
          api.get('/plantas').catch(() => ({ data: [] })),
          api.get('/productores').catch(() => ({ data: [] })),
          api.get('/titulares-faena').catch(() => ({ data: [] })),
          api.get('/provincias').catch(() => ({ data: [] })),
        ]);

      if (!mountedRef.current) return null;

      const usuarioData = userRes.data ?? null;
      setUsuario(usuarioData);

      const depsRaw = Array.isArray(depsRes.data) ? depsRes.data : [];
      const deps = depsRaw.map((d) => ({
        id_departamento: d.id_departamento ?? d.id ?? null,
        nombre_departamento:
          d.departamento ?? d.nombre_departamento ?? d.nombre ?? '',
        provincia: d.provincia ?? d.descripcion ?? '',
        id_provincia: d.id_provincia ?? null,
      }));

      const plsRaw = Array.isArray(plantasRes.data) ? plantasRes.data : [];
      const pls = plsRaw
        .map((p) => {
          const id = p.id_planta ?? p.id ?? p.planta_id ?? null;
          const nombre =
            p.nombre ??
            p.nombre_planta ??
            p.descripcion ??
            p.razon_social ??
            '';
          return {
            id_planta: id,
            nombre,
            id_provincia: p.id_provincia ?? null,
            provincia: p.provincia ?? p.descripcion ?? '',
          };
        })
        .filter((p) => p.id_planta != null);

      const prodsRaw = Array.isArray(prodsRes.data)
        ? prodsRes.data
        : Array.isArray(prodsRes.data?.data)
        ? prodsRes.data.data
        : [];
      const prods = prodsRaw.map((p) => ({
        id_productor: p.id_productor ?? p.id ?? null,
        nombre: p.nombre ?? p.razon_social ?? p.nombre_productor ?? '',
        cuit: p.cuit ?? null,
      }));

      const titsRaw = Array.isArray(titsRes.data) ? titsRes.data : [];
      const tits = titsRaw.map((t) => ({
        id_titular_faena: t.id_titular_faena ?? t.id ?? null,
        nombre: t.nombre ?? '',
        localidad: t.localidad ?? '',
        provincia: t.provincia ?? t.descripcion ?? '',
        id_provincia: t.id_provincia ?? null,
      }));

      const provsRaw = Array.isArray(provsRes.data) ? provsRes.data : [];
      const provs = provsRaw.map((p) => ({
        id: p.id ?? p.id_provincia ?? null,
        descripcion: p.descripcion ?? p.nombre ?? '',
      }));

      setDepartamentos(deps);
      setPlantas(pls);
      setProductores(prods);
      setTitulares(tits);
      setProvincias(provs);

      if (usuarioData && usuarioData.id_planta != null) {
        const planta = pls.find(
          (p) => String(p.id_planta) === String(usuarioData.id_planta)
        );
        if (planta) {
          setPlantaAsignada(planta);
          setForm((prev) => ({ ...prev, id_planta: String(planta.id_planta) }));
        } else {
          setForm((prev) => ({
            ...prev,
            id_planta: String(usuarioData.id_planta),
          }));
        }
      }

      return {
        departamentos: deps,
        plantas: pls,
        productores: prods,
        titulares: tits,
        provincias: provs,
      };
    } catch (err) {
      console.error('loadInitial error', err);
      if (mountedRef.current)
        showToast('error', 'Error cargando listas. Reintentá.');
      return null;
    }
  }

  // Helper: Formatear CUIT (XX-XXXXXXXX-X)
  const formatCUIT = (value) => {
    if (!value) return '';
    const cleaned = String(value).replace(/\D/g, '').slice(0, 11);
    if (cleaned.length === 0) return '';
    if (cleaned.length <= 2) return cleaned;
    if (cleaned.length <= 10) return `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 10)}-${cleaned.slice(10)}`;
  };

  const deptOptions = useMemo(
    () =>
      departamentos.map((d) => ({
        value: String(d.id_departamento ?? d.id ?? ''),
        label: `${d.nombre_departamento}${
          d.provincia ? ' — ' + d.provincia : ''
        }`,
      })),
    [departamentos]
  );
  const plantaOptions = useMemo(
    () =>
      plantas.map((p) => ({
        value: String(p.id_planta ?? p.id ?? ''),
        label: p.nombre || '',
      })),
    [plantas]
  );
  const prodOptions = useMemo(
    () =>
      productores
        .map((p) => ({
          value: String(p.id_productor ?? p.id ?? ''),
          label: p.cuit ? `${p.nombre} (${formatCUIT(p.cuit)})` : p.nombre || '',
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [productores]
  );
  const titOptions = useMemo(
    () =>
      titulares.map((t) => ({
        value: String(t.id_titular_faena ?? t.id ?? ''),
        label: t.nombre || '',
      })),
    [titulares]
  );
  const provOptions = useMemo(
    () =>
      provincias.map((p) => ({
        value: String(p.id ?? ''),
        label: p.descripcion || '',
      })),
    [provincias]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (name) => (selected) =>
    setForm((prev) => ({ ...prev, [name]: selected ? selected.value : '' }));

  // bloquear planta si rol es supervisor (2) o usuario (3)
  const isPlantaLocked = (() => {
    if (!usuario) return false;
    const rol = usuario.rol;
    if (rol === null || rol === undefined) return false;
    const rolStr = String(rol).trim().toLowerCase();
    return (
      rolStr === 'supervisor' ||
      rolStr === 'usuario' ||
      rolStr === '2' ||
      rolStr === '3'
    );
  })();

  // --- agregar esta helper arriba de handleSubmit ---
  async function isTropaTaken(n_tropa, year, plantaId) {
    if (!n_tropa) return false;
    try {
      // intenta consultar /tropas con query params n_tropa y year; ajustá la URL si tu API usa otro formato
      // incluimos planta si está disponible para hacer la comprobación por planta
      const q = new URLSearchParams();
      q.set('n_tropa', String(n_tropa));
      if (year) q.set('year', String(year));
      if (plantaId) q.set('planta', String(plantaId));

      const res = await api.get(`/tropas?${q.toString()}`);

      // soporta varias formas de respuesta: array directo o {data: [...]}
      const list =
        (res && Array.isArray(res.data) && res.data) ||
        (res && res.data && Array.isArray(res.data.data) && res.data.data) ||
        [];

      if (!Array.isArray(list)) return false;

      // si vienen objetos, comprobamos coincidencias por campos comunes
      const normalized = list.map((t) => ({
        id_tropa: t.id_tropa ?? t.id ?? null,
        n_tropa: t.n_tropa ?? t.numero_tropa ?? t.numero ?? null,
        fecha: t.fecha ?? t.created_at ?? null,
        id_planta:
          t.id_planta ??
          t.planta_id ??
          t.planta?.id_planta ??
          t.planta?.id ??
          null,
      }));

      // comparador: mismo n_tropa estrictamente y mismo año (si year dado)
      return normalized.some((t) => {
        if (!t.n_tropa) return false;
        if (String(t.n_tropa) !== String(n_tropa)) return false;
        if (
          plantaId &&
          t.id_planta != null &&
          String(t.id_planta) !== String(plantaId)
        )
          return false;
        if (!year) return true;
        const d = t.fecha ? new Date(t.fecha) : null;
        const tYear = d && !isNaN(d) ? d.getFullYear() : null;
        return tYear === Number(year);
      });
    } catch (err) {
      // en caso de error de red dejamos pasar (no bloquear) pero logueamos
      console.error('[isTropaTaken] error checking tropa uniqueness', err);
      return false;
    }
  }

  // --- reemplazar tu handleSubmit por esto ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    const required = [
      'dte_dtu',
      'guia_policial',
      'n_tropa',
      'id_departamento',
      'id_planta',
      'id_productor',
      'id_titular_faena',
    ];
    if (isPlantaLocked && usuario?.id_planta) {
      setForm((prev) => ({ ...prev, id_planta: String(usuario.id_planta) }));
    }
    const missing = required.filter(
      (k) =>
        !form[k] && !(k === 'id_planta' && isPlantaLocked && usuario?.id_planta)
    );
    if (missing.length) {
      showToast('error', 'Completá todos los campos obligatorios.');
      return;
    }

    // --- Validación de unicidad: nro de tropa por año ---
    // obtenemos año desde form.fecha_alta; si no existe usamos el año actual
    const fecha = form.fecha_alta ? new Date(form.fecha_alta) : null;
    const year =
      fecha && !isNaN(fecha) ? fecha.getFullYear() : new Date().getFullYear();
    const plantaIdForCheck =
      isPlantaLocked && usuario?.id_planta
        ? usuario.id_planta
        : form.id_planta || null;

    // chequeo asíncrono
    const taken = await isTropaTaken(form.n_tropa, year, plantaIdForCheck);
    if (taken) {
      showToast(
        'error',
        `El número de tropa ${form.n_tropa} ya existe en el año ${year}.`
      );
      return;
    }

    try {
      const payload = { ...form };
      if (isPlantaLocked && usuario?.id_planta)
        payload.id_planta = String(usuario.id_planta);

      // Formatear fechas correctamente para evitar problemas de zona horaria
      if (payload.fecha_alta) {
        payload.fecha_alta = formatDateForAPI(payload.fecha_alta);
      }
      if (payload.fecha_ingreso) {
        payload.fecha_ingreso = formatDateForAPI(payload.fecha_ingreso);
      }

      const res = await api.post('/tropas', payload);

      // Extraer id_tropa de la respuesta (buscar en varios formatos posibles)
      const id_tropa =
        res?.data?.id_tropa ??
        res?.data?.id ??
        res?.data?.insertId ??
        res?.data?.id_insertado ??
        null;

      if (id_tropa) {
        console.log('[TropaForm] Tropa creada con id:', id_tropa);
        showToast('success', 'Tropa creada correctamente.');

        // Limpiar formulario
        setForm({
          fecha_alta: '',
          fecha_ingreso: '',
          dte_dtu: '',
          guia_policial: '',
          n_tropa: '',
          id_departamento: '',
          id_planta: usuario?.id_planta ? String(usuario.id_planta) : '',
          id_productor: '',
          id_titular_faena: '',
        });

        // Redirigir a detalle de tropa
        const urlPath = `/tropas-cargadas/modificar/${id_tropa}`;
        console.log('[TropaForm] Redirigiendo a:', urlPath);

        // Llamar callback si existe (para compatibilidad)
        if (onCreated && typeof onCreated === 'function') {
          onCreated(id_tropa);
        }

        // Usar navigate para redirigir
        setTimeout(() => {
          navigate(urlPath);
        }, 500);
        return;
      }

      if (res?.status >= 200 && res.status < 300) {
        console.warn('[TropaForm] Respuesta 2xx pero sin id_tropa:', res.data);
        showToast(
          'error',
          'Tropa creada pero sin ID. Por favor, intenta nuevamente.'
        );
        return;
      }
      showToast('error', 'Error al guardar tropa.');
    } catch (err) {
      console.error('guardar tropa error', err);
      
      // Capturar error específico de DTE/DTU duplicado
      if (err?.response?.status === 409 && err?.response?.data?.code === 'DUPLICATE_DTE_DTU') {
        showToast(
          'error',
          err?.response?.data?.error || `El DTE/DTU ${form.dte_dtu} ya está registrado`
        );
        return;
      }
      
      showToast(
        'error',
        err?.response?.data?.error || 'Error al guardar tropa.'
      );
    }
  };

  const openModal = (type, opener) => {
    openerRef.current = opener || null;
    setModalFor(type);
  };

  const handleCreatedModal = (type) => async (obj) => {
    try {
      const created = obj || {};

      if (type === 'departamento') {
        const id = created.id_departamento ?? created.id ?? null;
        const nombre =
          created.nombre_departamento ??
          created.departamento ??
          created.nombre ??
          `Departamento ${Date.now()}`;
        const id_provincia = created.id_provincia ?? null;
        const finalId = id ? String(id) : `local-dep-${Date.now()}`;
        const newDep = {
          id_departamento: id ?? finalId,
          nombre_departamento: nombre,
          provincia: created.provincia ?? created.descripcion ?? '',
          id_provincia,
        };
        setDepartamentos((prev) => {
          const exists = prev.find(
            (p) =>
              String(p.id_departamento) === String(newDep.id_departamento) ||
              (newDep.nombre_departamento &&
                String(p.nombre_departamento).trim().toLowerCase() ===
                  String(newDep.nombre_departamento).trim().toLowerCase())
          );
          if (exists) return prev;
          return [...prev, newDep];
        });
        setForm((f) => ({
          ...f,
          id_departamento: String(newDep.id_departamento),
        }));
        showToast('success', 'Departamento guardado y seleccionado.');
      }

      if (type === 'productor') {
        const id = created.id_productor ?? created.id ?? null;
        const nombre =
          created.nombre ??
          created.razon_social ??
          created.nombre_productor ??
          `Productor ${Date.now()}`;
        const cuit = created.cuit ?? null;
        const finalId = id ? String(id) : `local-prod-${Date.now()}`;
        const newProd = { id_productor: id ?? finalId, nombre, cuit };
        setProductores((prev) => {
          const exists = prev.find(
            (p) =>
              String(p.id_productor) === String(newProd.id_productor) ||
              (newProd.cuit && String(p.cuit) === String(newProd.cuit))
          );
          if (exists) return prev;
          return [...prev, newProd];
        });
        setForm((f) => ({ ...f, id_productor: String(newProd.id_productor) }));
        showToast('success', 'Productor guardado y seleccionado.');
      }

      if (type === 'titular') {
        const id = created.id_titular_faena ?? created.id ?? null;
        const nombre = created.nombre ?? `Titular ${Date.now()}`;
        const localidad = created.localidad ?? '';
        const finalId = id ? String(id) : `local-tit-${Date.now()}`;
        const newTit = {
          id_titular_faena: id ?? finalId,
          nombre,
          localidad,
          provincia: created.provincia ?? '',
        };
        setTitulares((prev) => {
          const exists = prev.find(
            (t) =>
              String(t.id_titular_faena) === String(newTit.id_titular_faena) ||
              (newTit.nombre &&
                String(t.nombre).trim().toLowerCase() ===
                  String(newTit.nombre).trim().toLowerCase())
          );
          if (exists) return prev;
          return [...prev, newTit];
        });
        setForm((f) => ({
          ...f,
          id_titular_faena: String(newTit.id_titular_faena),
        }));
        showToast('success', 'Titular guardado y seleccionado.');
      }

      setModalFor(null);
      if (openerRef.current && openerRef.current.focus)
        openerRef.current.focus();
    } catch (err) {
      console.error('handleCreatedModal error', err);
      showToast('error', 'Creado, pero hubo un problema actualizando listas.');
      setModalFor(null);
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="max-w-5xl mx-auto bg-white p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-100 space-y-6"
      >
        <AppNotification
          show={Boolean(toast)}
          message={toast?.text || ''}
          type={toast?.type === 'success' ? 'success' : 'error'}
          onClose={() => setToast(null)}
          errorTitle="Atencion"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SelectField
            label="Planta"
            value={
              plantaOptions.find((o) => o.value === form.id_planta) || null
            }
            onChange={(sel) => handleSelectChange('id_planta')(sel)}
            options={plantaOptions}
            placeholder="Seleccione una planta"
            isDisabled={isPlantaLocked}
          />

          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700 text-sm">
              Ingreso al establecimiento
            </label>
            <input
              name="fecha_ingreso"
              type="date"
              value={form.fecha_ingreso}
              onChange={handleChange}
              className={INPUT_BASE_CLASS}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700 text-sm">
              DTE/DTU
            </label>
            <input
              name="dte_dtu"
              value={form.dte_dtu}
              onChange={handleChange}
              required
              placeholder="Ej. 123456"
              onKeyDown={onlyDigitsKeyDown}
              onPaste={onlyDigitsPaste}
              inputMode="numeric"
              pattern="\d*"
              className={INPUT_BASE_CLASS}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-2 font-semibold text-gray-700 text-sm">
              Guía Policial
            </label>
            <input
              name="guia_policial"
              value={form.guia_policial}
              onChange={handleChange}
              required
              placeholder="Ej. 789456"
              onKeyDown={onlyDigitsKeyDown}
              onPaste={onlyDigitsPaste}
              inputMode="numeric"
              pattern="\d*"
              className={INPUT_BASE_CLASS}
            />
          </div>

          <div className="flex flex-col">
            <label className="mb-1 font-semibold text-gray-700 text-sm">
              Nº Tropa
            </label>
            <input
              name="n_tropa"
              type="text"
              value={form.n_tropa}
              onChange={handleChange}
              required
              placeholder="Ej. 1001"
              onKeyDown={onlyDigitsKeyDown}
              onPaste={onlyDigitsPaste}
              inputMode="numeric"
              pattern="\d*"
              className={INPUT_BASE_CLASS}
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-0.5">
              <label className="font-semibold text-gray-700 text-sm">
                Departamento
              </label>
              <button
                type="button"
                onClick={(e) => openModal('departamento', e.currentTarget)}
                className="text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-md text-xs font-medium"
              >
                Agregar +
              </button>
            </div>
            <SelectField
              label=""
              value={
                deptOptions.find((o) => o.value === form.id_departamento) ||
                null
              }
              onChange={(sel) => handleSelectChange('id_departamento')(sel)}
              options={deptOptions}
              placeholder="Seleccione un departamento"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-0.5">
              <label className="font-semibold text-gray-700 text-sm">
                Productor
              </label>
              <button
                type="button"
                onClick={(e) => openModal('productor', e.currentTarget)}
                className="text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-md text-xs font-medium"
              >
                Agregar +
              </button>
            </div>
            <SelectField
              label=""
              value={
                prodOptions.find((o) => o.value === form.id_productor) || null
              }
              onChange={(sel) => handleSelectChange('id_productor')(sel)}
              options={prodOptions}
              placeholder="Seleccione un productor"
            />
          </div>

          <div className="sm:col-span-1">
            <div className="flex justify-between items-center mb-0.5">
              <label className="font-semibold text-gray-700 text-sm">
                Titular Faena
              </label>
              <button
                type="button"
                onClick={(e) => openModal('titular', e.currentTarget)}
                className="text-green-700 bg-green-100 border border-green-200 px-2 py-0.5 rounded-md text-xs font-medium"
              >
                Agregar +
              </button>
            </div>
            <SelectField
              label=""
              value={
                titOptions.find((o) => o.value === form.id_titular_faena) ||
                null
              }
              onChange={(sel) => handleSelectChange('id_titular_faena')(sel)}
              options={titOptions}
              placeholder="Seleccione un titular"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#00902f] text-white py-2.5 rounded-md hover:bg-[#008d36]"
        >
          Siguiente
        </button>
      </form>

      {modalFor && (
        <Modal onClose={() => setModalFor(null)}>
          <InlineCreateModal
            type={modalFor}
            provincias={provincias}
            onCancel={() => setModalFor(null)}
            onCreated={handleCreatedModal(modalFor)}
            onNotify={showToast}
          />
        </Modal>
      )}
    </>
  );
}

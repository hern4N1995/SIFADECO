// DetalleTropa.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select';
import api from '../services/api';
import AppNotification from '../components/AppNotification';
import { formatDateFromDB } from '../utils/dateFormatter';

const INPUT_BASE_CLASS =
  'w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50';

function SelectField({
  label,
  value,
  onChange,
  options = [],
  placeholder = '— Seleccionar —',
  maxMenuHeight = 200,
  isDisabled = false,
  isClearable = false,
  selectKey = undefined,
  usePortal = true,
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
    indicatorsContainer: (base) => ({ ...base, height: '48px' }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.5rem',
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      zIndex: 999999,
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
    <div className="flex flex-col">
      {label && (
        <label className="mb-2 font-semibold text-gray-700 text-sm">
          {label}
        </label>
      )}
      <Select
        key={selectKey}
        value={value ?? null}
        onChange={(sel) => onChange(sel ?? null)}
        options={options}
        placeholder={placeholder}
        maxMenuHeight={maxMenuHeight}
        isDisabled={isDisabled}
        isClearable={isClearable}
        styles={customStyles}
        noOptionsMessage={() => 'Sin opciones'}
        components={{ IndicatorSeparator: () => null }}
        onFocus={() => {
          setIsFocusing(true);
          setTimeout(() => setIsFocusing(false), 50);
        }}
        menuPortalTarget={
          usePortal && typeof document !== 'undefined' ? document.body : undefined
        }
        menuPosition={usePortal ? 'fixed' : 'absolute'}
        menuPlacement="auto"
      />
    </div>
  );
}

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
  if (
    (e.ctrlKey || e.metaKey) &&
    ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())
  )
    return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}

/* ---------- Modal Helper ---------- */
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black opacity-30 pointer-events-auto" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-[10000] pointer-events-auto overflow-visible">
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
    if (type === 'productor')
      return (
        values.nombre?.trim() &&
        values.cuit?.trim() &&
        values.cuit.replace(/\D/g, '').length === 11
      );
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

  const handleCuitChange = (e) => {
    const { value } = e.target;
    const cleaned = value.replace(/\D/g, '').slice(0, 11);
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

  const handleCreate = async () => {
    if (!validate()) {
      setError('Completá los campos obligatorios correctamente.');
      return;
    }

    setLoading(true);
    try {
      const getTokenHeaders = () => {
        try {
          const token = localStorage.getItem('authToken');
          return token ? { Authorization: `Bearer ${token}` } : {};
        } catch (e) {
          return {};
        }
      };

      let endpoint, payload;
      if (type === 'departamento') {
        endpoint = '/departamentos';
        payload = {
          nombre_departamento: values.nombre_departamento,
          id_provincia: Number(values.id_provincia),
        };
      } else if (type === 'productor') {
        endpoint = '/productores';
        payload = {
          nombre: values.nombre,
          cuit: values.cuit.replace(/\D/g, ''),
        };
      } else if (type === 'titular') {
        endpoint = '/titulares-faena';
        payload = {
          nombre: values.nombre,
          id_provincia: Number(values.id_provincia),
          localidad: values.localidad,
          direccion: values.direccion || '',
          cuit: values.cuit ? values.cuit.replace(/\D/g, '') : '',
        };
      }

      const res = await api.post(endpoint, payload, {
        headers: getTokenHeaders(),
      });

      if (mounted.current) {
        const rawData = res.data || {};
        onCreated(rawData);
      }
    } catch (err) {
      if (mounted.current) {
        const msg =
          err?.response?.data?.error ||
          err?.message ||
          'Error al crear registro';
        setError(msg);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  };

  const INPUT_BASE_CLASS =
    'w-full border-2 border-gray-200 rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:border-green-500 focus:ring-4 focus:ring-green-100 focus:outline-none hover:border-green-300 bg-gray-50';

  const provOptions = provincias.map((p) => ({
    value: String(p.id ?? p.id_provincia ?? ''),
    label: p.descripcion ?? p.nombre ?? '',
  }));

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
            selectKey={`dept-prov-${provOptions.length}`}
            usePortal={false}
          />

          <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nombre productor
          </label>
          <input
            name="nombre"
            value={values.nombre}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. Establecimiento Pérez"
          />
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            selectKey={`tit-prov-${provOptions.length}`}
            usePortal={false}
          />

          <label className="block text-sm font-medium text-gray-700 mt-3 mb-2">
            Nombre titular
          </label>
          <input
            name="nombre"
            value={values.nombre}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. Juan López"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Localidad
          </label>
          <input
            name="localidad"
            value={values.localidad}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. Mercedes"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Dirección (opcional)
          </label>
          <input
            name="direccion"
            value={values.direccion}
            onChange={handleChange}
            className={INPUT_BASE_CLASS + ' mb-2'}
            placeholder="Ej. Calle Principal 123"
          />

          <label className="block text-sm font-medium text-gray-700 mb-2">
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

export default function DetalleTropa() {
  const { tropaId } = useParams();
  const navigate = useNavigate();

  // Normalizar el ID: si viene como string, convertir a número
  // tropaId debería ser un string como "137", lo pasamos al endpoint como está
  const id = tropaId ? String(tropaId).trim() : undefined;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [usuario, setUsuario] = useState(null);
  const [tropaInfo, setTropaInfo] = useState({
    n_tropa: '',
    dte_dtu: '',
    fecha_ingreso: '',
    guia_policial: '',
    titular: '',
    productor: '',
    planta: '',
    departamento: '',
    id_titular_faena: null,
    id_productor: null,
    id_departamento: null,
    id_planta: null,
  });

  // Estados para edición de la tropa
  const [editingTropa, setEditingTropa] = useState(false);
  const [tropaEdicion, setTropaEdicion] = useState({});
  const [departamentos, setDepartamentos] = useState([]);
  const [productores, setProductores] = useState([]);
  const [titulares, setTitulares] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [provincias, setProvincias] = useState([]);
  const [savingTropa, setSavingTropa] = useState(false);

  const [detalle, setDetalle] = useState({ especie: '', categorias: [] });
  const [especies, setEspecies] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]); // canonical normalized
  const [especiesOptions, setEspeciesOptions] = useState([]);

  const [editCategoryOptions, setEditCategoryOptions] = useState([]); // per-edit catalog
  const [toast, setToast] = useState(null);

  const [modalFor, setModalFor] = useState(null);
  const openerRef = useRef(null);

  const [editing, setEditing] = useState({
    id: null, // id_tropa_detalle as string
    id_cat_especie: '',
    remanente: '',
    id_especie: null,
    selectedCategory: null,
    selectKey: undefined,
  });

  // Sincronizar tropaEdicion con tropaInfo cuando se carga la tropa
  useEffect(() => {
    if (tropaInfo.n_tropa) {
      setTropaEdicion({
        n_tropa: tropaInfo.n_tropa || '',
        dte_dtu: tropaInfo.dte_dtu || '',
        guia_policial: tropaInfo.guia_policial || '',
        fecha_ingreso: tropaInfo.fecha_ingreso || '',
        id_departamento: tropaInfo.id_departamento || null,
        id_planta: tropaInfo.id_planta || null,
        id_productor: tropaInfo.id_productor || null,
        id_titular_faena: tropaInfo.id_titular_faena || null,
      });
    }
  }, [
    tropaInfo.n_tropa,
    tropaInfo.dte_dtu,
    tropaInfo.guia_policial,
    tropaInfo.fecha_ingreso,
    tropaInfo.id_departamento,
    tropaInfo.id_planta,
    tropaInfo.id_productor,
    tropaInfo.id_titular_faena,
  ]);

  // Asegurar que tropaEdicion se actualiza después de que se cargan las opciones
  useEffect(() => {
    if (
      (plantas.length > 0 ||
        departamentos.length > 0 ||
        productores.length > 0 ||
        titulares.length > 0) &&
      tropaInfo.n_tropa &&
      (!tropaEdicion.n_tropa || tropaEdicion.n_tropa === '')
    ) {
      setTropaEdicion({
        n_tropa: tropaInfo.n_tropa || '',
        dte_dtu: tropaInfo.dte_dtu || '',
        guia_policial: tropaInfo.guia_policial || '',
        fecha_ingreso: tropaInfo.fecha_ingreso || '',
        id_departamento: tropaInfo.id_departamento || null,
        id_planta: tropaInfo.id_planta || null,
        id_productor: tropaInfo.id_productor || null,
        id_titular_faena: tropaInfo.id_titular_faena || null,
      });
    }
  }, [plantas.length, departamentos.length, productores.length, titulares.length]);

  // When editing.id_especie changes, reload category options for the edit form
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const especieId = editing?.id_especie;
      if (!especieId) {
        if (mounted) setEditCategoryOptions([]);
        return;
      }
      try {
        const opts = await fetchCategoriasByEspecie(especieId);
        if (!mounted) return;
        const normalized = opts.map((o) => ({
          value: String(o.value),
          label: String(o.label),
        }));
        // ensure current selectedCategory stays if present
        setEditCategoryOptions(normalized);
        if (editing.selectedCategory) {
          const exists = normalized.some(
            (x) => String(x.value) === String(editing.selectedCategory.value)
          );
          if (!exists) {
            setEditing((s) => ({
              ...s,
              selectedCategory: null,
              id_cat_especie: '',
            }));
          }
        }
      } catch (e) {
        console.warn(
          '[DetalleTropa] error loading edit categories for especie',
          especieId,
          e?.message || e
        );
      }
    };
    load();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing.id_especie]);

  const [confirmDelete, setConfirmDelete] = useState({
    id: null,
    ids: null,
    nombre: '',
  });

  const [bufferRows, setBufferRows] = useState([]);
  const [especieSeleccionada, setEspecieSeleccionada] = useState(null);
  const [catalogoCategorias, setCatalogoCategorias] = useState([]);
  const [nuevoDetalle, setNuevoDetalle] = useState({
    id_cat_especie: '',
    cantidad: '',
  });

  const getTokenHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Convertir fecha ISO a formato YYYY-MM-DD para input type="date"
  const formatDateForInput = (isoDate) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  const showToast = (type, text, ms = 3000) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), ms);
  };

  const onlyDigits = (raw) =>
    raw == null ? '' : String(raw).replace(/\D/g, '');

  const normalizeOption = (o) => ({
    value: String(o.id_cat_especie ?? o.id ?? o.id_cat ?? o.value ?? ''),
    label: String(o.nombre ?? o.descripcion ?? o.label ?? o.descripcion ?? ''),
  });

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
          created.nombre ??
          created.nombre_departamento ??
          created.departamento ??
          `Departamento ${Date.now()}`;
        const id_provincia = created.id_provincia ?? null;
        const finalId = id ? String(id) : `local-dep-${Date.now()}`;
        // Normalizar con 'id' y 'nombre' como propiedades comunes
        const newDep = {
          id: id ?? finalId,
          nombre,
          provincia: created.provincia ?? created.descripcion ?? '',
          id_provincia,
        };
        setDepartamentos((prev) => {
          const exists = prev.find(
            (p) =>
              String(p.id) === String(newDep.id) ||
              (newDep.nombre &&
                String(p.nombre).trim().toLowerCase() ===
                  String(newDep.nombre).trim().toLowerCase())
          );
          if (exists) return prev;
          return [...prev, newDep];
        });
        setTropaEdicion((f) => ({
          ...f,
          id_departamento: String(newDep.id),
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
        // Normalizar con 'id' y 'nombre' como propiedades comunes
        const newProd = { id: id ?? finalId, nombre, cuit };
        setProductores((prev) => {
          const exists = prev.find(
            (p) =>
              String(p.id) === String(newProd.id) ||
              (newProd.cuit && String(p.cuit) === String(newProd.cuit))
          );
          if (exists) return prev;
          return [...prev, newProd];
        });
        setTropaEdicion((f) => ({
          ...f,
          id_productor: String(newProd.id),
        }));
        showToast('success', 'Productor guardado y seleccionado.');
      }

      if (type === 'titular') {
        const id = created.id_titular_faena ?? created.id ?? null;
        const nombre = created.nombre ?? `Titular ${Date.now()}`;
        const localidad = created.localidad ?? '';
        const finalId = id ? String(id) : `local-tit-${Date.now()}`;
        // Normalizar con 'id' como propiedad común para consistencia con la lista cargada
        const newTit = {
          id: id ?? finalId,
          nombre,
          localidad,
          provincia: created.provincia ?? '',
        };
        setTitulares((prev) => {
          const exists = prev.find(
            (t) =>
              String(t.id) === String(newTit.id) ||
              (newTit.nombre &&
                String(t.nombre).trim().toLowerCase() ===
                  String(newTit.nombre).trim().toLowerCase())
          );
          if (exists) return prev;
          return [...prev, newTit];
        });
        setTropaEdicion((f) => ({
          ...f,
          id_titular_faena: String(newTit.id),
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

  const fetchTropa = async () => {
    try {
      console.log('[DetalleTropa] Obteniendo tropa con ID:', id);
      const res = await api.get(`/tropas/${id}`, {
        headers: getTokenHeaders(),
      });
      console.log('[DetalleTropa] Respuesta de tropa:', res.data);

      const data = res.data || {};

      // Extraer datos con múltiples fallbacks
      const n_tropa = data.n_tropa ?? data.numero_tropa ?? data.numero ?? '';
      const dte_dtu = data.dte_dtu ?? data.dte ?? data.dtu ?? '';
      const fecha_ingreso = data.fecha_ingreso ?? data.fecha ?? '';
      const guia_policial = data.guia_policial ?? '';
      const titular = data.titular ?? data.titular_nombre ?? '';
      const planta =
        data.planta ?? data.planta_nombre ?? data.nombre_planta ?? '';
      const productor =
        data.productor ?? data.productor_nombre ?? data.nombre_productor ?? '';
      const departamento =
        data.departamento ?? data.nombre_departamento ?? data.depto ?? '';

      const tropaData = {
        n_tropa: n_tropa || '',
        dte_dtu: dte_dtu || '',
        fecha_ingreso: fecha_ingreso || '',
        guia_policial: guia_policial || '',
        titular: titular || '',
        planta: planta || '',
        productor: productor || '',
        departamento: departamento || '',
        id_titular_faena: data.id_titular_faena || null,
        id_productor: data.id_productor || null,
        id_departamento: data.id_departamento || null,
        id_planta: data.id_planta || null,
      };

      setTropaInfo(tropaData);
      setTropaEdicion(tropaData);

      console.log('[DetalleTropa] Tropa info seteada:', tropaData);
    } catch (err) {
      console.error('[DetalleTropa] Error al obtener tropa:', err);
      console.error('[DetalleTropa] URL intentada: /tropas/' + id);
      console.error('[DetalleTropa] Response status:', err.response?.status);
      console.error('[DetalleTropa] Response data:', err.response?.data);
      setError('No se pudo obtener la tropa');
    }
  };

  const fetchDatos = async () => {
    try {
      const [deptRes, prodRes, titRes, plantaRes, provRes] = await Promise.all([
        api.get('/tropas/departamentos', { headers: getTokenHeaders() }),
        api.get('/tropas/productores', { headers: getTokenHeaders() }),
        api.get('/tropas/titulares', { headers: getTokenHeaders() }),
        api.get('/tropas/plantas', { headers: getTokenHeaders() }),
        api.get('/provincias', { headers: getTokenHeaders() }),
      ]);

      setDepartamentos(Array.isArray(deptRes.data) ? deptRes.data : []);
      setProductores(Array.isArray(prodRes.data) ? prodRes.data : []);
      setTitulares(Array.isArray(titRes.data) ? titRes.data : []);
      setPlantas(Array.isArray(plantaRes.data) ? plantaRes.data : []);
      setProvincias(Array.isArray(provRes.data) ? provRes.data : []);
    } catch (err) {
      console.error('[DetalleTropa] Error al obtener datos auxiliares:', err);
    }
  };

  const fetchDetalleAgrupado = async () => {
    try {
      const res = await api.get(`/tropas/${id}/detalle-agrupado`, {
        headers: getTokenHeaders(),
      });
      const data = res.data || {};
      const categorias = Array.isArray(data.categorias) ? data.categorias : [];
      setDetalle({ especie: data.especie ?? '', categorias });

      // build canonical categoryOptions (value as string)
      const opts = categorias.map((c) => normalizeOption(c));
      const seen = new Set();
      const dedup = [];
      for (const o of opts) {
        if (!seen.has(o.value)) {
          seen.add(o.value);
          dedup.push(o);
        }
      }
      setCategoryOptions(dedup);
    } catch (err) {
      console.error('Error al obtener detalle agrupado:', err);
      setDetalle({ especie: '', categorias: [] });
      setCategoryOptions([]);
      setError((prev) => prev || 'No se pudo cargar el detalle de la tropa');
    }
  };

  const fetchEspecies = async () => {
    try {
      console.log('[DetalleTropa] Obteniendo especies...');

      // Intentar obtener de /especies primero
      try {
        const res = await api.get('/especies', { headers: getTokenHeaders() });
        console.log(
          '[DetalleTropa] Respuesta de especies (endpoint /especies):',
          res.data
        );

        const data = res.data;
        const activos = Array.isArray(data)
          ? data.filter((e) =>
              e.estado === undefined ? true : Boolean(e.estado)
            )
          : [];

        console.log('[DetalleTropa] Especies activas:', activos);

        const opts = activos.map((s) => ({
          value: s.id ?? s.id_especie ?? s.nombre,
          label: s.nombre ?? s.descripcion ?? String(s.id ?? ''),
        }));

        console.log('[DetalleTropa] Opciones de especies:', opts);

        setEspecies(activos);
        setEspeciesOptions(opts);
        return;
      } catch (err1) {
        console.warn(
          '[DetalleTropa] Error con /especies, intentando /categorias-especie:',
          err1.message
        );

        // Fallback: obtener especies desde categorías
        const resCat = await api.get('/categorias-especie', {
          headers: getTokenHeaders(),
        });
        console.log(
          '[DetalleTropa] Respuesta de categorias-especie:',
          resCat.data
        );

        const categorias = Array.isArray(resCat.data) ? resCat.data : [];
        const especiesSet = new Set();
        const especiesList = [];

        for (const cat of categorias) {
          const especieId = cat.id_especie;
          const especieNombre = cat.especie;

          if (especieId && !especiesSet.has(especieId)) {
            especiesSet.add(especieId);
            especiesList.push({
              id_especie: especieId,
              descripcion: especieNombre,
              id: especieId,
              nombre: especieNombre,
            });
          }
        }

        console.log(
          '[DetalleTropa] Especies extraídas de categorías:',
          especiesList
        );

        const opts = especiesList.map((s) => ({
          value: s.id_especie ?? s.id,
          label: s.descripcion ?? s.nombre,
        }));

        console.log(
          '[DetalleTropa] Opciones de especies (desde categorías):',
          opts
        );

        setEspecies(especiesList);
        setEspeciesOptions(opts);
      }
    } catch (err) {
      console.error('[DetalleTropa] Error al obtener especies:', err);
      console.error('[DetalleTropa] Error response:', err.response?.data);
      setEspecies([]);
      setEspeciesOptions([]);
      setError((prev) => prev || 'No se pudieron cargar las especies');
    }
  };
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      console.log('[DetalleTropa] Montando componente con ID:', id);
      setLoading(true);
      setError('');
      
      // Cargar usuario desde localStorage
      try {
        const usuarioStr = localStorage.getItem('usuario');
        if (usuarioStr) {
          const usr = JSON.parse(usuarioStr);
          if (mounted) setUsuario(usr);
        }
      } catch (e) {
        console.warn('[DetalleTropa] Error al parsear usuario:', e);
      }
      
      await Promise.all([
        fetchTropa(),
        fetchDetalleAgrupado(),
        fetchEspecies(),
        fetchDatos(),
      ]);
      if (mounted) {
        console.log('[DetalleTropa] Carga completada');
        setLoading(false);
      }
    };
    load();
    return () => (mounted = false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    const loadCategorias = async () => {
      if (!especieSeleccionada?.value) {
        console.log(
          '[DetalleTropa] Sin especie seleccionada, limpiando categorías'
        );
        setCatalogoCategorias([]);
        return;
      }

      console.log(
        '[DetalleTropa] Cargando categorías para especie:',
        especieSeleccionada.value
      );

      try {
        const r = await api.get(
          `/categorias-especie/${especieSeleccionada.value}/categorias`,
          { headers: getTokenHeaders() }
        );

        console.log('[DetalleTropa] Respuesta de categorías:', r.data);

        const list = Array.isArray(r.data) ? r.data : r.data?.categorias ?? [];

        console.log('[DetalleTropa] Categorías crudas:', list);

        const opts = list.map((c) => normalizeOption(c));

        console.log('[DetalleTropa] Categorías normalizadas:', opts);

        const seen = new Set();
        const dedup = [];
        for (const o of opts) {
          if (!seen.has(o.value)) {
            seen.add(o.value);
            dedup.push(o);
          }
        }

        console.log('[DetalleTropa] Categorías sin duplicar:', dedup);

        setCatalogoCategorias(dedup);
      } catch (err) {
        console.warn(
          '[DetalleTropa] No se pudieron cargar categorias para especie',
          especieSeleccionada?.value,
          err
        );
        console.warn('[DetalleTropa] Error response:', err.response?.data);

        // Fallback: obtener de categorias-especie y filtrar
        try {
          console.log(
            '[DetalleTropa] Intentando fallback con /categorias-especie'
          );
          const resCat = await api.get(`/categorias-especie`, {
            headers: getTokenHeaders(),
          });

          console.log(
            '[DetalleTropa] Respuesta de categorias-especie:',
            resCat.data
          );

          const allCats = Array.isArray(resCat.data) ? resCat.data : [];
          const filtradas = allCats.filter(
            (c) =>
              String(c.id_especie ?? c.especie_id ?? '') ===
              String(especieSeleccionada.value)
          );

          console.log(
            '[DetalleTropa] Categorías filtradas para especie:',
            filtradas
          );

          const opts = filtradas.map((c) => normalizeOption(c));

          const seen = new Set();
          const dedup = [];
          for (const o of opts) {
            if (!seen.has(o.value)) {
              seen.add(o.value);
              dedup.push(o);
            }
          }

          console.log(
            '[DetalleTropa] Categorías sin duplicar (fallback):',
            dedup
          );

          setCatalogoCategorias(dedup);
        } catch (err2) {
          console.warn('[DetalleTropa] Fallback también falló:', err2);
          setCatalogoCategorias([]);
        }
      }
    };
    loadCategorias();
  }, [especieSeleccionada]);

  const resolveIdFromItem = (item) => {
    if (!item) return null;
    // Try several common id property names
    const tryKeys = (obj) => {
      if (!obj) return null;
      const keys = [
        'id_tropa_detalle',
        'id_tropadetalle',
        'id_tropa_det',
        'id_tropaDetalle',
        'id_tropa_detalle',
        'id_detalle',
        'id',
        'idDetalle',
      ];
      for (const k of keys) {
        if (obj[k] !== undefined && obj[k] !== null) return obj[k];
      }
      return null;
    };

    const direct = tryKeys(item);
    if (direct != null) return direct;

    if (Array.isArray(item.rawRows) && item.rawRows.length > 0) {
      const r0 = item.rawRows[0];
      const fromRaw = tryKeys(r0);
      if (fromRaw != null) return fromRaw;
    }

    // As a last resort, some grouped items include an array of ids under 'ids' or similar
    if (Array.isArray(item.ids) && item.ids.length > 0) return item.ids[0];

    return null;
  };

  const fetchCategoriasByEspecie = async (especieId) => {
    if (!especieId) return [];
    // Primero intentar endpoint específico: /categorias-especie/:id/categorias
    try {
      const res = await api.get(`/categorias-especie/${especieId}/categorias`, {
        headers: getTokenHeaders(),
      });
      const rows = Array.isArray(res.data)
        ? res.data
        : res.data?.categorias ?? [];
      return rows.map((c) => ({
        value: String(c.id_cat_especie ?? c.id),
        label: String(
          c.descripcion ?? c.nombre ?? String(c.id_cat_especie ?? c.id)
        ),
        raw: c,
      }));
    } catch (e) {
      // Si falla (por ejemplo 404 en deploy), hacer fallback a /categorias-especie y filtrar
      console.warn(
        '[DetalleTropa] fetchCategoriasByEspecie failed, intentando fallback',
        especieId,
        e?.message
      );
      try {
        const r = await api.get('/categorias-especie', {
          headers: getTokenHeaders(),
        });
        const all = Array.isArray(r.data) ? r.data : r.data?.categorias ?? [];
        const filtered = all.filter(
          (c) =>
            String(c.id_especie ?? c.especie_id ?? '') === String(especieId)
        );
        return filtered.map((c) => ({
          value: String(c.id_cat_especie ?? c.id),
          label: String(
            c.descripcion ?? c.nombre ?? String(c.id_cat_especie ?? c.id)
          ),
          raw: c,
        }));
      } catch (e2) {
        console.warn(
          '[DetalleTropa] fetchCategoriasByEspecie fallback también falló',
          e2?.message
        );
        return [];
      }
    }
  };

  // openEdit: build editCategoryOptions and selectedCategory object
  const openEdit = async (item) => {
    const resolvedId = resolveIdFromItem(item);
    console.log('[DetalleTropa] openEdit called for item:', item);
    console.log('[DetalleTropa] openEdit resolvedId:', resolvedId);

    let especieId = item.id_especie ?? item.especie_id ?? null;
    if (
      !especieId &&
      item.especie &&
      Array.isArray(especies) &&
      especies.length > 0
    ) {
      const found = especies.find(
        (e) =>
          String(e.nombre ?? e.descripcion ?? '')
            .toLowerCase()
            .trim() ===
          String(item.especie ?? '')
            .toLowerCase()
            .trim()
      );
      if (found) especieId = found.id ?? found.id_especie ?? null;
    }

    let fetchedOptions = [];
    if (especieId) {
      try {
        fetchedOptions = await fetchCategoriasByEspecie(especieId);
        console.log(
          '[DetalleTropa] fetchedOptions length:',
          Array.isArray(fetchedOptions) ? fetchedOptions.length : 0
        );
      } catch {
        fetchedOptions = [];
      }
    }

    const sourceOptions =
      Array.isArray(fetchedOptions) && fetchedOptions.length > 0
        ? fetchedOptions
        : categoryOptions;
    console.log(
      '[DetalleTropa] sourceOptions length:',
      Array.isArray(sourceOptions) ? sourceOptions.length : 0
    );

    // normalize and dedupe
    const seen = new Set();
    const dedup = [];
    for (const o of sourceOptions) {
      const vv = String(o.value ?? '');
      const label = String(o.label ?? vv);
      if (!seen.has(vv)) {
        seen.add(vv);
        dedup.push({ value: vv, label });
      } else {
        if (label && label !== '') {
          const idx = dedup.findIndex((x) => x.value === vv);
          if (idx >= 0 && (!dedup[idx].label || dedup[idx].label === ''))
            dedup[idx].label = label;
        }
      }
    }

    // current category id from various possible properties in payload
    const currentCategoryValue =
      item.id_cat_especie ??
      (item.rawRows && item.rawRows[0] && item.rawRows[0].id_cat_especie) ??
      item.categoria?.id_cat_especie ??
      item.categoria?.id ??
      item.id_cat ??
      '';
    const currentCategoryStr =
      currentCategoryValue === null || currentCategoryValue === undefined
        ? ''
        : String(currentCategoryValue);

    if (currentCategoryStr !== '') {
      const exists = dedup.some((x) => String(x.value) === currentCategoryStr);
      if (!exists) {
        const labelFromItem = String(
          item.nombre ??
            item.descripcion ??
            item.label ??
            (Array.isArray(item.rawRows) && item.rawRows[0]
              ? item.rawRows[0].nombre ?? item.rawRows[0].descripcion
              : '') ??
            currentCategoryStr
        );
        dedup.unshift({ value: currentCategoryStr, label: labelFromItem });
      }
    }

    // Defensive: do not remove options that look like the detail id; keep dedup as-is
    setEditCategoryOptions(dedup);

    const selectedObj =
      dedup.find((o) => String(o.value) === String(currentCategoryStr)) || null;
    const selectKeyForThisEdit = `cat-${
      resolvedId ?? 'noid'
    }-${currentCategoryStr}`;

    console.log(
      '[DetalleTropa] selectKeyForThisEdit:',
      selectKeyForThisEdit,
      'currentCategoryStr:',
      currentCategoryStr,
      'selectedObj:',
      selectedObj
    );

    // If no resolvedId, try to pick an id from rawRows first element
    let editId = null;
    if (resolvedId != null) editId = String(resolvedId);
    else if (Array.isArray(item.rawRows) && item.rawRows.length > 0) {
      const first = item.rawRows[0];
      const tryKeys = (obj) => {
        if (!obj) return null;
        const keys = [
          'id_tropa_detalle',
          'id_tropadetalle',
          'id_tropa_det',
          'id_tropaDetalle',
          'id_detalle',
          'id',
        ];
        for (const k of keys)
          if (obj[k] !== undefined && obj[k] !== null) return obj[k];
        return null;
      };
      const fromRaw = tryKeys(first);
      if (fromRaw != null) editId = String(fromRaw);
    }

    // final fallback to item.key so UI can still enter edit mode
    if (!editId) editId = String(item.key ?? 'noid');

    setEditing({
      id: editId,
      id_cat_especie: currentCategoryStr,
      remanente: String(item.cantidad ?? item.remanente ?? 0),
      id_especie: especieId ?? null,
      selectedCategory: selectedObj,
      selectKey: selectKeyForThisEdit,
    });
  };

  const cancelEdit = () =>
    setEditing({
      id: null,
      id_cat_especie: '',
      remanente: '',
      id_especie: null,
      selectedCategory: null,
      selectKey: undefined,
    });

  const saveEdit = async () => {
    if (!editing.id)
      return showToast('error', 'Elemento sin id, no se puede editar.');

    const selectedOpt =
      editing.selectedCategory && editing.selectedCategory.value
        ? editing.selectedCategory
        : editCategoryOptions.find(
            (o) => String(o.value) === String(editing.id_cat_especie)
          ) ||
          categoryOptions.find(
            (o) => String(o.value) === String(editing.id_cat_especie)
          );

    const newCat = selectedOpt ? selectedOpt.value : undefined;
    const newCantidad = Number(editing.remanente || 0);

    try {
      const original =
        detalle.categorias.find((c) => {
          // direct ids on the grouped row
          const ids = [c.id_tropa_detalle, c.id, c.id_detalle].map((v) =>
            v == null ? null : String(v)
          );
          if (ids.includes(String(editing.id))) return true;

          // or any rawRows within the grouped row may contain the id
          if (Array.isArray(c.rawRows)) {
            for (const rr of c.rawRows) {
              const rrIds = [
                rr.id_tropa_detalle,
                rr.id,
                rr.id_detalle,
                rr.id_tropa_detalle_id,
              ].map((v) => (v == null ? null : String(v)));
              if (rrIds.includes(String(editing.id))) return true;
            }
          }

          return false;
        }) || null;

      // If we didn't find an original in the grouped detalle, try to
      // fetch the non-aggregated detalle rows and look for a matching
      // underlying record. This handles the case where the UI shows
      // aggregated/grouped rows without exposing the underlying ids.
      let originalFound = original;
      let effectiveEditingId = String(editing.id);
      if (!originalFound) {
        try {
          console.warn(
            '[DetalleTropa] original not found — fetching raw detalle'
          );
          const rawRes = await api.get(`/tropas/${id}/detalle`, {
            headers: getTokenHeaders(),
          });
          const rawRows = Array.isArray(rawRes.data)
            ? rawRes.data
            : rawRes.data?.detalle ?? [];
          // Try to find a row by matching common category id properties
          const candidate =
            rawRows.find((r) => {
              const catVals = [
                r.id_cat_especie,
                r.id_cat,
                r.id_categoria,
                r.categoria_id,
              ].map((v) => (v == null ? null : String(v)));
              if (catVals.includes(String(editing.id))) return true;
              if (catVals.includes(String(editing.id_cat_especie))) return true;
              // also try matching by any id fields if editing.id looks numeric
              const idVals = [r.id_tropa_detalle, r.id, r.id_detalle].map((v) =>
                v == null ? null : String(v)
              );
              if (idVals.includes(String(editing.id))) return true;
              return false;
            }) || null;

          if (candidate) {
            // set the effective editing id to the underlying record id
            effectiveEditingId = String(
              candidate.id_tropa_detalle ??
                candidate.id ??
                candidate.id_detalle ??
                editing.id
            );
            originalFound = candidate;
            console.log(
              '[DetalleTropa] Found underlying candidate for edit:',
              effectiveEditingId,
              candidate
            );
          } else {
            console.warn(
              '[DetalleTropa] No underlying candidate found in /detalle'
            );
          }
        } catch (eRaw) {
          console.warn(
            '[DetalleTropa] Error fetching /tropas/:id/detalle fallback',
            eRaw?.message || eRaw
          );
        }
      }

      if (!originalFound)
        return showToast(
          'error',
          'No se encontró el registro original para editar.'
        );

      const originalEspecieId =
        originalFound?.id_especie ?? originalFound?.especie_id ?? null;
      const newEspecieId = editing.id_especie ?? originalEspecieId ?? null;

      const especieChanged =
        newEspecieId != null &&
        originalEspecieId != null &&
        String(newEspecieId) !== String(originalEspecieId);
      const categoriaChanged =
        newCat !== undefined &&
        String(newCat) !==
          String(originalFound.id_cat_especie ?? originalFound.id_cat ?? '');

      if (especieChanged) {
        try {
          await api.delete(`/tropas/tropa-detalle/${effectiveEditingId}`, {
            headers: getTokenHeaders(),
          });
        } catch (eDel) {
          console.error(
            'No se pudo eliminar detalle para cambio de especie',
            eDel
          );
          return showToast(
            'error',
            'No se pudo cambiar la especie (error al eliminar registro antiguo).'
          );
        }

        const createPayload = [
          {
            id_especie: Number(newEspecieId),
            id_cat_especie: Number(newCat),
            cantidad: Number(newCantidad),
          },
        ];
        try {
          await api.post(`/tropas/${id}/detalle`, createPayload, {
            headers: getTokenHeaders(),
          });
          showToast('success', 'Especie y cantidad actualizadas.');
          cancelEdit();
          await fetchDetalleAgrupado();
          return;
        } catch (eCreate) {
          console.error(
            'Error creando nuevo detalle tras cambio de especie',
            eCreate
          );
          return showToast(
            'error',
            'No se pudo crear el nuevo detalle con la especie seleccionada.'
          );
        }
      }

      if (categoriaChanged) {
        const destino =
          detalle.categorias.find((c) => {
            const sameCat =
              String(c.id_cat_especie ?? c.id_cat ?? c.id) === String(newCat);
            const sameEspecie =
              (c.id_especie ?? c.especie_id ?? newEspecieId) != null
                ? String(c.id_especie ?? c.especie_id ?? '') ===
                  String(newEspecieId)
                : true;
            const isSameRow = [c.id_tropa_detalle, c.id, c.id_detalle]
              .map((v) => (v == null ? null : String(v)))
              .includes(String(editing.id));
            return sameCat && sameEspecie && !isSameRow;
          }) || null;

        if (destino) {
          try {
            await api.patch(
              `/tropas/tropa-detalle/${
                destino.id_tropa_detalle ?? destino.id ?? destino.id_detalle
              }`,
              { cantidad: Number(newCantidad) },
              { headers: getTokenHeaders() }
            );
          } catch (eUpd) {
            try {
              await api.put(
                `/tropas/tropa-detalle/${
                  destino.id_tropa_detalle ?? destino.id ?? destino.id_detalle
                }`,
                { cantidad: Number(newCantidad) },
                { headers: getTokenHeaders() }
              );
            } catch (ePut) {
              console.error('No se pudo actualizar fila destino', eUpd, ePut);
              return showToast(
                'error',
                'No se pudo actualizar la categoría destino.'
              );
            }
          }

          try {
            await api.delete(`/tropas/tropa-detalle/${effectiveEditingId}`, {
              headers: getTokenHeaders(),
            });
          } catch (eDel) {
            console.error(
              'No se pudo eliminar fila original tras mover cantidad',
              eDel
            );
          }

          showToast(
            'success',
            'Categoría reemplazada (se reemplazó cantidad en la categoría destino).'
          );
          cancelEdit();
          await fetchDetalleAgrupado();
          return;
        } else {
          const payload = {
            id_cat_especie: newCat,
            cantidad: Number(newCantidad),
          };
          try {
            await api.patch(
              `/tropas/tropa-detalle/${effectiveEditingId}`,
              payload,
              {
                headers: getTokenHeaders(),
              }
            );
            showToast('success', 'Detalle actualizado.');
            cancelEdit();
            await fetchDetalleAgrupado();
            return;
          } catch (ePatch) {
            try {
              await api.put(
                `/tropas/tropa-detalle/${effectiveEditingId}`,
                payload,
                {
                  headers: getTokenHeaders(),
                }
              );
              showToast('success', 'Detalle actualizado.');
              cancelEdit();
              await fetchDetalleAgrupado();
              return;
            } catch (ePut) {
              console.error('PUT también falló', ePut);
              showToast('error', 'No se pudo actualizar el detalle.');
              return;
            }
          }
        }
      }

      // only cantidad changed
      {
        const payload = { cantidad: Number(newCantidad) };
        try {
          await api.patch(
            `/tropas/tropa-detalle/${effectiveEditingId}`,
            payload,
            {
              headers: getTokenHeaders(),
            }
          );
          showToast('success', 'Cantidad reemplazada.');
          cancelEdit();
          await fetchDetalleAgrupado();
          return;
        } catch (ePatch) {
          try {
            await api.put(
              `/tropas/tropa-detalle/${effectiveEditingId}`,
              payload,
              {
                headers: getTokenHeaders(),
              }
            );
            showToast('success', 'Cantidad reemplazada.');
            cancelEdit();
            await fetchDetalleAgrupado();
            return;
          } catch (ePut) {
            console.error('PUT también falló', ePut);
            showToast('error', 'No se pudo actualizar la cantidad.');
            return;
          }
        }
      }
    } catch (e) {
      console.error('saveEdit error', e);
      showToast('error', 'Error procesando la edición.');
    }
  };

  const openConfirmDelete = async (item) => {
    console.log('[DetalleTropa] openConfirmDelete called for item:', item);
    const resolvedId = resolveIdFromItem(item);
    if (resolvedId != null) {
      setConfirmDelete({
        id: resolvedId,
        ids: null,
        nombre: item.nombre ?? item.descripcion ?? '',
      });
      return;
    }

    // Try to collect ids from rawRows
    const collect = (rows) => {
      if (!Array.isArray(rows)) return [];
      const ids = [];
      for (const r of rows) {
        const tryKeys = (obj) => {
          if (!obj) return null;
          const keys = [
            'id_tropa_detalle',
            'id_tropadetalle',
            'id_tropa_det',
            'id_tropaDetalle',
            'id_detalle',
            'id',
          ];
          for (const k of keys)
            if (obj[k] !== undefined && obj[k] !== null) return obj[k];
          return null;
        };
        const v = tryKeys(r);
        if (v != null) ids.push(v);
      }
      return ids;
    };

    let ids = collect(item.rawRows || []);
    if (ids.length > 0) {
      setConfirmDelete({
        id: null,
        ids,
        nombre: item.nombre ?? item.descripcion ?? '',
      });
      return;
    }

    // If no ids in the item, try to fetch raw detalle rows and match by
    // category/especie/cantidad to find underlying records to delete.
    try {
      console.log(
        '[DetalleTropa] No ids in item, fetching /tropas/:id/detalle to find matches'
      );
      const r = await api.get(`/tropas/${id}/detalle`, {
        headers: getTokenHeaders(),
      });
      const rows = Array.isArray(r.data) ? r.data : r.data?.detalle ?? [];
      console.log(
        '[DetalleTropa] /tropas/:id/detalle rows length:',
        rows.length
      );
      try {
        console.log(
          '[DetalleTropa] /tropas/:id/detalle sample rows:',
          rows.slice(0, 10).map((r) => ({
            id: r.id_tropa_detalle ?? r.id ?? r.id_detalle,
            id_cat_especie: r.id_cat_especie ?? r.id_cat,
            categoria_nombre: r.categoria_nombre ?? r.nombre ?? r.descripcion,
            cantidad: r.cantidad,
            id_especie: r.id_especie,
          }))
        );
      } catch (e) {
        console.log('[DetalleTropa] could not stringify rows sample', e);
      }
      const candidates = rows.filter((rr) => {
        try {
          const rrCatId =
            rr.id_cat_especie ??
            rr.id_cat ??
            rr.id_categoria ??
            rr.categoria_id ??
            null;
          const itemCatId = item.id_cat_especie ?? item.id_cat ?? null;
          const rrCatName =
            (rr.categoria_nombre ?? rr.nombre ?? rr.descripcion ?? '') + '';
          const itemCatName = (item.nombre ?? item.descripcion ?? '') + '';

          const sameCatId =
            rrCatId != null &&
            itemCatId != null &&
            String(rrCatId) === String(itemCatId);
          const sameCatName =
            itemCatName &&
            rrCatName &&
            String(rrCatName).toLowerCase().trim() ===
              String(itemCatName).toLowerCase().trim();

          const sameCantidad =
            item.cantidad != null &&
            String(rr.cantidad ?? '') === String(item.cantidad ?? '');

          // Prefer id match; if not available, allow name match. Require at least category match
          // and prefer matching cantidad when available.
          if (sameCatId) {
            if (item.cantidad != null) return sameCantidad;
            return true;
          }
          if (sameCatName) {
            if (item.cantidad != null) return sameCantidad;
            return true;
          }

          return false;
        } catch (e) {
          return false;
        }
      });

      console.log('[DetalleTropa] candidates length:', candidates.length);
      try {
        console.log(
          '[DetalleTropa] candidates sample:',
          candidates.slice(0, 10).map((c) => ({
            id: c.id_tropa_detalle ?? c.id ?? c.id_detalle,
            id_cat_especie: c.id_cat_especie ?? c.id_cat,
            categoria_nombre: c.categoria_nombre ?? c.nombre ?? c.descripcion,
            cantidad: c.cantidad,
            id_especie: c.id_especie,
          }))
        );
      } catch (e) {
        console.log('[DetalleTropa] could not stringify candidates sample', e);
      }
      if (candidates.length > 0) {
        ids = candidates
          .map((c) => c.id_tropa_detalle ?? c.id ?? c.id_detalle)
          .filter((v) => v !== undefined && v !== null);
      }

      // If we found nothing by strict match (cantidad/id/name), try a looser
      // match: collect all rows that belong to the same category (id or name)
      // and same especie. This handles the UI-aggregation case where multiple
      // DB rows were inserted separately and the frontend displays a single
      // aggregated row (sum of cantidades).
      if ((!ids || ids.length === 0) && rows.length > 0) {
        try {
          const loose = rows.filter((rr) => {
            try {
              const rrCatId =
                rr.id_cat_especie ??
                rr.id_cat ??
                rr.id_categoria ??
                rr.categoria_id ??
                null;
              const itemCatId = item.id_cat_especie ?? item.id_cat ?? null;
              const rrCatName =
                (rr.categoria_nombre ?? rr.nombre ?? rr.descripcion ?? '') + '';
              const itemCatName = (item.nombre ?? item.descripcion ?? '') + '';
              const rrEsp = String(
                rr.id_especie ?? rr.especie ?? rr.especie_nombre ?? ''
              );
              const itemEsp = String(
                item.id_especie ?? item.especie ?? item.especie_nombre ?? ''
              );

              const sameEspecie =
                rrEsp !== '' && itemEsp !== '' ? rrEsp === itemEsp : true;

              const matchById =
                rrCatId != null &&
                itemCatId != null &&
                String(rrCatId) === String(itemCatId);
              const matchByName =
                itemCatName &&
                rrCatName &&
                String(rrCatName).toLowerCase().trim() ===
                  String(itemCatName).toLowerCase().trim();

              return (matchById || matchByName) && sameEspecie;
            } catch (e) {
              return false;
            }
          });
          console.log('[DetalleTropa] loose match count:', loose.length);
          if (loose.length > 0) {
            ids = loose
              .map((c) => c.id_tropa_detalle ?? c.id ?? c.id_detalle)
              .filter((v) => v !== undefined && v !== null);
          }
        } catch (e) {
          console.warn('[DetalleTropa] loose match error', e?.message || e);
        }
      }
    } catch (e) {
      console.warn(
        '[DetalleTropa] Error fetching detalle for delete fallback',
        e?.message || e
      );
    }

    if (ids && ids.length > 0) {
      setConfirmDelete({
        id: null,
        ids,
        nombre: item.nombre ?? item.descripcion ?? '',
      });
      return;
    }

    // Nothing found: notify user
    showToast(
      'error',
      'No se encontró identificador para eliminar este elemento.'
    );
  };
  const cancelDelete = () =>
    setConfirmDelete({ id: null, ids: [], nombre: '' });
  const confirmDeleteNow = async () => {
    console.log('[DetalleTropa] confirmDeleteNow invoked', confirmDelete);
    const did = confirmDelete.id;
    const dids = Array.isArray(confirmDelete.ids) ? confirmDelete.ids : null;
    if (!did && (!dids || dids.length === 0)) return cancelDelete();

    try {
      const headers = { ...getTokenHeaders() };
      if (did) {
        await api.delete(`/tropas/tropa-detalle/${did}`, { headers });
      } else if (dids && dids.length > 0) {
        // delete sequentially to avoid overloading server and to handle partial failures
        for (const idRow of dids) {
          try {
            await api.delete(`/tropas/tropa-detalle/${idRow}`, { headers });
          } catch (e) {
            console.warn(
              '[DetalleTropa] Error eliminando fila',
              idRow,
              e?.message
            );
          }
        }
      }
      showToast('success', 'Detalle eliminado.');
      cancelDelete();
      await fetchDetalleAgrupado();
    } catch (e) {
      console.error('[DetalleTropa] Error confirmDeleteNow', e);
      showToast('error', 'No se pudo eliminar el detalle.');
    }
  };

  function addBufferRow() {
    if (!nuevoDetalle.id_cat_especie)
      return showToast('error', 'Seleccioná categoría.');
    const cantidadNum = Number(nuevoDetalle.cantidad || 0);
    if (Number.isNaN(cantidadNum) || cantidadNum <= 0)
      return showToast('error', 'Cantidad inválida.');

    const catalogoSnapshot =
      catalogoCategorias && catalogoCategorias.length > 0
        ? catalogoCategorias.slice()
        : null;
    const especieSnapshot = especieSeleccionada
      ? { value: especieSeleccionada.value, label: especieSeleccionada.label }
      : null;

    setBufferRows((s) => [
      ...s,
      {
        uid: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        id_cat_especie: Number.isFinite(Number(nuevoDetalle.id_cat_especie))
          ? Number(nuevoDetalle.id_cat_especie)
          : nuevoDetalle.id_cat_especie,
        cantidad: cantidadNum,
        especie: especieSnapshot,
        catalogo: catalogoSnapshot,
      },
    ]);

    setEspecieSeleccionada(null);
    setNuevoDetalle({ id_cat_especie: '', cantidad: '' });
  }

  const updateBufferRow = (uid, patch) =>
    setBufferRows((s) =>
      s.map((r) => (r.uid === uid ? { ...r, ...patch } : r))
    );
  const removeBufferRow = (uid) =>
    setBufferRows((s) => s.filter((r) => r.uid !== uid));

  const normalizeRow = (r) => {
    const idCatRaw = r.id_cat_especie ?? '';
    const idCatNum = idCatRaw === '' ? null : Number(idCatRaw);
    const cantidadRaw = r.cantidad;
    const cantidadNum =
      cantidadRaw === '' || cantidadRaw == null
        ? null
        : Number(String(cantidadRaw).replace(/\D/g, ''));
    return {
      id_cat_especie: Number.isFinite(idCatNum) ? idCatNum : null,
      cantidad: Number.isFinite(cantidadNum) ? cantidadNum : null,
    };
  };

  const saveBufferAll = async () => {
    if (!Array.isArray(bufferRows) || bufferRows.length === 0)
      return showToast('error', 'No hay detalle agregado para guardar.');

    const invalid = bufferRows.find(
      (r) =>
        r.id_cat_especie === '' ||
        r.id_cat_especie == null ||
        r.cantidad === '' ||
        r.cantidad == null ||
        Number.isNaN(Number(r.cantidad)) ||
        Number(r.cantidad) <= 0
    );
    if (invalid)
      return showToast(
        'error',
        'Completá categoría y cantidad válida en todas las filas.'
      );

    const detallesToSend = bufferRows
      .map((r) => {
        const id_cat_especie = Number.isFinite(Number(r.id_cat_especie))
          ? Number(r.id_cat_especie)
          : r.id_cat_especie;
        const cantidad = Number(r.cantidad);

        const resolvedEspecieId =
          r.especie && r.especie.value !== undefined
            ? Number.isFinite(Number(r.especie.value))
              ? Number(r.especie.value)
              : r.especie.value
            : especieSeleccionada
            ? Number.isFinite(Number(especieSeleccionada.value))
              ? Number(especieSeleccionada.value)
              : especieSeleccionada.value
            : null;

        return {
          id_especie:
            resolvedEspecieId != null ? Number(resolvedEspecieId) : null,
          id_cat_especie,
          cantidad,
        };
      })
      .filter(
        (d) =>
          d.id_especie != null &&
          d.id_cat_especie != null &&
          Number.isFinite(d.cantidad) &&
          d.cantidad > 0
      );

    if (detallesToSend.length === 0)
      return showToast('error', 'No hay detalles válidos para enviar.');

    try {
      try {
        console.log(
          '[DetalleTropa] Enviando array detalles:',
          JSON.stringify(detallesToSend)
        );
      } catch {
        console.log(
          '[DetalleTropa] Enviando array detalles (raw):',
          detallesToSend
        );
      }

      const headers = {
        'Content-Type': 'application/json',
        ...getTokenHeaders(),
      };
      const res = await api.post(`/tropas/${id}/detalle`, detallesToSend, {
        headers,
      });

      if (res && res.data && (res.data.error || res.data.mensaje)) {
        const msg =
          res.data.error || res.data.mensaje || JSON.stringify(res.data);
        showToast('error', `Error servidor: ${msg}`);
        return;
      }

      showToast('success', 'Detalle agregado.');
      setBufferRows([]);
      await fetchDetalleAgrupado();

      setTimeout(() => {
        try {
          const target = document.getElementById('animales-cargados');
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.animate(
              [
                { boxShadow: '0 0 0 0 rgba(34,197,94,0.0)' },
                { boxShadow: '0 0 0 6px rgba(34,197,94,0.18)' },
                { boxShadow: '0 0 0 0 rgba(34,197,94,0.0)' },
              ],
              { duration: 900 }
            );
          }
        } catch (e) {
          console.warn('No se pudo desplazar a animales cargados', e);
        }
      }, 120);
    } catch (err) {
      console.error('[DetalleTropa] error guardar buffer', err);
      let serverMsg = 'No se pudo guardar el detalle agregado.';
      if (err?.response?.data) {
        const body = err.response.data;
        if (typeof body === 'string') serverMsg = body;
        else if (body.error) serverMsg = body.error;
        else if (body.mensaje) serverMsg = body.mensaje;
        else serverMsg = JSON.stringify(body);
      } else if (err?.message) serverMsg = err.message;
      showToast('error', serverMsg);
    }
  };

  // Build grouped view by especie -> categorias (keeps rawRows)
  const speciesGroups = useMemo(() => {
    const rows = Array.isArray(detalle.categorias) ? detalle.categorias : [];
    const speciesMap = new Map();

    for (const r of rows) {
      const especieName =
        r.especie ?? r.nombre_especie ?? String(r.id_especie ?? 'Sin especie');
      const speciesKey = String(especieName || 'Sin especie');

      if (!speciesMap.has(speciesKey)) speciesMap.set(speciesKey, new Map());

      const catKey = String(
        r.id_cat_especie ??
          r.nombre ??
          r.descripcion ??
          r.id ??
          r.id_tropa_detalle ??
          ''
      );
      const catMap = speciesMap.get(speciesKey);

      const idTropaDetalle = r.id_tropa_detalle ?? r.id ?? r.id_detalle ?? null;
      const cantidad = Number(r.cantidad ?? r.remanente ?? 0);
      const nombre = r.nombre ?? r.descripcion ?? r.label ?? '';

      if (!catMap.has(catKey)) {
        catMap.set(catKey, {
          key: catKey,
          id_cat_especie: r.id_cat_especie ?? null,
          nombre,
          cantidad,
          especie: especieName,
          id_tropa_detalle: idTropaDetalle,
          rawRows: [r],
        });
      } else {
        const cur = catMap.get(catKey);
        cur.cantidad += cantidad;
        cur.rawRows.push(r);
        if (!cur.id_tropa_detalle && idTropaDetalle)
          cur.id_tropa_detalle = idTropaDetalle;
      }
    }

    const result = [];
    for (const [especie, catMap] of speciesMap.entries())
      result.push({ especie, categorias: Array.from(catMap.values()) });
    return result;
  }, [detalle]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-lg">Cargando detalle de tropa...</p>
      </div>
    );
  }

  const saveTropaChanges = async () => {
    try {
      setSavingTropa(true);
      const payload = {
        n_tropa: tropaEdicion.n_tropa,
        dte_dtu: tropaEdicion.dte_dtu,
        guia_policial: tropaEdicion.guia_policial,
        fecha_ingreso: tropaEdicion.fecha_ingreso,
        id_titular_faena: tropaEdicion.id_titular_faena,
        id_productor: tropaEdicion.id_productor,
        id_departamento: tropaEdicion.id_departamento,
        id_planta: tropaEdicion.id_planta,
      };

      await api.put(`/tropas/${id}`, payload, {
        headers: getTokenHeaders(),
      });

      showToast('success', 'Tropa actualizada correctamente');
      setEditingTropa(false);
      await fetchTropa();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.error || 'Error al actualizar la tropa';
      showToast('error', errorMsg);
    } finally {
      setSavingTropa(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Detalle de Tropa</h1>
          <button
            onClick={() => {
              if (editingTropa) {
                // Cancelar edición
                setEditingTropa(false);
              } else {
                // Entrar en modo edición (tropaEdicion ya está sincronizado con tropaInfo)
                setEditingTropa(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              editingTropa
                ? 'bg-gray-500 hover:bg-gray-600 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {editingTropa ? '✕ Cancelar' : '✏️ Editar'}
          </button>
        </div>

        {editingTropa ? (
          // FORMULARIO DE EDICIÓN
          <div className="bg-white rounded-xl shadow-md p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Editar Datos de Tropa</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-600 mb-2">Nº Tropa</label>
                <input
                  type="text"
                  value={tropaEdicion.n_tropa || ''}
                  onChange={(e) =>
                    setTropaEdicion((prev) => ({ ...prev, n_tropa: e.target.value }))
                  }
                  className={INPUT_BASE_CLASS}
                  placeholder="Ej. 1001"
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-600 mb-2">DTE/DTU</label>
                <input
                  type="text"
                  value={tropaEdicion.dte_dtu || ''}
                  onChange={(e) =>
                    setTropaEdicion((prev) => ({ ...prev, dte_dtu: e.target.value }))
                  }
                  className={INPUT_BASE_CLASS}
                  placeholder="Ej. 123456"
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Guía Policial
                </label>
                <input
                  type="text"
                  value={tropaEdicion.guia_policial || ''}
                  onChange={(e) =>
                    setTropaEdicion((prev) => ({
                      ...prev,
                      guia_policial: e.target.value,
                    }))
                  }
                  className={INPUT_BASE_CLASS}
                />
              </div>

              <div className="flex flex-col">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Fecha Ingreso
                </label>
                <input
                  type="date"
                  value={formatDateForInput(tropaEdicion.fecha_ingreso) || ''}
                  onChange={(e) =>
                    setTropaEdicion((prev) => ({
                      ...prev,
                      fecha_ingreso: e.target.value,
                    }))
                  }
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
                    tropaEdicion.id_departamento &&
                    departamentos.find(
                      (d) => String(d.id) === String(tropaEdicion.id_departamento)
                    )
                      ? {
                          value: tropaEdicion.id_departamento,
                          label:
                            departamentos.find(
                              (d) =>
                                String(d.id) === String(tropaEdicion.id_departamento)
                            )?.nombre || '',
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setTropaEdicion((prev) => ({
                      ...prev,
                      id_departamento: opt?.value || null,
                    }))
                  }
                  options={departamentos.map((d) => ({
                    value: d.id,
                    label: d.nombre,
                  }))}
                  placeholder="— Seleccionar departamento —"
                />
              </div>

              <SelectField
                label="Planta"
                value={
                  tropaEdicion.id_planta &&
                  plantas.find(
                    (p) => String(p.id) === String(tropaEdicion.id_planta)
                  )
                    ? {
                        value: tropaEdicion.id_planta,
                        label:
                          plantas.find(
                            (p) =>
                              String(p.id) === String(tropaEdicion.id_planta)
                          )?.nombre || '',
                      }
                    : null
                }
                onChange={(opt) => {
                  // Solo permitir cambio si es admin (rol 1)
                  if (usuario && usuario.rol === 1) {
                    setTropaEdicion((prev) => ({
                      ...prev,
                      id_planta: opt?.value || null,
                    }));
                  }
                }}
                options={plantas.map((p) => ({
                  value: p.id,
                  label: p.nombre,
                }))}
                placeholder="— Seleccionar planta —"
                isDisabled={!usuario || (usuario.rol !== 1 && usuario.rol !== '1')}
              />

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
                    tropaEdicion.id_productor &&
                    productores.find(
                      (p) => String(p.id) === String(tropaEdicion.id_productor)
                    )
                      ? {
                          value: tropaEdicion.id_productor,
                          label:
                            productores.find(
                              (p) =>
                                String(p.id) === String(tropaEdicion.id_productor)
                            )?.nombre || '',
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setTropaEdicion((prev) => ({
                      ...prev,
                      id_productor: opt?.value || null,
                    }))
                  }
                  options={productores.map((p) => ({
                    value: p.id,
                    label: p.nombre,
                  }))}
                  placeholder="— Seleccionar productor —"
                />
              </div>

              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-0.5">
                  <label className="font-semibold text-gray-700 text-sm">
                    Titular de Faena
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
                    tropaEdicion.id_titular_faena &&
                    titulares.find(
                      (t) => String(t.id) === String(tropaEdicion.id_titular_faena)
                    )
                      ? {
                          value: tropaEdicion.id_titular_faena,
                          label:
                            titulares.find(
                              (t) =>
                                String(t.id) === String(tropaEdicion.id_titular_faena)
                            )?.nombre || '',
                        }
                      : null
                  }
                  onChange={(opt) =>
                    setTropaEdicion((prev) => ({
                      ...prev,
                      id_titular_faena: opt?.value || null,
                    }))
                  }
                  options={titulares.map((t) => ({
                    value: t.id,
                    label: t.nombre,
                  }))}
                  placeholder="— Seleccionar titular —"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => {
                  setTropaEdicion(tropaInfo);
                  setEditingTropa(false);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={saveTropaChanges}
                disabled={savingTropa}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {savingTropa ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        ) : (
          // VISTA DE LECTURA
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-md p-4">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Planta
                </label>
                <input
                  type="text"
                  value={
                    typeof tropaInfo.planta === 'object'
                      ? tropaInfo.planta?.nombre || ''
                      : tropaInfo.planta || ''
                  }
                  disabled
                  className={INPUT_BASE_CLASS}
                />
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Productor
                </label>
                <input
                  type="text"
                  value={tropaInfo.productor || ''}
                  disabled
                  className={INPUT_BASE_CLASS}
                />
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Departamento
                </label>
                <input
                  type="text"
                  value={tropaInfo.departamento || ''}
                  disabled
                  className={INPUT_BASE_CLASS}
                />
              </div>
              <div className="bg-white rounded-xl shadow-md p-4">
                <label className="block text-sm font-semibold text-gray-600 mb-1">
                  Guía Policial
                </label>
                <input
                  type="text"
                  value={tropaInfo.guia_policial || ''}
                  disabled
                  className={INPUT_BASE_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Nº Tropa', value: tropaInfo.n_tropa },
                {
                  label: 'Fecha Ingreso',
                  value: formatDateFromDB(tropaInfo.fecha_ingreso),
                },
                { label: 'DTE/DTU', value: tropaInfo.dte_dtu },
                { label: 'Titular', value: tropaInfo.titular },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl shadow-md p-4">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    {label}
                  </label>
                  <input
                    type="text"
                    value={value || ''}
                    disabled
                    className={INPUT_BASE_CLASS}
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <div
          id="animales-cargados"
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Animales cargados
          </h2>

          {!speciesGroups || speciesGroups.length === 0 ? (
            <p className="text-gray-500 text-center">
              No se han registrado animales en esta tropa.
            </p>
          ) : (
            <>
              {speciesGroups.map((species) => {
                const totalForSpecies = species.categorias.reduce(
                  (acc, i) => acc + (Number(i.cantidad) || 0),
                  0
                );
                return (
                  <div key={species.especie} className="mb-6">
                    <h3 className="text-base font-semibold text-gray-700 mb-3">
                      {species.especie}
                    </h3>

                    <div className="sm:hidden space-y-4">
                      {species.categorias.map((item) => {
                        const itemId = resolveIdFromItem(item) ?? item.key;
                        const isEditing =
                          editing.id && String(editing.id) === String(itemId);
                        return (
                          <div
                            key={item.key}
                            className="space-y-2 bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-base font-semibold text-gray-700">
                                  {item.nombre || item.key}
                                </h4>
                                <div className="text-xs text-gray-500">
                                  Cant: {item.cantidad}
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEdit({
                                      ...item,
                                      id_tropa_detalle: item.id_tropa_detalle,
                                      rawRows: item.rawRows,
                                    })
                                  }
                                  className="px-3 py-1 bg-yellow-500 text-white rounded text-xs font-medium hover:bg-yellow-600"
                                >
                                  Editar
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openConfirmDelete({
                                      ...item,
                                      id_tropa_detalle: item.id_tropa_detalle,
                                      rawRows: item.rawRows,
                                    })
                                  }
                                  className="px-3 py-1 bg-red-600 text-white rounded text-xs font-medium hover:bg-red-700"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>

                            {isEditing && (
                              <div className="pt-2 border-t border-gray-200 flex flex-col gap-2">
                                <SelectField
                                  label="Especie (editar)"
                                  value={
                                    especiesOptions.find(
                                      (o) =>
                                        String(o.value) ===
                                        String(editing.id_especie)
                                    ) || null
                                  }
                                  onChange={(opt) =>
                                    setEditing((s) => ({
                                      ...s,
                                      id_especie: opt?.value ?? null,
                                    }))
                                  }
                                  options={especiesOptions}
                                  placeholder="— Seleccionar especie —"
                                  isClearable={false}
                                />
                                <SelectField
                                  label="Categoría"
                                  selectKey={editing.selectKey}
                                  value={
                                    editing.selectedCategory
                                      ? editing.selectedCategory
                                      : (editCategoryOptions &&
                                        editCategoryOptions.length > 0
                                          ? editCategoryOptions
                                          : categoryOptions
                                        ).find(
                                          (o) =>
                                            String(o.value) ===
                                            String(editing.id_cat_especie)
                                        ) || null
                                  }
                                  onChange={(opt) =>
                                    setEditing((s) => ({
                                      ...s,
                                      id_cat_especie: opt?.value ?? '',
                                      selectedCategory: opt ?? null,
                                    }))
                                  }
                                  options={
                                    editCategoryOptions.length > 0
                                      ? editCategoryOptions
                                      : categoryOptions
                                  }
                                  placeholder="— Seleccionar categoría —"
                                  isDisabled={!editing.id_especie}
                                />
                                <input
                                  className={`${INPUT_BASE_CLASS} text-gray-800`}
                                  value={editing.remanente}
                                  onChange={(e) =>
                                    setEditing((s) => ({
                                      ...s,
                                      remanente: onlyDigits(e.target.value),
                                    }))
                                  }
                                  inputMode="numeric"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={cancelEdit}
                                    type="button"
                                    className="px-3 py-1 rounded border text-sm"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={saveEdit}
                                    type="button"
                                    className="px-3 py-1 rounded bg-green-700 text-white text-sm hover:bg-green-800"
                                  >
                                    Guardar
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <div className="bg-gray-100 rounded-lg p-3 flex justify-between items-center font-bold text-sm">
                        <span>TOTAL</span>
                        <span>{totalForSpecies}</span>
                      </div>
                    </div>

                    <div className="hidden sm:block space-y-4">
                      <div className="bg-white rounded-lg shadow-sm p-3 border">
                        <div className="overflow-x-auto">
                          <table className="min-w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                                  Categoría
                                </th>
                                <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                                  Cantidad
                                </th>
                                <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">
                                  Acciones
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {species.categorias.map((item) => {
                                const itemId =
                                  resolveIdFromItem(item) ?? item.key;
                                const isEditing =
                                  editing.id &&
                                  String(editing.id) === String(itemId);
                                return (
                                  <tr
                                    key={item.key}
                                    className="border-t border-gray-200"
                                  >
                                    <td className="px-4 py-2 text-sm text-gray-800">
                                      {isEditing ? (
                                        <div className="space-y-2">
                                          <SelectField
                                            label="Especie (editar)"
                                            value={
                                              especiesOptions.find(
                                                (o) =>
                                                  String(o.value) ===
                                                  String(editing.id_especie)
                                              ) || null
                                            }
                                            onChange={(opt) =>
                                              setEditing((s) => ({
                                                ...s,
                                                id_especie: opt?.value ?? null,
                                              }))
                                            }
                                            options={especiesOptions}
                                            placeholder="— Seleccionar especie —"
                                            isClearable={false}
                                          />
                                          <SelectField
                                            selectKey={editing.selectKey}
                                            value={
                                              editing.selectedCategory
                                                ? editing.selectedCategory
                                                : (editCategoryOptions &&
                                                  editCategoryOptions.length > 0
                                                    ? editCategoryOptions
                                                    : categoryOptions
                                                  ).find(
                                                    (o) =>
                                                      String(o.value) ===
                                                      String(
                                                        editing.id_cat_especie
                                                      )
                                                  ) || null
                                            }
                                            onChange={(opt) =>
                                              setEditing((s) => ({
                                                ...s,
                                                id_cat_especie:
                                                  opt?.value ?? '',
                                                selectedCategory: opt ?? null,
                                              }))
                                            }
                                            options={
                                              editCategoryOptions.length > 0
                                                ? editCategoryOptions
                                                : categoryOptions
                                            }
                                            placeholder="— Seleccionar categoría —"
                                            isDisabled={!editing.id_especie}
                                          />
                                        </div>
                                      ) : (
                                        item.nombre || item.key
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">
                                      {isEditing ? (
                                        <input
                                          className={`${INPUT_BASE_CLASS} w-24 text-right`}
                                          value={editing.remanente}
                                          onChange={(e) =>
                                            setEditing((s) => ({
                                              ...s,
                                              remanente: onlyDigits(
                                                e.target.value
                                              ),
                                            }))
                                          }
                                          inputMode="numeric"
                                        />
                                      ) : (
                                        item.cantidad
                                      )}
                                    </td>
                                    <td className="px-4 py-2 text-center">
                                      {isEditing ? (
                                        <div className="flex justify-center gap-2">
                                          <button
                                            onClick={cancelEdit}
                                            type="button"
                                            className="px-3 py-1 border rounded text-sm"
                                          >
                                            Cancelar
                                          </button>
                                          <button
                                            onClick={saveEdit}
                                            type="button"
                                            className="px-3 py-1 bg-green-700 text-white rounded text-sm hover:bg-green-800"
                                          >
                                            Guardar
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex justify-center gap-2">
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openEdit({
                                                ...item,
                                                id_tropa_detalle:
                                                  item.id_tropa_detalle,
                                                rawRows: item.rawRows,
                                              })
                                            }
                                            className="px-3 py-1 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"
                                          >
                                            Editar
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() =>
                                              openConfirmDelete({
                                                ...item,
                                                id_tropa_detalle:
                                                  item.id_tropa_detalle,
                                                rawRows: item.rawRows,
                                              })
                                            }
                                            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                                          >
                                            Eliminar
                                          </button>
                                        </div>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                              <tr className="bg-gray-100 font-bold text-sm">
                                <td className="px-4 py-2">
                                  TOTAL {species.especie}
                                </td>
                                <td className="px-4 py-2 text-right">
                                  {totalForSpecies}
                                </td>
                                <td className="px-4 py-2" />
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Cargar Detalle por Especie
          </h2>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <SelectField
                label="Especie"
                value={especieSeleccionada}
                onChange={(opt) => {
                  setEspecieSeleccionada(opt || null);
                  setNuevoDetalle({ id_cat_especie: '', cantidad: '' });
                }}
                options={especiesOptions}
                placeholder="— Seleccionar especie —"
                isClearable
              />
              <SelectField
                label="Categoría"
                value={
                  catalogoCategorias.find(
                    (c) =>
                      String(c.value) === String(nuevoDetalle.id_cat_especie)
                  ) || null
                }
                onChange={(opt) =>
                  setNuevoDetalle((s) => ({
                    ...s,
                    id_cat_especie: opt?.value ?? '',
                  }))
                }
                options={
                  catalogoCategorias.length > 0
                    ? catalogoCategorias
                    : categoryOptions
                }
                placeholder="— Seleccionar categoría —"
                isDisabled={!especieSeleccionada}
              />
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  value={nuevoDetalle.cantidad}
                  onChange={(e) =>
                    setNuevoDetalle((s) => ({
                      ...s,
                      cantidad: onlyDigits(e.target.value),
                    }))
                  }
                  placeholder="0"
                  className={INPUT_BASE_CLASS}
                  disabled={!especieSeleccionada}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={addBufferRow}
                className="px-4 py-2 bg-green-700 text-white rounded text-sm hover:bg-green-800"
                disabled={!especieSeleccionada}
              >
                Agregar al detalle
              </button>
            </div>

            {bufferRows.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Detalle agregado
                </h3>
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full bg-white rounded-xl border">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                          Especie
                        </th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                          Categoría
                        </th>
                        <th className="px-4 py-2 text-right text-sm font-semibold text-gray-700">
                          Cantidad
                        </th>
                        <th className="px-4 py-2 text-center text-sm font-semibold text-gray-700">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bufferRows.map((r) => (
                        <tr key={r.uid} className="border-t border-gray-200">
                          <td className="px-4 py-2">
                            <SelectField
                              label={null}
                              value={
                                especiesOptions.find(
                                  (o) =>
                                    String(o.value) === String(r.especie?.value)
                                ) ||
                                (r.especie
                                  ? {
                                      value: r.especie.value,
                                      label: r.especie.label,
                                    }
                                  : null)
                              }
                              onChange={(opt) =>
                                updateBufferRow(r.uid, {
                                  especie: opt
                                    ? { value: opt.value, label: opt.label }
                                    : null,
                                })
                              }
                              options={especiesOptions}
                              placeholder="— Seleccionar especie —"
                            />
                          </td>
                          <td className="px-4 py-2">
                            <SelectField
                              value={
                                (r.catalogo && r.catalogo.length > 0
                                  ? r.catalogo
                                  : catalogoCategorias.length > 0
                                  ? catalogoCategorias
                                  : categoryOptions
                                ).find(
                                  (o) =>
                                    String(o.value) === String(r.id_cat_especie)
                                ) || null
                              }
                              onChange={(opt) =>
                                updateBufferRow(r.uid, {
                                  id_cat_especie: opt?.value ?? '',
                                })
                              }
                              options={
                                r.catalogo && r.catalogo.length > 0
                                  ? r.catalogo
                                  : catalogoCategorias.length > 0
                                  ? catalogoCategorias
                                  : categoryOptions
                              }
                              placeholder="— Seleccionar categoría —"
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <input
                              className={`${INPUT_BASE_CLASS} w-24 text-right`}
                              type="text"
                              inputMode="numeric"
                              value={r.cantidad ?? 0}
                              onChange={(e) =>
                                updateBufferRow(r.uid, {
                                  cantidad:
                                    e.target.value === ''
                                      ? ''
                                      : Number(
                                          String(e.target.value).replace(
                                            /\D/g,
                                            ''
                                          )
                                        ),
                                })
                              }
                            />
                          </td>
                          <td className="px-4 py-2 text-center">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => removeBufferRow(r.uid)}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                              >
                                Eliminar
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="sm:hidden space-y-2">
                  {bufferRows.map((r) => (
                    <div
                      key={r.uid}
                      className="bg-gray-50 rounded-lg shadow p-3 flex flex-col gap-2"
                    >
                      <SelectField
                        label="Especie"
                        value={
                          especiesOptions.find(
                            (o) => String(o.value) === String(r.especie?.value)
                          ) ||
                          (r.especie
                            ? { value: r.especie.value, label: r.especie.label }
                            : null)
                        }
                        onChange={(opt) =>
                          updateBufferRow(r.uid, {
                            especie: opt
                              ? { value: opt.value, label: opt.label }
                              : null,
                          })
                        }
                        options={especiesOptions}
                        placeholder="— Seleccionar especie —"
                      />
                      <SelectField
                        value={
                          (r.catalogo && r.catalogo.length > 0
                            ? r.catalogo
                            : catalogoCategorias.length > 0
                            ? catalogoCategorias
                            : categoryOptions
                          ).find(
                            (o) => String(o.value) === String(r.id_cat_especie)
                          ) || null
                        }
                        onChange={(opt) =>
                          updateBufferRow(r.uid, {
                            id_cat_especie: opt?.value ?? '',
                          })
                        }
                        options={
                          r.catalogo && r.catalogo.length > 0
                            ? r.catalogo
                            : catalogoCategorias.length > 0
                            ? catalogoCategorias
                            : categoryOptions
                        }
                        placeholder="— Seleccionar categoría —"
                      />
                      <input
                        className={`${INPUT_BASE_CLASS}`}
                        type="text"
                        inputMode="numeric"
                        value={r.cantidad ?? 0}
                        onChange={(e) =>
                          updateBufferRow(r.uid, {
                            cantidad:
                              e.target.value === ''
                                ? ''
                                : Number(
                                    String(e.target.value).replace(/\D/g, '')
                                  ),
                          })
                        }
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => removeBufferRow(r.uid)}
                          className="px-3 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 bg-green-700 text-white rounded text-sm hover:bg-green-800"
                    onClick={saveBufferAll}
                  >
                    Guardar detalle agregado
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 border rounded text-sm"
                    onClick={() => setBufferRows([])}
                  >
                    Limpiar detalle agregado
                  </button>
                </div>
              </div>
            )}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>

        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => {
              window.scrollTo(0, 0);
              navigate('/tropa');
            }}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Volver a ingresar tropa
          </button>
        </div>
      </div>

      {(confirmDelete.id ||
        (Array.isArray(confirmDelete.ids) && confirmDelete.ids.length > 0)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-30"
            onClick={cancelDelete}
          />
          <div className="relative bg-white rounded-lg shadow-lg p-6 w-full max-w-md z-10">
            <h3 className="text-lg font-semibold mb-3">
              Confirmar eliminación
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              {Array.isArray(confirmDelete.ids) &&
              confirmDelete.ids.length > 0 ? (
                <>
                  ¿Eliminar {confirmDelete.ids.length} filas de "
                  {confirmDelete.nombre}" de la tropa? Esta acción no se puede
                  deshacer.
                </>
              ) : (
                <>
                  ¿Eliminar "{confirmDelete.nombre}" de la tropa? Esta acción no
                  se puede deshacer.
                </>
              )}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={cancelDelete}
                type="button"
                className="px-4 py-2 border rounded"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteNow}
                type="button"
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

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

      <AppNotification
        show={Boolean(toast)}
        message={toast?.text || ''}
        type={toast?.type === 'success' ? 'success' : 'error'}
        onClose={() => setToast(null)}
        errorTitle="Atencion"
      />
    </div>
  );
}

// components/AltaDepartamento.jsx
import { useState } from 'react';
import api from '../services/api.js'; // ajustar la ruta si hace falta
import AppNotification from './AppNotification';

export default function AltaDepartamento({
  provinciasDB = [],
  onDepartamentoAgregado,
}) {
  const [provinciaIdSeleccionada, setProvinciaIdSeleccionada] = useState('');
  const [departamentoInput, setDepartamentoInput] = useState('');
  const [mensajeFeedback, setMensajeFeedback] = useState('');

  const agregarDepartamento = async () => {
    const nombre = departamentoInput.trim();

    if (
      !provinciaIdSeleccionada ||
      isNaN(parseInt(provinciaIdSeleccionada, 10)) ||
      !nombre
    ) {
      setMensajeFeedback('❌ Completá ambos campos correctamente.');
      setTimeout(() => setMensajeFeedback(''), 4000);
      return;
    }

    try {
      const payload = {
        nombre_departamento: nombre,
        id_provincia: Number(provinciaIdSeleccionada),
      };

      // Usar el cliente central `api` (baseURL ya configurada)
      const res = await api.post('/departamentos', payload);
      const data = res.data;

      // Éxito
      setMensajeFeedback('✅ Departamento agregado correctamente.');
      setProvinciaIdSeleccionada('');
      setDepartamentoInput('');
      if (onDepartamentoAgregado) onDepartamentoAgregado(data);
    } catch (err) {
      console.error('Error creando departamento:', err);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'Error de conexión con el servidor.';
      setMensajeFeedback(`❌ ${msg}`);
    } finally {
      setTimeout(() => setMensajeFeedback(''), 4000);
    }
  };

  return (
    <div className="space-y-4">
      <AppNotification
        show={Boolean(mensajeFeedback)}
        message={mensajeFeedback}
        type={mensajeFeedback.includes('✅') ? 'success' : 'error'}
        onClose={() => setMensajeFeedback('')}
        errorTitle="Atencion"
      />

      <h2 className="text-lg font-semibold">Agregar nuevo departamento</h2>

      <div>
        <label htmlFor="provincia" className="block mb-1 font-medium">
          Seleccioná una provincia
        </label>
        <select
          id="provincia"
          value={provinciaIdSeleccionada}
          onChange={(e) => setProvinciaIdSeleccionada(e.target.value)}
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Seleccioná --</option>
          {provinciasDB.map((p) => (
            <option key={p.id_provincia} value={p.id_provincia}>
              {p.descripcion}
            </option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={departamentoInput}
        onChange={(e) => setDepartamentoInput(e.target.value)}
        placeholder="Nombre del departamento..."
        className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
      />

      <button
        onClick={agregarDepartamento}
        disabled={!provinciaIdSeleccionada || !departamentoInput.trim()}
        className={`px-4 py-2 rounded text-white ${
          !provinciaIdSeleccionada || !departamentoInput.trim()
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        Agregar
      </button>
    </div>
  );
}

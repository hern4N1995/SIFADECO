import React, { useEffect, useState } from 'react';

export default function CategoriaEspecieAdmin() {
  const [categorias, setCategorias] = useState([]);
  const [especies, setEspecies] = useState([]);
  const [form, setForm] = useState({ descripcion: '', id_especie: '' });
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const getTokenHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchCategorias();
    fetchEspecies();
  }, []);

  const fetchCategorias = async () => {
    try {
      const res = await fetch('/categorias-especie', {
        headers: getTokenHeaders(),
      });
      const data = await res.json();
      setCategorias(data);
    } catch {
      setCategorias([]);
    }
  };

  const fetchEspecies = async () => {
    try {
      const res = await fetch('/especies', { headers: getTokenHeaders() });
      const data = await res.json();
      setEspecies(data);
    } catch {
      setEspecies([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const resetForm = () => {
    setForm({ descripcion: '', id_especie: '' });
    setEditandoId(null);
    setMensaje('');
    setError('');
  };

  const guardarCategoria = async () => {
    setMensaje('');
    setError('');

    if (!form.descripcion || !form.id_especie) {
      setError('Todos los campos son obligatorios');
      return;
    }

    const payload = {
      descripcion: form.descripcion.trim(),
      id_especie: parseInt(form.id_especie),
    };

    const url = editandoId
      ? `/categorias-especie/${editandoId}`
      : '/categorias-especie';
    const method = editandoId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getTokenHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error();
      await fetchCategorias();
      resetForm();
      setMensaje(editandoId ? 'Categoría actualizada' : 'Categoría registrada');
    } catch {
      setError('No se pudo guardar la categoría');
    }
  };

  const iniciarEdicion = (c) => {
    setForm({ descripcion: c.descripcion, id_especie: c.id_especie });
    setEditandoId(c.id_cat_especie);
    setMensaje('');
    setError('');
  };

  const eliminarCategoria = async (id) => {
    if (!window.confirm('¿Eliminar esta categoría de forma lógica?')) return;

    try {
      const res = await fetch(`/categorias-especie/${id}`, {
        method: 'DELETE',
        headers: getTokenHeaders(),
      });

      if (!res.ok) throw new Error();
      await fetchCategorias();
      setMensaje('Categoría eliminada correctamente');
    } catch {
      setError('No se pudo eliminar la categoría');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6">
      <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow ring-1 ring-slate-200 mb-8">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          {editandoId ? 'Modificar categoría' : 'Registrar nueva categoría'}
        </h2>

        <div className="space-y-4">
          <input
            type="text"
            name="descripcion"
            placeholder="Descripción"
            value={form.descripcion}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />

          <select
            name="id_especie"
            value={form.id_especie}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Seleccione especie</option>
            {especies.map((e) => (
              <option key={e.id_especie} value={e.id_especie}>
                {e.descripcion}
              </option>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={guardarCategoria}
              className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 font-semibold"
            >
              {editandoId ? 'Actualizar' : 'Guardar'}
            </button>
            {editandoId && (
              <button
                onClick={resetForm}
                className="px-4 py-2 bg-slate-500 text-white rounded hover:bg-slate-600 font-semibold"
              >
                Cancelar
              </button>
            )}
          </div>

          {(mensaje || error) && (
            <p
              className={`text-sm ${
                mensaje ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {mensaje || error}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow ring-1 ring-slate-200">
        <h2 className="text-lg font-semibold text-slate-700 mb-4">
          Categorías registradas
        </h2>

        <table className="w-full text-sm text-left text-slate-700">
          <thead className="bg-green-700 text-white text-xs uppercase">
            <tr>
              <th className="px-4 py-2">ID</th>
              <th className="px-4 py-2">Descripción</th>
              <th className="px-4 py-2">Especie</th>
              <th className="px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((c) => (
              <tr key={c.id_cat_especie} className="border-b last:border-b-0">
                <td className="px-4 py-2">{c.id_cat_especie}</td>
                <td className="px-4 py-2">{c.descripcion}</td>
                <td className="px-4 py-2">{c.especie}</td>
                <td className="px-4 py-2 space-x-2">
                  <button
                    onClick={() => iniciarEdicion(c)}
                    className="px-2 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Modificar
                  </button>
                  <button
                    onClick={() => eliminarCategoria(c.id_cat_especie)}
                    className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

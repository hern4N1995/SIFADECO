import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

const EnfermedadesDecomisoPage = () => {
  const { id_decomiso } = useParams();
  const [enfermedades, setEnfermedades] = useState([]);
  const [seleccionados, setSeleccionados] = useState({});

  useEffect(() => {
    const fetchEnfermedades = async () => {
      const res = await fetch('/enfermedades-con-organos');
      const data = await res.json();
      setEnfermedades(data);
    };
    fetchEnfermedades();
  }, []);

  const toggleOrgano = (id_enfermedad, id_organo) => {
    setSeleccionados((prev) => {
      const clave = `${id_enfermedad}-${id_organo}`;
      const nuevo = { ...prev };
      if (nuevo[clave]) {
        delete nuevo[clave];
      } else {
        nuevo[clave] = true;
      }
      return nuevo;
    });
  };

  const handleGuardar = async () => {
    const payload = Object.keys(seleccionados).map((clave) => {
      const [id_enfermedad, id_organo] = clave.split('-');
      return {
        id_decomiso,
        id_enfermedad: parseInt(id_enfermedad),
        id_organo: parseInt(id_organo),
      };
    });

    await fetch('/decomiso/enfermedades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    alert('Enfermedades registradas correctamente');
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded-xl">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
        🩺 Seleccionar Enfermedades y Órganos Afectados
      </h2>
      {enfermedades.map((enf) => (
        <div key={enf.id_enfermedad} className="mb-6">
          <h3 className="font-semibold text-green-700">{enf.descripcion}</h3>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {enf.organos.map((org) => {
              const clave = `${enf.id_enfermedad}-${org.id_organo}`;
              return (
                <label
                  key={org.id_organo}
                  className="flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    checked={!!seleccionados[clave]}
                    onChange={() =>
                      toggleOrgano(enf.id_enfermedad, org.id_organo)
                    }
                  />
                  <span>{org.nombre}</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
      <div className="text-right mt-6">
        <button
          onClick={handleGuardar}
          className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800 font-semibold"
        >
          Guardar Enfermedades
        </button>
      </div>
    </div>
  );
};

export default EnfermedadesDecomisoPage;

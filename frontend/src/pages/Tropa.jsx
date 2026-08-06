import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TropaForm from '../components/TropaForm.jsx';
import api from '../services/api.js';

export default function Tropa() {
  const [tropas, setTropas] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get('/tropas')
      .then((res) => setTropas(res.data))
      .catch((err) => console.error('Error al obtener tropas:', err));
  }, []);

  const handleCreated = (id_tropa) => {
    navigate(`/tropas-cargadas/modificar/${id_tropa}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-6 sm:py-8 px-3 sm:px-4 lg:px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 text-center drop-shadow mb-8">
          🐄 Ingreso de Tropas
        </h1>

        {/* <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 mb-8 sm:mb-10 border border-gray-100 hover:shadow-2xl transition-shadow duration-300"> */}
        <TropaForm onCreated={handleCreated} />
        {/* </div> */}
      </div>
    </div>
  );
}

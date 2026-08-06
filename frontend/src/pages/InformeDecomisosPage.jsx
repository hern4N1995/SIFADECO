import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HiArrowLeft } from 'react-icons/hi2';

export default function InformeDecomisosPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header con botón volver */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate('/informes')}
            className="p-2 rounded-lg bg-white shadow-md hover:shadow-lg transition text-gray-700"
          >
            <HiArrowLeft size={24} />
          </button>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-800">
            📊 Informe de Decomisos
          </h1>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-10">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Informe de Decomisos
            </h2>
            <p className="text-gray-600 text-lg mb-6">
              Los datos del resumen de decomisos se mostrarán aquí
            </p>
            <div className="bg-red-50 rounded-lg p-6 max-w-2xl">
              <p className="text-gray-700">
                Esta página mostrará estadísticas y resumen de:
              </p>
              <ul className="mt-4 space-y-2 text-left text-gray-700">
                <li>✓ Cantidad total de decomisos</li>
                <li>✓ Decomisos por motivo</li>
                <li>✓ Decomisos por faena</li>
                <li>✓ Partes decomisadas</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

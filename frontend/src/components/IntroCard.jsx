// src/components/IntroCard.jsx
import React from "react";

const IntroCard = () => {
  return (
    <section className="bg-white shadow-md rounded-lg p-6 max-w-4xl mx-auto my-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">
        Portal de Gestión de Faena y Decomisos
      </h2>
      <p className="text-gray-700 mb-4">
        Este sistema permite registrar y visualizar información sobre las tropas animales que ingresan a establecimientos para ser faenadas. 
        Lleva el control del número de animales faenados, los decomisos realizados y los motivos sanitarios involucrados.
      </p>
      <ul className="list-disc list-inside text-gray-700 mb-4">
        <li>Registro por tipo y categoría de animal</li>
        <li>Control sanitario y trazabilidad por establecimiento</li>
        <li>Visualización de datos con gráficos integrados como Power BI</li>
        <li>Interfaz alineada con el estilo institucional del Gobierno de Corrientes</li>
      </ul>
      <p className="text-gray-600 italic">
        Una herramienta clave para mejorar la toma de decisiones y fortalecer la sanidad animal.
      </p>
    </section>
  );
};

export default IntroCard;

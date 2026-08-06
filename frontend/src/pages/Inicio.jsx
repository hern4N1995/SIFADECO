import React from 'react';
import IntroCard from '../components/IntroCard';

export default function Inicio() {
  const cards = [
    {
      title: 'Faena',
      text: 'Registrá las faenas y frigoríficos activos de forma rápida y segura.',
      icon: '🥩',
    },
    {
      title: 'Decomisos',
      text: 'Controlá decomisos realizados con trazabilidad y precisión.',
      icon: '📦',
    },
    {
      title: 'Remanentes',
      text: 'Visualizá los remanentes de cada jornada en tiempo real.',
      icon: '📊',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center text-center text-white overflow-hidden">
        <div
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: 'url("/png/portada.png")' }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary opacity-85 z-10"></div>

        <div className="relative z-20 max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight drop-shadow-lg">
            SIFADECO
          </h1>
          <p className="mt-4 text-xl md:text-2xl max-w-2xl mx-auto drop-shadow-md">
            Sistema Integral de Gestión de Faenas & Decomisos
          </p>
          <p className="mt-2 text-base md:text-lg opacity-90 drop-shadow-sm">
            Desarrollado por el Área de Sistemas del Ministerio de Producción de
            Corrientes
          </p>
        </div>
      </section>

      {/* IntroCard */}
      <IntroCard />

      {/* Cards */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cards.map(({ title, text, icon }) => (
            <div
              key={title}
              className="group bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6 flex flex-col items-center text-center border border-gray-100 hover:border-green-300"
            >
              <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                {icon}
              </div>
              <h2 className="text-xl font-semibold text-primary mb-2">
                {title}
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

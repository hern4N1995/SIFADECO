import React from 'react';

const features = [
  {
    icon: '/icons/dashboard.svg',
    title: 'Dashboard',
    desc: 'Visualiza métricas en tiempo real'
  },
  {
    icon: '/icons/compliance.svg',
    title: 'Decomisos',
    desc: 'Registra y consulta decomisos'
  },
  {
    icon: '/icons/analytics.svg',
    title: 'Faena',
    desc: 'Monitorea procesos de faena'
  },
  {
    icon: '/icons/reports.svg',
    title: 'Remanentes',
    desc: 'Gestiona remanentes'
  }
];

export default function FeatureCards() {
  return (
    <section className="features">
      {features.map(f => (
        <div className="card" key={f.title}>
          <img src={f.icon} alt={f.title} />
          <h3>{f.title}</h3>
          <p>{f.desc}</p>
        </div>
      ))}
    </section>
  );
}

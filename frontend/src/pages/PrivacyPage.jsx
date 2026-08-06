import React, { useEffect } from 'react';

export default function PrivacyPage() {
  // Scroll to top al montar
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Año dinámico
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-5xl mx-auto">
        {/* Encabezado */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Sistema de Faenas y Decomisos - Política de Privacidad
          </h1>
          <p className="text-sm text-slate-500">
            Última actualización: {new Date().toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 space-y-8">
          <section className="border-l-4 border-green-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              1. Introducción
            </h2>
            <p className="text-slate-700 leading-relaxed">
              El Ministerio de Producción de Corrientes se compromete a proteger
              la privacidad de los datos personales de los usuarios del Sistema
              de Faenas. Esta política de privacidad describe cómo recopilamos,
              utilizamos y protegemos la información que usted proporciona.
            </p>
          </section>

          <section className="border-l-4 border-blue-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              2. Información que Recopilamos
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Recopilamos la siguiente información:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>
                <strong>Información de registro:</strong> nombre, apellido, email, contraseña
              </li>
              <li>
                <strong>Información sobre faenas:</strong> datos de tropas, especies, etc.
              </li>
              <li>
                <strong>Información de sesión:</strong> dirección IP, navegador utilizado, hora de acceso
              </li>
              <li>
                <strong>Información de actividad:</strong> registros de cambios y modificaciones
              </li>
            </ul>
          </section>

          <section className="border-l-4 border-purple-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              3. Cómo Utilizamos Su Información
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Utilizamos la información recopilada para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>Proporcionar y mantener el Sistema de Faenas</li>
              <li>Verificar su identidad y autenticar su acceso</li>
              <li>Generar informes y estadísticas sobre faenas</li>
              <li>Cumplir con regulaciones y normativas legales</li>
              <li>Mejorar la seguridad y rendimiento del sistema</li>
              <li>Comunicarnos sobre cambios importantes en el servicio</li>
            </ul>
          </section>

          <section className="border-l-4 border-red-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              4. Protección de Datos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Implementamos medidas técnicas y organizativas para proteger sus
              datos personales contra acceso no autorizado, alteración, divulgación
              o destrucción, como encriptación de datos en tránsito, contraseñas
              hasheadas, tokens JWT con expiración, validación de datos y rate
              limiting.
            </p>
          </section>

          <section className="border-l-4 border-yellow-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              5. Acceso a Sus Datos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Los datos que usted proporciona son accesibles solo para personal
              autorizado del Ministerio de Producción que requiera acceso para
              cumplir sus funciones. Nunca compartimos sus datos con terceros sin
              su consentimiento explícito.
            </p>
          </section>

          <section className="border-l-4 border-indigo-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              6. Derechos del Usuario
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Usted tiene derecho a:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>Acceder a sus datos personales almacenados</li>
              <li>Solicitar correcciones a datos inexactos</li>
              <li>Solicitar la eliminación de sus datos (sujeto a requisitos legales)</li>
              <li>Presentar reclamaciones ante autoridades de protección de datos</li>
            </ul>
          </section>

          <section className="border-l-4 border-teal-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              7. Contacto
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Si tiene preguntas sobre esta política de privacidad o sus datos
              personales, puede contactarse con:
            </p>
            <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
              <p className="font-semibold text-slate-800 mb-2">
                Ministerio de Producción de Corrientes
              </p>
              <p className="text-slate-600">Área de Sistemas</p>
              <p className="text-slate-600">Email: sistemasmprod@gmail.com</p>
            </div>
          </section>

          <section className="border-l-4 border-gray-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              8. Cambios a Esta Política
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Nos reservamos el derecho de actualizar esta política de privacidad
              en cualquier momento. Los cambios serán efectivos inmediatamente
              después de la publicación en el sistema.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

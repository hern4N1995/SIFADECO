import React, { useEffect } from 'react';

export default function TermsPage() {
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
            Sistema de Faenas y Decomisos - Términos y Condiciones
          </h1>
          <p className="text-sm text-slate-500">
            Última actualización:{' '}
            {new Date().toLocaleDateString('es-AR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Contenido principal */}
        <div className="bg-white rounded-xl shadow-lg p-8 sm:p-12 space-y-8">
          <section className="border-l-4 border-blue-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              1. Aceptación de Términos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Al acceder y utilizar el Sistema de Faenas y Decomisos del
              Ministerio de Producción de Corrientes, usted acepta estar
              vinculado por estos Términos y Condiciones. Si no está de acuerdo
              con estos términos, no debe utilizar el sistema.
            </p>
          </section>

          <section className="border-l-4 border-green-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              2. Uso Permitido
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              El Sistema de Faenas y Decomisos está destinado exclusivamente
              para:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>Personal autorizado del Ministerio de Producción</li>
              <li>Registro y control de faenas ganaderas y decomisos</li>
              <li>Generación de reportes e informes oficiales</li>
              <li>Cumplimiento de regulaciones y normativas legales</li>
            </ul>
          </section>

          <section className="border-l-4 border-red-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              3. Uso Prohibido
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Está explícitamente prohibido:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>
                Acceso no autorizado o intentos de eludir medidas de seguridad
              </li>
              <li>Modificación, alteración o destrucción de datos</li>
              <li>Reproducción de código o contenido sin autorización</li>
              <li>
                Actividades que causen daño, interferencia o inconvenientes
              </li>
              <li>Uso con propósitos comerciales no autorizados</li>
              <li>Consumo excesivo de recursos del sistema</li>
              <li>Compartir credenciales con usuarios no autorizados</li>
              <li>
                Manipulación de datos a través de herramientas de desarrollo
              </li>
            </ul>
          </section>

          <section className="border-l-4 border-purple-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              4. Responsabilidades del Usuario
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Usted es responsable de:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>
                Mantener la confidencialidad de sus credenciales de acceso
              </li>
              <li>No compartir su usuario y contraseña con terceros</li>
              <li>Reportar inmediatamente accesos no autorizados</li>
              <li>Cumplir con las políticas de seguridad establecidas</li>
              <li>Usar el sistema únicamente para propósitos autorizados</li>
            </ul>
          </section>

          <section className="border-l-4 border-yellow-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              5. Integridad de Datos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Usted se compromete a proporcionar información exacta, veraz y
              completa. Es responsable de mantener la integridad de los datos
              que ingresa en el sistema. El Ministerio de Producción se reserva
              el derecho de verificar la exactitud de los datos registrados.
            </p>
          </section>

          <section className="border-l-4 border-indigo-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              6. Limitación de Responsabilidad
            </h2>
            <p className="text-slate-700 leading-relaxed">
              El Ministerio de Producción no se responsabiliza por: pérdida de
              datos, interrupciones de servicio, daños indirectos o
              consecuentes, o cualquier otro daño derivado del uso del sistema.
              El usuario utiliza el sistema bajo su propio riesgo.
            </p>
          </section>

          <section className="border-l-4 border-teal-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              7. Disponibilidad del Servicio
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              El Sistema de Faenas se proporciona en base a "tal cual está".
              Aunque hacemos esfuerzos para mantener alta disponibilidad:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>El servicio puede no estar disponible en todo momento</li>
              <li>Se puede realizar mantenimiento sin previo aviso</li>
              <li>Se pueden implementar actualizaciones y cambios</li>
              <li>No garantizamos disponibilidad del 100%</li>
            </ul>
          </section>

          <section className="border-l-4 border-pink-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              8. Propiedad Intelectual
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Todo el contenido, software, diseños y funcionalidades del Sistema
              de Faenas son propiedad del Ministerio de Producción de Corrientes
              o de terceros con derechos reconocidos. Está prohibida la
              reproducción, distribución o modificación sin autorización
              explícita.
            </p>
          </section>

          <section className="border-l-4 border-cyan-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              9. Auditoría y Monitoreo
            </h2>
            <p className="text-slate-700 leading-relaxed">
              El Ministerio de Producción se reserva el derecho de: monitorear
              el uso del sistema, auditar actividades, registrar accesos y
              modificaciones, y analizar patrones de uso para garantizar
              seguridad y cumplimiento normativo.
            </p>
          </section>

          <section className="border-l-4 border-orange-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              10. Violaciones y Sanciones
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              El incumplimiento de estos términos puede resultar en:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 text-slate-700">
              <li>Suspensión temporal de acceso</li>
              <li>Revocación permanente de credenciales</li>
              <li>Acción legal según corresponda</li>
              <li>Acciones disciplinarias internas</li>
            </ul>
          </section>

          <section className="border-l-4 border-lime-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              11. Cambios en los Términos
            </h2>
            <p className="text-slate-700 leading-relaxed">
              El Ministerio de Producción se reserva el derecho de modificar
              estos términos en cualquier momento. Los cambios serán publicados
              en el sistema y entrarán en vigencia inmediatamente. Su uso
              continuado del sistema constituye aceptación de los términos
              modificados.
            </p>
          </section>

          <section className="border-l-4 border-gray-500 pl-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">
              12. Contacto y Apelaciones
            </h2>
            <p className="text-slate-700 leading-relaxed mb-4">
              Para consultas, reclamos o apelaciones respecto a estos términos:
            </p>
            <div className="bg-slate-50 p-6 rounded-lg border-2 border-slate-200">
              <p className="font-semibold text-slate-800 mb-2">
                Ministerio de Producción de Corrientes
              </p>
              <p className="text-slate-600">Área de Sistemas</p>
              <p className="text-slate-600">Email: sistemasmprod@gmail.com</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

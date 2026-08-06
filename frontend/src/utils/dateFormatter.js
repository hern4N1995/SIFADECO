/**
 * Utilidades para formatear fechas sin problemas de zona horaria
 * Evita que "2026-06-01" se interprete como UTC y se muestre como 2026-05-31 en zonas horarias antes de UTC
 */

/**
 * Convierte una fecha de la BD a formato de fecha local (DD-MM-YYYY)
 * @param {string|Date} dateInput - Fecha de la BD (ej: "2026-06-01" o "2026-06-01T00:00:00")
 * @param {string} locale - Código de localización (default: 'es-AR')
 * @returns {string} Fecha formateada (ej: "01-06-2026") o string vacío si no es válida
 */
export function formatDateFromDB(dateInput, locale = 'es-AR') {
  if (!dateInput) return '';
  
  try {
    let dateString = String(dateInput).trim();
    
    // Si es una fecha en formato "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM:SS"
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) {
      // Extraer solo la parte de fecha (YYYY-MM-DD)
      const [year, month, day] = dateString.split('T')[0].split('-');
      
      // Crear una fecha sin problemas de zona horaria
      // Usar el constructor con componentes numéricos: new Date(year, month - 1, day)
      // Esto crea la fecha en la zona horaria local
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      // Formatear usando toLocaleDateString
      return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    
    // Si es otro formato, intentar parsearlo normalmente
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (e) {
    console.error('Error al formatear fecha:', e);
    return '';
  }
}

/**
 * Convierte una fecha de un input type="date" a formato para API
 * @param {string} dateString - String de fecha (ej: "2026-06-01")
 * @returns {string|null} Fecha con hora para API (ej: "2026-06-01T00:00:00") o null
 */
export function formatDateForAPI(dateString) {
  if (!dateString) return null;
  
  // Si ya tiene hora, devolverlo tal cual
  if (dateString.includes('T')) {
    return dateString;
  }
  
  // Agregar hora 00:00:00
  return `${dateString}T00:00:00`;
}

/**
 * Formatea una fecha para mostrar en resumen (ej: "01-06-2026")
 * @param {string|Date} dateInput - Fecha a formatear
 * @param {string} locale - Código de localización
 * @returns {string} Fecha formateada
 */
export function formatDateSummary(dateInput, locale = 'es-AR') {
  return formatDateFromDB(dateInput, locale);
}

/**
 * Obtiene solo la parte de fecha (YYYY-MM-DD) de un string que puede contener hora
 * @param {string} dateString - String de fecha con posible hora
 * @returns {string} Parte de fecha (YYYY-MM-DD) o string vacío
 */
export function extractDatePart(dateString) {
  if (!dateString) return '';
  const match = String(dateString).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : '';
}

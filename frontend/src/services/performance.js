/**
 * Utilidades para optimización de performance en frontend
 * Debounce, throttle, lazy loading
 */

/**
 * Debounce: retrasa ejecución de función hasta que dejen de llamarla
 * Útil para: búsquedas, filtros, validaciones
 * @param {Function} func - Función a ejecutar
 * @param {number} delayMs - Retraso en milisegundos
 * @returns {Function} Función debounceada
 */
export const debounce = (func, delayMs = 500) => {
  let timeoutId = null;

  return (...args) => {
    // Cancelar timeout anterior
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Crear nuevo timeout
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delayMs);
  };
};

/**
 * Throttle: limita frecuencia de ejecución de función
 * Útil para: scroll, resize, mouse move
 * @param {Function} func - Función a ejecutar
 * @param {number} delayMs - Tiempo mínimo entre ejecuciones
 * @returns {Function} Función throttleada
 */
export const throttle = (func, delayMs = 500) => {
  let lastCallTime = 0;

  return (...args) => {
    const now = Date.now();
    if (now - lastCallTime >= delayMs) {
      func(...args);
      lastCallTime = now;
    }
  };
};

/**
 * Hook para cancelar requests automáticamente
 * Útil cuando componente se desmonta mientras hay request pendiente
 */
export const useAbortController = () => {
  const abortControllerRef = React.useRef(null);

  React.useEffect(() => {
    return () => {
      // Al desmontar, cancelar cualquier request pendiente
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        console.log('[AbortController] Cleanup: aborted pending requests');
      }
    };
  }, []);

  const createSignal = () => {
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  };

  return { createSignal, abort: () => abortControllerRef.current?.abort() };
};

/**
 * Retry con exponential backoff
 * Reintentar requests fallidos con retraso progresivo
 * @param {Function} fetcher - Función que retorna Promise
 * @param {number} maxRetries - Número máximo de intentos
 * @param {number} delayMs - Retraso inicial en ms
 * @returns {Promise} Resultado de la función
 */
export const retryWithBackoff = async (
  fetcher,
  maxRetries = 3,
  delayMs = 1000
) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fetcher();
      if (attempt > 1) {
        console.log(`[Retry] Success on attempt ${attempt}`);
      }
      return result;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = delayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.warn(
          `[Retry] Attempt ${attempt} failed. Retrying in ${delay}ms...`,
          error.message
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[Retry] Failed after ${maxRetries} attempts`);
  throw lastError;
};

/**
 * Batch de requests para ejecutar en paralelo con limite de concurrencia
 * Útil cuando tienes muchas requests y quieres evitar sobrecargar el servidor
 * @param {Array<Function>} tasks - Array de funciones que retornan Promise
 * @param {number} maxConcurrent - Máximo de requests en paralelo
 * @returns {Promise<Array>} Array de resultados
 */
export const batchRequests = async (tasks, maxConcurrent = 3) => {
  const results = [];
  const queue = [...tasks];
  let running = 0;

  return new Promise((resolve, reject) => {
    const processNext = async () => {
      if (queue.length === 0 && running === 0) {
        resolve(results);
        return;
      }

      if (queue.length > 0 && running < maxConcurrent) {
        running++;
        const task = queue.shift();

        try {
          const result = await task();
          results.push(result);
        } catch (error) {
          console.error('[BatchRequests] Task failed:', error);
          results.push({ error });
        }

        running--;
        processNext();
      }
    };

    // Iniciar procesamiento
    for (let i = 0; i < Math.min(maxConcurrent, queue.length); i++) {
      processNext();
    }
  });
};

/**
 * Memoización simple para funciones puras
 * Crea caché basado en argumentos
 * @param {Function} func - Función pura a memoizar
 * @returns {Function} Función memoizada
 */
export const memoize = (func) => {
  const cache = new Map();

  return (...args) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      console.log('[Memoize] HIT:', key);
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  };
};

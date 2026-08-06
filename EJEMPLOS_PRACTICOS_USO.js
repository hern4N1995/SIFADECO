/**
 * EJEMPLOS PRÁCTICOS - Cómo usar las nuevas características
 * Copiar/pegar en tu código y adaptar según necesites
 */

// ============================================
// EJEMPLO 1: Usar Logger Centralizado en Controladores
// ============================================

const pool = require('../db');
const logger = require('../utils/logger');

const obtenerUsuarios = async (req, res) => {
  try {
    logger.info('Iniciando obtención de usuarios', { userId: req.user?.id_usuario });
    
    const startTime = Date.now();
    const resultado = await pool.query('SELECT * FROM usuario WHERE estado = true');
    const duration = Date.now() - startTime;
    
    logger.database('SELECT', 'usuario', duration);
    logger.info('Usuarios obtenidos exitosamente', { count: resultado.rows.length });
    
    res.json(resultado.rows);
  } catch (error) {
    logger.error('Error al obtener usuarios', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// ============================================
// EJEMPLO 2: Usar Query Cache para Datos que Cambian Poco
// ============================================

const { withCache, getQueryCache } = require('../utils/query-cache');

const obtenerPlantasConCache = async (req, res) => {
  try {
    // Primera llamada: hace query, segunda: devuelve caché (5 minutos)
    const plantas = await withCache(
      pool,
      'plantas_activas', // clave de caché única
      'SELECT * FROM planta WHERE estado = true ORDER BY nombre',
      [], // parámetros
      5 // TTL: 5 minutos
    );

    res.json(plantas);
  } catch (error) {
    logger.error('Error al obtener plantas', error);
    res.status(500).json({ error: 'Error al obtener plantas' });
  }
};

// Cuando un usuario crea/modifica planta, invalidar caché:
const crearPlanta = async (req, res) => {
  try {
    // ... tu código de INSERT ...
    
    // Invalidar caché de plantas
    const cache = getQueryCache();
    cache.invalidateKey('plantas_activas');
    
    logger.info('Planta creada y caché invalidado');
    res.status(201).json({ id_planta: result.id });
  } catch (error) {
    logger.error('Error al crear planta', error);
    res.status(500).json({ error: 'Error al crear planta' });
  }
};

// ============================================
// EJEMPLO 3: Usar Respuestas Normalizadas
// ============================================

const response = require('../utils/response');

const obtenerUsuariosNormalizado = async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM usuario');
    
    // Respuesta normalizada exitosa
    res.json(response.success(
      resultado.rows,
      'Usuarios obtenidos correctamente'
    ));
  } catch (error) {
    // Respuesta normalizada de error
    res.status(500).json(response.error(
      'INTERNAL_ERROR',
      'Error al obtener usuarios',
      { details: error.message }
    ));
  }
};

// ============================================
// EJEMPLO 4: Implementar Debounce en Búsqueda (Frontend)
// ============================================

import React, { useState } from 'react';
import { debounce } from '../services/performance';
import api from '../services/api';

function UsuariosSearch() {
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Crear función de búsqueda con debounce
  const handleSearch = debounce(async (query) => {
    if (!query.trim()) {
      setResultados([]);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get(`/usuarios?q=${query}`);
      setResultados(response.data);
    } catch (error) {
      console.error('Error en búsqueda', error);
      setResultados([]);
    } finally {
      setLoading(false);
    }
  }, 500); // Espera 500ms sin escribir antes de hacer request

  return (
    <div>
      <input
        type="text"
        placeholder="Buscar usuario..."
        onChange={(e) => handleSearch(e.target.value)}
      />
      {loading && <p>Buscando...</p>}
      <ul>
        {resultados.map((u) => (
          <li key={u.id_usuario}>{u.nombre}</li>
        ))}
      </ul>
    </div>
  );
}

export default UsuariosSearch;

// ============================================
// EJEMPLO 5: Usar Caching Automático (Ya Funciona)
// ============================================

import api from '../services/api';

// Automático: primera llamada hace request, segunda devuelve caché
async function cargarDatos() {
  // Llamada 1: Request a /api/plantas (1500ms)
  const plantas1 = await api.get('/api/plantas');
  console.log('Primera llamada:', plantas1.data);

  // Llamada 2: Caché devuelve resultado (<10ms)
  const plantas2 = await api.get('/api/plantas');
  console.log('Segunda llamada (caché):', plantas2.data);

  // Llamada 3: Si modificas algo, caché se invalida automáticamente
  await api.post('/api/plantas', { nombre: 'Nueva' });

  // Llamada 4: Nuevo request porque caché se limpió
  const plantas4 = await api.get('/api/plantas');
  console.log('Después de modificar:', plantas4.data);
}

// ============================================
// EJEMPLO 6: Verificar Health Check
// ============================================

// En terminal:
// curl http://localhost:3000/api/health

// En navegador (consola):
fetch('/api/health')
  .then(r => r.json())
  .then(health => {
    console.log('Estado del servidor:', health);
    if (health.status === 'healthy') {
      console.log('✅ Todo bien, BD conectada');
    } else {
      console.log('⚠️ Servidor en estado degradado');
    }
  });

// ============================================
// EJEMPLO 7: Usar Retry con Exponential Backoff
// ============================================

import { retryWithBackoff } from '../services/performance';

async function cargarDatosConRetry() {
  try {
    const datos = await retryWithBackoff(
      () => api.get('/api/plantas'),
      3, // máximo 3 intentos
      1000 // esperar 1s, 2s, 4s
    );
    return datos.data;
  } catch (error) {
    console.error('Falló después de 3 intentos', error);
  }
}

// ============================================
// EJEMPLO 8: Ejecutar Múltiples Requests en Paralelo Limitado
// ============================================

import { batchRequests } from '../services/performance';

async function cargarTodosLosUsuarios() {
  const usuarioIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  // Ejecutar máximo 3 requests en paralelo (en lugar de 10)
  const tareas = usuarioIds.map((id) => 
    () => api.get(`/api/usuarios/${id}`)
  );

  const resultados = await batchRequests(tareas, 3); // Max 3 paralelos
  
  return resultados
    .filter((r) => !r.error)
    .map((r) => r.data);
}

// ============================================
// EJEMPLO 9: Cancelar Requests al Desmontar Componente
// ============================================

import React from 'react';
import { useAbortController } from '../services/performance';
import api from '../services/api';

function ComponenteConDatos() {
  const { createSignal } = useAbortController();
  const [datos, setDatos] = React.useState([]);

  React.useEffect(() => {
    const signal = createSignal();

    const cargar = async () => {
      try {
        const response = await api.get('/api/datos', { signal });
        setDatos(response.data);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error real:', error);
        }
        // Si es AbortError, el componente se desmontó, ignorar
      }
    };

    cargar();
  }, []);

  // Cuando el componente se desmonta, abort cancela la request automáticamente
  return <div>{datos.length} elementos cargados</div>;
}

export default ComponenteConDatos;

// ============================================
// EJEMPLO 10: Ver Stats de Caché (Debug)
// ============================================

import { getResponseCache } from '../services/cache';

// En consola del navegador:
const cache = getResponseCache();
console.log(cache.stats());
// Output: { size: 5, keys: ['/api/plantas', '/api/usuarios', ...] }

// Limpiar caché si algo falla:
cache.clear();
console.log('Caché limpiado');

// ============================================
// EJEMPLO 11: Combinar Varias Técnicas
// ============================================

import React, { useState } from 'react';
import { debounce, retryWithBackoff, batchRequests } from '../services/performance';
import api from '../services/api';

function DashboardAvanzado() {
  const [usuarios, setUsuarios] = useState([]);
  const [plantas, setPlantas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Búsqueda con debounce
  const handleBuscar = debounce(async (query) => {
    setLoading(true);
    try {
      // Retry automático en caso de fallar
      const response = await retryWithBackoff(
        () => api.get(`/api/usuarios?q=${query}`),
        3,
        1000
      );
      setUsuarios(response.data);
    } finally {
      setLoading(false);
    }
  }, 500);

  // Cargar datos paralelos limitado
  React.useEffect(() => {
    const cargar = async () => {
      setLoading(true);
      try {
        const tareas = [
          () => api.get('/api/usuarios'),
          () => api.get('/api/plantas'),
          () => api.get('/api/tropas'),
        ];

        const [usuariosResp, plantasResp] = await batchRequests(tareas, 2);

        setUsuarios(usuariosResp.data || []);
        setPlantas(plantasResp.data || []);
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  return (
    <div>
      {loading ? <p>Cargando...</p> : null}
      <input
        placeholder="Buscar..."
        onChange={(e) => handleBuscar(e.target.value)}
      />
      <p>Usuarios: {usuarios.length}</p>
      <p>Plantas: {plantas.length}</p>
    </div>
  );
}

export default DashboardAvanzado;

// ============================================
// EJEMPLO 12: Estructura Recomendada de Controlador Nuevo
// ============================================

const pool = require('../db');
const logger = require('../utils/logger');
const response = require('../utils/response');
const { withCache, getQueryCache } = require('../utils/query-cache');

/**
 * Obtiene lista de elementos
 * @param {Request} req
 * @param {Response} res
 */
const obtenerTodos = async (req, res) => {
  try {
    logger.info('Iniciando obtención de datos');

    // Usar caché para queries que no cambian frecuentemente
    const datos = await withCache(
      pool,
      'datos_principales',
      'SELECT * FROM tabla WHERE estado = true',
      [],
      5
    );

    logger.info('Datos obtenidos', { count: datos.length });
    res.json(response.success(datos, 'Datos obtenidos correctamente'));
  } catch (error) {
    logger.error('Error al obtener datos', error);
    res
      .status(500)
      .json(response.error('DB_ERROR', 'Error al obtener datos'));
  }
};

/**
 * Crear nuevo elemento
 * @param {Request} req
 * @param {Response} res
 */
const crear = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (!nombre) {
      return res
        .status(400)
        .json(response.error('VALIDATION_ERROR', 'Nombre requerido'));
    }

    const resultado = await pool.query(
      'INSERT INTO tabla (nombre) VALUES ($1) RETURNING *',
      [nombre]
    );

    // Invalidar caché después de modificar
    const cache = getQueryCache();
    cache.invalidateKey('datos_principales');

    logger.info('Elemento creado', { id: resultado.rows[0].id });
    res
      .status(201)
      .json(response.success(resultado.rows[0], 'Creado exitosamente'));
  } catch (error) {
    logger.error('Error al crear', error);
    res
      .status(500)
      .json(response.error('DB_ERROR', 'Error al crear elemento'));
  }
};

module.exports = { obtenerTodos, crear };

// ============================================
// RESUMEN
// ============================================
/*
✅ Logger: logger.info(), logger.error(), logger.database()
✅ Caché: withCache() y cache.invalidateKey()
✅ Respuestas: response.success(), response.error()
✅ Frontend: debounce(), retryWithBackoff(), batchRequests()
✅ Caching auto: api.get() cachea automáticamente
✅ Health: GET /api/health, GET /api/ping

Todo listo para usar, copiar/pegar según necesites.
*/

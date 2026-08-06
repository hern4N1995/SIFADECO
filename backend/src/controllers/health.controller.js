/**
 * Controlador de Health Check
 * Verifica estado de servicios críticos
 */

const pool = require('../db');
const logger = require('../utils/logger');

/**
 * Health check completo del sistema
 * @route GET /api/health
 */
const healthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Verificar BD
    let dbStatus = 'disconnected';
    let dbTime = 0;
    try {
      const dbStart = Date.now();
      await pool.query('SELECT 1');
      dbTime = Date.now() - dbStart;
      dbStatus = 'connected';
    } catch (dbErr) {
      logger.error('Health check: DB connection failed', dbErr);
      dbStatus = 'error';
    }

    const uptime = Math.floor(process.uptime());
    const totalTime = Date.now() - startTime;

    res.json({
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: `${uptime}s`,
      services: {
        database: {
          status: dbStatus,
          responseTime: `${dbTime}ms`,
        },
        api: {
          status: 'running',
          version: process.env.API_VERSION || '1.0.0',
        },
      },
      environment: process.env.NODE_ENV,
      checkTime: `${totalTime}ms`,
    });
  } catch (err) {
    logger.error('Unhandled health check error', err);
    res.status(500).json({
      status: 'error',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Health check simple (rápido, sin verificar BD)
 * @route GET /api/ping
 */
const ping = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
};

module.exports = {
  healthCheck,
  ping,
};

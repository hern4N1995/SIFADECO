// src/services/auth-security.js
/**
 * Servicio de autenticación segura con CSRF token management
 */

import api from './api';

class AuthSecurityService {
  /**
   * Obtener CSRF token después de login
   */
  static async obtenerCsrfToken() {
    try {
      const response = await api.post('/auth/csrf-token');
      const { csrfToken, expiresIn } = response.data;
      
      // Guardar token y timestamp de expiración
      localStorage.setItem('csrfToken', csrfToken);
      localStorage.setItem('csrfTokenExpiry', Date.now() + expiresIn);
      
      console.log('[AUTH] CSRF token obtenido. Expira en:', new Date(Date.now() + expiresIn));
      return csrfToken;
    } catch (error) {
      console.error('[AUTH] Error obteniendo CSRF token:', error);
      throw error;
    }
  }

  /**
   * Verificar si el CSRF token está expirado
   */
  static isCsrfTokenExpired() {
    const expiry = localStorage.getItem('csrfTokenExpiry');
    if (!expiry) return true;
    return Date.now() > parseInt(expiry);
  }

  /**
   * Renovar CSRF token si está cerca de expirar
   */
  static async renovarCsrfToken() {
    const expiry = localStorage.getItem('csrfTokenExpiry');
    if (!expiry) return null;

    const minutosRestantes = (parseInt(expiry) - Date.now()) / 60000;
    
    // Renovar si quedan menos de 10 minutos
    if (minutosRestantes < 10) {
      console.log('[AUTH] Renovando CSRF token...');
      return await this.obtenerCsrfToken();
    }

    return localStorage.getItem('csrfToken');
  }

  /**
   * Limpiar tokens de seguridad al logout
   */
  static limpiarTokens() {
    localStorage.removeItem('csrfToken');
    localStorage.removeItem('csrfTokenExpiry');
    localStorage.removeItem('token');
    console.log('[AUTH] Tokens de seguridad limpiados');
  }

  /**
   * Validar antes de hacer cambios en BD
   * Lanza excepción si falta CSRF token o está expirado
   */
  static validarAntesDeCambio() {
    const csrfToken = localStorage.getItem('csrfToken');
    
    if (!csrfToken) {
      throw new Error('No hay CSRF token. Por favor recarga la página.');
    }

    if (this.isCsrfTokenExpired()) {
      localStorage.removeItem('csrfToken');
      throw new Error('CSRF token expirado. Por favor recarga la página.');
    }
  }
}

export default AuthSecurityService;

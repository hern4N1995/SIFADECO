// src/components/LoginModal.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import api from 'src/services/api';
import { LAST_ACTIVITY_KEY } from '../utils/auth';

export default function LoginModal({ isOpen, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Detectar tecla Esc para cerrar
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleCloseModal();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCloseModal = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    // Solo cerrar si se hace clic en el backdrop, no en el contenido del modal
    if (e.target === e.currentTarget) {
      handleCloseModal();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Por favor completá email y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      if (!data?.user || !data?.token) {
        throw new Error('Respuesta inválida del servidor');
      }

      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));

      // Obtener CSRF token después del login
      try {
        const csrfRes = await api.post('/auth/csrf-token');
        if (csrfRes.data?.csrfToken) {
          localStorage.setItem('csrfToken', csrfRes.data.csrfToken);
        }
      } catch (csrfErr) {
        console.warn('Error al obtener CSRF token:', csrfErr);
        // No es crítico si falla el CSRF token
      }

      handleCloseModal();

      // redirigir según rol (ajustá los casos si es necesario)
      switch (data.user.rol) {
        case 1:
        case 2:
        default:
          navigate('/inicio');
          break;
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Credenciales incorrectas. Por favor, revisá tus datos.');
      } else {
        setError(
          err.response?.data?.message || err.message || 'Error al conectar con el servidor.'
        );
      }
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-96 relative border border-gray-100 mx-4">
        <button
          onClick={handleCloseModal}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl font-light transition"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">🔐 Iniciar sesión</h2>
          <p className="text-sm text-gray-600 mt-1">Accedé a SIFADECO con tu cuenta</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="tucorreo@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="off"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-100 focus:border-green-500 transition"
                style={{
                  backgroundImage: 'none',
                  WebkitAutofill: 'off',
                }}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex="-1"
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition cursor-pointer z-10 ${
                  password ? 'visible' : 'invisible'
                }`}
                disabled={loading}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  <AiOutlineEyeInvisible size={20} />
                ) : (
                  <AiOutlineEye size={20} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed mt-6"
            disabled={loading}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          ¿Problemas para ingresar? Contactá al área de sistemas.
        </p>
      </div>
    </div>
  );
}

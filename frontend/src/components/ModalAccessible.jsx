import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

/**
 * ModalAccessible.jsx
 * Modal reutilizable accesible con overlay, z-index alto y bloqueo del fondo
 */
export default function ModalAccessible({ children, onClose }) {
  const modalRef = useRef(null);

  // Bloquear scroll del fondo mientras el modal esté abierto
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => (document.body.style.overflow = 'auto');
  }, []);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleKeyDown);
    modalRef.current?.focus();
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const modal = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4"
      aria-modal="true"
      role="dialog"
    >
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Contenedor centrado que define el ancho del modal */}
      <div className="relative z-10 w-full max-h-[calc(100vh-1.5rem)] sm:max-h-[90vh] overflow-y-auto">
        {/* Contenido real (evitar que clicks dentro cierren) */}
        <div
          ref={modalRef}
          tabIndex={-1}
          className="focus:outline-none"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

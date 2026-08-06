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
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Fondo oscuro */}
      <div
        className="fixed inset-0 bg-black opacity-40"
        onClick={onClose}
      ></div>

      {/* Contenido: no limitar ancho aquí para permitir que el hijo controle max-width (ej. max-w-6xl) */}
      {/* Capa transparente que captura clicks fuera del modal */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Contenedor centrado que define el ancho del modal */}
      <div className="w-full flex justify-center px-4">
        <div className="relative w-full max-w-4xl lg:max-w-6xl">
          {/* Fondo oscuro limitado al ancho del modal */}
          <div
            className="absolute inset-0 bg-black/40 rounded-2xl"
            onClick={onClose}
          />

          {/* Contenido real (evitar que clicks dentro cierren) */}
          <div
            ref={modalRef}
            tabIndex={-1}
            className="relative bg-transparent focus:outline-none"
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

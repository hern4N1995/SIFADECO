import React from 'react';

export default function AppNotification({
  show,
  message,
  type = 'success',
  onClose,
  successTitle = 'Listo',
  errorTitle = 'Atencion',
}) {
  if (!show || !message) return null;

  const isError = type === 'error' || type === 'danger';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] w-[95%] max-w-2xl">
      <div
        className={`rounded-2xl border-2 shadow-2xl px-4 sm:px-5 py-4 ${
          isError
            ? 'bg-red-100 border-red-500 text-red-900'
            : 'bg-emerald-100 border-emerald-600 text-emerald-900'
        }`}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-base sm:text-lg font-extrabold leading-tight">
              {isError ? errorTitle : successTitle}
            </p>
            <p className="text-sm sm:text-base font-semibold mt-1">{message}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg border border-black/20 bg-white/70 px-3 py-1 text-sm font-bold hover:bg-white"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

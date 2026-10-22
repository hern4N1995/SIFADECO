// Devuelve true si es un clic izquierdo sin teclas modificadoras,
// es decir, cuando la navegacion ocurre en la misma pestaña.
// Ctrl/Cmd/Shift/Alt + clic (o clic con la rueda) abren en otra pestaña/ventana.
export const isPlainLeftClick = (e) =>
  e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;

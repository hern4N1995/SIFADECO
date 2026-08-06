// src/middleware/validation-schemas.js
/**
 * Esquemas de validación reutilizables para todos los controllers
 * Protege contra manipulación de tipos desde consola
 */

module.exports = {
  // Usuarios
  usuarioCreate: {
    nombre: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    email: { type: 'string', required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    password: { type: 'string', required: true, minLength: 6, maxLength: 255 },
    id_planta: { type: 'number', required: true, min: 1 },
    rol: { type: 'string', required: true, enum: ['admin', 'usuario', 'consultor'] },
  },

  usuarioUpdate: {
    nombre: { type: 'string', maxLength: 100 },
    email: { type: 'string', pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    id_planta: { type: 'number', min: 1 },
    rol: { type: 'string', enum: ['admin', 'usuario', 'consultor'] },
  },

  // Tropas
  tropaCreate: {
    n_tropa: { type: 'string', required: true, minLength: 1, maxLength: 50 },
    dte_dtu: { type: 'string', required: true, pattern: /^\d{7,8}$/ },
    id_departamento: { type: 'number', required: true, min: 1 },
    id_productor: { type: 'number', required: true, min: 1 },
    id_titular_faena: { type: 'number', min: 1 },
    id_planta: { type: 'number', min: 1 },
    guia_policial: { type: 'string', maxLength: 50 },
  },

  tropaUpdate: {
    n_tropa: { type: 'string', minLength: 1, maxLength: 50 },
    dte_dtu: { type: 'string', pattern: /^\d{7,8}$/ },
    id_departamento: { type: 'number', min: 1 },
    id_productor: { type: 'number', min: 1 },
    id_titular_faena: { type: 'number', min: 1 },
    guia_policial: { type: 'string', maxLength: 50 },
  },

  // Faenas
  faenaCreate: {
    id_tropa: { type: 'number', required: true, min: 1 },
    fecha: { type: 'string', required: true, pattern: /^\d{4}-\d{2}-\d{2}/ },
  },

  // Decomisos
  decomisoCreate: {
    id_faena_detalle: { type: 'number', required: true, min: 1 },
    fecha: { type: 'string', pattern: /^\d{4}-\d{2}-\d{2}/ },
  },

  decomisoDetalleCreate: {
    id_decomiso: { type: 'number', required: true, min: 1 },
    id_afeccion: { type: 'number', required: true, min: 1 },
    id_parte_decomisada: { type: 'number', required: true, min: 1 },
    cantidad: { type: 'number', required: true, min: 1 },
    peso_kg: { type: 'number', min: 0 },
  },

  // Partes Decomisadas
  parteDecomisadaCreate: {
    nombre_parte: { type: 'string', required: true, minLength: 2, maxLength: 255 },
    id_tipo_parte_deco: { type: 'number', min: 1 },
  },

  parteDecomisadaUpdate: {
    nombre_parte: { type: 'string', minLength: 2, maxLength: 255 },
    id_tipo_parte_deco: { type: 'number', min: 1 },
  },

  // Tipos de Parte Decomisada
  tipoParteDecoCreate: {
    nombre_tipo_parte: { type: 'string', required: true, minLength: 2, maxLength: 255 },
  },

  tipoParteDecoUpdate: {
    nombre_tipo_parte: { type: 'string', minLength: 2, maxLength: 255 },
    estado: { type: 'boolean' },
  },

  // Provincias
  provinciaCreate: {
    nombre: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  },

  provinciaUpdate: {
    nombre: { type: 'string', minLength: 2, maxLength: 100 },
  },

  // Departamentos
  departamentoCreate: {
    nombre_departamento: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    id_provincia: { type: 'number', required: true, min: 1 },
  },

  departamentoUpdate: {
    nombre_departamento: { type: 'string', minLength: 2, maxLength: 100 },
    id_provincia: { type: 'number', min: 1 },
  },

  // Plantas
  plantaCreate: {
    nombre: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    id_provincia: { type: 'number', required: true, min: 1 },
    direccion: { type: 'string', maxLength: 255 },
  },

  plantaUpdate: {
    nombre: { type: 'string', minLength: 2, maxLength: 100 },
    id_provincia: { type: 'number', min: 1 },
    direccion: { type: 'string', maxLength: 255 },
  },

  // Especies
  especieCreate: {
    descripcion: { type: 'string', required: true, minLength: 2, maxLength: 100 },
  },

  especieUpdate: {
    descripcion: { type: 'string', minLength: 2, maxLength: 100 },
  },

  // Categorías de Especie
  categoriaEspecieCreate: {
    descripcion: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    id_especie: { type: 'number', required: true, min: 1 },
  },

  categoriaEspecieUpdate: {
    descripcion: { type: 'string', minLength: 2, maxLength: 100 },
    id_especie: { type: 'number', min: 1 },
  },

  // Productores
  productorCreate: {
    nombre: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    cuit: { type: 'string', required: true, pattern: /^\d{11,13}$/ },
  },

  productorUpdate: {
    nombre: { type: 'string', minLength: 2, maxLength: 100 },
    cuit: { type: 'string', pattern: /^\d{11,13}$/ },
  },

  // Veterinarios
  veterinarioCreate: {
    nombre: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    matricula: { type: 'string', required: true, minLength: 1, maxLength: 50 },
  },

  veterinarioUpdate: {
    nombre: { type: 'string', minLength: 2, maxLength: 100 },
    matricula: { type: 'string', minLength: 1, maxLength: 50 },
  },

  // Afecciones
  afeccionCreate: {
    nombre: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    id_especie: { type: 'number', min: 1 },
  },

  afeccionUpdate: {
    nombre: { type: 'string', minLength: 2, maxLength: 100 },
    id_especie: { type: 'number', min: 1 },
  },

  // Titulares de Faena
  titularFaenaCreate: {
    nombre: { type: 'string', required: true, minLength: 2, maxLength: 100 },
    cuit: { type: 'string', pattern: /^\d{11}$/ },
  },

  titularFaenaUpdate: {
    nombre: { type: 'string', minLength: 2, maxLength: 100 },
    cuit: { type: 'string', pattern: /^\d{11}$/ },
  },
};

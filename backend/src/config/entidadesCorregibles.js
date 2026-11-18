// src/config/entidadesCorregibles.js
// Registro de entidades que el superadmin puede corregir (ver controllers/correcciones.controller.js).
// Solo se pueden editar los campos listados aquí. Claves primarias y campos de relación
// que enlazan otros registros (ej: faena.id_tropa) no están habilitados a propósito.
//
// tipos: text | int | num | date | bool | fk (referencia a otra tabla: { tabla, pk, etiqueta })

const PROVINCIA = { tabla: 'provincia', pk: 'id_provincia', etiqueta: 'descripcion' };
const DEPARTAMENTO = { tabla: 'departamento', pk: 'id_departamento', etiqueta: 'nombre_departamento' };
const TITULAR = { tabla: 'titular_faena', pk: 'id_titular_faena', etiqueta: 'nombre' };
const PRODUCTOR = { tabla: 'productor', pk: 'id_productor', etiqueta: 'nombre' };
const PLANTA = { tabla: 'planta', pk: 'id_planta', etiqueta: 'nombre' };

const ENTIDADES = {
  tropa: {
    titulo: 'Tropa',
    tabla: 'tropa',
    pk: 'id_tropa',
    etiqueta: (r) => `Tropa N° ${r.n_tropa ?? r.id_tropa}`,
    buscar: ['n_tropa', 'dte_dtu'],
    campos: {
      n_tropa: { label: 'N° de tropa', tipo: 'int', requerido: true },
      dte_dtu: { label: 'DTe/DTu', tipo: 'text' },
      guia_policial: { label: 'Guía policial', tipo: 'text' },
      fecha_alta: { label: 'Fecha de alta', tipo: 'date', requerido: true },
      fecha_ingreso: { label: 'Fecha de ingreso', tipo: 'date' },
      id_titular_faena: { label: 'Titular de faena', tipo: 'fk', ref: TITULAR },
      id_departamento: { label: 'Departamento', tipo: 'fk', ref: DEPARTAMENTO },
      id_productor: { label: 'Productor', tipo: 'fk', ref: PRODUCTOR },
      id_planta: { label: 'Planta', tipo: 'fk', ref: PLANTA },
    },
  },
  faena: {
    titulo: 'Faena',
    tabla: 'faena',
    pk: 'id_faena',
    etiqueta: (r) => `Faena #${r.id_faena}`,
    buscar: [],
    campos: {
      fecha_faena: { label: 'Fecha de faena', tipo: 'date', requerido: true },
    },
  },
  productor: {
    titulo: 'Productor',
    tabla: 'productor',
    pk: 'id_productor',
    etiqueta: (r) => r.nombre || `Productor #${r.id_productor}`,
    buscar: ['nombre', 'cuit'],
    campos: {
      nombre: { label: 'Nombre', tipo: 'text', requerido: true },
      cuit: { label: 'CUIT', tipo: 'text' },
      estado: { label: 'Activo', tipo: 'bool' },
    },
  },
  departamento: {
    titulo: 'Departamento',
    tabla: 'departamento',
    pk: 'id_departamento',
    etiqueta: (r) => r.nombre_departamento || `Departamento #${r.id_departamento}`,
    buscar: ['nombre_departamento'],
    campos: {
      nombre_departamento: { label: 'Nombre', tipo: 'text', requerido: true },
      id_provincia: { label: 'Provincia', tipo: 'fk', ref: PROVINCIA, requerido: true },
    },
  },
  planta: {
    titulo: 'Planta',
    tabla: 'planta',
    pk: 'id_planta',
    etiqueta: (r) => r.nombre || `Planta #${r.id_planta}`,
    buscar: ['nombre', 'cuit'],
    campos: {
      nombre: { label: 'Nombre', tipo: 'text', requerido: true },
      direccion: { label: 'Dirección', tipo: 'text' },
      norma_legal: { label: 'Norma legal', tipo: 'text' },
      cuit: { label: 'CUIT', tipo: 'text' },
      fecha_habilitacion: { label: 'Fecha de habilitación', tipo: 'date' },
      estado: { label: 'Activa', tipo: 'bool' },
      id_provincia: { label: 'Provincia', tipo: 'fk', ref: PROVINCIA },
      id_departamento: { label: 'Departamento', tipo: 'fk', ref: DEPARTAMENTO },
    },
  },
  titular_faena: {
    titulo: 'Titular de faena',
    tabla: 'titular_faena',
    pk: 'id_titular_faena',
    etiqueta: (r) => r.nombre || `Titular #${r.id_titular_faena}`,
    buscar: ['nombre', 'cuit'],
    campos: {
      nombre: { label: 'Nombre', tipo: 'text', requerido: true },
      localidad: { label: 'Localidad', tipo: 'text', requerido: true },
      direccion: { label: 'Dirección', tipo: 'text' },
      cuit: { label: 'CUIT', tipo: 'text' },
      id_provincia: { label: 'Provincia', tipo: 'fk', ref: PROVINCIA, requerido: true },
    },
  },
  veterinario: {
    titulo: 'Veterinario',
    tabla: 'veterinario',
    pk: 'id_veterinario',
    etiqueta: (r) => `${r.nombre_vet ?? ''} ${r.apellido_vet ?? ''}`.trim() || `Veterinario #${r.id_veterinario}`,
    buscar: ['nombre_vet', 'apellido_vet', 'matricula'],
    campos: {
      nombre_vet: { label: 'Nombre', tipo: 'text', requerido: true },
      apellido_vet: { label: 'Apellido', tipo: 'text', requerido: true },
      matricula: { label: 'Matrícula', tipo: 'text', requerido: true },
      dni: { label: 'DNI', tipo: 'int', requerido: true },
      email: { label: 'Email', tipo: 'text', requerido: true },
      n_telefono: { label: 'Teléfono', tipo: 'text' },
      estado: { label: 'Activo', tipo: 'bool' },
    },
  },
};

module.exports = ENTIDADES;

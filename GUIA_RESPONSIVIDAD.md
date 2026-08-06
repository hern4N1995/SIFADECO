# 📱 GUÍA DE RESPONSIVIDAD - InformesPage

## Responsive Breakpoints

### 🔵 Mobile (< 640px)
```
┌─────────────────────┐
│ 📋 Informe Mensual  │
│ [Imprimir Button]   │  ← Se apila vertical
└─────────────────────┘

Texto: xs (12px)
Padding: px-3, py-2
Tablas: Scroll horizontal
Layout: 1 columna
```

### 🟢 Tablet (640px - 1024px)
```
┌──────────────────────────────────┐
│ 📋 Informe Mensual [Imprimir]    │  ← Lado a lado
└──────────────────────────────────┘

Texto: sm (14px)
Padding: px-4, py-2
Tablas: Scroll horizontal
Layout: 1-2 columnas (empieza transición)
```

### 🟠 Desktop (≥ 1024px)
```
┌─────────────────────────────────────────┐
│ 📋 Informe Mensual      [Imprimir]      │
└─────────────────────────────────────────┘

Texto: sm-base (14-16px)
Padding: px-4, py-4
Tablas: Ancho completo (sin scroll necesario)
Layout: 2 columnas lado a lado
```

---

## Clases Tailwind Responsivas Usadas

### Text Size
```html
<!-- xs en móvil, sm en tablet/desktop -->
<h1 className="text-xs sm:text-sm">Título</h1>
<p className="text-xs sm:text-sm md:text-base">Párrafo</p>
```

### Padding
```html
<!-- px-3 móvil, px-4 tablet, py-2 móvil, py-4 desktop -->
<div className="px-3 sm:px-4 py-2 sm:py-4">Contenido</div>
```

### Layout
```html
<!-- flex-col en móvil, flex-row en tablet -->
<div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
  <button>Botón 1</button>
  <button>Botón 2</button>
</div>

<!-- grid 1 columna móvil, 2 columnas en lg -->
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <table>Faenas</table>
  <table>Decomisos</table>
</div>
```

### Scroll Horizontal
```html
<!-- Auto scroll en pantallas pequeñas -->
<div className="overflow-x-auto rounded-lg border">
  <table className="w-full">
    <!-- Datos anchos -->
  </table>
</div>
```

---

## 🖨️ Print Styles (@media print)

### A4 Landscape
```css
@page {
  margin: 0.4in;
  size: A4 landscape;  /* 11.7" x 8.3" */
}
```

### Colores para Impresión
```css
thead { background-color: #dcfce7; }   /* Verde 100 */
tfoot { background-color: #bbf7d0; }   /* Verde 200 */
all borders { border: 1px solid #000; } /* Negro */
```

### Evitar Cortes
```css
table { page-break-inside: avoid; }
thead, tbody tr { page-break-inside: avoid; }
```

---

## Elementos Clave

### 1️⃣ Print Button
```jsx
<button
  onClick={() => window.print()}
  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white 
    rounded-lg hover:bg-green-700 active:bg-green-800 transition-all 
    duration-200 font-medium shadow-md hover:shadow-lg active:scale-95 
    text-sm sm:text-base print:hidden whitespace-nowrap"
>
  <svg className="w-4 h-4 sm:w-5 sm:h-5" .../>
  Imprimir
</button>
```

**Características:**
- ✅ Se oculta en impresión (`print:hidden`)
- ✅ Responsive size (`text-sm sm:text-base`, `w-4 h-4 sm:w-5 sm:h-5`)
- ✅ Efectos visuales (`hover:bg-green-700`, `active:scale-95`)
- ✅ No se rompe en líneas (`whitespace-nowrap`)

### 2️⃣ Tablas Responsivas
```jsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full text-xs sm:text-sm border-collapse">
    <thead>
      <tr className="bg-green-100">
        <th className="px-3 sm:px-4 py-2 text-left font-semibold 
          text-gray-700 border border-gray-300 whitespace-nowrap">
          Encabezado
        </th>
      </tr>
    </thead>
    <tbody>
      <tr className="bg-white hover:bg-gray-50">
        <td className="px-3 sm:px-4 py-2 text-gray-700 
          border border-gray-300">
          Dato
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

**Características:**
- ✅ Scroll horizontal automático en móvil
- ✅ Padding responsivo (`px-3 sm:px-4`)
- ✅ Texto responsivo (`text-xs sm:text-sm`)
- ✅ Headers no se rompen (`whitespace-nowrap`)
- ✅ Bordes consistentes

### 3️⃣ Observaciones Textarea
```jsx
<textarea
  value={observaciones}
  onChange={(e) => {
    const texto = e.target.value.substring(0, 500);
    setObservaciones(texto);
  }}
  placeholder="Escriba observaciones..."
  className="w-full p-3 sm:p-4 border-2 border-gray-300 bg-white 
    text-gray-700 text-xs sm:text-sm rounded-lg resize-none 
    focus:outline-none focus:ring-2 focus:ring-green-500 
    transition-all hover:border-green-300 print:border-black"
  rows="4"
/>
```

**Características:**
- ✅ Padding responsivo (`p-3 sm:p-4`)
- ✅ Texto responsivo (`text-xs sm:text-sm`)
- ✅ Focus ring verde
- ✅ Hover state
- ✅ Border negro en impresión

---

## 📊 Vista Previa: Mobil vs Desktop

### Mobile (320px)
```
┌─────────────────────────────────┐
│  📋 Informe Mensual             │
│  ┌──────────────────────────────┐
│  │[Imprimir] (button full-width)│
│  └──────────────────────────────┘
├─────────────────────────────────┤
│ Tabla Faenas (scroll-x)          │
│  Día │ Total │ ...              │
│  ──────────────                 │
├─────────────────────────────────┤
│ Tabla Decomisos (scroll-x)       │
│  Causa │ Cantidad │ ...         │
│  ──────────────────             │
├─────────────────────────────────┤
│ [OBSERVACIONES]                 │
│ ┌─────────────────────────────┐ │
│ │ texto...                    │ │
│ │ 100 / 500 caracteres        │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ Tabla Titulares (scroll-x)       │
│  Titular │ Bovino │ Bubalino    │
│  ──────────────────────────────  │
└─────────────────────────────────┘
```

### Desktop (1920px)
```
┌─────────────────────────────────────────────────────────────────┐
│  📋 Informe Mensual                              [Imprimir]     │
└─────────────────────────────────────────────────────────────────┘
├────────────────────────────────┬────────────────────────────────┤
│                                 │                                │
│ Tabla Faenas (lado izq.)        │ Tabla Decomisos (lado der.)    │
│  Día │ Total │ Bovino │ Bufal. │  Causa │ Tipo │ Cantidad      │
│  ──────────────────────────────  │  ──────────────────────────  │
│                                 │                                │
├────────────────────────────────┴────────────────────────────────┤
│ [OBSERVACIONES] (full-width)                                    │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ texto de observación...                                    │ │
│ │ 150 / 500 caracteres                                       │ │
│ └────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────┤
│ Tabla Titulares (full-width)                                     │
│  Titular de Faena │ Bovino │ Bubalino │ Ovino │ Porcino │ Caprino
│  ──────────────────────────────────────────────────────────────  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Testing Manual

### Paso 1: Responsive Layout
```bash
1. Abrir en Chrome DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Probar: iPhone SE, iPad, Desktop
4. Verificar:
   ✓ Texto legible
   ✓ Botones clickeables
   ✓ Tablas con scroll-x
   ✓ No hay cortes
```

### Paso 2: Impresión
```bash
1. Presionar botón [Imprimir]
2. Verificar print preview:
   ✓ Formato A4 landscape
   ✓ Márgenes correctos
   ✓ Colores verdes se ven
   ✓ Tablas no se cortan
   ✓ Texto legible (9-16pt)
3. Imprimir a PDF o impresora física
```

### Paso 3: Funcionalidad
```bash
1. Cargar informe del mes actual
2. Cambiar mes/año
3. Cambiar planta (si es admin)
4. Escribir en observaciones
5. Refrescar datos
6. Imprimir
7. Verificar persistencia en localStorage
```

---

## 🌈 Paleta de Colores

### Tema Principal (Green)
| Uso | Clase | Color | Hex |
|-----|-------|-------|-----|
| Headers | bg-green-100 | Verde claro | #dcfce7 |
| Footers | bg-green-200 | Verde medio | #bbf7d0 |
| Botones | bg-green-600 | Verde oscuro | #16a34a |
| Hover | hover:bg-green-700 | Verde + oscuro | #15803d |
| Focus | focus:ring-green-500 | Verde enfoque | #22c55e |

### Neutros
| Uso | Clase | Color | Hex |
|-----|-------|-------|-----|
| Borders | border-gray-300 | Gris oscuro | #d1d5db |
| Dividers | border-gray-200 | Gris claro | #e5e7eb |
| Texto | text-gray-700 | Gris texto | #374151 |
| Background alt | bg-gray-50 | Gris muy claro | #f9fafb |

---

## ✅ Checklist de Validación

### Visual
- [ ] Botón impresión se ve bien en móvil y desktop
- [ ] Tablas responsivas con scroll-x
- [ ] Colores verdes coherentes
- [ ] Spacing consistente
- [ ] Fuentes legibles en todos los tamaños

### Funcional
- [ ] Botón impresión funciona
- [ ] Print preview muestra A4 landscape
- [ ] Datos no se cortan
- [ ] Observaciones se guardan en localStorage
- [ ] Filtros por mes/año/planta funcionan

### Impresión
- [ ] Formato A4 landscape
- [ ] Márgenes correctos (0.4in)
- [ ] Colores se ven (no b/n por defecto)
- [ ] Bordes negros
- [ ] Sin cortes de datos

---

**Estado Final**: ✨ READY FOR PRODUCTION

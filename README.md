# Sistema Faena 2.0

Resumen corto del stack y las herramientas detectadas en este repositorio.

## Stack real del proyecto

| Area | Herramientas | Uso principal |
| --- | --- | --- |
| Frontend | React 19, Vite, React Router DOM | Interfaz web y navegación |
| UI y visualización | Tailwind CSS, React Select, React Icons, Recharts, Framer Motion, Fontsource Montserrat | Estilos, selects, iconos, gráficos y animaciones |
| Comunicación | Axios | Consumo de API HTTP |
| Backend | Node.js, Express 5 | API REST |
| Base de datos | PostgreSQL, pg | Persistencia de datos |
| Seguridad | bcrypt, jsonwebtoken, dotenv, cors | Hashing, JWT, variables de entorno y CORS |
| Calidad | ESLint, Prettier | Lint y formato |
| Desarrollo | Nodemon | Recarga automática del backend |
| Build CSS | PostCSS, Autoprefixer | Procesamiento de estilos |
| Deploy | Vercel, Render | Frontend y backend en producción |

## Herramientas esenciales

Estas son las que hoy forman el núcleo operativo del proyecto.

- React 19
- Vite
- Tailwind CSS
- Axios
- React Router DOM
- React Select
- Recharts
- Framer Motion
- Node.js
- Express 5
- PostgreSQL
- pg
- bcrypt
- jsonwebtoken
- dotenv
- cors
- ESLint
- Nodemon
- PostCSS
- Autoprefixer
- Vercel
- Render

## Herramientas complementarias

No son el núcleo del negocio, pero sí agregan soporte útil o mejoran DX/UI.

- React Icons
- Fontsource Montserrat
- Prettier
- Alias `src` configurado en Vite
- Proxy local de Vite hacia `http://localhost:3000`
- Servicios frontend de caché, seguridad y performance en `frontend/src/services`
- Scripts de diagnóstico de rutas y conexión en `backend/scripts`

## Posible legado o uso no activo

Estas piezas existen en el repo, pero no aparecen como parte activa del flujo principal actual.

- `go.mod` está vacío
- `cmd/main.go` está vacío
- `configs/config.yaml` está vacío
- `backend/src/database/connectionPostgreSQL.js` parece una conexión antigua; los controladores actuales consumen `backend/src/db.js`

## Configuración relevante

- Frontend dev: `npm run dev` en `frontend`
- Frontend build: `npm run build` en `frontend`
- Backend dev: `npm run dev` en `backend`
- Backend start: `npm start` en `backend`
- Lint frontend: `npm run lint` en `frontend`
- Lint backend: `npm run lint` en `backend`

## Deploy detectado

- Vercel para el frontend, con SPA rewrite en `frontend/vercel.json`
- Render para el backend, inferido por la lógica de `frontend/src/services/api.js` y la conexión remota contemplada en `backend/src/db.js`

## Notas rápidas

- El frontend usa `/api` en localhost mediante proxy de Vite.
- En producción, el frontend detecta `sifadeco.vercel.app` y apunta al backend remoto en Render.
- La conexión principal a PostgreSQL está centralizada en `backend/src/db.js`.

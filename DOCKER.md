# Dockerización de SIFADECO

Este documento describe cómo levantar el sistema completo en un servidor Ubuntu sin Docker instalado.

## Requisitos previos

1. Instalar Docker y Docker Compose en Ubuntu.
2. Clonar el repositorio.
3. Copiar el archivo de variables de entorno.

## Pasos

```bash
git clone https://github.com/hern4N1995/SIFADECO.git
cd SIFADECO
cp .env.example .env
# Editar .env y definir JWT_SECRET, FRONTEND_ORIGINS, PGPASSWORD, etc.

docker compose up -d --build
```

## Servicios

- `db`: PostgreSQL con el esquema inicial cargado desde `./db-init/init.sql`.
- `backend`: Node.js + Express en `backend/src/App.js`.
- `frontend`: React + Vite build servido por nginx.

## Variables de entorno

- `PGHOST`: nombre del servicio PostgreSQL en docker-compose (`db`).
- `PGPORT`: puerto del contenedor PostgreSQL (`5432`).
- `PGUSER`: usuario de la base de datos.
- `PGPASSWORD`: contraseña de la base de datos.
- `PGDATABASE`: nombre de la base de datos.
- `JWT_SECRET`: secreto JWT para autenticación.
- `FRONTEND_ORIGINS`: orígenes permitidos para CORS (ej. `http://localhost,http://127.0.0.1`).
- `USE_REDIS`: `false` por defecto; si se habilita, también configurar `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`.

## Notas importantes

- El servicio `frontend` usa nginx con `proxy_pass http://backend:3000` en `/api` para que el frontend pueda hacer llamadas relativas a `/api`.
- El `backend` se conecta a PostgreSQL usando variables individuales (`PGHOST`, `PGPORT`, etc.) y no `DATABASE_URL`, así evita la rama de SSL forzado para proveedores remotos.
- El `db` tiene healthcheck con `pg_isready`; el `backend` espera a que la base de datos esté lista.

## Comandos útiles

- Levantar todo: `docker compose up -d --build`
- Ver logs: `docker compose logs -f`
- Parar: `docker compose down`
- Reconstruir frontend: `docker compose build frontend`

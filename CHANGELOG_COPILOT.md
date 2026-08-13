# CHANGELOG_COPILOT

## 2026-08-06

- Creé `backend/Dockerfile` usando Node 20 Alpine y multi-stage build.
- Creé `frontend/Dockerfile` para build con Vite y servir el `dist` con nginx:alpine.
- Añadí `frontend/nginx.conf` con `location /api` proxy_pass a `http://backend:3000` y headers `Host`, `X-Real-IP`, `X-Forwarded-For`.
- Añadí `docker-compose.yml` con servicios `db`, `backend` y `frontend`, red interna común y volumen persistente para PostgreSQL.
- Configuré el backend para usar variables individuales de Postgres (`PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`) y evitar la rama SSL forzado de `DATABASE_URL`.
- Añadí healthcheck `pg_isready` en el servicio `db` para que `backend` espere `condition: service_healthy`.
- Creé `.env.example` con todas las variables necesarias y comenté las variables de Redis como opcionales.
- Añadí `.dockerignore` en `backend` y `frontend`.
- Documenté el proceso en `DOCKER.md`.

Estado: completo

Próximos pasos:
- Probar localmente con `docker compose up -d --build`.
- Ajustar si hay errores de CORS o rutas relativas del frontend.

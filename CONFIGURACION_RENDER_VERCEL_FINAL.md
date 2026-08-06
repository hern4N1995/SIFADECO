# Configuración Render + Vercel - Sistema Faena 2.0

## ✅ Cambios realizados en el código

### 1. Backend (.env)
Actualizado con las nuevas credenciales de Render:
- `DB_HOST`: dpg-d60u482qcgvc7387br5g-a.oregon-postgres.render.com
- `DB_PORT`: 5432
- `DB_USER`: sifadecodb_user
- `DB_PASS`: lIeGDVuEAgJkQKCvIGyfwoR3o8cjSEEc
- `DB_NAME`: sifadecodb
- `FRONTEND_ORIGINS`: http://localhost:5173,https://sistema-faena2-0.vercel.app

### 2. Frontend (api.js)
Actualizada la URL de Render:
- De: `https://sistema-faena.onrender.com/api`
- A: `https://sifadeco.onrender.com/api`

---

## 📋 Pasos a realizar en Render

### En el dashboard de Render:

1. **Crear un Web Service**
   - Conectar el repositorio GitHub: `sistema-faena2.0`
   - Branch: `main`
   - Build command: `cd backend && npm install`
   - Start command: `npm start` (o `node src/App.js`)
   - Region: Oregon (misma que la BD)

2. **Configurar variables de entorno en Render:**
   ```
   PORT: 3000
   NODE_ENV: production
   DB_HOST: dpg-d60u482qcgvc7387br5g-a.oregon-postgres.render.com
   DB_PORT: 5432
   DB_USER: sifadecodb_user
   DB_PASS: lIeGDVuEAgJkQKCvIGyfwoR3o8cjSEEc
   DB_NAME: sifadecodb
   JWT_SECRET: S1f4D3c0*2o2S-Min_0F_Production
   FRONTEND_ORIGINS: http://localhost:5173,https://sistema-faena2-0.vercel.app
   ```

3. **Esperar a que se despliegue**
   - Render asignará una URL como: `https://sifadeco.onrender.com`
   - Verificar que `/api/health` responde correctamente

---

## 📋 Pasos a realizar en Vercel

### En el dashboard de Vercel:

1. **Verificar variables de entorno:**
   - `VITE_API_BASE_URL`: https://sifadeco.onrender.com/api (opcional, porque está hardcodeado en api.js)

2. **Redeploy el proyecto**
   - Ir a Deployments → Redeploy última versión
   - O hacer push a GitHub para trigger automático

3. **Verificar que funciona**
   - Acceder a https://sistema-faena2-0.vercel.app
   - Intentar login
   - Debe conectarse a https://sifadeco.onrender.com/api

---

## 🧪 Pruebas Locales

Para probar que todo funciona en localhost:

1. **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   - Debería escuchar en `http://localhost:3000`
   - Conexión a BD Render debe funcionar

2. **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   - Debería abrir en `http://localhost:5173`
   - Detectará localhost y usará `/api` relativo
   - Se conectará a `http://localhost:3000/api`

3. **Verificar:**
   - [ ] Login funciona en localhost
   - [ ] Datos se cargan correctamente
   - [ ] Sin errores de CORS

---

## 🔗 URLs Finales

| Entorno | Frontend | Backend |
|---------|----------|---------|
| Localhost | http://localhost:5173 | http://localhost:3000/api |
| Vercel + Render | https://sistema-faena2-0.vercel.app | https://sifadeco.onrender.com/api |

---

## ⚠️ Notas Importantes

1. **El backend en Render dormirá si no hay actividad** por 15 minutos en plan gratuito
   - Primera solicitud tardará ~30s en responder
   
2. **SSL en la BD** está configurado con `rejectUnauthorized: false`
   - Es seguro para Render que proporciona certificados válidos

3. **CORS está configurado** para permitir:
   - http://localhost:5173 (desarrollo)
   - https://sistema-faena2-0.vercel.app (producción)

4. **Si cambias la URL del backend** actualiza en:
   - [frontend/src/services/api.js](frontend/src/services/api.js) línea 17
   - Variables de entorno de Vercel (opcional, está hardcodeado)

---

## 🚀 Checklist de Despliegue

- [ ] BD Render conectada y funcionando
- [ ] Backend deployado en Render
- [ ] Frontend deployado en Vercel
- [ ] Login funciona en Vercel
- [ ] Login funciona en localhost
- [ ] No hay errores de CORS
- [ ] JWT_SECRET es consistente
- [ ] Variables de entorno correctas en Render

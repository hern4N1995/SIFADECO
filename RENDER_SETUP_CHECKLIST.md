# ✅ Checklist para Render - Backend

## Problema Actual
- ❌ Backend retorna error 500
- ❌ Vercel aún usa URL antigua (`sistema-faena.onrender.com`)

---

## 📋 Pasos en Render Dashboard

### 1. **Crear Web Service (si aún no existe)**
   - [ ] Conectar repo: `sistema-faena2.0`
   - [ ] Branch: `main`
   - [ ] Root Directory: `backend`
   - [ ] Build command: `npm install`
   - [ ] Start command: `npm start`

### 2. **Configurar Variables de Entorno**

**IMPORTANTE:** Estas deben estar en Render, NO en .env local

```
PORT=3000
NODE_ENV=production
DB_HOST=dpg-d60u482qcgvc7387br5g-a.oregon-postgres.render.com
DB_PORT=5432
DB_USER=sifadecodb_user
DB_PASS=lIeGDVuEAgJkQKCvIGyfwoR3o8cjSEEc
DB_NAME=sifadecodb
JWT_SECRET=S1f4D3c0*2o2S-Min_0F_Production
FRONTEND_ORIGINS=http://localhost:5173,https://sistema-faena2-0.vercel.app
```

### 3. **Desplegar**
   - [ ] Haz clic en "Deploy"
   - [ ] Espera a que salga "✓ Live" (puede tardar 3-5 minutos)
   - [ ] Anota la URL (debería ser `https://sifadeco.onrender.com`)

### 4. **Verificar que funciona**
   - [ ] Abre https://sifadeco.onrender.com/api/health en el navegador
   - [ ] Debería responder con JSON (no error 500)

---

## 📋 Pasos en Vercel Dashboard

### 1. **Forzar Redeploy**
   - [ ] Ve a https://vercel.com/dashboard
   - [ ] Selecciona el proyecto `sistema-faena2-0`
   - [ ] Haz clic en "Deployments"
   - [ ] Busca el último deployment
   - [ ] Haz clic en los 3 puntos (⋮) → "Redeploy"
   - [ ] Espera a que muestre "✓ Production"

### 2. **Verificar que funciona**
   - [ ] Abre https://sistema-faena2-0.vercel.app
   - [ ] Abre DevTools (F12) → Console
   - [ ] Debería mostrar: `API base (build): https://sifadeco.onrender.com/api`
   - [ ] Intenta hacer login
   - [ ] NO debería haber errores de CORS

---

## 🔗 URLs Finales

```
Frontend Vercel: https://sistema-faena2-0.vercel.app
Backend Render:  https://sifadeco.onrender.com
API Endpoint:    https://sifadeco.onrender.com/api
```

---

## 🛠️ Si aún hay error 500 en el backend

Revisa los **Logs** de Render:

1. Dashboard de Render → Tu Web Service
2. Haz clic en "Logs"
3. Busca líneas con `ERROR` o `Connection refused`
4. Verifica que:
   - [ ] Conecta a la BD correctamente (debería mostrar `✅ Conectado a PostgreSQL`)
   - [ ] No hay errores de syntaxis en el código
   - [ ] Puerto 3000 está disponible

---

## 📞 Troubleshooting

### Error: "Connection refused" en Render
- La BD probablemente no es accesible
- Verifica las credenciales en Render vs `.env`

### Error: "EADDRINUSE" en Render  
- Otro proceso usa puerto 3000
- Configura puerto dinámico: `PORT=${PORT:-3000}`

### Error: "Cannot find module" en Render
- Falta hacer `npm install`
- Verifica que Build command es: `npm install`

### Error 500 en /api/auth/login
- Backend está corriendo pero hay error en el controlador
- Revisa los Logs de Render


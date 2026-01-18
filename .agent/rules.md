# 🦅 MISSION CONTROL: REGLAS DE COMPORTAMIENTO (NIVEL DIOS)

Este documento es la **ÚNICA FUENTE DE VERDAD** técnica para el proyecto Sol del Amanecer. Rige la conducta de desarrolladores humanos y agentes de IA.

---

## 1. 🛡️ INTEGRIDAD Y CODEBASE
- **NO BORRAR:** Prohibido eliminar código funcional no relacionado con la tarea.
- **NO RESUMIR:** El output de código debe ser siempre completo y funcional.
- **CLEAN CODE:** Mantener la arquitectura de carpetas.
- **MONOREPO:**
  - `backend/`: API (Node.js/Express) en puerto 5000.
  - `frontend-sda/`: Dashboard (React/Vite) en puerto 5173.
  - `app-sda-chofer/`: App Móvil (Expo).

---

## 2. 🌐 GESTIÓN DE ENTORNOS (HYBRID PROTECTION)
Hemos implementado una estrategia de "Protección Híbrida" para erradicar el error de `localhost` en producción.

### A. Estrategia de URLs
- **Desarrollo (`.env` local):**
  - El sistema detecta `import.meta.env.DEV`.
  - Usa automáticamente `http://localhost:5000`.
- **Producción (Hostinger/VPS):**
  - El sistema detecta `!DEV`.
  - **HARDCODED:** Usa forzosamente `https://api-choferes.cotizadorlogistico.site`.
  - *Nota:* Ya no dependemos de variables de entorno frágiles en el build de producción.

### B. Archivos de Configuración Permitidos
- ✅ `frontend-sda/.env` (Solo para local)
- ✅ `backend/.env` (Secretos del servidor)
- 🗑️ **PROHIBIDO:** Crear `.env.production` o `.env.local_dev` redundantes.

---

## 3. 🚀 PROTOCOLO DE DESPLIEGUE (VPS & HOSTINGER)

### A. Backend (VPS - 69.62.86.69)
1.  **Conexión:** `ssh root@69.62.86.69`
2.  **Sync:** `cd /var/www/soldelamanecer/backend && git pull origin main`
3.  **Install:** `npm install` (solo si hay nuevas dependencias).
4.  **Restart:** `pm2 restart sda-backend`
5.  **Nginx (God Mode):**
    - Configuración especial en `/etc/nginx/sites-enabled/api-choferes`.
    - Usa `alias` para `/uploads` (sin pasar por Node).
    - Usa headers CORS dinámicos (`$http_origin`) para permitir credenciales.

### B. Frontend (Hostinger)
1.  **Build:** Ejecutar `npm run build:vps` en `frontend-sda/`.
    - Este script usa la lógica híbrida para "quemar" la URL de producción.
2.  **Artifact:** Se genera `FINAL_SOL_DEL_AMANECER_UPLOAD.zip`.
3.  **Deploy:** Subir este ÚNICO archivo a Hostinger y descomprimir en `public_html`.

---

## 4. 📸 GESTIÓN DE CURSOS Y FOTOS (STATIC ASSETS)
- **Almacenamiento:** Las imágenes viven en `backend/uploads`.
- **Acceso:** Se sirven directamente vía Nginx desde `https://api-choferes.cotizadorlogistico.site/uploads/...`.
- **Seguridad:** Nginx añade `Access-Control-Allow-Origin` dinámico para permitir que el frontend las cargue sin bloqueos CORS.

---

## 5. ⚠️ MANDAMIENTOS FINALES
1.  **PRE-CHECK:** Antes de cerrar una tarea, verifica que no has roto el entorno local.
2.  **LIMPIEZA:** Nunca dejes archivos `.zip` o carpetas `temp_` en el repositorio.
3.  **DB:** La base de datos siempre es `soldelamanecer`. No tocar otras DBs en el VPS.

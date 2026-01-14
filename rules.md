# MISSION CONTROL: REGLAS DE COMPORTAMIENTO (NIVEL DIOS)

Este documento rige la conducta del desarrollador/IA en el proyecto Sol del Amanecer.

---

## 1. INTEGRIDAD DEL CÓDIGO (REGLA DE ORO 🚫)
- **NO BORRAR:** Está terminantemente prohibido eliminar código existente que no esté relacionado con la tarea actual.
- **NO RESUMIR:** El output debe ser el archivo COMPLETO y funcional. Nunca uses `// ... resto del código ...`.
- **PRESERVACIÓN:** Mantén las importaciones y dependencias intactas.

---

## 2. CALIDAD DE INGENIERÍA 🧠
- **CERO PARCHES:** Se prohíben los arreglos sucios. Encuentra la **causa raíz**.
- **ESTÁNDARES:** Paginación y lógica pesada en el Backend. Frontend centrado en UI/UX premium.
- **CLEAN CODE:** Respeta la arquitectura de carpetas y patrones existentes.

---

## 3. GESTIÓN DE ENTORNOS (.env / Config) 🌐
- **DIFERENCIACIÓN:** No mezcles URLs de desarrollo (`localhost`) con producción (`api-choferes...`) en el código.
- **PROTOCOLO FRONTEND:** Antes de un deploy a Hostinger, `VITE_API_SISTEMA` debe ser el dominio HTTPS del VPS en el `.env`.
- **APP MÓVIL:** La URL de la API se configura en `app-sda-chofer/src/api/client.ts`. Verificar siempre antes de un build APK.
- **PERSISTENCIA:** Nunca subas archivos `.env` o carpetas `uploads/` a Git.

---

## 4. SEGURIDAD Y SINCRONIZACIÓN DE DATOS (CRÍTICO 🔒)
- **DB NAME:** La base de datos es `soldelamanecer` en todos los entornos (Local y VPS). NO renombrar.
- **SINCRONIZACIÓN:** Los datos viajan de Desarrollo -> Producción vía `mongodump`/`mongorestore`. Ver comandos en `rules_vps.md`.
- **INTEGRIDAD:** No inventes columnas ni cambies tipos de datos sin autorización.
- **COLECCIONES:** Usar `localidadesSistema` para el módulo de logística.

---

## 5. ESTRUCTURA DEL MONOREPO 📂
- `backend/`: API Monolítica (Node.js/Express). Puerto 5000.
- `frontend-sda/`: Dashboard Administrativo (React/Mantine). Puerto 5173.
- `app-sda-chofer/`: Aplicación Móvil (React Native/Expo).

---

## 6. VERIFICACIÓN (TESTING) ✅
- **TESTEAR SIEMPRE:** Al terminar, genera pruebas (scripts o logs) que demuestren el funcionamiento y la ausencia de regresiones.
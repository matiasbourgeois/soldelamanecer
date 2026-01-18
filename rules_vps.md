# Arquitectura y Reglas del VPS - Sol del Amanecer (Nivel Dios)

Este documento es la fuente de verdad técnica para el entorno de producción. Cualquier intervención (humana o IA) debe seguir estas reglas para evitar caídas del sistema o pérdida de datos.

---

## 🌐 Información de Red e Infraestructura
- **IP Pública:** `69.62.86.69`
- **Dominio API:** `api-choferes.cotizadorlogistico.site` (Servido vía HTTPS)
- **Dominio Frontend:** `soldelamanecer.ar` (Hostinger)
- **Usuario SSH:** `root`
- **OS:** Ubuntu 22.04 LTS

---

## 🚀 Aplicaciones y Hosting (PM2)
El servidor aloja múltiples aplicaciones. **NUNCA** modificar o detener aplicaciones ajenas a "Sol del Amanecer".

NO TOCAR NUNCA LA DB DE cotizadorRutas-db del VPS

| Aplicación | Puerto | Directorio | Descripción |
| :--- | :--- | :--- | :--- |
| `sda-backend` | `5000` | `/var/www/soldelamanecer` | Backend Monolítico SDA (Node.js) |
| `cotizador-backend` | `3333` | `/var/www/cotizador` | Aplicación externa (PROHIBIDO TOCAR) |

---

## 🛠️ Configuración del Backend (SDA)
- **Directorio:** `/var/www/soldelamanecer`
- **Workflow de Actualización:** Repositorio Git enlazado a GitHub.
- **Rama Oficial:** `feature/mantenimiento-nivel-dios` (o `main` según fase).
- **Persistencia Física:** El archivo `.env` y la carpeta `uploads/` NO están en Git y deben preservarse.

### Procedimiento de Actualización Seguro:
1. `cd /var/www/soldelamanecer`
2. `git fetch origin`
3. `git reset --hard origin/feature/mantenimiento-nivel-dios`
4. `npm install --omit=dev`
5. `pm2 restart sda-backend`
6. `pm2 flush sda-backend` (para limpiar logs viejos)

---

## 🔌 Configuración Nginx y SSL
- **Ruta Config:** `/etc/nginx/sites-enabled/api-choferes`
- **Proxy Inverso:** Redirige el tráfico desde el dominio SSL hacia `localhost:5000/api/`.
- **SSL:** Gestionado por Certbot.

---

## 🗄️ Base de Datos (MongoDB)
- **Instancia:** Local (Puerto 27017).
- **Nombre Base:** `soldelamanecer` (ÚNICA FUENTE DE VERDAD).

### Sincronización de Datos (Local -> VPS):
Para pasar datos de desarrollo a producción:
1. **Local:** `mongodump --db soldelamanecer --archive=sda_site.archive`
2. **Subir:** `scp sda_site.archive root@69.62.86.69:/tmp/`
3. **VPS:** `mongorestore --db soldelamanecer --archive=/tmp/sda_site.archive --drop`

---

## 💻 Despliegue de Frontend (Hostinger)
El frontend se sirve desde Hostinger, pero consume la API del VPS.
1. **Config `.env` local:** `VITE_API_SISTEMA=https://api-choferes.cotizadorlogistico.site`
2. **Build:** `npm run build` en `frontend-sda/`.
3. **Deploy:** Subir el contenido de `dist/` a Hostinger.

> [!CAUTION]
> Si el frontend apunta a `localhost:5000` en producción, el sistema se verá vacío. Verificar siempre las variables de entorno antes de compilar.

---

# 📜 Pacto de los Dioses: Protocolo de Despliegue Infalible

Este protocolo es de cumplimiento **OBLIGATORIO** para cualquier IA o humano. Su objetivo es erradicar el error de `localhost` en producción y garantizar la integridad de los ambientes.

### 1. El Seguro de Construcción (Pre-build Check)
**PROHIBIDO** generar un build que contenga la cadena `http://localhost`. 
*   **Acción**: Antes de comprimir el `dist/`, se debe verificar que las URLs apunten a `https://api-choferes.cotizadorlogistico.site`.
*   **Automatización**: Se recomienda usar `npm run build:prod` (o similar) vinculado exclusivamente a `.env.vps`.

### 2. Gestión de Entornos (Strict Env Policy)
*   **Ambiente Local (`.env`)**: Solo para desarrollo. Nunca debe tocarse durante un despliegue.
*   **Ambiente de Producción (`.env.vps`)**: Fuente de verdad para despliegues a Hostinger.
*   **Consistencia**: Cualquier cambio en la lógica de red debe reflejarse en ambos ambientes de forma simétrica.

### 3. El Ritual de Despliegue (Paso a Paso)

#### A. Backend (VPS):
1.  **SSH Interactivo**: Entrar siempre al entorno (`ssh root@69.62.86.69`).
2.  **Sincronización**: `git fetch origin && git reset --hard origin/main`.
3.  **Instalación**: `npm install --omit=dev`.
4.  **Reinicio**: `pm2 restart sda-backend && pm2 flush sda-backend`.
5.  **Verificación**: `pm2 status` y revisión de logs.

#### B. Frontend (Hostinger):
1.  **Configuración**: Cargar `.env.vps` con la URL de la API real.
2.  **Build**: Ejecutar construcción en modo producción.
3.  **Validación**: Buscar "localhost" en `dist/`. Si existe, **abortar**.
4.  **ZIP**: Generar `frontend_build_god_tier.zip`.
5.  **Hostinger**: Subir y descomprimir.

### 4. Mandato para Futuras IAs
Cualquier asistente de IA que trabaje en este repositorio **DEBE** leer este archivo íntegramente antes de proponer cualquier cambio en el flujo de despliegue o configuración de red. El incumplimiento de este protocolo se considera un fallo crítico en la ejecución de la tarea.

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
- **Colección Crítica:** `localidadesSistema` (Contiene los 103 registros unificados. NO usar `localidades`).

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

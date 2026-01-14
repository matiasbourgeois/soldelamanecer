# Arquitectura y Reglas del VPS - Sol del Amanecer

Este documento establece las reglas y la configuración del servidor VPS para asegurar la estabilidad del sistema y facilitar el mantenimiento por parte de cualquier IA o desarrollador.

## Información de Red e Infraestructura
- **IP Pública:** `69.62.86.69`
- **Dominio Principal:** `soldelamanecer.ar`
- **Usuario SSH:** `root`
- **SO:** Ubuntu 22.04 LTS

## Aplicaciones Hosting (PM2)
El servidor aloja múltiples aplicaciones. **NUNCA** modificar o detener aplicaciones ajenas a "Sol del Amanecer".

| Aplicación | Puerto | Directorio | Descripción |
| :--- | :--- | :--- | :--- |
| `sda-backend` | `5000` | `/var/www/soldelamanecer` | Backend unificado SDA (Node.js) |
| `cotizador-backend` | `3333` | `/var/www/cotizador` | Otra aplicación (NO TOCAR) |

## Configuración del Backend (SDA)
- **Directorio:** `/var/www/soldelamanecer`
- **Gestión de Versiones:** Repositorio Git conectado a `https://github.com/matiasbourgeois/soldelamanecer.git`.
- **Rama de Trabajo Actual:** `feature/mantenimiento-nivel-dios`
- **Persistence:** Archivo `.env` y carpeta `uploads/` (fotos choferes) están en `.gitignore` y deben preservarse siempre.

## Procedimiento de Actualización (Safe Update)
Para actualizar el backend sin romper nada, seguir estrictamente estos pasos:

1. **Entrar al directorio:** `cd /var/www/soldelamanecer`
2. **Backup Preventivo (Opcional):** `cp -r . ../backup_manual_$(date +%F)`
3. **Sincronizar Git:** 
   ```bash
   git fetch origin
   git reset --hard origin/feature/mantenimiento-nivel-dios
   ```
4. **Instalar Dependencias:** `npm install --production`
5. **Reiniciar Servicio:** `pm2 restart sda-backend`

## Configuración Nginx
- Archivo de configuración: `/etc/nginx/sites-enabled/soldelamanecer`
- Gestiona tanto el frontend (dist) como el proxy inverso para la API en `/api/`.
- SSL gestionado por Certbot (Let's Encrypt).

## Base de Datos
- **Instancia:** MongoDB Local (Puerto 27017).
- **Base de Datos:** `soldelamanecer`.

> [!WARNING]
> Cualquier cambio en la configuración de Nginx o PM2 fuera del contexto de `sda-backend` debe ser consultado previamente. No modificar puertos de otras aplicaciones.

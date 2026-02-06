// tasks/cronGenerarHojas.js
const cron = require("node-cron");
const { generarHojasAutomaticas } = require("../controllers/logistica/hojaRepartoController");
const logger = require("../utils/logger");

/**
 * Motor de Generación Silenciosa (Phase 1)
 * Configurado para ejecutarse a las 00:01 AM Hora Argentina (GMT-3)
 */
const iniciarGeneracionAutomatica = () => {
    // 00:01 AR = 03:01 UTC
    // Si el servidor está en UTC, usamos "1 3 * * *"
    // Si el servidor permite timezone en node-cron:
    cron.schedule("1 0 * * *", async () => {
        logger.info("🕐 Ejecutando tarea programada: Generación Silenciosa de Hojas (00:01 AR)");

        // Obtenemos la fecha actual para la generación
        const hoy = new Date();

        try {
            const resultados = await generarHojasAutomaticas(hoy);
            logger.info(`✅ Generación automática completada. Hojas creadas: ${resultados.creadas}, Saltadas: ${resultados.saltadas}, Errores: ${resultados.errores}`);
        } catch (error) {
            logger.error("❌ Error en tarea programada de generación automática:", error);
        }
    }, {
        timezone: "America/Argentina/Cordoba"
    });
};

module.exports = iniciarGeneracionAutomatica;

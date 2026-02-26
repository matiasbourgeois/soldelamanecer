// tasks/cronGenerarHojas.js
const cron = require("node-cron");
const { generarHojasAutomaticas } = require("../controllers/logistica/hojaRepartoController");
const logger = require("../utils/logger");
const { esFeriado } = require("../services/feriadoService");

/**
 * Motor de Generación Silenciosa (Phase 1)
 * Configurado para ejecutarse a las 00:01 AM Hora Argentina (GMT-3)
 * Valida feriados nacionales antes de generar hojas
 */
const iniciarGeneracionAutomatica = () => {
    cron.schedule("1 0 * * *", async () => {
        logger.info("🕐 Ejecutando tarea programada: Generación Silenciosa de Hojas (00:01 AR)");

        // Parsear hora estricta de Argentina para evitar saltos de día en hosts UTC
        const moment = require('moment-timezone');
        const hoy = moment().tz('America/Argentina/Buenos_Aires').toDate();

        // Verificar si es feriado nacional
        const esFeriadoNacional = await esFeriado(hoy);

        if (esFeriadoNacional) {
            logger.info("🏖️ HOY ES FERIADO NACIONAL - No se generarán hojas de reparto automáticas");
            return;
        }

        try {
            const resultados = await generarHojasAutomaticas(hoy, esFeriadoNacional);
            logger.info(`✅ Generación automática completada. Hojas creadas: ${resultados.creadas}, Saltadas: ${resultados.saltadas}, Errores: ${resultados.errores}`);
        } catch (error) {
            logger.error("❌ Error en tarea programada de generación automática:", error);
        }
    }, {
        timezone: "America/Argentina/Cordoba"
    });

    logger.info("✅ Cron de generación automática inicializado (00:01 AR)");
};

module.exports = iniciarGeneracionAutomatica;

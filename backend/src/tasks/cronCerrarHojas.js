// tasks/cronCerrarHojas.js
const cron = require("node-cron");
const { cerrarHojasVencidas } = require("../controllers/logistica/hojaRepartoController");
const logger = require("../utils/logger");

const iniciarCierreAutomatico = () => {
  // Ejecuta todos los días a las 00:30 (Ajustado según lógica previa)
  cron.schedule("30 0 * * *", async () => {

    logger.info("🕐 Ejecutando tarea programada: cierre automático de hojas vencidas");

    const ahora = new Date();

    // Ajustamos la fecha para obtener el "ayer" en hora ARGENTINA (GMT-3)
    const offsetHoraArgentina = -3; // GMT-3
    const ayerUTC = new Date(Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate() - 1,
      -offsetHoraArgentina // compensar para que sea el "ayer" en Argentina
    ));

    logger.info("📆 Fecha calculada como AYER (Argentina -> UTC): %s", ayerUTC.toISOString());

    try {
      await cerrarHojasVencidas(ayerUTC);
      logger.info("✅ Cierre automático de hojas completado exitosamente.");
    } catch (error) {
      logger.error("❌ Error en tarea programada de cierre automático:", error);
    }
  });
};

module.exports = iniciarCierreAutomatico;
// tasks/cronCerrarHojas.js
const cron = require("node-cron");
const { cerrarHojasVencidas } = require("../controllers/logistica/hojaRepartoController");
const logger = require("../utils/logger");

const iniciarCierreAutomatico = () => {
  // Ejecuta todos los días a las 00:30 (Ajustado según lógica previa)
  cron.schedule("30 0 * * *", async () => {

    logger.info("🕐 Ejecutando tarea programada: cierre automático de hojas vencidas");

    const moment = require('moment-timezone');

    // Calcular "Ayer" con la precisión absoluta de Buenos Aires, independientemente de dónde corra el node server
    const ayerArg = moment().tz('America/Argentina/Buenos_Aires').subtract(1, 'days').toDate();

    logger.info("📆 Fecha calculada como AYER (Argentina): %s", ayerArg.toISOString());

    try {
      await cerrarHojasVencidas(ayerArg);
      logger.info("✅ Cierre automático de hojas completado exitosamente.");
    } catch (error) {
      logger.error("❌ Error en tarea programada de cierre automático:", error);
    }
  }, {
    timezone: "America/Argentina/Cordoba"
  });
};

module.exports = iniciarCierreAutomatico;
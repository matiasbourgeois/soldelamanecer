// tasks/cronCerrarHojas.js
const cron = require("node-cron");
const { cerrarHojasVencidas } = require("../controllers/logistica/hojaRepartoController");

const iniciarCierreAutomatico = () => {
  // Ejecuta todos los días a las 16:03 hora ARGENTINA (GMT-3)
  cron.schedule("30 0 * * *", async () => {

    console.log("🕐 Ejecutando tarea programada: cierre automático de hojas vencidas");

    const ahora = new Date();

    // Ajustamos la fecha para obtener el "ayer" en hora ARGENTINA (GMT-3)
    const offsetHoraArgentina = -3; // GMT-3
    const ayerUTC = new Date(Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate() - 1,
      -offsetHoraArgentina // compensar para que sea el "ayer" en Argentina
    ));

    console.log("📆 Fecha calculada como AYER (Argentina -> UTC):", ayerUTC.toISOString());

    await cerrarHojasVencidas(ayerUTC); // esta función trabaja con fechas UTC
  });
};

module.exports = iniciarCierreAutomatico;
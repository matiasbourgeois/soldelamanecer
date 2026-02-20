const cron = require('node-cron');
const LiquidacionContratado = require('../models/LiquidacionContratado');
const logger = require('../utils/logger');

// Cronjob: Corre todos los días a las 02:00 AM
const cronLiquidaciones = () => {
    cron.schedule('0 2 * * *', async () => {
        logger.info('🕒 [CRON] Ejecutando validación de Liquidaciones Tácitas...');

        try {
            // Se considerarán vencidas tras 3 días = 72 horas
            const TRES_DIAS_MILISEGUNDOS = 3 * 24 * 60 * 60 * 1000;
            const fechaLimite = new Date(Date.now() - TRES_DIAS_MILISEGUNDOS);

            // Buscar liquidaciones 'enviado' que superen los 3 días enviadas
            const liquidacionesVencidas = await LiquidacionContratado.find({
                estado: 'enviado',
                'fechas.envio': { $lte: fechaLimite }
            });

            if (liquidacionesVencidas.length === 0) {
                logger.info('🕒 [CRON] No hay liquidaciones pendientes de aceptación tácita.');
                return;
            }

            logger.info(`🕒 [CRON] Se encontraron ${liquidacionesVencidas.length} liquidaciones para aceptar automáticamente.`);

            let aceptadas = 0;
            for (const liq of liquidacionesVencidas) {
                try {
                    liq.estado = 'aceptado_automatico';
                    liq.fechas.aceptacion = new Date();

                    // Opcionalmente borrar el token de seguridad ya que caducó la ventana
                    // liq.tokenAceptacion = undefined; 

                    await liq.save();
                    aceptadas++;
                    logger.info(`✅ Liquidación ${liq._id} (Chofer ${liq.chofer}) aceptada tácitamente.`);
                } catch (err) {
                    logger.error(`❌ Error actualizando liquidación ${liq._id}:`, err);
                }
            }

            logger.info(`🕒 [CRON] Finalizado. Se procesaron exitosamente ${aceptadas}/${liquidacionesVencidas.length}.`);

        } catch (error) {
            logger.error('❌ Error general en cronLiquidaciones:', error);
        }
    }, {
        scheduled: true,
        timezone: "America/Argentina/Buenos_Aires"
    });
};

module.exports = cronLiquidaciones;

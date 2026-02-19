const cron = require("node-cron");
const HojaReparto = require("../models/HojaReparto");
const logger = require("../utils/logger");

/**
 * Función que cambia estados de hojas "pendiente" a "en reparto"
 * según la hora de salida configurada en la ruta
 */
const cambiarEstadosSegunHora = async () => {
    try {
        const ahora = new Date();
        // ⚠️ IMPORTANTE: usar toLocaleTimeString con TZ Argentina.
        // getHours() devuelve hora UTC del servidor, no hora Argentina (UTC-3).
        // Eso causaba que hojas pasaran a 'en reparto' 3 horas antes de su horaSalida.
        const horaActual = ahora.toLocaleTimeString('es-AR', {
            timeZone: 'America/Argentina/Buenos_Aires',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        });


        logger.info(`⏰ Verificando hojas pendientes (hora actual: ${horaActual})...`);

        // Buscar hojas pendientes de hoy
        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);

        const hojasPendientes = await HojaReparto.find({
            estado: 'pendiente',
            fecha: { $gte: inicioDia, $lte: finDia }
        }).populate('ruta');

        if (hojasPendientes.length === 0) {
            logger.info(`📋 No hay hojas pendientes para verificar.`);
            return;
        }

        logger.info(`📋 Verificando ${hojasPendientes.length} hojas pendientes...`);

        let cambios = 0;

        for (const hoja of hojasPendientes) {
            const horaSalida = hoja.ruta?.horaSalida;

            if (!horaSalida) {
                continue;
            }

            // Comparar strings de hora (formato HH:MM)
            if (horaActual >= horaSalida) {
                hoja.estado = 'en reparto';
                hoja.historialMovimientos.push({
                    usuario: null,
                    accion: `Cambio automático a EN REPARTO (hora salida: ${horaSalida}, hora actual: ${horaActual})`
                });

                await hoja.save();

                logger.info(`🚚 Hoja ${hoja.numeroHoja || hoja._id} cambió a EN REPARTO (ruta: ${hoja.ruta?.codigo})`);
                cambios++;
            }
        }

        if (cambios > 0) {
            logger.info(`✅ ${cambios} hojas cambiadas a EN REPARTO`);
        } else {
            logger.info(`📋 Ninguna hoja lista para cambiar a EN REPARTO aún`);
        }

    } catch (error) {
        logger.error("❌ Error cambiando estados automáticamente:", error);
    }
};

/**
 * Inicializa el cron de cambio automático de estados
 * Se ejecuta cada 15 minutos para verificar horarios de salida
 */
const iniciarCambioAutomaticoEstados = () => {
    cron.schedule("*/15 * * * *", cambiarEstadosSegunHora, {
        timezone: "America/Argentina/Cordoba"
    });

    logger.info("✅ Cron de cambio de estados inicializado (cada 15 minutos)");
};

module.exports = iniciarCambioAutomaticoEstados;

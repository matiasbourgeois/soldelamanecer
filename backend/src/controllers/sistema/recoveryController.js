const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { esFeriado } = require('../../services/feriadoService');
const { generarHojasAutomaticas, cerrarHojasVencidas } = require('../logistica/hojaRepartoController');
const HojaReparto = require('../../models/HojaReparto');
const logger = require('../../utils/logger');

// Motor de Retroceso Temporal (Time Machine)
exports.recuperarDiasCaidos = async (req, res) => {
    try {
        const { fechaInicio, fechaFin } = req.body;

        if (!fechaInicio || !fechaFin) {
            return res.status(400).json({ error: "Debe proveer fechaInicio y fechaFin" });
        }

        const fInicio = moment.tz(fechaInicio, "YYYY-MM-DD", 'America/Argentina/Buenos_Aires').startOf('day');
        const fFin = moment.tz(fechaFin, "YYYY-MM-DD", 'America/Argentina/Buenos_Aires').startOf('day');

        if (fInicio.isAfter(fFin)) {
            return res.status(400).json({ error: "fechaInicio debe ser menor o igual a fechaFin" });
        }

        // Limitamos para no explotar el servidor (máx 15 días de recuperación seguidos)
        const duracionDias = fFin.diff(fInicio, 'days');
        if (duracionDias > 15) {
            return res.status(400).json({ error: "Solo se puede recuperar un máximo de 15 días a la vez" });
        }

        logger.info(`⏱️ INICIANDO PROTOCOLO ANTIMATERIA: Recuperando desde ${fInicio.format('YYYY-MM-DD')} hasta ${fFin.format('YYYY-MM-DD')}`);

        const reporteFinal = [];
        let iterador = fInicio.clone();

        while (iterador.isSameOrBefore(fFin)) {
            const fechaIterada = iterador.clone().toDate();
            const fechaString = iterador.format('YYYY-MM-DD');
            let reporteDia = {
                fecha: fechaString,
                creadas: 0,
                saltadas: 0,
                errores: 0,
                pasadasAReparto: 0,
                cerradas: 0,
                feriado: false,
                mensaje: ""
            };

            logger.info(`\n======================================================`);
            logger.info(`⏳ PROCESANDO DÍA: ${fechaString}`);

            // 1. Check Feriado
            const esFeriadoLocal = await esFeriado(fechaIterada);
            if (esFeriadoLocal) {
                logger.info(`🏖️ Día feriado. Omitiendo generación.`);
                reporteDia.feriado = true;
                reporteDia.mensaje = "Omitido por feriado nacional.";
                reporteFinal.push(reporteDia);
                iterador.add(1, 'days');
                continue;
            }

            // 2. FASE MAÑANA (Generación)
            logger.info(`   > Fase Mañana: Generando hojas...`);
            // generarHojasAutomaticas ya tiene el blindaje adentro: si la hoja para una ruta ya existe ese día, la salta
            const resultadosGeneracion = await generarHojasAutomaticas(fechaIterada, false);
            if (resultadosGeneracion) {
                reporteDia.creadas = resultadosGeneracion.creadas;
                reporteDia.saltadas = resultadosGeneracion.saltadas;
                reporteDia.errores = resultadosGeneracion.errores;
            }

            // 3. FASE TARDE (Pasar a En Reparto)
            // Aquí avanzamos TODAS las hojas regulares pendientes del día.
            // Las hojas manuales/especiales "SDA-ESPECIAL" no tienen horaSalida válida en ruta, por lo que serán ignoradas
            logger.info(`   > Fase Tarde: Avanzando pendientes a En Reparto...`);
            const finDiaIterado = iterador.clone().endOf('day').toDate();

            const hojasPendientesDia = await HojaReparto.find({
                estado: 'pendiente',
                fecha: { $gte: fechaIterada, $lte: finDiaIterado }
            }).populate('ruta');

            for (const hoja of hojasPendientesDia) {
                if (hoja.ruta && hoja.ruta.horaSalida) {
                    hoja.estado = 'en reparto';
                    hoja.historialMovimientos.push({
                        usuario: req.usuario?._id || null,
                        accion: `Cambio a EN REPARTO generado por Time Machine`
                    });
                    await hoja.save();
                    reporteDia.pasadasAReparto++;
                }
            }

            // 4. FASE NOCHE (Cerrar Hojas Vencidas)
            logger.info(`   > Fase Noche: Cerrando hojas...`);
            // cerrarHojasVencidas toma las que están "en reparto" en ese rango horario y las pasa a "cerrada"
            await cerrarHojasVencidas(fechaIterada);
            // Validamos cuántas terminaron cerradas para reflejarlo en el reporte
            const hojasCerradasTerminadas = await HojaReparto.countDocuments({
                estado: 'cerrada',
                cerradaAutomaticamente: true,
                fecha: { $gte: fechaIterada, $lte: finDiaIterado },
                'historialMovimientos.accion': "cerrado automático por vencimiento de fecha"
            });
            reporteDia.cerradas = hojasCerradasTerminadas;

            reporteDia.mensaje = "Día procesado exitosamente.";
            reporteFinal.push(reporteDia);

            logger.info(`✅ Fin del día ${fechaString}.`);
            // Avanzar 1 día
            iterador.add(1, 'days');
        }

        logger.info(`🎉 PROTOCOLO ANTIMATERIA COMPLETADO`);

        res.status(200).json({
            mensaje: "Recuperación completada",
            reporte: reporteFinal
        });

    } catch (error) {
        logger.error("❌ Error Fatal en Recuperación Antimateria:", error);
        res.status(500).json({ error: "Error interno durante la recuperación", detalle: error.message });
    }
};

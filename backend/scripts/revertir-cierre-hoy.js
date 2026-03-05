require('dotenv').config();
const mongoose = require('mongoose');
const HojaReparto = require('../src/models/HojaReparto');
const moment = require('moment-timezone');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function revertirCierreHoy() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        // Rango de fechas: HOY (5 de Marzo de 2026)
        const inicioDia = moment.tz("2026-03-05T00:00:00", 'America/Argentina/Buenos_Aires').toDate();
        const finDia = moment.tz("2026-03-05T23:59:59", 'America/Argentina/Buenos_Aires').toDate();

        console.log(`\n======================================================`);
        console.log(`⏳ BUSCANDO HOJAS DE HOY CERRADAS PREMATURAMENTE (05/03/2026)`);
        console.log(`======================================================`);

        // Buscamos las que se cerraron automáticamente hoy
        const hojasAfectadas = await HojaReparto.find({
            estado: 'cerrada',
            cerradaAutomaticamente: true,
            fecha: { $gte: inicioDia, $lte: finDia }
        });

        console.log(`📋 Se encontraron ${hojasAfectadas.length} hojas afectadas por el cierre adelantado.`);

        let revertidas = 0;

        for (const hoja of hojasAfectadas) {
            // Revertir a 'pendiente' para que el Cron de 5 minutos las tome si corresponde
            hoja.estado = 'pendiente';
            hoja.cerradaAutomaticamente = false;

            // Si el array de envios tiene algo, como acababan de nacer no deberia, pero por las dudas
            // Y le agregamos al historial
            hoja.historialMovimientos.push({
                usuario: null,
                accion: `Reversión administrativa: levantamiento prematuro corregido (vuelve a curso normal)`
            });

            await hoja.save();
            console.log(`🔄 Hoja ${hoja.numeroHoja} restaurada a PENDIENTE`);
            revertidas++;
        }

        console.log(`\n🎉====================================================🎉`);
        console.log(`          REVERSIÓN COMPLETADA`);
        console.log(`          Total restauradas a su curso: ${revertidas}`);
        console.log(`🎉====================================================🎉`);

    } catch (e) {
        console.error("❌ Error Fatal en script de reversión:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

revertirCierreHoy();

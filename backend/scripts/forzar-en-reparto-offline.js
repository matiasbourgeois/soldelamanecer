require('dotenv').config();
const mongoose = require('mongoose');
const HojaReparto = require('../src/models/HojaReparto');
require('../src/models/Ruta'); // Fix MissingSchemaError
const moment = require('moment-timezone');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function forzarEnReparto() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        // Rango de fechas: 4 y 5 de Marzo de 2026
        const inicio = moment.tz("2026-03-04T00:00:00", 'America/Argentina/Buenos_Aires').toDate();
        const fin = moment.tz("2026-03-05T23:59:59", 'America/Argentina/Buenos_Aires').toDate();

        console.log(`\n======================================================`);
        console.log(`⏳ BUSCANDO HOJAS 'PENDIENTES' DEL 04/03 Y 05/03 PARA PASAR A 'EN REPARTO'`);
        console.log(`======================================================`);

        const hojasPendientes = await HojaReparto.find({
            estado: 'pendiente',
            fecha: { $gte: inicio, $lte: fin }
        }).populate('ruta');

        console.log(`📋 Se encontraron ${hojasPendientes.length} hojas pendientes en ese rango.`);

        let cambiadas = 0;

        for (const hoja of hojasPendientes) {
            hoja.estado = 'en reparto';
            hoja.historialMovimientos.push({
                usuario: null,
                accion: `Cambio automático a EN REPARTO (Simulación retroactiva por servidor apagado)`
            });

            await hoja.save();
            console.log(`🚚 Hoja ${hoja.numeroHoja} cambió a EN REPARTO`);
            cambiadas++;
        }

        console.log(`\n🎉====================================================🎉`);
        console.log(`          CAMBIO MASIVO A 'EN REPARTO' COMPLETADO`);
        console.log(`          Total cambiadas: ${cambiadas}`);
        console.log(`🎉====================================================🎉`);

    } catch (e) {
        console.error("❌ Error Fatal en script de forzar en reparto:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

forzarEnReparto();

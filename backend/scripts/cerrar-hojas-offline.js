require('dotenv').config();
const mongoose = require('mongoose');
const { cerrarHojasVencidas } = require('../src/controllers/logistica/hojaRepartoController');
const moment = require('moment-timezone');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function runCierreVencidas() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        // Fechas a procesar como "Ayer", simulando que el cron se ejecutó en la madrugada de los días 3, 4, 5.
        // El cron "de hoy" cierra las de "ayer". Por lo que si queremos cerrar el 2, le pasamos la medianoche del 2, etc.
        const fechasPasadas = [
            moment.tz("2026-03-04T12:00:00", 'America/Argentina/Buenos_Aires').toDate(),
            moment.tz("2026-03-05T12:00:00", 'America/Argentina/Buenos_Aires').toDate()
        ];

        for (const fecha of fechasPasadas) {
            console.log(`\n======================================================`);
            console.log(`⏳ EJECUTANDO CIERRE AUTOMÁTICO PARA EL DÍA: ${moment(fecha).format('DD/MM/YYYY')}`);
            console.log(`======================================================`);

            await cerrarHojasVencidas(fecha);

            console.log(`✅ Finalizado para ${moment(fecha).format('DD/MM/YYYY')}`);
        }

        console.log(`\n🎉====================================================🎉`);
        console.log(`          CIERRE RETROACTIVO COMPLETADO EXITOSAMENTE`);
        console.log(`🎉====================================================🎉`);

    } catch (e) {
        console.error("❌ Error Fatal en script de cierre:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

runCierreVencidas();

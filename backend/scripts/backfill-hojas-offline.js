require('dotenv').config();
const mongoose = require('mongoose');
const { esFeriado } = require('../src/services/feriadoService');
const { generarHojasAutomaticas } = require('../src/controllers/logistica/hojaRepartoController');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function runBackfill() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        // Fechas a recuperar: 5 de Marzo de 2026 (HOY)
        // Usamos T12:00:00Z para asegurar que caiga en el día correcto sin problemas de Timezone
        const fechasARecuperar = [
            new Date("2026-03-05T12:00:00.000Z")
        ];

        let totalCreadas = 0;
        let totalSaltadas = 0;
        let totalErrores = 0;

        for (const fecha of fechasARecuperar) {
            const momentTZ = require('moment-timezone');
            const fechaEnAR = momentTZ(fecha).tz('America/Argentina/Buenos_Aires');
            console.log(`\n======================================================`);
            console.log(`⏳ INICIANDO BACKFILL PARA LA FECHA: ${fechaEnAR.format('DD/MM/YYYY')}`);
            console.log(`======================================================`);

            const esFeriadoLocal = await esFeriado(fecha);

            if (esFeriadoLocal) {
                console.log(`🏖️ LA FECHA ${fechaEnAR.format('DD/MM/YYYY')} FUE FERIADO NACIONAL - Omitiendo...`);
                continue;
            }

            // Llamamos a la función God Tier del controlador, que ya filtra duplicados y feriados
            const resultados = await generarHojasAutomaticas(fecha, esFeriadoLocal);

            if (resultados) {
                console.log(`✅ Resultado del día ${fechaEnAR.format('DD/MM/YYYY')}:`);
                console.log(`   - Hojas Creadas: ${resultados.creadas}`);
                console.log(`   - Hojas Saltadas (Ya existían o no correspondían): ${resultados.saltadas}`);
                console.log(`   - Errores Encontrados: ${resultados.errores}`);

                totalCreadas += resultados.creadas;
                totalSaltadas += resultados.saltadas;
                totalErrores += resultados.errores;
            } else {
                console.log(`⚠️ La función no devolvió resultados tabulados para esta fecha.`);
            }
        }

        console.log(`\n🎉====================================================🎉`);
        console.log(`          BACKFILL COMPLETADO EXITOSAMENTE`);
        console.log(`🎉====================================================🎉`);
        console.log(`TOTAL HOJAS CREADAS: ${totalCreadas}`);
        console.log(`TOTAL HOJAS SALTADAS: ${totalSaltadas}`);
        console.log(`TOTAL ERRORES: ${totalErrores}`);

    } catch (e) {
        console.error("❌ Error Fatal en script de Backfill:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

runBackfill();

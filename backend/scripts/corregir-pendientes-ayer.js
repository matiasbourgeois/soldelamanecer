require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const HojaReparto = require('../src/models/HojaReparto');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function corregirEstadoHojasAyer() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado.");

        // Apuntamos al día 6 de Marzo (Ayer)
        const ayerInicio = moment.tz("2026-03-06T00:00:00", 'America/Argentina/Buenos_Aires').toDate();
        const ayerFin = moment.tz("2026-03-06T23:59:59", 'America/Argentina/Buenos_Aires').toDate();

        console.log(`\n======================================================`);
        console.log(`🛠️  CORRIGIENDO HOJAS MAL CANCELADAS DEL: 06/03/2026`);
        console.log(`======================================================`);

        // Buscamos las hojas que modifiqué recién al estado 'cancelada' con el mensaje específico
        const hojasErroneas = await HojaReparto.find({
            estado: 'cancelada',
            fecha: { $gte: ayerInicio, $lte: ayerFin },
            'historialMovimientos.accion': "cancelada automáticamente (atascada post-apagón)"
        });

        if (hojasErroneas.length === 0) {
            console.log("✅ No se encontraron hojas erróneamente canceladas.");
        } else {
            console.log(`⚠️ Se detectaron ${hojasErroneas.length} hojas canceladas por error. Procediendo a corregir...`);

            for (const hoja of hojasErroneas) {
                // 1. Eliminar el movimiento incorrecto de cancelación
                hoja.historialMovimientos = hoja.historialMovimientos.filter(
                    mov => mov.accion !== "cancelada automáticamente (atascada post-apagón)"
                );

                // 2. Simular el paso por "En Reparto"
                hoja.historialMovimientos.push({
                    usuario: null,
                    accion: `Cambio automático a EN REPARTO post-apagón (Corrección)`
                });

                // 3. Simular el Cierre automático
                hoja.estado = "cerrada";
                hoja.cerradaAutomaticamente = true;
                hoja.historialMovimientos.push({
                    usuario: null,
                    accion: "cerrado automático por vencimiento de fecha (Corrección post-apagón)"
                });

                await hoja.save();
                console.log(`   ✅ Hoja ${hoja.numeroHoja || hoja._id} corregida a CERRADA.`);
            }
        }

        console.log(`\n🎉====================================================🎉`);
        console.log(`   CORRECCIÓN COMPLETADA CON ÉXITO`);
        console.log(`🎉====================================================🎉`);

    } catch (e) {
        console.error("❌ Error Fatal durante la corrección:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

corregirEstadoHojasAyer();

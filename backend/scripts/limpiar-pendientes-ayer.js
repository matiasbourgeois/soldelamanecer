require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const HojaReparto = require('../src/models/HojaReparto');
const Envio = require('../src/models/Envio');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function limpiarPendientesAyer() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado.");

        // Apuntamos al día 6 de Marzo (Ayer)
        const ayerInicio = moment.tz("2026-03-06T00:00:00", 'America/Argentina/Buenos_Aires').toDate();
        const ayerFin = moment.tz("2026-03-06T23:59:59", 'America/Argentina/Buenos_Aires').toDate();

        console.log(`\n======================================================`);
        console.log(`🧹 LIMPIANDO HOJAS PENDIENTES DEL: 06/03/2026`);
        console.log(`======================================================`);

        const hojasPendientes = await HojaReparto.find({
            estado: 'pendiente',
            fecha: { $gte: ayerInicio, $lte: ayerFin }
        }).populate('envios');

        if (hojasPendientes.length === 0) {
            console.log("✅ No se encontraron hojas pendientes de ayer. Nada que hacer.");
        } else {
            console.log(`⚠️ Se detectaron ${hojasPendientes.length} hojas atascadas en 'pendiente' de ayer.`);

            for (const hoja of hojasPendientes) {
                // Liberar los envíos asignados a esta hoja (si los hay)
                for (const envio of hoja.envios) {
                    if (envio.estado === "en reparto" || envio.estado === "asignado") {
                        console.log(`   📦 Envío ${envio._id} liberado -> reagendado`);
                        envio.estado = "reagendado";
                        envio.hojaReparto = null;
                        envio.historialEstados.push({
                            estado: "reagendado",
                            sucursal: "Casa Central – Córdoba",
                        });
                        await envio.save();
                    }
                }

                hoja.estado = "cancelada";
                hoja.cerradaAutomaticamente = true;
                hoja.historialMovimientos.push({
                    usuario: null,
                    accion: "cancelada automáticamente (atascada post-apagón)"
                });
                await hoja.save();
                console.log(`   ✅ Hoja ${hoja.numeroHoja || hoja._id} CANCELADA exitosamente.`);
            }
        }

        console.log(`\n🎉====================================================🎉`);
        console.log(`   OPERACIÓN DE LIMPIEZA COMPLETADA CON ÉXITO`);
        console.log(`🎉====================================================🎉`);

    } catch (e) {
        console.error("❌ Error Fatal durante la limpieza:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

limpiarPendientesAyer();

/**
 * SCRIPT ÚNICO DE CIERRE MANUAL DE HOJAS VENCIDAS
 * Ejecutar solo UNA vez desde el VPS: node scripts/cerrar_hojas_vencidas_manual.js
 * Cierra todas las hojas "en reparto" de días anteriores a HOY.
 * Las hojas de hoy (13/03/2026) NO se tocan.
 *
 * Lógica idéntica a cerrarHojasVencidas() del controller.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const mongoose = require('mongoose');
const moment = require('moment-timezone');

// Conectar a la base de datos
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/soldelamanecer';

async function main() {
    console.log('🔄 Conectando a MongoDB:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log('🟢 Conectado a MongoDB');

    // Importar modelos
    const HojaReparto = require('../src/models/HojaReparto');
    const Envio = require('../src/models/Envio');

    // Calcular "inicio de hoy" en hora argentina
    const hoyAR = moment().tz('America/Argentina/Buenos_Aires').startOf('day');
    const inicioDiaHoy = hoyAR.toDate(); // En UTC = las 3:00 AM UTC del día de hoy

    console.log(`📅 Buscando hojas "en reparto" ANTERIORES a: ${hoyAR.format('DD/MM/YYYY HH:mm')} (AR)`);
    console.log(`   En UTC esto equivale a: ${inicioDiaHoy.toISOString()}`);

    // Buscar todas las hojas "en reparto" con fecha ANTES de hoy
    const hojas = await HojaReparto.find({
        estado: 'en reparto',
        fecha: { $lt: inicioDiaHoy }
    }).populate('envios');

    console.log(`\n📋 Se encontraron ${hojas.length} hojas vencidas para cerrar:`);
    hojas.forEach(h => {
        const fechaAR = moment(h.fecha).tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY');
        console.log(`   📄 ${h.numeroHoja || 'Sin número'} | Fecha: ${fechaAR} | Envíos: ${h.envios.length}`);
    });

    if (hojas.length === 0) {
        console.log('\n✅ No hay hojas vencidas. Todo en orden.');
        await mongoose.disconnect();
        return;
    }

    console.log('\n⚙️  Procesando cierres...');
    let exitosas = 0;
    let errores = 0;

    for (const hoja of hojas) {
        try {
            let enviosReagendados = 0;

            // Reagendar envíos que sigan "en reparto"
            for (const envio of hoja.envios) {
                if (envio.estado === 'en reparto') {
                    envio.estado = 'reagendado';
                    envio.hojaReparto = null;
                    envio.historialEstados.push({
                        estado: 'reagendado',
                        sucursal: 'Casa Central – Córdoba'
                    });
                    await envio.save();
                    enviosReagendados++;
                    console.log(`   📦 Envío ${envio._id} → reagendado`);
                }
            }

            // Cerrar la hoja
            hoja.estado = 'cerrada';
            hoja.cerradaAutomaticamente = true;
            hoja.historialMovimientos.push({
                usuario: null,
                accion: 'Cierre manual retroactivo por script de recuperación (cron inactivo)'
            });
            await hoja.save();

            const fechaAR = moment(hoja.fecha).tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY');
            console.log(`   ✅ Hoja ${hoja.numeroHoja || 'S/N'} (${fechaAR}) cerrada. Envíos reagendados: ${enviosReagendados}`);
            exitosas++;

        } catch (err) {
            console.error(`   ❌ Error cerrando hoja ${hoja.numeroHoja || hoja._id}:`, err.message);
            errores++;
        }
    }

    console.log(`\n🏁 RESUMEN FINAL:`);
    console.log(`   ✅ Hojas cerradas exitosamente: ${exitosas}`);
    console.log(`   ❌ Errores: ${errores}`);
    console.log(`   📦 Script completado.`);

    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB.');
}

main().catch(err => {
    console.error('❌ Error crítico en el script:', err);
    process.exit(1);
});

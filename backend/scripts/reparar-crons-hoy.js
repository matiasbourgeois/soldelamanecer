require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const { esFeriado } = require('../src/services/feriadoService');
const { generarHojasAutomaticas, cerrarHojasVencidas } = require('../src/controllers/logistica/hojaRepartoController');
const HojaReparto = require('../src/models/HojaReparto');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function repararCronsApagados() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado. Iniciando reparación post-apagón.");

        const ahoraArg = moment().tz('America/Argentina/Buenos_Aires');
        const hoy = ahoraArg.toDate();
        const ayer = ahoraArg.clone().subtract(1, 'days').toDate();
        const horaActual = ahoraArg.format('HH:mm');

        console.log(`\n======================================================`);
        console.log(`🕰️  HORA ACTUAL SIMULADA: ${ahoraArg.format('DD/MM/YYYY HH:mm')}`);
        console.log(`======================================================`);

        // =========================================================
        // CRON 1: Cerrar Hojas Vencidas (Normalmente 00:30 AM)
        // =========================================================
        console.log(`\n⏳ 1. Ejecutando Cron de Cierre (Cerrando hojas del ${moment(ayer).format('DD/MM')})...`);
        await cerrarHojasVencidas(ayer);
        console.log(`✅ Cierre completado.`);

        // =========================================================
        // CRON 2: Generar Hojas (Normalmente 00:01 AM)
        // =========================================================
        console.log(`\n⏳ 2. Ejecutando Cron de Generación (Creando hojas del ${moment(hoy).format('DD/MM')})...`);
        const esFeriadoLocal = await esFeriado(hoy);
        if (esFeriadoLocal) {
            console.log(`🏖️ Hoy es Feriado. No se generarán hojas.`);
        } else {
            const resultados = await generarHojasAutomaticas(hoy, esFeriadoLocal);
            if (resultados) {
                console.log(`✅ Generación completada: ${resultados.creadas} Creadas, ${resultados.saltadas} Saltadas, ${resultados.errores} Errores.`);
            }
        }

        // =========================================================
        // CRON 3: Cambiar a 'en reparto' (Normalmente cada 5 min)
        // =========================================================
        console.log(`\n⏳ 3. Ejecutando Cron de Estados (Verificando hora de salida vs ${horaActual})...`);
        const inicioDia = ahoraArg.clone().startOf('day').toDate();
        const finDia = ahoraArg.clone().endOf('day').toDate();

        const hojasPendientes = await HojaReparto.find({
            estado: 'pendiente',
            fecha: { $gte: inicioDia, $lte: finDia }
        }).populate('ruta');

        let cambiadas = 0;
        for (const hoja of hojasPendientes) {
            const horaSalida = hoja.ruta?.horaSalida;
            if (horaSalida && horaActual >= horaSalida) {
                hoja.estado = 'en reparto';
                hoja.historialMovimientos.push({
                    usuario: null,
                    accion: `Cambio automático a EN REPARTO post-apagón (hora salida: ${horaSalida}, hora actual: ${horaActual})`
                });
                await hoja.save();
                console.log(`🚚 Hoja ${hoja.numeroHoja || hoja._id} (Ruta: ${hoja.ruta?.codigo}) cambió a EN REPARTO`);
                cambiadas++;
            }
        }
        console.log(`✅ Cambio de estados completado. ${cambiadas} hojas pasaron a 'en reparto'.`);

        console.log(`\n🎉====================================================🎉`);
        console.log(`   REPARACIÓN DE MOTOR OFFLINE COMPLETADA CON ÉXITO`);
        console.log(`🎉====================================================🎉`);

    } catch (e) {
        console.error("❌ Error Fatal durante la reparación:", e);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

repararCronsApagados();

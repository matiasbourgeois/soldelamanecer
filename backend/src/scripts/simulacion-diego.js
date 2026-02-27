require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('../models/Chofer');
const Usuario = require('../models/Usuario');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');

const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');

async function simularLiquidacionDiego() {
    console.log('\n=========================================================');
    console.log('🏁 INICIANDO SIMULACIÓN DE LIQUIDACIÓN: DIEGO ANCHAVAL');
    console.log('=========================================================\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Buscar a Diego
        const usuarioDiego = await Usuario.findOne({ dni: '36141379' });

        if (!usuarioDiego) {
            console.log('❌ ERROR: No se encontró a Diego en la BD.');
            process.exit(1);
        }

        const choferDiego = await Chofer.findOne({ usuario: usuarioDiego._id });
        if (!choferDiego) {
            console.log('❌ ERROR: Diego no es chofer.');
            process.exit(1);
        }

        console.log(`👤 Chofer Identificado: ${usuarioDiego.nombre} (ID: ${choferDiego._id})`);

        // 2. Crear una ruta de contingencia para la simulación
        await Ruta.deleteOne({ codigo: 'RUTA-SIM-DIEGO' });
        const rutaDummy = new Ruta({
            codigo: 'RUTA-SIM-DIEGO',
            horaSalida: '06:00',
            kilometrosEstimados: 100,
            precioKm: 500, // $500 x km
            tipoPago: 'por_km'
        });
        await rutaDummy.save();

        // 3. Generar Hojas de Reparto en ENERO 2026
        console.log('\n📅 Generando Hojas de Reparto para Enero 2026...');
        const hojasCreadas = [];

        for (let i = 1; i <= 5; i++) {
            const date = new Date(`2026-01-0${i}T12:00:00Z`);

            // Requerimiento: Kms extra (10 en una, 300 en otra)
            let kmsExtra = 0;
            if (i === 2) kmsExtra = 10;
            if (i === 4) kmsExtra = 300;

            const hoja = new HojaReparto({
                fecha: date,
                ruta: rutaDummy._id,
                chofer: choferDiego._id,
                estado: 'cerrada',
                tipoPago: 'por_km',
                precioKm: 500,
                precioHistorico_km: 500,
                kilometrosEstimados: 100,
                kilometrosAdicionales: kmsExtra,
                motivoKmAdicionales: kmsExtra > 0 ? 'Desvío Programado QA' : ''
            });
            await hoja.save();
            hojasCreadas.push(hoja);
            console.log(`  -> Día ${i} | Fecha: ${date.toISOString().split('T')[0]} | KMs Base: 100 | KMs Extra: ${kmsExtra}`);
        }

        // 4. Invocar a la calculadora del sistema
        console.log('\n🧮 Ejecutando Motor de Liquidación Pura (Enero 2026)...');

        const resultado = await calcularTotalesLiquidacion(
            choferDiego._id.toString(),
            '2026-01-01T00:00:00.000Z',
            '2026-01-31T23:59:59.000Z'
        );

        console.log('\n================ RESULTADOS FINALES =================');
        if (resultado) {
            console.log(JSON.stringify(resultado, null, 2));
        } else {
            console.log('❌ Falló la calculadora.');
        }
        console.log('=========================================================\n');

        // 5. Cleanup
        await Ruta.deleteOne({ _id: rutaDummy._id });
        for (const h of hojasCreadas) {
            await HojaReparto.deleteOne({ _id: h._id });
        }
        console.log('🧹 Limpieza OK.');

    } catch (err) {
        console.error('ERROR CRÍTICO:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

simularLiquidacionDiego();

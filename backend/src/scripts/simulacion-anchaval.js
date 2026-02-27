require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('../models/Chofer');
const Usuario = require('../models/Usuario');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');

const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');

async function simulacionRealAnchaval() {
    console.log('\n=========================================================');
    console.log('🏦 INICIANDO SIMULACIÓN REAL: DIEGO ANCHAVAL (ENERO 2026)');
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

        // 2. Limpieza de Hojas Previas y Rutas Mockeadas de Diego
        console.log('🧹 Limpiando hojas de Enero previas de Diego para no duplicar...');
        await HojaReparto.deleteMany({
            chofer: choferDiego._id,
            fecha: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: new Date('2026-01-31T23:59:59Z') }
        });
        await Ruta.deleteMany({ codigo: { $in: ['1626-SIM', '1620-SIM'] } });

        // 3. Crear las 2 Rutas Reales de Diego
        const precioLeones = 122863.60 / 270; // 455.05037...
        const precioJamesCraik = 189817.60 / 370; // 513.02054...

        const rutaLeones = new Ruta({
            codigo: '1626-SIM',
            descripcion: 'Leones - Tarde',
            horaSalida: '14:00',
            kilometrosEstimados: 270,
            precioKm: precioLeones,
            tipoPago: 'por_km'
        });
        await rutaLeones.save();

        const rutaJames = new Ruta({
            codigo: '1620-SIM',
            descripcion: 'James Craik - Oliva Tarde',
            horaSalida: '14:30',
            kilometrosEstimados: 370,
            precioKm: precioJamesCraik,
            tipoPago: 'por_km'
        });
        await rutaJames.save();

        console.log(`🛣️  Rutas Creadas: \n - Leones (270km | $${precioLeones.toFixed(2)}/km)\n - James Craik (370km | $${precioJamesCraik.toFixed(2)}/km)`);

        // 4. Generar Hojas de Reparto (26 días laborales de Enero)
        console.log('\n📅 Generando 52 Hojas de Reparto (26 días x 2 Rutas)...');

        let diaVisual = 2; // Empezamos el 2 de Enero
        for (let i = 1; i <= 26; i++) {
            // Evitamos domingos simulando saltos (26 dias)
            const date = new Date(`2026-01-${diaVisual.toString().padStart(2, '0')}T12:00:00Z`);

            // Hoja 1: Leones
            await new HojaReparto({
                fecha: date,
                ruta: rutaLeones._id,
                chofer: choferDiego._id,
                estado: 'cerrada',
                tipoPago: 'por_km',
                precioKm: precioLeones,
                precioHistorico_km: precioLeones,
                kilometrosEstimados: 270,
                kilometrosAdicionales: 0
            }).save();

            // Hoja 2: James Craik
            let kmsExtra = 0;
            let observaciones = '';

            // Requerimientos del usuario + Captura Excel
            if (diaVisual === 8) {
                kmsExtra = 10;
                observaciones = 'Hasta san marcos por camouly';
            }
            if (diaVisual === 31) {
                kmsExtra = 300;
                observaciones = 'extras';
            }

            await new HojaReparto({
                fecha: date,
                ruta: rutaJames._id,
                chofer: choferDiego._id,
                estado: 'cerrada',
                tipoPago: 'por_km',
                precioKm: precioJamesCraik,
                precioHistorico_km: precioJamesCraik,
                kilometrosEstimados: 370,
                kilometrosAdicionales: kmsExtra, // Legacy
                datosDrogueria: { kmExtra: kmsExtra }, // El que lee el liquidador real
                motivoKmAdicionales: observaciones
            }).save();

            // Incremento Días (Simulando un calendario básico, sumamos 1, menos si cae domingo)
            diaVisual++;
            if (diaVisual === 4 || diaVisual === 11 || diaVisual === 18 || diaVisual === 25) diaVisual++;
        }

        // 5. Invocar a la calculadora
        console.log('\n🧮 Calculando Liquidación Completa (Enero 2026)...');
        const resultado = await calcularTotalesLiquidacion(
            choferDiego._id.toString(),
            '2026-01-01T00:00:00.000Z',
            '2026-01-31T23:59:59.000Z'
        );

        console.log('\n================ RESULTADO CALCO DEL EXCEL =================');
        if (resultado) {
            const data = resultado.totales;
            console.log(`🛣️ KMs Base Acumulados: ${data.kmBaseAcumulados}`);
            console.log(`⚠️ KMs Extra Acumulados: ${data.kmExtraAcumulados}`);
            console.log(`\n💰 Subtotal Base (s/extras): $${data.montoTotalViajes - (10 * precioJamesCraik) - (300 * precioJamesCraik)}`); // Estimación visual para el chat
            console.log(`🔥 TOTAL LIQUIDACIÓN (Rutas + Extras): $${data.montoTotalViajes}`);
            require('fs').writeFileSync('anchaval.json', JSON.stringify({
                kmBase: data.kmBaseAcumulados,
                kmExtra: data.kmExtraAcumulados,
                montoBase: data.montoTotalViajes - (10 * precioJamesCraik) - (300 * precioJamesCraik),
                montoTotal: data.montoTotalViajes
            }, null, 2));

            console.log('\n📋 MUESTRA DE LAS ÚLTIMAS 4 HOJAS (Matching Excel):');
            // Mostrar solo las ultimas 4 para no spawnear 52 lineas en chat
            const ultimasHojas = resultado.hojasValidas.slice(-4);
            ultimasHojas.forEach(hoja => {
                const dateClean = new Date(hoja.fecha).toISOString().split('T')[0];
                const baseMoney = hoja.totalCalculado || (hoja.kilometrosEstimados * (hoja.precioKm || hoja.precioHistorico_km || 0));
                const extraMoney = (hoja.kilometrosAdicionales || 0) * (hoja.precioKm || hoja.precioHistorico_km || 0);
                const nombreRuta = hoja.ruta.codigo === '1626-SIM' ? 'Leones' : 'James Craik';

                console.log(`  [${dateClean}] Ruta: ${nombreRuta.padEnd(11)} | KMs: ${hoja.kilometrosEstimados} | +KM: ${hoja.kilometrosAdicionales || 0} | Pago Base: $${baseMoney.toFixed(2)} | Extras: $${extraMoney.toFixed(2)}`);
            });
            console.log('  ... (52 registros procesados en total)');
        } else {
            console.log('❌ Falló la calculadora.');
        }

        // 6. Cleanup preventivo
        await Ruta.deleteMany({ codigo: { $in: ['1626-SIM', '1620-SIM'] } });
        await HojaReparto.deleteMany({
            chofer: choferDiego._id,
            fecha: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: new Date('2026-01-31T23:59:59Z') }
        });

    } catch (err) {
        console.error('ERROR CRÍTICO:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

simulacionRealAnchaval();

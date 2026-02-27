require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('../models/Chofer');
const Usuario = require('../models/Usuario');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');
const { esFeriado } = require('../services/feriadoService');
const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');

async function simulacionFermanelli() {
    console.log('\n=========================================================');
    console.log('🤖 INICIANDO SIMULADOR CRON (DICIEMBRE 2025 - FERMANELLI)');
    console.log('=========================================================\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Buscar a Fermanelli
        const usuarioLorenzo = await Usuario.findOne({ nombre: { $regex: /fermanelli/i } });
        if (!usuarioLorenzo) {
            console.log('❌ ERROR: No se encontró a Lorenzo en la BD.');
            process.exit(1);
        }

        const choferLorenzo = await Chofer.findOne({ usuario: usuarioLorenzo._id });
        if (!choferLorenzo) {
            console.log('❌ ERROR: Lorenzo no es chofer.');
            process.exit(1);
        }

        console.log(`👤 Chofer Identificado: ${usuarioLorenzo.nombre} (ID: ${choferLorenzo._id})`);

        // 2. Limpieza de Hojas y Rutas Previas
        console.log('🧹 Limpiando base para el emulador de Diciembre...');
        await HojaReparto.deleteMany({
            chofer: choferLorenzo._id,
            fecha: { $gte: new Date('2025-12-01T00:00:00Z'), $lte: new Date('2025-12-31T23:59:59Z') }
        });
        await Ruta.deleteMany({ codigo: { $in: ['074R-SIM', '154R-SIM'] } });

        // 3. Crear las 2 Rutas Reales de Fermanelli 
        const precioViaje = 50818.50; // Constante

        const frecuenciaLunesASabado = {
            tipo: 'dias-especificos',
            diasSemana: [false, true, true, true, true, true, true]
        };

        const rutaManana = await new Ruta({
            codigo: '074R-SIM',
            descripcion: 'VILLA CORDOBA MAÑANA',
            horaSalida: '07:00',
            kilometrosEstimados: 1, // Para no afectar logica distancias
            precioKm: precioViaje,  // En por_km esto multiplica 1 x precioViaje = 50818.50
            tipoPago: 'por_km',
            frecuencia: frecuenciaLunesASabado
        }).save();

        const rutaTarde = await new Ruta({
            codigo: '154R-SIM',
            descripcion: 'VILLA CORDOBA TARDE',
            horaSalida: '14:00',
            kilometrosEstimados: 1,
            precioKm: precioViaje,
            tipoPago: 'por_km',
            frecuencia: frecuenciaLunesASabado
        }).save();

        console.log('\n📅 Iniciando escaneo día a día del mes de Diciembre 2025...');
        let hojasGeneradas = 0;

        // 4. Bucle Maestro - Diciembre tiene 31 días
        for (let dia = 1; dia <= 31; dia++) {
            const fechaActual = new Date(`2025-12-${dia.toString().padStart(2, '0')}T12:00:00Z`);
            const diaSemanaIndex = fechaActual.getDay(); // 0(Dom) a 6(Sab)

            // Comprobar la lógica del Cron real (Día Feriado Nacional)
            const esDiaFeriado = await esFeriado(fechaActual);

            if (esDiaFeriado) {
                console.log(` 🏖️ ${fechaActual.toISOString().split('T')[0]} - FERIADO. El Cron omitió la generación automática.`);
                continue;
            }
            if (diaSemanaIndex === 0) { // Domingo
                console.log(` 🛌 ${fechaActual.toISOString().split('T')[0]} - DOMINGO. No corresponde frecuencia.`);
                continue;
            }

            // Genero Hoja 1 (Mañana)
            await new HojaReparto({
                fecha: fechaActual,
                ruta: rutaManana._id,
                chofer: choferLorenzo._id,
                estado: 'cerrada',
                tipoPago: 'por_km',
                precioKm: precioViaje,
                precioHistorico_km: precioViaje,
                kilometrosEstimados: 1,
                kilometrosAdicionales: 0
            }).save();
            hojasGeneradas++;

            // Genero Hoja 2 (Tarde)
            await new HojaReparto({
                fecha: fechaActual,
                ruta: rutaTarde._id,
                chofer: choferLorenzo._id,
                estado: 'cerrada',
                tipoPago: 'por_km',
                precioKm: precioViaje,
                precioHistorico_km: precioViaje,
                kilometrosEstimados: 1,
                kilometrosAdicionales: 0
            }).save();
            hojasGeneradas++;
        }

        console.log(`\n✅ Escaneo del Cron Finalizado. Hojas resultantes (Cron): ${hojasGeneradas}\n`);

        // 5. Invocar a la calculadora
        console.log('🧮 Calculando Liquidación Final...');
        const resultado = await calcularTotalesLiquidacion(
            choferLorenzo._id.toString(),
            '2025-12-01T00:00:00.000Z',
            '2025-12-31T23:59:59.000Z'
        );

        if (resultado) {
            const data = resultado.totales;
            require('fs').writeFileSync('f_lorenzo.json', JSON.stringify({
                hojasCron: hojasGeneradas,
                kmBase: data.kmBaseAcumulados,
                montoTotal: data.montoTotalViajes
            }, null, 2));

            console.log('\n================ RESULTADOS CALENDARIO REAL =================');
            console.log(`📊 Hojas Totales Asignadas por Cron Automatico: ${hojasGeneradas}`);
            console.log(`💰 Tarifa de Viajes: $${precioViaje.toFixed(2)} c/u`);
            console.log(`🔥 TOTAL LIQUIDACIÓN SEGÚN SISTEMA CRON (Sin intervención humana): $${data.montoTotalViajes}`);
            console.log(`🤔 TOTAL EXCEL CONTADURÍA: $ 2.388.469,50 (47 Hojas)`);
            console.log(`📉 DIFERENCIA SISTEMA vs EXCEL: $${data.montoTotalViajes - 2388469.50} (${hojasGeneradas - 47} viajes de de diferencia)`);
        } else {
            console.log('❌ Falló la calculadora.');
        }

        // 6. Cleanup preventivo
        await Ruta.deleteMany({ codigo: { $in: ['074R-SIM', '154R-SIM'] } });
        await HojaReparto.deleteMany({
            chofer: choferLorenzo._id,
            fecha: { $gte: new Date('2025-12-01T00:00:00Z'), $lte: new Date('2025-12-31T23:59:59Z') }
        });

    } catch (err) {
        console.error('ERROR CRÍTICO:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

simulacionFermanelli();

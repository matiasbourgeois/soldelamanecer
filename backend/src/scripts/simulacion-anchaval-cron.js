require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('../models/Chofer');
const Usuario = require('../models/Usuario');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');
const { esFeriado } = require('../services/feriadoService');
const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');

async function simulacionCronAnchaval() {
    console.log('\n=========================================================');
    console.log('🤖 INICIANDO SIMULADOR CRON (REPLICA EXACTA DE FIN DE CURSO)');
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
        console.log(`👤 Chofer Identificado: ${usuarioDiego.nombre} (ID: ${choferDiego._id})`);

        // 2. Limpieza de Hojas y Rutas Previas
        console.log('🧹 Limpiando base para el emulador de Feriados...');
        await HojaReparto.deleteMany({
            chofer: choferDiego._id,
            fecha: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: new Date('2026-01-31T23:59:59Z') }
        });
        await Ruta.deleteMany({ codigo: { $in: ['1626-CRON', '1620-CRON'] } });

        // 3. Crear las 2 Rutas Reales de Diego con Calendario Semanal de Lunes a Sábados
        const precioLeones = 122863.60 / 270;
        const precioJamesCraik = 189817.60 / 370;

        // Frecuencia: [Dom=false, Lun=true, Mar=true, Mie=true, Jue=true, Vie=true, Sab=true]
        const frecuenciaLunesASabado = {
            tipo: 'dias-especificos',
            diasSemana: [false, true, true, true, true, true, true]
        };

        const rutaLeones = await new Ruta({
            codigo: '1626-CRON',
            descripcion: 'Leones - Tarde',
            horaSalida: '14:00',
            kilometrosEstimados: 270,
            precioKm: precioLeones,
            tipoPago: 'por_km',
            frecuencia: frecuenciaLunesASabado
        }).save();

        const rutaJames = await new Ruta({
            codigo: '1620-CRON',
            descripcion: 'James Craik - Oliva Tarde',
            horaSalida: '14:30',
            kilometrosEstimados: 370,
            precioKm: precioJamesCraik,
            tipoPago: 'por_km',
            frecuencia: frecuenciaLunesASabado
        }).save();

        console.log('\n📅 Iniciando escaneo día a día del mes de Enero 2026...');
        let hojasGeneradas = 0;

        // 4. Bucle Maestro que simula el lapso temporal completo del Cron en 31 días
        for (let dia = 1; dia <= 31; dia++) {
            const fechaActual = new Date(`2026-01-${dia.toString().padStart(2, '0')}T12:00:00Z`);
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

            // Es un día laborable. Insertamos como lo haría el generadorAutomático.
            // Genero Hoja 1 (Leones)
            await new HojaReparto({
                fecha: fechaActual,
                ruta: rutaLeones._id,
                chofer: choferDiego._id,
                estado: 'cerrada', // Lo cerramos para que se pueda liquidar
                tipoPago: 'por_km',
                precioKm: precioLeones,
                precioHistorico_km: precioLeones,
                kilometrosEstimados: 270,
                kilometrosAdicionales: 0
            }).save();
            hojasGeneradas++;

            // Genero Hoja 2 (James Craik) - Ojo a los extras
            let kmsExtra = 0;
            if (dia === 8) kmsExtra = 10;
            if (dia === 31) kmsExtra = 300;

            await new HojaReparto({
                fecha: fechaActual,
                ruta: rutaJames._id,
                chofer: choferDiego._id,
                estado: 'cerrada',
                tipoPago: 'por_km',
                precioKm: precioJamesCraik,
                precioHistorico_km: precioJamesCraik,
                kilometrosEstimados: 370,
                kilometrosAdicionales: kmsExtra,
                datosDrogueria: { kmExtra: kmsExtra }
            }).save();
            hojasGeneradas++;
        }

        console.log(`\n✅ Escaneo del Cron Finalizado. Hojas resultantes: ${hojasGeneradas}\n`);
        if (hojasGeneradas !== 52) {
            console.log(`⚠️ ALERTA: Hojas generadas (${hojasGeneradas}) no coinciden con las 52 del Excel real.`);
        } else {
            console.log('🎯 EXACTITUD: Se generaron exactamente 52 hojas (Descartados: 4 Domingos + 1 Feriado 01/01)');
        }

        // 5. Invocar a la calculadora
        console.log('🧮 Calculando Liquidación Final...');
        const resultado = await calcularTotalesLiquidacion(
            choferDiego._id.toString(),
            '2026-01-01T00:00:00.000Z',
            '2026-01-31T23:59:59.000Z'
        );

        const data = resultado.totales;
        require('fs').writeFileSync('anchaval-cron.json', JSON.stringify({
            kmBase: data.kmBaseAcumulados,
            kmExtra: data.kmExtraAcumulados,
            montoTotal: data.montoTotalViajes
        }, null, 2));
        console.log('\n================ RESULTADOS CALENDARIO REAL =================');
        console.log(`🛣️ KMs Base: ${data.kmBaseAcumulados}`);
        console.log(`⚠️ KMs Extra: ${data.kmExtraAcumulados}`);
        console.log(`🔥 TOTAL LIQUIDACIÓN: $${data.montoTotalViajes}`);

        // 6. Cleanup preventivo
        await Ruta.deleteMany({ codigo: { $in: ['1626-CRON', '1620-CRON'] } });
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

simulacionCronAnchaval();

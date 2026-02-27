require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('../models/Chofer');
const Usuario = require('../models/Usuario');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');
const { esFeriado } = require('../services/feriadoService');
const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');

async function simulacionGarcia() {
    console.log('\n=========================================================');
    console.log('🦾 INICIANDO SIMULADOR CRON: GARCIA, EMANUEL JESUS (ENERO 2026)');
    console.log('=========================================================\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Buscar a Garcia
        const usuarioGarcia = await Usuario.findOne({ dni: '29759271' });
        if (!usuarioGarcia) {
            console.log('❌ ERROR: No se encontró a Garcia en la BD.');
            process.exit(1);
        }

        const choferGarcia = await Chofer.findOne({ usuario: usuarioGarcia._id });
        if (!choferGarcia) {
            console.log('❌ ERROR: Garcia no es chofer.');
            process.exit(1);
        }

        console.log(`👤 Chofer Identificado: ${usuarioGarcia.nombre} (ID: ${choferGarcia._id})`);

        // 2. Limpieza de Hojas y Rutas Previas
        console.log('🧹 Limpiando base para el emulador...');
        await HojaReparto.deleteMany({
            chofer: choferGarcia._id,
            fecha: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: new Date('2026-01-31T23:59:59Z') }
        });
        await Ruta.deleteMany({ codigo: { $in: ['1347-SIM', '2347-SIM'] } });

        // 3. Crear las 2 Rutas Reales
        // Segun imagen: $67.122,00 por 220 KMs => Precio x KM = 305.10
        const precioKm = 67122.00 / 220;

        // Ruta Monte de los Gauchos (1347)
        // Según excel: facturó 17/1, 24/1, 31/1 (Todos son Sábados). 
        // Asi que la frecuencia es Lunes a Sábado.
        const frecLunesASabado = {
            tipo: 'dias-especificos',
            diasSemana: [false, true, true, true, true, true, true]
        };

        // Ruta Adelia Maria (2347)
        // Según excel: facturó de Lunes a Viernes (no aparece los sábados).
        const frecLunesAViernes = {
            tipo: 'dias-especificos',
            diasSemana: [false, true, true, true, true, true, false]
        };

        const rutaMonte = await new Ruta({
            codigo: '1347-SIM',
            descripcion: 'Monte de los Gauchos - Tarde',
            horaSalida: '14:00',
            kilometrosEstimados: 220,
            precioKm: precioKm,
            tipoPago: 'por_km',
            frecuencia: frecLunesASabado
        }).save();

        const rutaAdelia = await new Ruta({
            codigo: '2347-SIM',
            descripcion: 'Adelia Maria - Mañana',
            horaSalida: '06:00',
            kilometrosEstimados: 220,
            precioKm: precioKm,
            tipoPago: 'por_km',
            frecuencia: frecLunesAViernes
        }).save();

        console.log('\n📅 Iniciando cron desde entrada del cadete (12/01/2026) hasta fin de mes (31/01/2026)...');
        let hojasGeneradas = 0;

        // 4. Bucle Maestro - Iteramos cronológicamente
        for (let dia = 12; dia <= 31; dia++) {
            const fechaActual = new Date(`2026-01-${dia.toString().padStart(2, '0')}T12:00:00Z`);
            const diaSemanaIndex = fechaActual.getDay(); // 0(Dom) a 6(Sab)

            // Comprobar la lógica del Cron real
            const esDiaFeriado = await esFeriado(fechaActual);

            if (esDiaFeriado) {
                console.log(` 🏖️ ${fechaActual.toISOString().split('T')[0]} - FERIADO.`);
                continue;
            }
            if (diaSemanaIndex === 0) {
                console.log(` 🛌 ${fechaActual.toISOString().split('T')[0]} - DOMINGO.`);
                continue;
            }

            // Generamos Monte de los Gauchos (L a S)
            let kmsExtraMonte = 0;
            let extrasMotivo = '';

            // Inyectar incidentes del Excel:
            // 15/1 -> 89 Kms extra ("HASTA GIGENA POR ROTURA DE CAMION")
            // 19/1 -> 50 Kms extra ("hasta huanchillas por camoyte n°4455076")
            if (dia === 15) { kmsExtraMonte = 89; extrasMotivo = 'HASTA GIGENA POR ROTURA DE CAMION'; }
            if (dia === 19) { kmsExtraMonte = 50; extrasMotivo = 'hasta huanchillas por camoyte n°4455076'; }

            await new HojaReparto({
                fecha: fechaActual,
                ruta: rutaMonte._id,
                chofer: choferGarcia._id,
                estado: 'cerrada',
                tipoPago: 'por_km',
                precioKm: precioKm,
                precioHistorico_km: precioKm,
                kilometrosEstimados: 220,
                kilometrosAdicionales: kmsExtraMonte,
                datosDrogueria: { kmExtra: kmsExtraMonte },
                motivoKmAdicionales: extrasMotivo
            }).save();
            hojasGeneradas++;

            // Generamos Adelia Maria (L a V) - Si no es Sábado (idx = 6)
            if (diaSemanaIndex !== 6) {
                await new HojaReparto({
                    fecha: fechaActual,
                    ruta: rutaAdelia._id,
                    chofer: choferGarcia._id,
                    estado: 'cerrada',
                    tipoPago: 'por_km',
                    precioKm: precioKm,
                    precioHistorico_km: precioKm,
                    kilometrosEstimados: 220,
                    kilometrosAdicionales: 0
                }).save();
                hojasGeneradas++;
            }
        }

        console.log(`\n✅ Escaneo del Cron Finalizado. Hojas generadas: ${hojasGeneradas}`);
        if (hojasGeneradas !== 33) {
            console.log(`⚠️ ALERTA: Hojas generadas (${hojasGeneradas}) no coinciden con las 33 del Excel.`);
        } else {
            console.log('🎯 EXACTITUD: Se generaron exactamente 33 hojas desde el 12/01! (18 Viajes M. Gauchos + 15 Adelia María)');
        }

        // 5. Invocar a la calculadora
        console.log('🧮 Calculando Liquidación Completa...');
        const resultado = await calcularTotalesLiquidacion(
            choferGarcia._id.toString(),
            '2026-01-01T00:00:00.000Z',
            '2026-01-31T23:59:59.000Z'
        );

        if (resultado) {
            const data = resultado.totales;
            require('fs').writeFileSync('f_garcia.json', JSON.stringify({
                hojasCron: hojasGeneradas,
                kmBase: data.kmBaseAcumulados,
                kmExtra: data.kmExtraAcumulados,
                montoTotal: data.montoTotalViajes
            }, null, 2));

            console.log('\n================ RESULTADOS FINALES SISTEMA V3 =================');
            console.log(`📊 KMs Base Recorridos: ${data.kmBaseAcumulados} (vs 7260 Excel)`);
            console.log(`⚠️ KMs Extra Oficiales: ${data.kmExtraAcumulados} (vs 139 Excel)`);
            console.log(`💰 Tarifa de KM Variable: $${precioKm.toFixed(6)}`);
            console.log(`🔥 TOTAL LIQUIDACIÓN SISTEMA: $${data.montoTotalViajes.toFixed(2)}`);
            console.log(`🤔 TOTAL EXCEL CONTADURÍA:  $2257434.90`);
            console.log(`📉 DESVÍO: $${(data.montoTotalViajes - 2257434.90).toFixed(2)}`);
        } else {
            console.log('❌ Falló la calculadora.');
        }

        // 6. Cleanup preventivo
        await Ruta.deleteMany({ codigo: { $in: ['1347-SIM', '2347-SIM'] } });
        await HojaReparto.deleteMany({
            chofer: choferGarcia._id,
            fecha: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: new Date('2026-01-31T23:59:59Z') }
        });

    } catch (err) {
        console.error('ERROR CRÍTICO:', err);
    } finally {
        await mongoose.connection.close();
        process.exit();
    }
}

simulacionGarcia();

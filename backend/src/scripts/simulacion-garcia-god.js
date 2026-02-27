require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('../models/Chofer');
const Usuario = require('../models/Usuario');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');
const Vehiculo = require('../models/Vehiculo');
const { esFeriado } = require('../services/feriadoService');
const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');

async function simulacionGodTierGarcia() {
    console.log('\n=========================================================');
    console.log('👑 INICIANDO SIMULADOR CRON NIVEL DIOS: GARCIA (ENERO 2026)');
    console.log('=========================================================\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Buscar a Garcia
        const usuarioGarcia = await Usuario.findOne({ dni: '29759271' });
        const choferGarcia = await Chofer.findOne({ usuario: usuarioGarcia._id });

        console.log(`👤 Chofer Identificado: ${usuarioGarcia.nombre}`);

        // 2. Limpieza de Hojas y Rutas Previas
        console.log('🧹 Limpiando base para el emulador masivo...');
        await HojaReparto.deleteMany({
            chofer: choferGarcia._id,
            fecha: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: new Date('2026-01-31T23:59:59Z') }
        });
        await Ruta.deleteMany({ codigo: { $in: ['1347-GOD', '2347-GOD'] } });

        // 3. Crear las 2 Rutas Reales
        // Segun imagen: $67.122,00 por 220 KMs => Precio x KM = 305.10
        const precioKm = 67122.00 / 220;

        // Ruta Monte de los Gauchos (1347)
        const frecLunesASabado = {
            tipo: 'dias-especificos',
            diasSemana: [false, true, true, true, true, true, true]
        };

        // Ruta Adelia Maria (2347)
        const frecLunesAViernes = {
            tipo: 'dias-especificos',
            diasSemana: [false, true, true, true, true, true, false]
        };

        const rutaMonte = await new Ruta({
            codigo: '1347-GOD',
            descripcion: 'Monte de los Gauchos - Tarde',
            horaSalida: '14:00',
            kilometrosEstimados: 220,
            precioKm: precioKm,
            tipoPago: 'por_km',
            frecuencia: frecLunesASabado
        }).save();

        const rutaAdelia = await new Ruta({
            codigo: '2347-GOD',
            descripcion: 'Adelia Maria - Mañana',
            horaSalida: '06:00',
            kilometrosEstimados: 220,
            precioKm: precioKm,
            tipoPago: 'por_km',
            frecuencia: frecLunesAViernes
        }).save();

        console.log('\n📅 [NIVEL DIOS] Iniciando cron desde el Dia 1 al 31 de Enero (Con Feriados)...');
        let hojasTotalesCreadas = 0;
        let hojasPagables = 0;
        let hojasAusentes = 0;

        // 4. Bucle Maestro - SIMULACIÓN DEL GENERADOR AUTOMÁTICO EXACTO DESDE EL DÍA 1
        for (let dia = 1; dia <= 31; dia++) {
            const fechaActual = new Date(`2026-01-${dia.toString().padStart(2, '0')}T12:00:00Z`);
            const diaSemanaIndex = fechaActual.getDay(); // 0(Dom) a 6(Sab)

            // Feriados Argentina
            const esDiaFeriado = await esFeriado(fechaActual);

            if (esDiaFeriado) {
                console.log(` 🏖️ [CRON NO GENERA] ${fechaActual.toISOString().split('T')[0]} - FERIADO.`);
                continue;
            }
            if (diaSemanaIndex === 0) {
                console.log(` 🛌 [CRON NO GENERA] ${fechaActual.toISOString().split('T')[0]} - DOMINGO.`);
                continue;
            }

            // ==========================================
            // LOGICA NIVEL DIOS: VACACIONES HASTA EL DÍA 11
            // ==========================================
            // El Cron genera TODAS las hojas como estado "pendiente".
            // De la fecha 2 al 11, Emanuel nunca se presentó a trabajar.
            // Esas hojas quedaron en la terminal como "pendiente" toda la semana.
            // Luego, el coordinador vio que no vino y quizás las marcó como 'cancelada', o simplemente
            // murieron en estado 'pendiente'.
            let estadoHojaDiaria = 'pendiente';
            if (dia >= 12) {
                // El día 12 volvió de sus vacaciones, operó la ruta, y expidió la mercadería en destino,
                // por ende el Playero al terminar la jornada cerró con éxito esta hoja marcándola 'cerrada'.
                estadoHojaDiaria = 'cerrada';
                hojasPagables++;
            } else {
                // Del 2 al 11 (Vacaciones registradas)
                estadoHojaDiaria = 'pendiente'; // Playero Administrativo nunca cerró esta hoja porque el chofer no vino
                hojasAusentes++;
            }

            // Generamos Monte de los Gauchos (L a S)
            let kmsExtraMonte = 0;
            if (dia === 15) kmsExtraMonte = 89;
            if (dia === 19) kmsExtraMonte = 50;

            await new HojaReparto({
                fecha: fechaActual,
                ruta: rutaMonte._id,
                chofer: choferGarcia._id,
                estado: estadoHojaDiaria, // <-- AQUI RESIDE LA MAGIA DEL BACKEND
                tipoPago: 'por_km',
                precioKm: precioKm,
                precioHistorico_km: precioKm,
                kilometrosEstimados: 220,
                kilometrosAdicionales: kmsExtraMonte,
                datosDrogueria: { kmExtra: kmsExtraMonte }
            }).save();
            hojasTotalesCreadas++;

            // Generamos Adelia Maria (L a V) - Si no es Sábado (idx = 6)
            if (diaSemanaIndex !== 6) {
                await new HojaReparto({
                    fecha: fechaActual,
                    ruta: rutaAdelia._id,
                    chofer: choferGarcia._id,
                    estado: estadoHojaDiaria, // <-- AQUI RESIDE LA MAGIA DEL BACKEND
                    tipoPago: 'por_km',
                    precioKm: precioKm,
                    precioHistorico_km: precioKm,
                    kilometrosEstimados: 220,
                    kilometrosAdicionales: 0
                }).save();
                hojasTotalesCreadas++;
            }
        }

        console.log(`\n✅ Escaneo Mensual (Día 1 al 31) Terminado.`);
        console.log(`- Total Hojas inyectadas por Cronjobs en BD: ${hojasTotalesCreadas}`);
        console.log(`- Hojas anuladas/Ausente por Vacaciones (2 al 11): ${hojasAusentes}`);
        console.log(`- Hojas Validadas y Cerradas (Retorno 12 al 31): ${hojasPagables}`);

        // 5. Invocar a la calculadora ciega
        console.log('\n🧮 Mandando al motor de Liquidaciones que se las arregle solo y evada la basura matemática...');
        const resultado = await calcularTotalesLiquidacion(
            choferGarcia._id.toString(),
            '2026-01-01T00:00:00.000Z',
            '2026-01-31T23:59:59.000Z'
        );

        if (resultado) {
            const data = resultado.totales;
            require('fs').writeFileSync('f_garcia_god.json', JSON.stringify({
                hojasTotalesBD: hojasTotalesCreadas,
                hojasFiltradas: hojasPagables,
                kmBase: data.kmBaseAcumulados,
                kmExtra: data.kmExtraAcumulados,
                montoTotal: data.montoTotalViajes
            }, null, 2));

            console.log('\n================ RESULTADOS FINALES SISTEMA V3 =================');
            console.log(`📊 KMs Base Remunerados: ${data.kmBaseAcumulados} (vs 7260 Excel)`);
            console.log(`⚠️ KMs Extra Oficiales: ${data.kmExtraAcumulados} (vs 139 Excel)`);
            console.log(`🔥 TOTAL LIÑA OBTENIDA AUTOMÁTICA: $${data.montoTotalViajes.toFixed(2)}`);
            console.log(`🤔 TOTAL EXCEL CONTADURÍA:          $2257434.90`);
            console.log(`📉 DESVÍO: $${(data.montoTotalViajes - 2257434.90).toFixed(2)}`);
        } else {
            console.log('❌ Falló la calculadora.');
        }

        // 6. Cleanup preventivo
        await Ruta.deleteMany({ codigo: { $in: ['1347-GOD', '2347-GOD'] } });
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

simulacionGodTierGarcia();

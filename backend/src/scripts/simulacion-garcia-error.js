require('dotenv').config();
const mongoose = require('mongoose');
const Chofer = require('../models/Chofer');
const Usuario = require('../models/Usuario');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');
const { esFeriado } = require('../services/feriadoService');
const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');

async function simulacionDescuidoHumano() {
    console.log('\n=========================================================');
    console.log('🚨 INICIANDO SIMULADOR CRON (ERROR HUMANO): GARCIA ENERO 26');
    console.log('=========================================================\n');

    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Buscar a Garcia
        const usuarioGarcia = await Usuario.findOne({ dni: '29759271' });
        const choferGarcia = await Chofer.findOne({ usuario: usuarioGarcia._id });

        console.log(`👤 Chofer Identificado: ${usuarioGarcia.nombre}`);

        // 2. Limpieza
        console.log('🧹 Limpiando base para el emulador masivo...');
        await HojaReparto.deleteMany({
            chofer: choferGarcia._id,
            fecha: { $gte: new Date('2026-01-01T00:00:00Z'), $lte: new Date('2026-01-31T23:59:59Z') }
        });
        await Ruta.deleteMany({ codigo: { $in: ['1347-ERR', '2347-ERR'] } });

        // 3. Crear las 2 Rutas Reales
        // Segun imagen: $67.122,00 por 220 KMs => Precio x KM = 305.10
        const precioKm = 67122.00 / 220;

        const frecLunesASabado = { tipo: 'dias-especificos', diasSemana: [false, true, true, true, true, true, true] };
        const frecLunesAViernes = { tipo: 'dias-especificos', diasSemana: [false, true, true, true, true, true, false] };

        const rutaMonte = await new Ruta({
            codigo: '1347-ERR', descripcion: 'Monte de los Gauchos - Tarde', horaSalida: '14:00',
            kilometrosEstimados: 220, precioKm: precioKm, tipoPago: 'por_km', frecuencia: frecLunesASabado
        }).save();

        const rutaAdelia = await new Ruta({
            codigo: '2347-ERR', descripcion: 'Adelia Maria - Mañana', horaSalida: '06:00',
            kilometrosEstimados: 220, precioKm: precioKm, tipoPago: 'por_km', frecuencia: frecLunesAViernes
        }).save();

        console.log('\n📅 [SIMULACIÓN CIEGA] Cron Automático Ininterrumpido (Día 1 al 31)');
        console.log('⚠️ ESCENARIO: RH se olvidó de registrar vacaciones. El cron generó todo para él y se cerraron.');
        let hojasTotalesCreadas = 0;

        // 4. Bucle Maestro - SIMULACIÓN DEL ERROR (El Cron asume que Garcia trabajó todo Enero)
        for (let dia = 1; dia <= 31; dia++) {
            const fechaActual = new Date(`2026-01-${dia.toString().padStart(2, '0')}T12:00:00Z`);
            const diaSemanaIndex = fechaActual.getDay(); // 0(Dom) a 6(Sab)

            // Feriados Argentina
            const esDiaFeriado = await esFeriado(fechaActual);
            if (esDiaFeriado) continue;
            if (diaSemanaIndex === 0) continue;

            // RH no gestiona ausencias. El playero cierra todo ciegamente
            const estadoCegato = 'cerrada';

            // Generamos Monte de los Gauchos (L a S)
            let kmsExtraMonte = 0;
            if (dia === 15) kmsExtraMonte = 89;
            if (dia === 19) kmsExtraMonte = 50;

            await new HojaReparto({
                fecha: fechaActual,
                ruta: rutaMonte._id,
                chofer: choferGarcia._id,
                estado: estadoCegato, // Error Humano: Dejaron que se cierre en vez de anularlo o reasignarlo
                tipoPago: 'por_km',
                precioKm: precioKm,
                precioHistorico_km: precioKm,
                kilometrosEstimados: 220,
                kilometrosAdicionales: kmsExtraMonte,
                datosDrogueria: { kmExtra: kmsExtraMonte }
            }).save();
            hojasTotalesCreadas++;

            // Generamos Adelia Maria (L a V) 
            if (diaSemanaIndex !== 6) {
                await new HojaReparto({
                    fecha: fechaActual,
                    ruta: rutaAdelia._id,
                    chofer: choferGarcia._id,
                    estado: estadoCegato, // Error Humano
                    tipoPago: 'por_km',
                    precioKm: precioKm,
                    precioHistorico_km: precioKm,
                    kilometrosEstimados: 220,
                    kilometrosAdicionales: 0
                }).save();
                hojasTotalesCreadas++;
            }
        }

        console.log(`\n✅ Escaneo Ciego Terminado.`);
        console.log(`- Total Hojas inyectadas y cerradas FALSA Y ERRÓNEAMENTE: ${hojasTotalesCreadas}`);

        // 5. Invocar a la calculadora
        console.log('\n🧮 Mandando al motor de Liquidaciones...');
        const resultado = await calcularTotalesLiquidacion(
            choferGarcia._id.toString(),
            '2026-01-01T00:00:00.000Z',
            '2026-01-31T23:59:59.000Z'
        );

        if (resultado) {
            const data = resultado.totales;
            console.log('\n================ RESULTADOS ERROR HUMANO =================');
            console.log(`📊 Hojas Aprobadas Erroneamente: ${hojasTotalesCreadas} (vs 33 Excel Real)`);
            console.log(`🔥 TOTAL LIQUIDACIÓN SISTEMA CIEGO: $${data.montoTotalViajes.toFixed(2)}`);
            console.log(`🤔 TOTAL EXCEL CONTADURÍA (Real Pagado):  $2257434.90`);
            console.log(`🚨 SOBRE-FACTURACIÓN POR NEGLIGENCIA: $${(data.montoTotalViajes - 2257434.90).toFixed(2)} pagados de MÁS a Garcia.`);
        }

        // 6. Cleanup preventivo
        await Ruta.deleteMany({ codigo: { $in: ['1347-ERR', '2347-ERR'] } });
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

simulacionDescuidoHumano();

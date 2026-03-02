/**
 * CREAR LIQUIDACIÓN DEMO
 * Inserta una liquidación ficticia con datos reales de un contratado
 * de la BD para que podés verla y probarla en el historial del admin.
 * NO se auto-destruye — queda visible en el frontend para que la pruebes.
 *
 * Para eliminarla después usá el botón "Anular" del historial o correlo con --limpiar.
 * Ejemplo: node crear-demo-liquidacion.js --limpiar
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const moment = require('moment-timezone');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

require('./src/models/Usuario');
require('./src/models/Vehiculo');
require('./src/models/Ruta');
require('./src/models/Configuracion');
const Chofer = require('./src/models/Chofer');
const HojaReparto = require('./src/models/HojaReparto');
const LiquidacionContratado = require('./src/models/LiquidacionContratado');

const LIMPIAR = process.argv.includes('--limpiar');

const OK = (msg) => console.log(`  ✅ ${msg}`);
const ERR = (msg) => console.log(`  ❌ ${msg}`);
const INF = (msg) => console.log(`  ℹ️  ${msg}`);
const HDR = (msg) => console.log(`\n${'═'.repeat(65)}\n  ${msg}\n${'═'.repeat(65)}`);

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    OK('Conectado a MongoDB.');

    if (LIMPIAR) {
        HDR('MODO LIMPIEZA: Borrando liquidaciones DEMO');
        const borradas = await LiquidacionContratado.deleteMany({
            motivoRechazo: '[DEMO-LIQUIDACION]'
        });
        OK(`${borradas.deletedCount} liquidación(es) DEMO eliminadas.`);
        await mongoose.disconnect();
        return;
    }

    HDR('CREANDO LIQUIDACIÓN DEMO');

    // Buscar cualquier contratado activo
    const chofer = await Chofer.findOne({ tipoVinculo: 'contratado', activo: true }).populate('usuario');
    if (!chofer) { ERR('No hay contratados activos en la BD.'); process.exit(1); }

    OK(`Contratado encontrado: ${chofer.usuario?.nombre} (DNI: ${chofer.usuario?.dni || 'S/DNI'})`);

    // Buscar hojas reales de los últimos 3 meses para incluir en la demo
    const hace3M = moment().tz('America/Argentina/Buenos_Aires').subtract(3, 'months').startOf('month').toDate();
    const hoy = moment().tz('America/Argentina/Buenos_Aires').toDate();

    const Ruta = require('./src/models/Ruta');
    const rutasTitular = await Ruta.find({ contratistaTitular: chofer._id }).select('_id');
    const idsRutas = rutasTitular.map(r => r._id);

    const hojas = await HojaReparto.find({
        estado: { $in: ['cerrada', 'en reparto'] },
        fecha: { $gte: hace3M, $lte: hoy },
        $or: [
            { chofer: chofer._id },
            { ruta: { $in: idsRutas } }
        ]
    }).limit(10);

    INF(`Hojas reales encontradas para incluir en la demo: ${hojas.length}`);

    // Calcular totales ficticios coherentes
    const diasTrabajados = hojas.length || 8; // Mínimo 8 para que se vea bien
    const kmBase = hojas.reduce((sum, h) => sum + (h.kilometrosEstimados || 0), 0) || 1240;
    const kmExtra = hojas.reduce((sum, h) => sum + (h.datosDrogueria?.kmExtra || 0), 0) || 42;

    // Para que se vea un monto realista, tomamos la tarifa del chofer o 850 por día
    const tarifaBase = chofer.datosContratado?.montoChoferDia || 850;
    const montoEstimado = hojas.length > 0
        ? hojas.reduce((sum, h) => sum + ((h.kilometrosEstimados || 0) * (h.precioKm || 0) + (h.montoPorDistribucion || 0)), 0)
        : diasTrabajados * tarifaBase;

    const periodoInicio = moment().tz('America/Argentina/Buenos_Aires').subtract(1, 'month').startOf('month').toDate();
    const periodoFin = moment().tz('America/Argentina/Buenos_Aires').subtract(1, 'month').endOf('month').toDate();

    const liqDemo = new LiquidacionContratado({
        chofer: chofer._id,
        periodo: { inicio: periodoInicio, fin: periodoFin },
        hojasReparto: hojas.map(h => h._id),
        totales: {
            diasTrabajados,
            kmBaseAcumulados: kmBase,
            kmExtraAcumulados: kmExtra,
            montoTotalViajes: Math.round(montoEstimado * 100) / 100
        },
        estado: 'borrador',
        motivoRechazo: '[DEMO-LIQUIDACION]', // Tag para poder borrarla después con --limpiar
        fechas: {
            creacion: new Date()
        }
    });

    await liqDemo.save();

    HDR('LIQUIDACIÓN DEMO CREADA');
    OK(`ID:              ${liqDemo._id}`);
    OK(`Contratado:      ${chofer.usuario?.nombre}`);
    OK(`Período:         ${moment(periodoInicio).format('DD/MM/YYYY')} → ${moment(periodoFin).format('DD/MM/YYYY')}`);
    OK(`Días trabajados: ${diasTrabajados}`);
    OK(`KMs Base:        ${kmBase} km`);
    OK(`KMs Extra:       ${kmExtra} km`);
    OK(`Monto Total:     $${liqDemo.totales.montoTotalViajes.toLocaleString('es-AR')}`);
    OK(`Hojas incluidas: ${hojas.length}`);
    console.log('');
    INF('Ahora podés ir al Sistema > Logística > Liquidaciones > Historial para verla.');
    INF('Desde el historial podés: Enviar PDF por email, Descargar PDF, Anularla.');
    INF('Para eliminar esta demo de la BD: node crear-demo-liquidacion.js --limpiar');

    await mongoose.disconnect();
    INF('Desconectado.');
};

run().catch(e => { console.error(e); process.exit(1); });

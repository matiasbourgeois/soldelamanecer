/**
 * POBLAR DEMO VISUAL — Múltiples liquidaciones (borrador + rechazadas)
 * Para probar cómo se ve el historial con datos reales.
 * Para limpiar: node poblar-demo-visual.js --limpiar
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
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
const TAG = '[DEMO-VISUAL]';

const OK = (m) => console.log(`  ✅ ${m}`);
const INF = (m) => console.log(`  ℹ️  ${m}`);
const ERR = (m) => console.log(`  ❌ ${m}`);
const HDR = (m) => console.log(`\n${'═'.repeat(60)}\n  ${m}\n${'═'.repeat(60)}`);

// Motivos de rechazo variados para hacer el test más realista
const MOTIVOS_RECHAZO = [
    'El viaje del 5 de enero no lo realicé, estaba de licencia médica.',
    'Los kilómetros del día 12/01 no coinciden con mi registro. Hice 180km no 240km.',
    'El pago por distribución del 20/01 ya fue incluido en la liquidación de diciembre.',
    'Hay dos viajes del 8 y 15 de enero que corresponden a otro chofer (García).',
    'El cálculo del mes fijo no está incluido, faltán $45.000 del monto acordado.'
];

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    OK('Conectado a MongoDB.');

    // ── LIMPIAR ────────────────────────────────────────────────────────────
    if (LIMPIAR) {
        HDR('LIMPIEZA: Borrando liquidaciones DEMO-VISUAL');
        const r = await LiquidacionContratado.deleteMany({ 'observaciones': TAG });
        OK(`${r.deletedCount} liquidaciones demo-visual eliminadas.`);
        // Limpiar por tag alternativo en motivoRechazo
        const r2 = await LiquidacionContratado.deleteMany({ motivoRechazo: { $regex: TAG } });
        OK(`${r2.deletedCount} liquidaciones rechazadas demo-visual eliminadas.`);
        await mongoose.disconnect();
        return;
    }

    // ── BUSCAR CONTRATADOS ────────────────────────────────────────────────
    HDR('Buscando contratados activos...');
    const contratados = await Chofer.find({ tipoVinculo: 'contratado', activo: true })
        .populate('usuario')
        .limit(10);

    if (!contratados.length) { ERR('No hay contratados activos.'); process.exit(1); }
    OK(`Encontrados ${contratados.length} contratados.`);

    const Ruta = require('./src/models/Ruta');
    const tz = 'America/Argentina/Buenos_Aires';

    // ── HOJAS GENÉRICAS (sinelar hojas sin datos reales) ─────────────────
    // Vamos a crear liquidaciones con hojasReparto vacío para demo puro visual
    const creadas = [];
    let motiIdx = 0;

    // Vamos a crear hasta 8 liquidaciones distribuidas entre los contratados
    const configs = [
        { mesesAtras: 5, estado: 'borrador' },
        { mesesAtras: 4, estado: 'rechazado' },
        { mesesAtras: 4, estado: 'borrador' },
        { mesesAtras: 3, estado: 'rechazado' },
        { mesesAtras: 3, estado: 'enviado' },
        { mesesAtras: 2, estado: 'rechazado' },
        { mesesAtras: 2, estado: 'aceptado_manual' },
        { mesesAtras: 1, estado: 'rechazado' },
    ];

    HDR('Creando liquidaciones demo-visual...');

    for (let i = 0; i < configs.length; i++) {
        const cfg = configs[i];
        const chofer = contratados[i % contratados.length];

        const inicio = moment().tz(tz).subtract(cfg.mesesAtras, 'months').startOf('month').toDate();
        const fin = moment().tz(tz).subtract(cfg.mesesAtras, 'months').endOf('month').toDate();

        // Totales simulados random-ish
        const dias = Math.floor(Math.random() * 15) + 8; // 8-22 días
        const kmBase = dias * (Math.floor(Math.random() * 80) + 140); // 140-220 km/día
        const kmExtra = Math.floor(Math.random() * 5) * 12; // 0, 12, 24, 36, 48
        const monto = parseFloat((kmBase * (Math.random() * 0.8 + 1.2)).toFixed(2)); // tarifa aprox

        const liq = new LiquidacionContratado({
            chofer: chofer._id,
            periodo: { inicio, fin },
            hojasReparto: [],
            totales: {
                diasTrabajados: dias,
                kmBaseAcumulados: kmBase,
                kmExtraAcumulados: kmExtra,
                montoTotalViajes: monto
            },
            estado: cfg.estado,
            tokenAceptacion: crypto.randomBytes(32).toString('hex'),
            observaciones: TAG,
            fechas: {
                creacion: moment().tz(tz).subtract(cfg.mesesAtras, 'months').add(1, 'day').toDate()
            },
            ...(cfg.estado === 'rechazado' && {
                motivoRechazo: `${MOTIVOS_RECHAZO[motiIdx % MOTIVOS_RECHAZO.length]} ${TAG}`
            }),
            ...(cfg.estado === 'enviado' && {
                fechas: {
                    creacion: moment().tz(tz).subtract(cfg.mesesAtras, 'months').add(1, 'day').toDate(),
                    envio: moment().tz(tz).subtract(cfg.mesesAtras, 'months').add(3, 'day').toDate()
                }
            }),
            ...(cfg.estado === 'aceptado_manual' && {
                fechas: {
                    creacion: moment().tz(tz).subtract(cfg.mesesAtras, 'months').add(1, 'day').toDate(),
                    aceptacion: moment().tz(tz).subtract(cfg.mesesAtras, 'months').add(5, 'day').toDate()
                }
            })
        });

        if (cfg.estado === 'rechazado') motiIdx++;

        await liq.save();
        const mesLabel = moment(inicio).tz(tz).format('MMM YYYY').toUpperCase();
        const choferNombre = chofer.usuario?.nombre || chofer._id;
        OK(`[${cfg.estado.toUpperCase().padEnd(15)}] ${choferNombre} — ${mesLabel} — $${monto.toFixed(0)}`);
        creadas.push(liq._id);
    }

    HDR('RESUMEN');
    INF(`${creadas.length} liquidaciones demo-visual creadas en la BD.`);
    INF(`Para ver: entrá a /admin/liquidaciones → tab "Historial"`);
    INF(`Para limpiar: node poblar-demo-visual.js --limpiar`);

    await mongoose.disconnect();
    process.exit(0);
};

run().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});

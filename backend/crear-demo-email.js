/**
 * CREAR LIQUIDACIÓN DEMO + ENVIAR EMAIL PARA FLUJO COMPLETO
 * Crea una liquidación real de un contratado y la envía a la dirección indicada.
 * La liquidación queda en estado "enviado" con un token válido para que
 * Matías pueda hacer clic en el link de conformidad y ver el flujo completo.
 *
 * El script NO se auto-destruye — la liquidación queda en la BD.
 * Para eliminarla: node crear-demo-email.js --limpiar
 */
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const crypto = require('crypto');
const moment = require('moment-timezone');
const nodemailer = require('nodemailer');
const fs = require('fs');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

require('./src/models/Usuario');
require('./src/models/Vehiculo');
require('./src/models/Ruta');
require('./src/models/Configuracion');
const Chofer = require('./src/models/Chofer');
const HojaReparto = require('./src/models/HojaReparto');
const LiquidacionContratado = require('./src/models/LiquidacionContratado');
const { generatePDF } = require('./src/utils/pdfService');

const EMAIL_DESTINO = 'matiasbourgeois.eeuu@gmail.com';
const LIMPIAR = process.argv.includes('--limpiar');

const OK = (msg) => console.log(`  ✅ ${msg}`);
const ERR = (msg) => console.log(`  ❌ ${msg}`);
const INF = (msg) => console.log(`  ℹ️  ${msg}`);
const HDR = (msg) => console.log(`\n${'═'.repeat(65)}\n  ${msg}\n${'═'.repeat(65)}`);

const run = async () => {
    await mongoose.connect(process.env.MONGO_URI);
    OK('Conectado a MongoDB.');

    if (LIMPIAR) {
        HDR('LIMPIEZA: Borrando liquidaciones DEMO-EMAIL');
        const r = await LiquidacionContratado.deleteMany({ motivoRechazo: '[DEMO-EMAIL]' });
        OK(`${r.deletedCount} liquidación(es) demo-email eliminadas.`);
        await mongoose.disconnect();
        return;
    }

    HDR('PASO 1: Buscando contratado activo con viajes');
    const contratados = await Chofer.find({ tipoVinculo: 'contratado', activo: true }).populate('usuario').limit(20);
    if (!contratados.length) { ERR('No hay contratados activos.'); process.exit(1); }

    // Buscar el que tenga más hojas
    const Ruta = require('./src/models/Ruta');
    let mejorChofer = null, mejorHojas = [];

    for (const ch of contratados) {
        const rutasTitular = await Ruta.find({ contratistaTitular: ch._id }).select('_id');
        const hace3M = moment().tz('America/Argentina/Buenos_Aires').subtract(3, 'months').startOf('month').toDate();
        const hoy = moment().tz('America/Argentina/Buenos_Aires').toDate();
        const hojas = await HojaReparto.find({
            estado: { $in: ['cerrada', 'en reparto'] },
            fecha: { $gte: hace3M, $lte: hoy },
            $or: [
                { chofer: ch._id },
                { ruta: { $in: rutasTitular.map(r => r._id) } }
            ]
        }).populate('ruta vehiculo').limit(15);

        if (hojas.length > mejorHojas.length) {
            mejorChofer = ch;
            mejorHojas = hojas;
        }
    }

    if (!mejorChofer) { mejorChofer = contratados[0]; }
    OK(`Contratado seleccionado: ${mejorChofer.usuario?.nombre} — ${mejorHojas.length} hoja(s) encontradas.`);

    // Calcular totales reales desde las hojas
    let kmBase = 0, kmExtra = 0, montoTotal = 0, diasTrabajados = mejorHojas.length || 5;
    const hojasDetalladas = mejorHojas.map(h => {
        const base = h.kilometrosEstimados || h.ruta?.kilometrosEstimados || 0;
        const extra = h.datosDrogueria?.kmExtra || 0;
        kmBase += base;
        kmExtra += extra;
        const precio = h.precioKm || 0;
        const monto = (base + extra) * precio || h.montoPorDistribucion || 0;
        montoTotal += monto;
        const obsRaw = h.observaciones || h.cierre?.observaciones || '';
        const TEXTO_SISTEMA = /generada\s+autom[aá]ticamente|motor\s+silencioso/i;
        return {
            fecha: new Date(h.fecha).toLocaleDateString('es-AR'),
            ruta: h.ruta?.codigo || '-',
            descripcion: h.ruta?.descripcion || '-',
            horaSalida: h.ruta?.horaSalida || '-',
            vehiculo: h.vehiculo?.patente || '-',
            kmBase: base > 0 ? base : '-',
            kmExtra: extra > 0 ? extra : '-',
            observaciones: obsRaw && !TEXTO_SISTEMA.test(obsRaw) ? obsRaw : '-',
            monto: monto > 0 ? monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '-'
        };
    });

    // Si no pudimos calcular monto (sin precioKm), usar tarifa por día
    if (montoTotal === 0) {
        montoTotal = diasTrabajados * (mejorChofer.datosContratado?.montoChoferDia || 850);
    }

    HDR('PASO 2: Creando liquidación demo en estado "enviado"');
    const periodoInicio = moment().tz('America/Argentina/Buenos_Aires').subtract(1, 'month').startOf('month').toDate();
    const periodoFin = moment().tz('America/Argentina/Buenos_Aires').subtract(1, 'month').endOf('month').toDate();
    const token = crypto.randomBytes(32).toString('hex');

    // Limpiar demos previas del mismo tipo para no acumular
    await LiquidacionContratado.deleteMany({ motivoRechazo: '[DEMO-EMAIL]' });
    INF('Demos previas del tipo [DEMO-EMAIL] eliminadas.');

    const liq = new LiquidacionContratado({
        chofer: mejorChofer._id,
        periodo: { inicio: periodoInicio, fin: periodoFin },
        hojasReparto: mejorHojas.map(h => h._id),
        totales: {
            diasTrabajados,
            kmBaseAcumulados: kmBase,
            kmExtraAcumulados: kmExtra,
            montoTotalViajes: Math.round(montoTotal * 100) / 100
        },
        estado: 'enviado',
        tokenAceptacion: token,
        motivoRechazo: '[DEMO-EMAIL]',
        fechas: { creacion: new Date(), envio: new Date() }
    });
    await liq.save();
    OK(`Liquidación creada con ID: ${liq._id}`);

    HDR('PASO 3: Generando PDF');
    const fondoPath = path.join(process.cwd(), 'templates', 'Copia de HOJADEREPARTO.png');
    let fondoBase64 = '';
    if (fs.existsSync(fondoPath)) { fondoBase64 = fs.readFileSync(fondoPath, 'base64'); OK('Fondo cargado.'); }

    const formFecha = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' });
    const formMes = new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', month: 'long', year: 'numeric' });
    const txtMes = formMes.format(periodoInicio);

    const dataPDF = {
        pdfMargin: { top: '40px', bottom: '40px', left: '50px', right: '50px' },
        imagen_fondo: fondoBase64 ? `data:image/png;base64,${fondoBase64}` : '',
        periodoMes: txtMes.charAt(0).toUpperCase() + txtMes.slice(1),
        fechaInicio: formFecha.format(periodoInicio),
        fechaFin: formFecha.format(periodoFin),
        chofer: mejorChofer.usuario?.nombre || 'Contratado',
        dni: mejorChofer.usuario?.dni || 'S/DNI',
        diasTrabajados,
        totalKmBase: kmBase,
        totalKmExtra: kmExtra,
        montoTotalViajesFormat: montoTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
        montoMesAdicional: false,
        montoMesAdicionalFormat: '$0',
        montoTotal: montoTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
        hojas: hojasDetalladas
    };

    const fileName = `DEMO_Liq_${Date.now()}.pdf`;
    const pdfPath = path.join(process.cwd(), 'pdfs', 'liquidaciones', fileName);
    if (!fs.existsSync(path.dirname(pdfPath))) fs.mkdirSync(path.dirname(pdfPath), { recursive: true });
    await generatePDF('liquidacion_contratado.html', dataPDF, pdfPath);
    OK(`PDF generado: ${fileName}`);

    HDR(`PASO 4: Enviando email a ${EMAIL_DESTINO}`);
    const linkConformidad = `http://localhost:5173/conformidad/${token}`;

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });

    await transporter.sendMail({
        from: `"Sol del Amanecer SRL" <${process.env.EMAIL_USER}>`,
        to: EMAIL_DESTINO,
        subject: `Resumen de Liquidación — ${mejorChofer.usuario?.nombre} — ${dataPDF.periodoMes}`,
        html: `
        <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 20px; max-width: 600px; margin: auto;">
            <h2 style="color: #0891b2;">Resumen de Liquidación de Viajes</h2>
            <p>Hola <strong>${mejorChofer.usuario?.nombre}</strong>,</p>
            <p>Adjuntamos el resumen de viajes realizados correspondientes al período del <strong>${dataPDF.fechaInicio}</strong> al <strong>${dataPDF.fechaFin}</strong>.</p>
            <div style="background:#f1f5f9;padding:20px;border-radius:8px;margin:20px 0;text-align:center;">
                <p style="margin:0;font-size:14px;color:#64748b;">Total a liquidar:</p>
                <p style="margin:4px 0;font-size:28px;font-weight:900;color:#0891b2;">${dataPDF.montoTotal}</p>
                <p style="margin:0;font-size:12px;color:#94a3b8;">${diasTrabajados} días · ${kmBase} km base · ${kmExtra} km extra</p>
            </div>
            <p>Hacé clic en el siguiente botón para revisar el detalle online, donde vas a poder <strong>Aceptar</strong> la liquidación, o bien <strong>Rechazarla</strong> indicando el motivo de la diferencia.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="${linkConformidad}" style="background-color: #0284c7; color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                    REVISAR LIQUIDACIÓN
                </a>
            </div>
            <p style="font-size: 12px; color: #64748b; border-top:1px solid #e2e8f0;padding-top:15px;">Si no confirmás la recepción en un plazo de 3 días hábiles, la liquidación se considerará conformada automáticamente según los términos y condiciones de Sol del Amanecer SRL.</p>
        </div>`,
        attachments: [{ filename: 'Liquidacion_SDA.pdf', path: pdfPath }]
    });

    HDR('RESUMEN FINAL');
    OK(`Liquidación ID: ${liq._id}`);
    OK(`Contratado: ${mejorChofer.usuario?.nombre}`);
    OK(`Período: ${dataPDF.fechaInicio} → ${dataPDF.fechaFin}`);
    OK(`Monto: ${dataPDF.montoTotal}`);
    OK(`Email enviado a: ${EMAIL_DESTINO}`);
    OK(`Estado en BD: "enviado" (visible en Historial)`);
    console.log('');
    INF(`Link de conformidad (para probar sin email):`);
    console.log(`  👉 ${linkConformidad}`);
    console.log('');
    INF('Para limpiar: node crear-demo-email.js --limpiar');
    await mongoose.disconnect();
};

run().catch(e => { console.error(e); process.exit(1); });

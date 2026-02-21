const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const fs = require('fs');

// Modelos
const Usuario = require('../models/Usuario');
const Chofer = require('../models/Chofer');
const Vehiculo = require('../models/Vehiculo');
const Ruta = require('../models/Ruta');
const HojaReparto = require('../models/HojaReparto');

const API_URL = 'http://localhost:5000/api';
const logFile = 'test-liquidaciones-especiales-results.log';

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (msg) => { const s = `[GOD-LIQUIDACION] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logSuccess = (msg) => { const s = `[SUCCESS] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logError = (msg) => { const s = `[ERROR] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };

async function createHojaEspecial(apiBody, cfgAdmin) {
    const res = await axios.post(`${API_URL}/hojas-reparto/especial`, apiBody, cfgAdmin);
    return res.data.hoja;
}

async function runTest() {
    log('🌟 Iniciando Mega-Test E2E: LIQUIDACIONES Y HOJAS ESPECIALES 🌟');

    await mongoose.connect(process.env.MONGO_URI);
    log('Conectado a la base de datos.');

    await cleanup();

    try {
        log('--- FASE 1: Preparativos de Flotilla y Personal ---');

        const fakeAdmin = new Usuario({ nombre: 'Recursos Humanos', email: 'admin.liq@test.com', contrasena: 'hashedpassword123', rol: 'admin' });
        await fakeAdmin.save();
        const tokenAdmin = jwt.sign({ id: fakeAdmin._id, rol: fakeAdmin.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const cfgAdmin = { headers: { Authorization: `Bearer ${tokenAdmin}` } };

        const uChofer = new Usuario({ nombre: 'Liquidado', email: 'choferL@test.com', contrasena: 'hash', rol: 'chofer' });
        await uChofer.save();
        const chofer = new Chofer({ usuario: uChofer._id, dni: 'LIQ-111', telefono: '111', tipoVinculo: 'contratado' });
        await chofer.save();

        const vehiculo = new Vehiculo({ patente: 'LIQ-001', marca: 'M', modelo: 'A', capacidadKg: 1000, tipoPropiedad: 'externo', kilometrajeActual: 1000 });
        await vehiculo.save();

        // Creamos una Ruta base mensual.
        const fakeRuta = new Ruta({ codigo: 'LIQ-R1', descripcion: 'Ruta Base Mensual', horaSalida: '08:00', tipoPago: 'por_mes', montoMensual: 500000 });
        await fakeRuta.save();

        log('Chofer y Vehículo generados. Ruta Base con Pago Mensual de $500.000 generada.');

        // --- FASE 2: Creación de Hojas y Cierre ---
        log('--- FASE 2: Admin genera y cierra 3 Hojas Especiales (Apoyando a la Ruta Mensual) ---');

        // Hoja 1: Por Vuelta
        const hVueltaObj = await createHojaEspecial({
            fecha: new Date(), ruta: fakeRuta._id, chofer: chofer._id, vehiculo: vehiculo._id,
            tipoPago: 'por_vuelta', cantidadVueltas: 2, precioPorVuelta: 6000, observaciones: 'Refuerzo Lunes'
        }, cfgAdmin);

        // Hoja 2: Fijo
        const hFijoObj = await createHojaEspecial({
            fecha: new Date(), ruta: fakeRuta._id, chofer: chofer._id, vehiculo: vehiculo._id,
            tipoPago: 'fijo_viaje', montoFijo: 15000, observaciones: 'Refuerzo Martes'
        }, cfgAdmin);

        // Hoja 3: Por Km
        const hKmObj = await createHojaEspecial({
            fecha: new Date(), ruta: fakeRuta._id, chofer: chofer._id, vehiculo: vehiculo._id,
            tipoPago: 'por_km', kilometrosEstimados: 100, precioKm: 150, observaciones: 'Refuerzo Miercoles'
        }, cfgAdmin);

        // Forzamos "en reparto" para saltar validación del forzar-cierre
        await HojaReparto.updateMany({ _id: { $in: [hVueltaObj._id, hFijoObj._id, hKmObj._id] } }, { estado: 'en reparto' });

        // Cerramos las 3
        await axios.post(`${API_URL}/hojas-reparto/forzar-cierre`, { hojaId: hVueltaObj._id }, cfgAdmin);
        await axios.post(`${API_URL}/hojas-reparto/forzar-cierre`, { hojaId: hFijoObj._id }, cfgAdmin);
        await axios.post(`${API_URL}/hojas-reparto/forzar-cierre`, { hojaId: hKmObj._id }, cfgAdmin);

        logSuccess('3 Hojas Especiales Cerradas. Listas para liquidar.');

        // --- FASE 3: Testeamos el Motor de Liquidaciones ---
        log('--- FASE 3: Simulando la Liquidación desde el Motor ---');

        const hoy = new Date();
        const inicioM = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
        const finM = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

        const resLiq = await axios.post(`${API_URL}/liquidaciones/simular`, {
            choferId: chofer._id.toString(),
            fechaInicio: inicioM.toISOString().split('T')[0],
            fechaFin: finM.toISOString().split('T')[0]
        }, cfgAdmin);

        const { hojasValidas, montoMesAdicional, totales } = resLiq.data;

        log('- Resultado del API de Liquidaciones:');
        hojasValidas.forEach(h => {
            log(`Hoja: ${h.numeroHoja} | Tipo Orig: ${h.tipoPago} | DETALLE CALCULADO: [${h.detallePago}] -> Subtotal: $${h.subtotal}`);
        });

        // Sumatoria esperada: 
        // Vuelta: 2 * 6000 = 12000
        // Fijo: 15000
        // Km: 100 * 150 = 15000
        // Total Hojas: 42000
        // Mes Adicional: No aplica porque el discriminador anuló la ruta base mensual ahogando, PERO
        // esperá, si la hoja es especial NO acumula mes adicional, pero la subtotal suma.

        log(`==> RUTAS POR MES ASIGNADAS AL CHOFER EN EL PERIODO: $${montoMesAdicional}`);
        log(`==> GRAN TOTAL A LIQUIDAR (Bolsa de sueldo): $${totales.montoTotalViajes}`);

        if (totales.montoTotalViajes === 42000) {
            logSuccess('EL MOTOR IGNORÓ PERFECTAMENTE EL MES FIJO DE LA RUTA BASE Y SUMÓ SOLO LOS CONCEPTOS ESPECIALES!');
            logSuccess('PRUEBA SUPERADA CON ÉXITO: MULTIPLES CONCEPTOS DISCRIMINADOS Y COBRADOS.');
        } else {
            throw new Error(`El total calculado ($${totales.montoTotalViajes}) no coincide con los $42.000 esperados.`);
        }

    } catch (error) {
        logError(error.message);
        if (error.response?.data) console.error(JSON.stringify(error.response.data, null, 2));
    } finally {
        await cleanup();
        await mongoose.disconnect();
        log('Script Finalizado y DB desconectada.');
    }
}

async function cleanup() {
    log('Desinfectando Mock DB LIQUIDACIONES...');
    await Vehiculo.deleteMany({ patente: /LIQ/ });
    await Ruta.deleteMany({ codigo: /LIQ-/ });
    const ch = await Chofer.find({ dni: /LIQ-/ });
    const usIds = ch.map(c => c.usuario);
    await Chofer.deleteMany({ dni: /LIQ-/ });
    await Usuario.deleteMany({ _id: { $in: usIds } });
    await Usuario.deleteMany({ email: 'admin.liq@test.com' });
    await Usuario.deleteMany({ email: 'choferL@test.com' });
    await HojaReparto.deleteMany({ observaciones: { $regex: /Refuerzo/ } });
}

runTest();

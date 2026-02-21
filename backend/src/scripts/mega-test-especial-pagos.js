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
const logFile = 'test-especial-pagos-results.log';

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (msg) => { const s = `[GOD-PAGOS] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logSuccess = (msg) => { const s = `[SUCCESS] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logError = (msg) => { const s = `[ERROR] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };

async function createHojaEspecial(apiBody, cfgAdmin, lbl) {
    const res = await axios.post(`${API_URL}/hojas-reparto/especial`, apiBody, cfgAdmin);
    const hoja = res.data.hoja;
    return hoja;
}

async function runTest() {
    log('🌟 Iniciando Mega-Test E2E: HOJAS ESPECIALES CON MÚLTIPLES TIPOS DE PAGO 🌟');

    await mongoose.connect(process.env.MONGO_URI);
    log('Conectado a la base de datos.');

    await cleanup();

    try {
        log('--- FASE 1: Preparativos de Flotilla y Personal ---');

        const fakeAdmin = new Usuario({ nombre: 'Control Operativo', email: 'admin.pagos@test.com', contrasena: 'hashedpassword123', rol: 'admin' });
        await fakeAdmin.save();
        const tokenAdmin = jwt.sign({ id: fakeAdmin._id, rol: fakeAdmin.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const cfgAdmin = { headers: { Authorization: `Bearer ${tokenAdmin}` } };

        const uChofer = new Usuario({ nombre: 'Multiuso', email: 'choferP@test.com', contrasena: 'hash', rol: 'chofer' });
        await uChofer.save();
        const chofer = new Chofer({ usuario: uChofer._id, dni: 'PAG-111', telefono: '111', tipoVinculo: 'contratado' });
        await chofer.save();

        const vehiculo = new Vehiculo({ patente: 'PAG-001', marca: 'M', modelo: 'A', capacidadKg: 1000, tipoPropiedad: 'propio', kilometrajeActual: 1000 });
        await vehiculo.save();

        const fakeRuta = new Ruta({ codigo: 'PAG-R1', descripcion: 'Ruta Base', horaSalida: '08:00', tipoPago: 'por_mes', montoMensual: 10000 });
        await fakeRuta.save();

        log('Generado Chofer y Vehículo Múltiple.');

        // --- FASE 2: Creación de Hojas con distintos pagos ---
        log('--- FASE 2: Admin genera 3 Hojas Especiales (Por Km, Por Vuelta, Fijo) ---');

        // 2.1 Por Km
        const hojaKm = await createHojaEspecial({
            fecha: new Date(), ruta: fakeRuta._id, chofer: chofer._id, vehiculo: vehiculo._id,
            tipoPago: 'por_km', kilometrosEstimados: 120, precioKm: 1500, observaciones: 'Pago KM'
        }, cfgAdmin, 'Por Km');

        // 2.2 Por Vuelta
        const hojaVuelta = await createHojaEspecial({
            fecha: new Date(), ruta: fakeRuta._id, chofer: chofer._id, vehiculo: vehiculo._id,
            tipoPago: 'por_vuelta', cantidadVueltas: 3, precioPorVuelta: 5000, observaciones: 'Pago Vueltas'
        }, cfgAdmin, 'Por Vuelta');

        // 2.3 Fijo
        const hojaFijo = await createHojaEspecial({
            fecha: new Date(), ruta: fakeRuta._id, chofer: chofer._id, vehiculo: vehiculo._id,
            tipoPago: 'fijo_viaje', montoFijo: 25000, observaciones: 'Pago Fijo'
        }, cfgAdmin, 'Fijo');

        logSuccess(`3 Hojas Especiales generadas en DB: ${hojaKm.numeroHoja}, ${hojaVuelta.numeroHoja}, ${hojaFijo.numeroHoja}`);

        // Verificamos Persistencia
        const checkKm = await HojaReparto.findById(hojaKm._id).lean();
        const checkVuelta = await HojaReparto.findById(hojaVuelta._id).lean();
        const checkFijo = await HojaReparto.findById(hojaFijo._id).lean();

        if (checkKm.tipoPago === 'por_km' && checkKm.kilometrosEstimados === 120 && checkKm.precioKm === 1500) {
            logSuccess('Hoja Por Kilómetro persistida exitosamente sin mezclar campos.');
        } else throw new Error("Fallo en la persistencia Por Kilómetro");

        if (checkVuelta.tipoPago === 'por_vuelta' && checkVuelta.cantidadVueltas === 3 && checkVuelta.precioPorVuelta === 5000) {
            logSuccess('Hoja Por Vuelta persistida exitosamente sin mezclar campos.');
        } else throw new Error("Fallo en la persistencia Por Vuelta");

        if (checkFijo.tipoPago === 'fijo_viaje' && checkFijo.montoFijo === 25000) {
            logSuccess('Hoja Precio Fijo persistida exitosamente sin mezclar campos.');
        } else throw new Error("Fallo en la persistencia Precio Fijo");


        // --- FASE 3: Validación del Endpoint de Reporte para Finanzas ---
        log('--- FASE 3: Validando Salida del Array Financiero (Reporte Especiales) ---');

        const mesActual = (new Date()).getMonth() + 1;
        const anioActual = (new Date()).getFullYear();
        const resReporte = await axios.get(`${API_URL}/hojas-reparto/reporte-especiales?mes=${mesActual}&anio=${anioActual}`, cfgAdmin);

        const rKm = resReporte.data.especiales.find(h => h.numeroHoja === hojaKm.numeroHoja);
        const rVuelta = resReporte.data.especiales.find(h => h.numeroHoja === hojaVuelta.numeroHoja);
        const rFijo = resReporte.data.especiales.find(h => h.numeroHoja === hojaFijo.numeroHoja);

        if (!rKm || !rVuelta || !rFijo) {
            throw new Error('Alerta: Faltan hojas en el reporte de especiales.');
        }

        if (rKm.detalleCobro === "120 Km a $1500") logSuccess(`Parser Por Km Correcto -> [${rKm.detalleCobro}]`);
        else throw new Error(`Parser Por Km fallo: ${rKm.detalleCobro}`);

        if (rVuelta.detalleCobro === "3 Vueltas a $5000") logSuccess(`Parser Por Vuelta Correcto -> [${rVuelta.detalleCobro}]`);
        else throw new Error(`Parser Por Vuelta fallo: ${rVuelta.detalleCobro}`);

        if (rFijo.detalleCobro === "Fijo: $25000") logSuccess(`Parser Fijo Correcto -> [${rFijo.detalleCobro}]`);
        else throw new Error(`Parser Fijo fallo: ${rFijo.detalleCobro}`);


        logSuccess('🚀 MEGA-TEST DE MODALIDADES DE PAGO COMPLETADO AL 100%.');

    } catch (error) {
        logError(error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    } finally {
        await cleanup();
        await mongoose.disconnect();
        log('Script Finalizado y DB desconectada.');
    }
}

async function cleanup() {
    log('Desinfectando Mock DB PAGOS...');
    await Vehiculo.deleteMany({ patente: /PAG/ });
    await Ruta.deleteMany({ codigo: /PAG-/ });
    const ch = await Chofer.find({ dni: /PAG-/ });
    const usIds = ch.map(c => c.usuario);
    await Chofer.deleteMany({ dni: /PAG-/ });
    await Usuario.deleteMany({ _id: { $in: usIds } });
    await Usuario.deleteMany({ email: 'admin.pagos@test.com' });
    await Usuario.deleteMany({ email: 'choferP@test.com' });
    // Limpiar las hojas creadas:
    // No eliminamos regex 'SDA-ESPECIAL' total para no pisar el otro test,
    // eliminamos las que tengan usuario choferP
    await HojaReparto.deleteMany({ observaciones: { $regex: /Pago/ } });
}

runTest();

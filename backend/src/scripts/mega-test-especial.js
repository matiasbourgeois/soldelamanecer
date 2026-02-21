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
const logFile = 'test-especial-results.log';

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (msg) => { const s = `[GOD-ESPECIAL] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logSuccess = (msg) => { const s = `[SUCCESS] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logError = (msg) => { const s = `[ERROR] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };

async function runTest() {
    log('🌟 Iniciando Mega-Test E2E: HOJA ESPECIAL Y CONTROL OPERATIVO 🌟');

    await mongoose.connect(process.env.MONGO_URI);
    log('Conectado a la base de datos.');

    await cleanup();

    try {
        // --- PREPARATIVOS (Mocks) ---
        log('--- FASE 1: Preparativos de Flotilla y Personal ---');

        const fakeAdmin = new Usuario({ nombre: 'Control Operativo', email: 'admin.especial@test.com', contrasena: 'hashedpassword123', rol: 'admin' });
        await fakeAdmin.save();
        const tokenAdmin = jwt.sign({ id: fakeAdmin._id, rol: fakeAdmin.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const cfgAdmin = { headers: { Authorization: `Bearer ${tokenAdmin}` } };

        // Chofer A (Planificado Originalmente)
        const uChoferA = new Usuario({ nombre: 'Original', email: 'choferA@test.com', contrasena: 'hash', rol: 'chofer' });
        await uChoferA.save();
        const choferA = new Chofer({ usuario: uChoferA._id, dni: 'ESP-111', telefono: '111', tipoVinculo: 'contratado' });
        await choferA.save();

        // Chofer B (Reemplazo de Emergencia)
        const uChoferB = new Usuario({ nombre: 'Reemplazo', email: 'choferB@test.com', contrasena: 'hash', rol: 'chofer' });
        await uChoferB.save();
        const choferB = new Chofer({ usuario: uChoferB._id, dni: 'ESP-222', telefono: '222', tipoVinculo: 'contratado' });
        await choferB.save();

        // Vehículos A y B
        const vehiculoA = new Vehiculo({ patente: 'ESA-001', marca: 'M', modelo: 'A', capacidadKg: 1000, tipoPropiedad: 'propio', kilometrajeActual: 1000 });
        const vehiculoB = new Vehiculo({ patente: 'ESB-002', marca: 'M', modelo: 'B', capacidadKg: 1000, tipoPropiedad: 'propio', kilometrajeActual: 2000 });
        await Promise.all([vehiculoA.save(), vehiculoB.save()]);

        const fakeRuta = new Ruta({ codigo: 'ESP-R1', descripcion: 'Ruta Base', horaSalida: '08:00', tipoPago: 'por_mes', montoMensual: 10000 });
        await fakeRuta.save();

        log('Generados 2 Choferes (Titular y Reemplazo) y 2 Vehículos.');

        // --- FASE 2: Creación de la Hoja Especial ---
        log('--- FASE 2: Admin genera Nueva Hoja Especial ---');

        const bodyEspecial = {
            fecha: new Date(),
            ruta: fakeRuta._id,
            chofer: choferA._id,
            vehiculo: vehiculoA._id,
            kilometrosEstimados: 120,
            precioKm: 1500,
            observaciones: 'Refuerzo sorpresa por exceso de demanda.'
        };

        const resEspecial = await axios.post(`${API_URL}/hojas-reparto/especial`, bodyEspecial, cfgAdmin);
        const hojaEspecialId = resEspecial.data.hoja._id;

        if (resEspecial.data.hoja.numeroHoja.includes('SDA-ESPECIAL')) {
            logSuccess(`Hoja Especial generada con numeración oficial: ${resEspecial.data.hoja.numeroHoja}`);
        } else throw new Error("La numeración de la hoja no corresponde a ESPECIAL.");


        // --- FASE 3: Modificación "Quick Edit" del Control Operativo ---
        log('--- FASE 3: Control Operativo cambia el Chofer y Vehículo en vivo ---');
        // El admin se dio cuenta que Chofer A se enfermó. Lo cambia por Chofer B y Vehiculo B.

        await axios.put(`${API_URL}/hojas-reparto/${hojaEspecialId}`, {
            chofer: choferB._id,
            vehiculo: vehiculoB._id
        }, cfgAdmin);

        const checkHojaEditada = await HojaReparto.findById(hojaEspecialId).lean();
        if (checkHojaEditada.chofer.toString() === choferB._id.toString() && checkHojaEditada.vehiculo.toString() === vehiculoB._id.toString()) {
            logSuccess('Edición rápida (Quick Edit) aplicada. Reasignado exitosamente al Chofer B y Vehículo B.');
        } else throw new Error('Falló el Quick Edit de Control Operativo.');


        // --- FASE 4: Chofer B entra a la App Móvil y opera la Especial ---
        log('--- FASE 4: Chofer de Reemplazo toma el mando desde su App ---');

        // Emulamos el token móvil de Chofer B
        const tokenMovil = jwt.sign({ id: uChoferB._id, rol: 'chofer' }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const cfgMovil = { headers: { Authorization: `Bearer ${tokenMovil}` } };

        // 4.1 Inicia Turno (Sube su Odómetro)
        log('Chofer B carga KM Inicial...');
        await axios.post(`${API_URL}/vehiculos/${vehiculoB._id}/reporte-chofer`, {
            kilometraje: 2050,
            litros: 0,
            rutaId: fakeRuta._id,
            hojaRepartoId: hojaEspecialId,
            observaciones: 'Tomando el refuerzo especial.'
        }, cfgMovil);

        const hojaIniciada = await HojaReparto.findById(hojaEspecialId).lean();
        if (hojaIniciada.estado === 'en reparto') {
            logSuccess('Hoja mutó correctamente a "en reparto" tras el OK del celular.');
        } else throw new Error('La App móvil no logró pasar la Hoja Especial a En Reparto.');

        // 4.2 Al ser especial, no hay envíos (o hay, pero no simulados). El tipo termina el viaje.
        log('Chofer B finaliza el refuerzo y rinde Odómetro Final...');
        await axios.post(`${API_URL}/vehiculos/${vehiculoB._id}/reporte-chofer`, {
            kilometraje: 2150, // Hizo 100km
            litros: 20,
            rutaId: fakeRuta._id,
            hojaRepartoId: hojaEspecialId,
            observaciones: 'Refuerzo terminado. Listo.'
        }, cfgMovil);


        // --- FASE 5: Cierre por parte del Admin ---
        log('--- FASE 5: Admin fuerza cierre y revisa los listados ---');
        await axios.post(`${API_URL}/hojas-reparto/forzar-cierre`, {
            hojaId: hojaEspecialId
        }, cfgAdmin);

        const hojaCerrada = await HojaReparto.findById(hojaEspecialId).lean();
        if (hojaCerrada.estado === 'cerrada') logSuccess('Hoja Especial cerrada en perfectas condiciones.');
        else throw new Error('La Hoja Especial no logró cerrarse.');

        // Validamos si aparece en los listados
        const mesActual = (new Date()).getMonth() + 1;
        const anioActual = (new Date()).getFullYear();
        const resReporte = await axios.get(`${API_URL}/hojas-reparto/reporte-especiales?mes=${mesActual}&anio=${anioActual}`, cfgAdmin);

        if (resReporte.data.especiales && resReporte.data.especiales.some(h => h.numeroHoja === hojaCerrada.numeroHoja)) {
            logSuccess('La Hoja Especial figura correctamente en el Reporte Mensual FASE 8 destinado a finanzas.');
        } else {
            throw new Error('La Hoja fue cerrada pero NO APARECE en el endpoint de Reporte Especial.');
        }

        logSuccess('🚀 MEGA-TEST DE CONTROL OPERATIVO & HOJAS ESPECIALES COMPLETADO CON 100% DE EFECTIVIDAD.');

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
    log('Desinfectando Mock DB...');
    await Vehiculo.deleteMany({ patente: /ES/ });
    await Ruta.deleteMany({ codigo: /ESP-/ });
    await HojaReparto.deleteMany({ numeroHoja: /SDA-ESPECIAL/ });
    const ch = await Chofer.find({ dni: /ESP-/ });
    const usIds = ch.map(c => c.usuario);
    await Chofer.deleteMany({ dni: /ESP-/ });
    await Usuario.deleteMany({ _id: { $in: usIds } });
    await Usuario.deleteMany({ email: 'admin.especial@test.com' });
    await Usuario.deleteMany({ email: /choferA@test\.com|choferB@test\.com/ });
}

runTest();

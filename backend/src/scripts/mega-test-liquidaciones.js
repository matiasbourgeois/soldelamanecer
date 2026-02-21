const mongoose = require('mongoose');
const axios = require('axios');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

// Modelos
const Usuario = require('../models/Usuario');
const Chofer = require('../models/Chofer');
const Vehiculo = require('../models/Vehiculo');
const Ruta = require('../models/Ruta');
const HojaReparto = require('../models/HojaReparto');
const LiquidacionContratado = require('../models/LiquidacionContratado');

const API_URL = 'http://localhost:5000/api';
const fs = require('fs');
const logFile = 'test-results.log';
// Limpiamos el log al inicio
if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (msg) => { const s = `[GOD-TEST] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logSuccess = (msg) => { const s = `[SUCCESS] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logError = (msg) => { const s = `[ERROR] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };

async function runTest() {
    log('Iniciando Test End-to-End Nivel Dios de Liquidaciones...');

    // 1. Conexión a DB
    await mongoose.connect(process.env.MONGO_URI);
    log('Conectado a la base de datos.');

    // 2. Limpieza previa de mugre GOD-TEST
    await cleanup();

    try {
        // 3. Crear Admin Token para hacer peticiones HTTP
        const fakeAdmin = new Usuario({
            nombre: 'God',
            email: 'god.admin@test.com',
            contrasena: 'hashedpassword',
            rol: 'admin',
        });
        await fakeAdmin.save();

        const token = jwt.sign({ id: fakeAdmin._id, rol: fakeAdmin.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
        log('Usuario Admin temporal y Token JWT creados.');

        // 4. Crear Chofer Contratado Falso
        const fakeUserChofer = new Usuario({
            nombre: 'Contratado',
            email: 'contratado.god@test.com',
            contrasena: 'hashedpassword',
            rol: 'chofer'
        });
        await fakeUserChofer.save();

        const fakeChofer = new Chofer({
            usuario: fakeUserChofer._id,
            dni: 'TEST-999999',
            telefono: '1122334455',
            tipoVinculo: 'contratado',
            datosContratado: {
                razonSocial: 'Logistica GOD SRL',
                cuit: '30-99999999-9',
                montoChoferDia: 3000 // Pago fijo por día si usa vehículo de la empresa SDA
            }
        });
        await fakeChofer.save();
        log('Chofer Contratado Falso creado. Monto SDA Día: $3000');

        // 5. Crear Vehículos Falsos (Uno SDA Propio, Uno Externo)
        const vehiculoExt = new Vehiculo({ patente: 'GOD-EXT', marca: 'Test', modelo: 'Ext', capacidadKg: 1000, tipoPropiedad: 'externo' });
        const vehiculoSDA = new Vehiculo({ patente: 'GOD-SDA', marca: 'Test', modelo: 'SDA', capacidadKg: 2000, tipoPropiedad: 'propio' });
        await vehiculoExt.save();
        await vehiculoSDA.save();
        log('Vehículos falsos creados (Propio y Externo).');

        // 6. Crear Rutas Falsas (Diferentes tipos de pago)
        const rutaKm = new Ruta({ codigo: 'GOD-R-KM', descripcion: 'Cobro por KM', horaSalida: '08:00', tipoPago: 'por_km', precioKm: 100, kilometrosEstimados: 50 });
        const rutaDist = new Ruta({ codigo: 'GOD-R-DIST', descripcion: 'Cobro por Distribucion', horaSalida: '09:00', tipoPago: 'por_distribucion', montoPorDistribucion: 5000 });
        const rutaMes = new Ruta({ codigo: 'GOD-R-MES', descripcion: 'Cobro por Mes', horaSalida: '10:00', tipoPago: 'por_mes', montoMensual: 150000 });
        await rutaKm.save();
        await rutaDist.save();
        await rutaMes.save();
        log('Rutas falsas creados con tres modalidades de pago ($100/km, $5000/dist, $150000/mes).');

        // 7. Crear Hojas de Reparto (Las cerramos para que se puedan liquidar)
        const hoy = new Date();
        const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
        const anteayer = new Date(hoy); anteayer.setDate(anteayer.getDate() - 2);
        const masAtras = new Date(hoy); masAtras.setDate(masAtras.getDate() - 3);

        const hojas = [
            // Caso 1: Ruta x KM + Vehiculo Externo -> (50km * 100 = $5000)
            { numeroHoja: 'GOD-001', fecha: hoy, chofer: fakeChofer._id, vehiculo: vehiculoExt._id, ruta: rutaKm._id, estado: 'cerrada' },
            // Caso 2: Ruta x Dist + Vehiculo Externo -> ($5000)
            { numeroHoja: 'GOD-002', fecha: ayer, chofer: fakeChofer._id, vehiculo: vehiculoExt._id, ruta: rutaDist._id, estado: 'cerrada' },
            // Caso 3: Ruta x Mes + Vehiculo Externo -> ($150000 sumado al total general como extra)
            { numeroHoja: 'GOD-003', fecha: anteayer, chofer: fakeChofer._id, vehiculo: vehiculoExt._id, ruta: rutaMes._id, estado: 'cerrada' },
            // Caso 4: Cualquiera (Ruta x KM) pero con Vehículo SDA (Propio) -> Fijo de $3000 por día
            { numeroHoja: 'GOD-004', fecha: masAtras, chofer: fakeChofer._id, vehiculo: vehiculoSDA._id, ruta: rutaKm._id, estado: 'cerrada' },
        ];
        await HojaReparto.insertMany(hojas);
        log('4 Hojas de Reparto creadas, asignadas y marcadas como CERRADAS.');

        // 8. Test HTTP End-to-End: Simular Liquidacion
        log('--- SIMULANDO LIQUIDACIÓN VÍA API HTTP ---');

        let fechaInicio = new Date(); fechaInicio.setDate(fechaInicio.getDate() - 5);
        let fechaFin = new Date(); fechaFin.setDate(fechaFin.getDate() + 1); // Future to catch everything

        const fI = fechaInicio.toISOString().split('T')[0];
        const fF = fechaFin.toISOString().split('T')[0];

        const reqBody = { choferId: fakeChofer._id.toString(), fechaInicio: fI, fechaFin: fF };

        // Debug query directo a DB con la misma logica del controller:
        const fnInicio = new Date(reqBody.fechaInicio);
        fnInicio.setHours(0, 0, 0, 0);
        const fnFin = new Date(reqBody.fechaFin);
        fnFin.setHours(23, 59, 59, 999);
        const idToSearch = reqBody.choferId;

        const queryHojas = {
            fecha: { $gte: fnInicio, $lte: fnFin },
            estado: { $ne: 'pendiente' },
            $or: [
                { chofer: idToSearch, ruta: { $nin: [] } },
                { ruta: { $in: [] } }
            ]
        };
        const checkHojas = await HojaReparto.find(queryHojas).lean();
        log(`Hojas de este chofer usando el query exacto del Controller: ${checkHojas.length}`);
        log(`Query JSON: ${JSON.stringify(queryHojas)}`);

        const simularRes = await axios.post(`${API_URL}/liquidaciones/simular`, reqBody, axiosConfig);
        const data = simularRes.data;

        if (!data.totales) {
            throw new Error("El endpoint devolvió totales: null. No encontró las hojas de reparto (o fueron invalidadas).");
        }

        log(`Resultados obtenidos: ${data.hojasValidas.length} hojas válidas. ${data.totales.diasTrabajados} días trabajados.`);

        // EXPECTED TOTAL: 5000 (km) + 5000 (dist) + 150000 (mes) + 3000 (SDA) = 163000
        const EXPECTED_TOTAL = 163000;
        log(`Monto Calculado por el Motor: $${data.totales.montoTotalViajes}`);
        log(`Monto Esperado Matemáticamente: $${EXPECTED_TOTAL}`);

        if (data.totales.montoTotalViajes === EXPECTED_TOTAL) {
            logSuccess('✅ CÁLCULO PERFECTO. Todos los modelos de negocio reaccionaron matemáticamente como debían.');
        } else {
            throw new Error(`El cálculo falló. Esperado: ${EXPECTED_TOTAL}, Obtenido: ${data.totales.montoTotalViajes}`);
        }

        // 9. Oficializar (Guardar)
        log('--- GUARDANDO LIQUIDACIÓN OFICIAL ---');
        const guardarRes = await axios.post(`${API_URL}/liquidaciones`, reqBody, axiosConfig);
        logSuccess(`✅ LIQUIDACIÓN BANCARIZADA EXITOSAMENTE. ID: ${guardarRes.data._id}`);

        // 10. Validar re-simulación en ceros (porque ya fue liquidado)
        log('--- VERIFICANDO PROTECCIÓN CONTRA DOBLE LIQUIDACIÓN ---');
        const reSimularRes = await axios.post(`${API_URL}/liquidaciones/simular`, reqBody, axiosConfig);
        if (reSimularRes.data.hojasValidas.length === 0) {
            logSuccess(`✅ PROTECCIÓN EXITOSA. La API retornó 0 hojas válidas para re-liquidar el mismo periodo.`);
        } else {
            logError('❌ LA API PERMITIÓ SIMULAR Y LIQUIDAR VIAJES YA COBRADOS!');
        }

    } catch (error) {
        logError(error.message);
        if (error.response) console.error(error.response.data);
    } finally {
        await cleanup();
        await mongoose.disconnect();
        log('Script Finalizado y Base de Datos Desconectada.');
    }
}

async function cleanup() {
    log('Limpiando base de datos de objetos GOD-TEST...');
    await LiquidacionContratado.deleteMany({ "totales.montoTotalViajes": 163000 }); // El que guardamos
    await HojaReparto.deleteMany({ numeroHoja: { $regex: /GOD-/ } });
    await Ruta.deleteMany({ codigo: { $regex: /GOD-/ } });
    await Vehiculo.deleteMany({ patente: { $regex: /GOD-/ } });
    const chofer = await Chofer.findOne({ dni: 'TEST-999999' });
    if (chofer) {
        await LiquidacionContratado.deleteMany({ chofer: chofer._id });
        await Chofer.findByIdAndDelete(chofer._id);
    }
    await Usuario.deleteMany({ email: { $regex: /god/i } });
}

runTest();

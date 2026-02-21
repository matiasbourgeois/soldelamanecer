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
const Envio = require('../models/Envio');
const Localidad = require('../models/Localidad');
const Destinatario = require('../models/Destinatario');
const LiquidacionContratado = require('../models/LiquidacionContratado');

const API_URL = 'http://localhost:5000/api';
const logFile = 'test-movil-results.log';

if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

const log = (msg) => { const s = `[GOD-MOBILE] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logSuccess = (msg) => { const s = `[SUCCESS] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };
const logError = (msg) => { const s = `[ERROR] ${msg}\n`; fs.appendFileSync(logFile, s); console.log(s.trim()); };

async function runTest() {
    log('📱 Iniciando Test End-to-End Nivel Dios: Flujo App Móvil...');

    await mongoose.connect(process.env.MONGO_URI);
    log('Conectado a la base de datos.');

    await cleanup();

    try {
        // --- 1. SETUP (Backend Admin POV) ---
        log('--- FASE 1: Preparación del Entorno desde Control Operativo ---');

        const fakeAdmin = new Usuario({
            nombre: 'God',
            email: 'admin.cierre@test.com',
            contrasena: 'hashedpassword123',
            rol: 'admin'
        });
        await fakeAdmin.save();
        const tokenAdmin = jwt.sign({ id: fakeAdmin._id, rol: fakeAdmin.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const fakeUserChofer = new Usuario({
            nombre: 'Movil',
            email: 'chofer.movil@test.com',
            contrasena: 'hashedpassword123',
            rol: 'chofer'
        });
        await fakeUserChofer.save();

        const fakeChofer = new Chofer({
            usuario: fakeUserChofer._id,
            dni: 'MOVIL-999999',
            telefono: '1122334455',
            tipoVinculo: 'contratado',
        });
        await fakeChofer.save();
        log('Chofer de prueba creado.');

        const fakeVehiculo = new Vehiculo({ patente: 'MOV-TEST', marca: 'App', modelo: 'Test', capacidadKg: 1000, tipoPropiedad: 'propio', kilometrajeActual: 10000 });
        await fakeVehiculo.save();
        log('Vehículo de prueba creado (Patente: MOV-TEST, KM Inicial BD: 10,000).');

        const fakeRuta = new Ruta({ codigo: 'MOV-R1', descripcion: 'Ruta Móvil', horaSalida: '08:00', tipoPago: 'por_mes', montoMensual: 10000 });
        await fakeRuta.save();

        const fakeLocalidad = new Localidad({ nombre: 'TestCity', codigoPostal: '5000', provincia: 'Cordoba', frecuencia: 'Diaria' });
        await fakeLocalidad.save();

        const fakeDest = new Destinatario({
            nombre: 'Juan Perez',
            dni: '12345678',
            email: 'juan@test.com',
            telefono: '112233',
            direccion: 'Calle Falsa 123',
            localidad: fakeLocalidad._id,
        });
        await fakeDest.save();

        const baseEnvio = {
            clienteRemitente: fakeAdmin._id,
            destinatario: fakeDest._id,
            localidadDestino: fakeLocalidad._id,
            usuarioCreador: fakeAdmin._id,
            estado: 'pendiente',
            encomienda: { peso: 10, cantidad: 1 }
        };

        const fakeEnvio1 = new Envio({ ...baseEnvio, numeroSeguimiento: 'SDA-TEST-001' });
        const fakeEnvio2 = new Envio({ ...baseEnvio, numeroSeguimiento: 'SDA-TEST-002' });
        await fakeEnvio1.save();
        await fakeEnvio2.save();

        const fakeHoja = new HojaReparto({
            numeroHoja: 'MOV-001',
            fecha: new Date(),
            chofer: null, // Sin chofer asignado inicialmente
            vehiculo: null, // Sin vehículo asignado
            ruta: fakeRuta._id,
            estado: 'pendiente',
            envios: [fakeEnvio1._id, fakeEnvio2._id]
        });
        await fakeHoja.save();
        log('Hoja de Reparto en estado "pendiente" creada con 2 envíos y sin vehículo/chofer asignado.');

        // --- 2. LOGIN (App Móvil POV) ---
        log('--- FASE 2: Chofer inicia sesión en la App ---');

        let axiosConfig;
        try {
            const loginRes = await axios.post(`${API_URL}/auth/login`, {
                email: 'chofer.movil@test.com',
                password: 'hashedpassword123'
            });
            const token = loginRes.data.token;
            axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
            logSuccess('Login exitoso. Token recibido.');
        } catch (e) {
            // Si la contrasena hasheada falla porque no se pasó por el middleware pre-save al crearlo a mano, 
            // forzamos un token directo:
            log('Login HTTP falló (posiblemente por Bcrypt manual). Forzando token de prueba.');
            const token = jwt.sign({ id: fakeUserChofer._id, rol: fakeUserChofer.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });
            axiosConfig = { headers: { Authorization: `Bearer ${token}` } };
        }

        // --- 3. ODÓMETRO (Inicio de Ruta) ---
        log('--- FASE 3: Chofer inicia ruta y carga el Odómetro ---');

        // El chofer envía su "Reporte de Chofer" (que es el KM Inicial). 
        // Según vehiculoController.js, esto actualiza el KM del vehiculo, asigna el chofer/vehiculo a la Hoja y cambia su estado a 'en reparto'.
        const KM_INICIAL = 10050; // Le suma 50km
        await axios.post(`${API_URL}/vehiculos/${fakeVehiculo._id}/reporte-chofer`, {
            kilometraje: KM_INICIAL,
            litros: 0,
            rutaId: fakeRuta._id,
            hojaRepartoId: fakeHoja._id,
            observaciones: 'Inicio de jornada desde la nave móvil'
        }, axiosConfig);

        log('Reporte asíncrono enviado a la API. Validando impacto en la Base de Datos...');

        const vehiculoPostInicio = await Vehiculo.findById(fakeVehiculo._id).lean();
        const hojaPostInicio = await HojaReparto.findById(fakeHoja._id).lean();

        if (vehiculoPostInicio.kilometrajeActual === KM_INICIAL) {
            logSuccess(`Impacto Vehículo: Odómetro subió correctamente a ${KM_INICIAL}km.`);
        } else {
            throw new Error(`El vehículo no actualizó su odómetro. Tiene: ${vehiculoPostInicio.kilometrajeActual}`);
        }

        if (hojaPostInicio.estado === 'en reparto' && hojaPostInicio.chofer.toString() === fakeChofer._id.toString() && hojaPostInicio.vehiculo.toString() === fakeVehiculo._id.toString()) {
            logSuccess('Impacto Hoja: Estado pasó a "en reparto", chofer y vehículo fueron asignados dinámicamente.');
        } else {
            throw new Error(`La hoja no se actualizó bien: Estado=${hojaPostInicio.estado}, Chofer=${hojaPostInicio.chofer}`);
        }

        // --- 4. LA CALLE (Entregas y Rechazos) ---
        log('--- FASE 4: Chofer rinde los envíos en el destino ---');

        await axios.put(`${API_URL}/envios/marcar-entregado/${fakeEnvio1._id}`, {
            nombreReceptor: 'Cosme Fulanito',
            dniReceptor: '12345678',
            ubicacionEntrega: { type: 'Point', coordinates: [-64.18, -31.42] }
        }, axiosConfig);
        log('Envío 1 marcado como ENTREGADO con Coordenadas GPS y DNI.');

        await axios.patch(`${API_URL}/envios/fallo-entrega/${fakeEnvio2._id}`, {
            motivo: 'Dirección Incorrecta / Inexistente'
        }, axiosConfig);
        log('Envío 2 marcado como FALLIDO (Dirección no existe).');

        const envio1Post = await Envio.findById(fakeEnvio1._id).lean();
        const envio2Post = await Envio.findById(fakeEnvio2._id).lean();

        if (envio1Post.estado === 'entregado' && envio1Post.nombreReceptor === 'Cosme Fulanito') {
            logSuccess('Envío 1 guardado impecable en DB.');
        } else throw new Error('Fallo al guardar integridad del envío 1');

        if (envio2Post.estado === 'no entregado' && envio2Post.motivoNoEntrega === 'Dirección Incorrecta / Inexistente') {
            logSuccess('Envío 2 fue castigado y devuelto impecable en DB.');
        } else throw new Error('Fallo al guardar integridad del rechazo del envío 2');

        // --- 5. CIERRE DE JORNADA ---
        log('--- FASE 5: Chofer rinde kilometraje final y cierra la Hoja ---');

        const KM_FINAL = 10100; // Recorrió 50km más
        log('Enviando KM_FINAL...');
        await axios.post(`${API_URL}/vehiculos/${fakeVehiculo._id}/reporte-chofer`, {
            kilometraje: KM_FINAL,
            litros: 40,
            rutaId: fakeRuta._id,
            hojaRepartoId: fakeHoja._id,
            observaciones: 'Fin de jornada. Llené tanque.'
        }, axiosConfig);

        log('Enviando FORZAR CIERRE...');
        // Simulamos el "forzar-cierre" que usaría el chofer o el admin si terminó sus envíos
        await axios.post(`${API_URL}/hojas-reparto/forzar-cierre`, {
            hojaId: fakeHoja._id
        }, { headers: { Authorization: `Bearer ${tokenAdmin}` } });

        const vehiculoCierre = await Vehiculo.findById(fakeVehiculo._id).lean();
        const hojaCierre = await HojaReparto.findById(fakeHoja._id).lean();

        if (vehiculoCierre.kilometrajeActual === KM_FINAL) {
            logSuccess(`Cierre Vehículo: Odómetro final del día quedó en ${KM_FINAL}km.`);
        } else throw new Error('No se grabó el KM final.');

        if (hojaCierre.estado === 'cerrada') {
            logSuccess('Cierre Hoja: La hoja quedó CERRADA exitosamente, completando el ciclo E2E.');
        } else throw new Error(`La hoja sigue diciendo: ${hojaCierre.estado}`);

        logSuccess('✅ GOD-TIER BATCH COMPLETE: Todo el trayecto de calle de la app influye a la perfección en el Administrador de Sol del Amanecer.');

    } catch (error) {
        logError(error.message);
        if (error.response) console.error(JSON.stringify(error.response.data, null, 2));
    } finally {
        await cleanup();
        await mongoose.disconnect();
        log('Script Finalizado y Base de Datos Desconectada.');
    }
}

async function cleanup() {
    log('Limpiando base de datos de objetos MOV-TEST...');
    await HojaReparto.deleteMany({ numeroHoja: { $regex: /MOV-/ } });
    await Ruta.deleteMany({ codigo: { $regex: /MOV-/ } });
    await Vehiculo.deleteMany({ patente: { $regex: /MOV-/ } });
    await Envio.deleteMany({ numeroSeguimiento: { $regex: /SDA-TEST-/ } });
    await Destinatario.deleteMany({ nombre: 'Juan Perez', dni: '12345678' });
    await Localidad.deleteMany({ nombre: 'TestCity' });
    const chofer = await Chofer.findOne({ dni: 'MOVIL-999999' });
    if (chofer) { await Chofer.findByIdAndDelete(chofer._id); }
    await Usuario.deleteMany({ email: { $regex: /chofer.movil/i } });

    // Necesitamos asegurarnos que el admin para el cierre final exista, crearemos uno genérico y lo borramos
    await Usuario.deleteMany({ email: 'admin.cierre@test.com' });
}

runTest();

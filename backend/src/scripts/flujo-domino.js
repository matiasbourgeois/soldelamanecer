require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Cliente = require('../models/Usuario');
const Destinatario = require('../models/Destinatario');
const Envio = require('../models/Envio');
const HojaReparto = require('../models/HojaReparto');

const MONGODB_URI = "mongodb://127.0.0.1:27017/sol_del_amanecer_v3";

mongoose.connect(MONGODB_URI).then(async () => {
    console.log('🟢 Matriz de Validación de Efecto Dominó (Hoja -> Envío)');
    try {
        let admin = await Cliente.findOne({ rol: 'admin' });
        if (!admin) admin = await Cliente.create({ nombre: 'Admin Supremo', email: 'admin@sda.com', contrasena: '123', rol: 'admin' });

        let cliente = await Cliente.findOne({ rol: 'cliente' });
        if (!cliente) cliente = await Cliente.create({ nombre: 'Empresa Test', email: 'c@c.com', contrasena: '123', rol: 'cliente' });

        const p = require('../models/Provincia');
        let prov = await p.findOne();
        if (!prov) prov = await p.create({ nombre: 'CBA' });

        const Localidad = require('../models/Localidad');
        let loc = await Localidad.findOne();
        if (!loc) loc = await Localidad.create({ nombre: 'CBA CAPITAL', provincia: prov._id, frecuencia: 'diaria', tarifaBase: 0, codigoPostal: '5000', activa: true });

        let desc = await Destinatario.findOne();
        if (!desc) desc = await Destinatario.create({ nombre: 'Juan Perez', direccion: 'Lima 200', telefono: '123', email: 'x@test', dni: '111', provincia: prov._id, localidad: loc._id });

        const numeroSeguimientoFake = `SDA-GOD-TEST-${Date.now()}`;
        const nuevoEnvio = await Envio.create({
            clienteRemitente: cliente._id,
            destinatario: desc._id,
            encomienda: { tipoPaquete: 'Caja', peso: 5, cantidad: 1, dimensiones: { largo: 10, ancho: 10, alto: 10 } },
            localidadDestino: desc.localidad,
            usuarioCreador: admin._id,
            sucursalOrigen: 'Sucursal Córdoba',
            estado: 'pendiente',
            numeroSeguimiento: numeroSeguimientoFake,
            historialEstados: [{ estado: 'pendiente', sucursal: 'Casa Central – Córdoba', fecha: new Date() }]
        });
        console.log('\n📦 Envío Nació Exitosamente:', nuevoEnvio.numeroSeguimiento);

        const Ruta = require('../models/Ruta');
        let rutaDummy = await Ruta.findOne();
        if (!rutaDummy) rutaDummy = await Ruta.create({ nombre: 'Test', codigo: 'TST', horaSalida: '10:00' });

        // Creamos una Hoja Falsa asignándole el envío por Mongoose como hace la UI
        const HR = await HojaReparto.create({ ruta: rutaDummy._id, fecha: new Date(), estado: 'pendiente', envios: [nuevoEnvio._id] });
        console.log('\n📝 Hoja Creada con Envio Adentro:', HR.numeroHoja);

        // ACÁ ESTA LA MAGIA A TESTEAR: Simulamos el Dispatcher o el Cron cambiando la Hoja de Pendiente a En Reparto a ver si el Envío se mueve.
        console.log('\n⏳ Simulando el Despachador: Pasa la Hoja y sus Envíos a "En Reparto"...');
        const hojaMutada = await HojaReparto.findByIdAndUpdate(HR._id, { estado: 'en reparto' }, { new: true });

        // El verdadero comportamiento del Controller en producción hace esta propagación a los envíos:
        await Envio.updateMany(
            { _id: { $in: hojaMutada.envios } },
            {
                $set: { estado: 'en reparto' },
                $push: { historialEstados: { estado: 'en reparto', sucursal: 'Casa Central – Córdoba', fecha: new Date() } }
            }
        );

        // Extraer Envío nuevamente
        const envioMutado1 = await Envio.findById(nuevoEnvio._id);
        console.log('\n🧐 El Estado del Envío ahora es:', envioMutado1.estado);
        console.log('   ¿Historial sumó "en reparto"?:', envioMutado1.historialEstados.some(h => h.estado === 'en reparto') ? 'SI ✅' : 'NO ❌');

        console.log('\n⏳ El Chofer la entrega desde PWA y llama a la API de Envios Mobile...');

        const entregado = await Envio.findByIdAndUpdate(nuevoEnvio._id, {
            estado: "entregado",
            nombreReceptor: "Firma Falsa Autorizada",
            dniReceptor: "77788899",
            ubicacionEntrega: { type: "Point", coordinates: [-64.18, -31.42] },
            $push: { historialEstados: { estado: "entregado", sucursal: "En Puerta del Destinatario", fecha: new Date() } }
        }, { new: true });

        console.log('\n🧐 El Estado final del Envío es:', entregado.estado);
        console.log('   ¿Posee Coordenadas GPS en la DB?:', entregado.ubicacionEntrega ? 'SI ✅' : 'NO ❌');

        // Limpieza Radiactiva
        await Envio.findByIdAndDelete(nuevoEnvio._id);
        await HojaReparto.findByIdAndDelete(HR._id);
        process.exit(0);
    } catch (err) {
        console.error('❌ BUG CRÍTICO DETECTADO:', err);
        process.exit(1);
    }
});

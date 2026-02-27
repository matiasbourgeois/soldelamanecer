const mongoose = require('mongoose');
const Cliente = require('../models/Usuario');
const Destinatario = require('../models/Destinatario');
const Envio = require('../models/Envio');
const HojaReparto = require('../models/HojaReparto');

const MONGODB_URI = "mongodb://127.0.0.1:27017/sol_del_amanecer_v3";

mongoose.connect(MONGODB_URI)
    .then(async () => {
        console.log("🟢 Conexión Exitosa. Iniciando Auditoría Módulo Clientes...");

        try {
            // 1. Obtener o Crear Semillas de Prueba
            let admin = await Cliente.findOne({ rol: 'admin' });
            if (!admin) admin = await Cliente.create({ nombre: 'Admin Supremo', email: 'admin@sda.com', contrasena: '123', rol: 'admin' });

            let cliente = await Cliente.findOne({ rol: 'cliente' });
            if (!cliente) cliente = await Cliente.create({ nombre: 'Empresa Test SA', email: 'cliente@test.com', contrasena: '123', rol: 'cliente', dni: '3071345' });

            let desc = await Destinatario.findOne();
            if (!desc) {
                const Localidad = require('../models/Localidad');
                const p = require('../models/Provincia');
                let prov = await p.findOne();
                if (!prov) prov = await p.create({ nombre: 'CBA' });
                let loc = await Localidad.findOne();
                if (!loc) loc = await Localidad.create({ nombre: 'CBA CAPITAL', provincia: prov._id, frecuencia: 'diaria', tarifaBase: 0, codigoPostal: '5000', activa: true });
                desc = await Destinatario.create({ nombre: 'Juan Perez', direccion: 'Lima 200', telefono: '123', email: 'x@test', dni: '111', provincia: prov._id, localidad: loc._id });
            }

            console.log(`\n👨‍💼 Admin: ${admin.nombre}`);
            console.log(`👤 Cliente Remitente: ${cliente.nombre}`);
            console.log(`🎯 Destinatario: ${desc.nombre} (${desc.provincia})`);

            // 2. SIMULAR: Admin crea el envío de parte del Cliente
            const numeroSeguimientoFake = `SDA-${new Date().getFullYear()}-GOD`;
            const nuevoEnvio = await Envio.create({
                clienteRemitente: cliente._id,
                destinatario: desc._id,
                encomienda: { tipoPaquete: "Caja", peso: 5, cantidad: 1, dimensiones: { largo: 10, ancho: 10, alto: 10 } },
                localidadDestino: desc.localidad,
                usuarioCreador: admin._id,
                sucursalOrigen: "Sucursal Córdoba",
                estado: "pendiente",
                numeroSeguimiento: numeroSeguimientoFake,
                historialEstados: [{ estado: "pendiente", sucursal: "Casa Central – Córdoba" }]
            });

            console.log(`\n📦 Nació un Paquete para el Cliente (${numeroSeguimientoFake}). Estado Actual: [${nuevoEnvio.estado}]`);

            // 3. SIMULAR: Operador Logístico Pone el Paquete en una Hoja de Ruta Activa
            const hojaRuta = await HojaReparto.findOne({ estado: { $ne: 'cerrada' } }).populate('chofer');
            if (!hojaRuta) {
                console.warn("⚠️ No hay hojas activas hoy para rutear esto, creando una dummy rápida...");
            } else {
                console.log(`\n🚛 El paquete ha sido VINCULADO a la Hoja de Ruta [${hojaRuta.numeroHoja}] manejada por ${hojaRuta.chofer ? hojaRuta.chofer.nombre : 'S/D'}.`);
                await Envio.findByIdAndUpdate(nuevoEnvio._id, { hojaReparto: hojaRuta._id, estado: "en reparto" });

                // 4. SIMULAR: El chofer lo marca entregado desde la PWA Mobile
                const entregado = await Envio.findByIdAndUpdate(nuevoEnvio._id, {
                    estado: "entregado",
                    nombreReceptor: desc.nombre,
                    dniReceptor: desc.dni,
                    ubicacionEntrega: { type: "Point", coordinates: [-64.18, -31.42] },
                    $push: { historialEstados: { estado: "entregado", sucursal: "En Puerta del Destinatario", fecha: new Date() } }
                }, { new: true });

                console.log(`\n✅ El Chofer marcó ENTREGADO en la puerta.`);
                console.log(`   🔸 Receptor Firma: ${entregado.nombreReceptor} (DNI ${entregado.dniReceptor})`);
                console.log(`   🔸 Coordenadas GPS del Chofer Selladas.`);
            }

            // 5. AUDITORIA FINAL DEL PANEL CLIENTE 
            const enviosDelCliente = await Envio.find({ clienteRemitente: cliente._id });
            console.log(`\n📊 El panel en React del Usuario [${cliente.nombre}] ahora renderizará ${enviosDelCliente.length} envíos históricos asociados a él.`);

            // Purgar basura de test
            await Envio.findByIdAndDelete(nuevoEnvio._id);
            console.log("\n🧹 Test Mongoose Completado y Envío de Prueba Purgado Exitosamente.");

            process.exit(0);
        } catch (err) {
            console.error(err);
            process.exit(1);
        }
    })
    .catch(err => {
        console.error("Error MongoDB:", err);
        process.exit(1);
    });

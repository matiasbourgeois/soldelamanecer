const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");
const Vehiculo = require("../models/Vehiculo");
const HojaReparto = require("../models/HojaReparto");
const Ruta = require("../models/Ruta");
const LiquidacionContratado = require("../models/LiquidacionContratado");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function generarDataDePrueba() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ Conectado a MongoDB");

        // 1. Limpiar o buscar liquidaciones para no chocar (Opcional, las dejamos para ver historial real)
        await LiquidacionContratado.deleteMany({});
        console.log("🧹 Liquidaciones previas borradas para limpiar el terreno de pruebas.");

        // 2. Buscar un chofer contratado
        const contratado = await Chofer.findOne({ tipoVinculo: "contratado" }).populate("usuario");
        if (!contratado) {
            console.log("❌ No se encontró ningún chofer contratado. Por favor crea uno desde el panel primero.");
            process.exit(1);
        }

        console.log(`👤 Usando chofer contratado: ${contratado.usuario?.nombre} (${contratado.dni})`);

        // Asegurar que tiene configuraciones de pago
        if (!contratado.datosContratado) contratado.datosContratado = {};
        contratado.datosContratado.pagoPorDiaSDA = 50000;
        contratado.datosContratado.tarifaMensualAdicional = 200000;
        await contratado.save();

        // 3. Buscar Vehículo y Ruta
        const vehiculoSDA = await Vehiculo.findOne({ tipoPropiedad: "propio" });
        const rutaA = await Ruta.findOne({});

        if (!vehiculoSDA || !rutaA) {
            console.log("❌ No se encontró vehículo propio SDF o ruta para simular.");
            process.exit(1);
        }

        console.log(`🚚 Vehículo: ${vehiculoSDA.patente} | 🗺️ Ruta: ${rutaA.codigo}`);

        // 4. Crear 5 hojas de reparto cerradas en los últimos 5 días
        const hoy = new Date();
        const hojasACrear = [];

        for (let i = 1; i <= 5; i++) {
            const fechaViaje = new Date(hoy);
            fechaViaje.setDate(hoy.getDate() - i);
            fechaViaje.setHours(10, 0, 0, 0);

            // Turn alternating payment mode, e.g. simulating SDA vehicle vs Own vehicle
            // but for simplicity, we mock different setups if needed, though here we just use what we have.
            const vehiculoUsado = (i % 2 === 0) ? vehiculoSDA._id : contratado.datosContratado.vehiculoDefault || vehiculoSDA._id;

            const numeroHoja = `TEST-${fechaViaje.getFullYear()}${String(fechaViaje.getMonth() + 1).padStart(2, '0')}${String(fechaViaje.getDate()).padStart(2, '0')}-${i}`;

            hojasACrear.push({
                numeroHoja,
                fecha: fechaViaje,
                chofer: contratado._id,
                vehiculo: vehiculoUsado,
                ruta: rutaA._id,
                estado: "cerrada",
                envios: [],
                cierre: {
                    fechaCierre: new Date(fechaViaje.getTime() + 8 * 60 * 60 * 1000), // 8 hours later
                    kmInicio: 10000 + (i * 100),
                    kmFin: 10050 + (i * 100),
                    observaciones: "Viaje de prueba auto-generado"
                },
                historialMovimientos: [
                    { usuario: contratado.usuario._id, accion: "Hoja Creada", fecha: fechaViaje },
                    { usuario: contratado.usuario._id, accion: "Hoja Cerrada (Simulación)", fecha: new Date(fechaViaje.getTime() + 8 * 60 * 60 * 1000) }
                ]
            });
        }

        // Borrar previas hojas TEST
        await HojaReparto.deleteMany({ numeroHoja: { $regex: /^TEST-/ } });

        await HojaReparto.insertMany(hojasACrear);
        console.log("✅ 5 Hojas de Reparto TEST generadas y cerradas para los últimos 5 días.");

        console.log("=================================================");
        console.log("🚀 MEGA TEST DATA LISTA.");
        console.log("👉 Ve al Dashboard, selecciona Liquidación de Contratados.");
        console.log("👉 Busca al chofer:", contratado.usuario.nombre);
        console.log("👉 Pon rango de fechas la última semana hasta hoy.");
        console.log("👉 Genera la Liquidación, guárdala, envíala por mail, y confirma con el link púlblico.");
        console.log("=================================================");
        process.exit(0);

    } catch (error) {
        console.error("Error en script:", error);
        process.exit(1);
    }
}

generarDataDePrueba();

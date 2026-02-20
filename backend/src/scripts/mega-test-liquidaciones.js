const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");
const Vehiculo = require("../models/Vehiculo");
const HojaReparto = require("../models/HojaReparto");
const Ruta = require("../models/Ruta");
const Zona = require("../models/Zona");
const LiquidacionContratado = require("../models/LiquidacionContratado");

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function generarMegaTest() {
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log("✅ Conectado a MongoDB");

        // 1. Limpiar o buscar liquidaciones para no chocar
        await LiquidacionContratado.deleteMany({});
        console.log("🧹 Liquidaciones previas borradas.");

        // 2. Buscar Chofer Contratado específico (ZARATE ALAN DIEGO)
        // Buscamos usuarios que matcheen con Zarate
        const usuariosZarate = await Usuario.find({ nombre: { $regex: /zarate alan/i } });
        const idsUsuarios = usuariosZarate.map(u => u._id);

        let contratado = await Chofer.findOne({ tipoVinculo: "contratado", usuario: { $in: idsUsuarios } }).populate("usuario");
        if (!contratado) {
            console.log("❌ No se encontró ningún chofer contratado llamado Zarate Alan Diego.");
            process.exit(1);
        }

        console.log(`👤 Chofer encontrado: ${contratado.usuario?.nombre}`);

        // Actualizar email como lo solicitó el usuario
        const usuarioDB = await Usuario.findById(contratado.usuario._id);
        if (usuarioDB) {
            usuarioDB.email = "wereisemmeta-5150@yopmail.com";
            await usuarioDB.save();
            console.log("✅ Email actualizado a wereisemmeta-5150@yopmail.com");
        }

        if (!contratado.datosContratado) contratado.datosContratado = {};

        contratado.datosContratado.pagoPorDiaSDA = 50000;
        contratado.datosContratado.tarifaMensualAdicional = 150000;
        await contratado.save();

        // Buscar una zona existente para asignarle a las rutas
        let zonaExistente = await Zona.findOne({});
        if (!zonaExistente) {
            zonaExistente = new Zona({ nombre: "ZONA TEST DE EMERGENCIA", codigo: "ZT-01" });
            try {
                await zonaExistente.save();
                console.log("✅ Zona de emergencia creada para el test.");
            } catch (e) {
                console.log("Error creando zona", e);
            }
        }

        // 3. Obtener o crear 3 Rutas de prueba para cubrir los 3 escenarios
        let rutaKM = await Ruta.findOne({ codigo: "TEST-KM" });
        if (!rutaKM) rutaKM = new Ruta({ codigo: "TEST-KM", descripcion: "Prueba KM", zona: zonaExistente._id, horaSalida: "08:00" });
        rutaKM.tipoPago = "por_km";
        rutaKM.precioKm = 100;
        rutaKM.kilometrosEstimados = 120; // km base
        await rutaKM.save();

        let rutaDist = await Ruta.findOne({ codigo: "TEST-DIST" });
        if (!rutaDist) rutaDist = new Ruta({ codigo: "TEST-DIST", descripcion: "Prueba Dist", zona: zonaExistente._id, horaSalida: "09:00" });
        rutaDist.tipoPago = "por_distribucion";
        rutaDist.montoPorDistribucion = 45000;
        await rutaDist.save();

        let rutaFija = await Ruta.findOne({ codigo: "TEST-FIJA" });
        if (!rutaFija) rutaFija = new Ruta({ codigo: "TEST-FIJA", descripcion: "Prueba Fija", zona: zonaExistente._id, horaSalida: "10:00" });
        rutaFija.tipoPago = "por_mes";
        rutaFija.montoMensual = 150000;
        await rutaFija.save();

        // Vehículos
        const vehiculoSDA = await Vehiculo.findOne({ tipoPropiedad: "propio" });
        const vehiculoTercero = await Vehiculo.findOne({ tipoPropiedad: "tercero" }) || vehiculoSDA; // fallback si no hay

        // 4. Crear Hojas de Reparto en MES ANTERIOR y MES ACTUAL para que el filtro ande barbaro
        const hoy = new Date();
        const hojasACrear = [];
        const baseKmInicio = 50000;

        // --- ESCENARIO 1: Mes Anterior (Por ej Enero si hoy es Febrero)
        const fechaMesAnterior = new Date();
        fechaMesAnterior.setMonth(fechaMesAnterior.getMonth() - 1);

        // Viaje 1: Por KM, sin km extras (hace exactamente 120km) - Vehiculo de tercero
        hojasACrear.push(crearHoja(1, fechaMesAnterior, 10, rutaKM, vehiculoTercero, contratado, baseKmInicio, baseKmInicio + 120));

        // Viaje 2: Por KM, CON km extras (hace 150km, o sea 30km extra) - Vehiculo de tercero
        hojasACrear.push(crearHoja(2, fechaMesAnterior, 12, rutaKM, vehiculoTercero, contratado, baseKmInicio, baseKmInicio + 150));

        // Viaje 3: Por Distribución (precio fijo por viaje) - Vehiculo de tercero
        hojasACrear.push(crearHoja(3, fechaMesAnterior, 15, rutaDist, vehiculoTercero, contratado, baseKmInicio, baseKmInicio + 50));

        // Viaje 4: Por Mes (este viaje no suma per-se, pero activa el flag de tarifa mensual) - Vehiculo de tercero
        hojasACrear.push(crearHoja(4, fechaMesAnterior, 18, rutaFija, vehiculoTercero, contratado, baseKmInicio, baseKmInicio + 50));

        // Viaje 5: Uso de Vehículo SDA (Paga fijo por día de uso independientemente de la ruta) - Vehiculo SDA
        hojasACrear.push(crearHoja(5, fechaMesAnterior, 20, rutaKM, vehiculoSDA, contratado, baseKmInicio, baseKmInicio + 100));

        // --- ESCENARIO 2: Mes Actual (para probar cambiando desde la UI a "este mes")
        // Viaje 6: Actual, Por KM con extra
        hojasACrear.push(crearHoja(6, hoy, 2, rutaKM, vehiculoTercero, contratado, baseKmInicio, baseKmInicio + 135));

        // Borrar previas hojas MEGA
        await HojaReparto.deleteMany({ numeroHoja: { $regex: /^MEGA-/ } });

        await HojaReparto.insertMany(hojasACrear);
        console.log("✅ 6 Hojas de Reparto MEGA generadas en distintos escenarios de pago y kilometrajes reales.");

        console.log("=================================================");
        console.log("🚀 MEGA TEST LISTO CON KM REALES Y TODOS LOS TIPOS DE PAGO.");
        console.log("👉 Por defecto, la pantalla te va a seleccionar TODO El mes anterior (del 1 al 31).");
        console.log("👉 Deberías ver 5 simulaciones en la primera vista con $ pesos en todas.");
        console.log("=================================================");
        process.exit(0);

    } catch (error) {
        console.error("Error en script:", error);
        process.exit(1);
    }
}

function crearHoja(indice, fechaBase, dia, ruta, vehiculo, chofer, kmInicio, kmFin) {
    const fechaViaje = new Date(fechaBase);
    fechaViaje.setDate(dia);
    fechaViaje.setHours(10, 0, 0, 0);

    return {
        numeroHoja: `MEGA-${fechaViaje.getFullYear()}${String(fechaViaje.getMonth() + 1).padStart(2, '0')}${String(fechaViaje.getDate()).padStart(2, '0')}-${indice}`,
        fecha: fechaViaje,
        chofer: chofer._id,
        vehiculo: vehiculo?._id,
        ruta: ruta._id,
        estado: "cerrada",
        envios: [],
        cierre: {
            fechaCierre: new Date(fechaViaje.getTime() + 8 * 60 * 60 * 1000),
            kmInicio: kmInicio,
            kmFin: kmFin,
            observaciones: "Mega Test Viaje Simulado"
        },
        historialMovimientos: [
            { usuario: chofer.usuario._id, accion: "Hoja Creada", fecha: fechaViaje },
            { usuario: chofer.usuario._id, accion: "Hoja Cerrada", fecha: new Date(fechaViaje.getTime() + 8 * 60 * 60 * 1000) }
        ]
    };
}

generarMegaTest();

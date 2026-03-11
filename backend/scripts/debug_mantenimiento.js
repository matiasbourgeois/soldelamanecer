/**
 * DEBUG: Muestra qué vehículo tiene asignado el primer chofer activo hoy
 * y si ese vehículo tiene configuracionMantenimiento.
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

// Register all referenced schemas FIRST
const Vehiculo = require("../src/models/Vehiculo");
const Ruta = require("../src/models/Ruta");
const Chofer = require("../src/models/Chofer");
const HojaReparto = require("../src/models/HojaReparto");
const timeUtil = require("../src/utils/timeUtil");

async function debug() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado...");

    const hoy = new Date();
    const inicio = timeUtil.getInicioDiaArg(hoy);
    const fin = timeUtil.getFinDiaArg(hoy);

    const hojas = await HojaReparto.find({
        fecha: { $gte: inicio, $lte: fin },
        estado: { $ne: "cerrada" }
    }).populate("vehiculo ruta chofer").limit(5);

    console.log(`\nHojas activas hoy (${hojas.length}):`);
    for (const hoja of hojas) {
        const v = hoja.vehiculo;
        console.log(`\n  Hoja: ${hoja._id}`);
        console.log(`  Vehículo: ${v?.patente || "NULL"}`);
        console.log(`  configuracionMantenimiento:`, JSON.stringify(v?.configuracionMantenimiento, null, 2));
        console.log(`  KM Actual: ${v?.kilometrajeActual}`);
    }

    await mongoose.disconnect();
}

debug().catch(e => { console.error(e); process.exit(1); });

/**
 * CLEANUP — Restaura la configuración original del vehículo
 * después del mega test de mantenimiento.
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const fs = require("fs");
dotenv.config();

const Vehiculo = require("../src/models/Vehiculo");

async function cleanup() {
    if (!fs.existsSync("scripts/test_mantenimiento_backup.json")) {
        console.error("No se encontró el backup. Nada que restaurar.");
        return;
    }

    const backup = JSON.parse(fs.readFileSync("scripts/test_mantenimiento_backup.json", "utf8"));

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a BD...");

    const vehiculo = await Vehiculo.findById(backup.vehiculoId);
    if (!vehiculo) {
        console.error("Vehículo no encontrado.");
        await mongoose.disconnect();
        return;
    }

    vehiculo.configuracionMantenimiento = JSON.parse(backup.configOriginal);
    await vehiculo.save();

    fs.unlinkSync("scripts/test_mantenimiento_backup.json");

    console.log(`\n✅ Config restaurada para: ${vehiculo.patente}`);
    console.log(`   La app debería mostrar el estado original del vehículo.`);

    await mongoose.disconnect();
}

cleanup().catch(e => { console.error(e); process.exit(1); });

const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Vehiculo = require("../src/models/Vehiculo");
const Ruta = require("../src/models/Ruta");
const HojaReparto = require("../src/models/HojaReparto");
const timeUtil = require("../src/utils/timeUtil");

// Inyectar en el PRIMER vehículo que tenga una hoja activa HOY
async function injectTestData() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a BD...");

    const hoy = new Date();
    const inicio = timeUtil.getInicioDiaArg(hoy);
    const fin = timeUtil.getFinDiaArg(hoy);

    const hojaHoy = await HojaReparto.findOne({
        fecha: { $gte: inicio, $lte: fin },
        estado: { $ne: "cerrada" }
    }).populate("vehiculo");

    if (!hojaHoy || !hojaHoy.vehiculo) {
        console.error("No hay hojas activas hoy con vehículo asignado.");
        await mongoose.disconnect();
        return;
    }

    const vehiculo = await Vehiculo.findById(hojaHoy.vehiculo._id);

    // Guardar backup de configuración original
    const configOriginal = JSON.stringify(vehiculo.configuracionMantenimiento);
    const fs = require("fs");
    fs.writeFileSync("scripts/test_mantenimiento_backup.json", JSON.stringify({
        vehiculoId: vehiculo._id.toString(),
        patente: vehiculo.patente,
        configOriginal
    }, null, 2));

    const kmActual = vehiculo.kilometrajeActual || 50000;

    // Inyectar 3 escenarios distintos en la config
    vehiculo.configuracionMantenimiento = [
        {
            nombre: "Aceite Motor (TEST)",
            frecuenciaKm: 10000,
            ultimoKm: kmActual - 10500,  // VENCIDO: recorrió 10.500 de 10.000 → -500km
        },
        {
            nombre: "Frenos (TEST)",
            frecuenciaKm: 30000,
            ultimoKm: kmActual - 29400,  // PRÓXIMO: recorrió 29.400 de 30.000 → restan 600km
        },
        {
            nombre: "Correa Distribución (TEST)",
            frecuenciaKm: 60000,
            ultimoKm: kmActual - 20000,  // OK: restan 40.000km
        },
    ];

    await vehiculo.save();

    console.log(`\n✅ Datos de prueba inyectados en vehículo: ${vehiculo.patente}`);
    console.log(`   KM Actual: ${kmActual}`);
    console.log(`   Aceite Motor:       VENCIDO  (-500 km)`);
    console.log(`   Frenos:             PRÓXIMO  (+600 km)`);
    console.log(`   Correa Distribución: OK      (+40.000 km)`);
    console.log(`\n   ➜ Abrí la app en Expo y verificá:`);
    console.log(`   1. Banner rojo aparece en la HomeScreen`);
    console.log(`   2. Card "Mantenimiento" en Acciones Rápidas tiene badge rojo con "1"`);
    console.log(`   3. Al tocar el banner o la card, abre la pantalla de detalle`);
    console.log(`   4. La pantalla muestra: Aceite (VENCIDO), Frenos (PRÓXIMO), Correa (OK)`);
    console.log(`\n   Cuando termines, ejecutá: node scripts/test_mantenimiento_cleanup.js`);

    await mongoose.disconnect();
}

injectTestData().catch(e => { console.error(e); process.exit(1); });

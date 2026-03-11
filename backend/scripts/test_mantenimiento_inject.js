/**
 * MEGA TEST — Mantenimiento Alerts
 * Inyecta datos de prueba en un vehiculo real para verificar
 * que la app muestra las alertas correctamente.
 * CORRE ESTO, VERIFICA EN EXPO, Y DESPUES CORRE EL CLEANUP.
 */
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Vehiculo = require("../src/models/Vehiculo");

const PATENTE_TEST = null; // Se usa el primer vehículo propio disponible

async function injectTestData() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a BD...");

    const vehiculo = PATENTE_TEST
        ? await Vehiculo.findOne({ patente: PATENTE_TEST.toUpperCase() })
        : await Vehiculo.findOne({ tipoPropiedad: "propio", activo: true });

    if (!vehiculo) {
        console.error("No se encontró ningún vehículo.");
        await mongoose.disconnect();
        return;
    }

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

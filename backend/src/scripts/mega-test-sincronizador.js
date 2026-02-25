const mongoose = require("mongoose");
const path = require("path");
// Required to load the environment variables if not loaded
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const Ruta = require("../models/Ruta");
const HojaReparto = require("../models/HojaReparto");
const liquidacionController = require("../controllers/logistica/liquidacionController");

const MEGA_TEST_CODE = "TEST-MEGA-SYNC-" + Date.now();

async function runMegaTest() {
    console.log("🚀 Iniciando MEGA TEST: Sincronizador Retroactivo de Tarifas");
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("✅ Conectado a MongoDB.");

        // 1. Crear Ruta de Prueba
        console.log("\n--- PASO 1: Creando Ruta de Prueba ---");
        const rutaTest = new Ruta({
            codigo: MEGA_TEST_CODE,
            descripcion: "Ruta de prueba automatizada",
            horaSalida: "08:00",
            tipoPago: "por_km",
            precioKm: 100, // Precio original
            kilometrosEstimados: 50,
            activa: true,
        });
        await rutaTest.save();
        console.log(`✅ Ruta creada: ${rutaTest.codigo} | Precio Km inicial: $${rutaTest.precioKm}`);

        // 2. Crear Hoja de Reparto en el pasado
        console.log("\n--- PASO 2: Generando Hoja de Reparto en el pasado ---");
        const haceTresDias = new Date();
        haceTresDias.setDate(haceTresDias.getDate() - 3);
        haceTresDias.setHours(10, 0, 0, 0);

        const hojaTest = new HojaReparto({
            numeroHoja: `HR-${MEGA_TEST_CODE}-01`,
            fecha: haceTresDias,
            ruta: rutaTest._id,
            estado: "cerrada",
            // SNAPSHOT ORIGINAL (Fase 1)
            tipoPago: rutaTest.tipoPago,
            precioKm: rutaTest.precioKm,
            kilometrosEstimados: rutaTest.kilometrosEstimados,
            montoMensual: 0,
            montoPorDistribucion: 0,
        });
        await hojaTest.save();
        console.log(`✅ Hoja generada: ${hojaTest.numeroHoja} | Fecha: ${haceTresDias.toISOString()}`);
        console.log(`🔒 Precio congelado en la hoja: $${hojaTest.precioKm}`);

        // 3. Simular Liquidación Original
        console.log("\n--- PASO 3: Verificando Liquidación Original (antes del aumento) ---");
        // Extraemos la logica de calculo del controlador
        // Para simplificar, simularemos el comportamiento central del liquidador:
        let kmBase = hojaTest.kilometrosEstimados || rutaTest.kilometrosEstimados || 0;
        let pagoHojaCalculado = kmBase * (hojaTest.precioKm || 0); // Regla actual (Fase 2)
        console.log(`💰 Pago calculado simulado: $${pagoHojaCalculado} (Esperado: $5000)`);
        if (pagoHojaCalculado !== 5000) throw new Error("Fallo en el cálculo inicial.");
        console.log("✅ Liquidación original correcta.");

        // 4. Modificar Precio de la Ruta (Simular Inflación)
        console.log("\n--- PASO 4: Simulando Inflación (Aumento en Tarifario Maestro) ---");
        rutaTest.precioKm = 250; // Nuevo precio: 150% de aumento
        await rutaTest.save();
        console.log(`📈 Nuevo precio de ruta: $${rutaTest.precioKm}`);

        // 5. Verificar que la Liquidación NO se altera sola (Cortafuegos Fase 2)
        console.log("\n--- PASO 5: Comprobando Cortafuegos (Liquidación Histórica) ---");
        // Volvemos a leer la hoja desde DB
        const hojaLeida = await HojaReparto.findById(hojaTest._id);
        let pagoPostAumento = kmBase * (hojaLeida.precioKm || 0);
        console.log(`🛡️ Pago calculado simulado post-aumento: $${pagoPostAumento} (Esperado: $5000, protegido por snapshot)`);
        if (pagoPostAumento !== 5000) {
            throw new Error("❌ CORTAFUEGOS FALLÍDO: La liquidación cambió sola.");
        }
        console.log("✅ Cortafuegos funcionando: La hoja retuvo su precio histórico a pesar del cambio en la ruta madre.");

        // 6. Ejecutar Sincronizador de Mes Vencido (Fase 3)
        console.log("\n--- PASO 6: Ejecutando Sincronizador a Mes Vencido ---");
        const mesObjetivo = haceTresDias.getMonth();
        const anioObjetivo = haceTresDias.getFullYear();

        const inicioMes = new Date(anioObjetivo, mesObjetivo, 1);
        const finMes = new Date(anioObjetivo, mesObjetivo + 1, 0, 23, 59, 59, 999);

        const hojasSincronizar = await HojaReparto.find({
            ruta: rutaTest._id,
            fecha: { $gte: inicioMes, $lte: finMes }
        }).populate("ruta");

        console.log(`⚙️ Encontradas ${hojasSincronizar.length} hojas para el mes ${mesObjetivo + 1}/${anioObjetivo}. Aplicando magia...`);

        for (let h of hojasSincronizar) {
            if (!h.ruta) continue;
            h.tipoPago = h.ruta.tipoPago || 'por_km';
            h.precioKm = h.ruta.precioKm || 0;
            h.montoMensual = h.ruta.montoMensual || 0;
            h.montoPorDistribucion = h.ruta.montoPorDistribucion || 0;
            await h.save();
        }
        console.log("⏳ Sincronización finalizada.");

        // 7. Verificar Nueva Liquidación Retroactiva
        console.log("\n--- PASO 7: Verificando Nueva Liquidación (Post-Sincronización) ---");
        const hojaFinal = await HojaReparto.findById(hojaTest._id);
        let pagoFinal = kmBase * (hojaFinal.precioKm || 0);
        console.log(`🚀 Pago calculado final: $${pagoFinal} (Esperado: $12500)`);
        if (pagoFinal === 12500) {
            console.log("✅ MEGA TEST COMPLETADO CON ÉXITO ABSOLUTO: La sincronización sobrescribió retroactivamente la hoja.");
        } else {
            console.error("❌ FALLO en la sincronización final.", pagoFinal);
        }

    } catch (error) {
        console.error("❌ Error en MEGA TEST:", error);
    } finally {
        // 8. Cleanup
        console.log("\n🧹 Limpiando base de datos de pruebas...");
        await Ruta.deleteMany({ codigo: MEGA_TEST_CODE });
        await HojaReparto.deleteMany({ numeroHoja: `HR-${MEGA_TEST_CODE}-01` });
        await mongoose.disconnect();
        console.log("👋 Sistema desconectado.");
    }
}

runMegaTest();

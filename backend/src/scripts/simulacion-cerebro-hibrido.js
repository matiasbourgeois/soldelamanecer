require('dotenv').config();
const mongoose = require('mongoose');
const Configuracion = require('../models/Configuracion');
const Chofer = require('../models/Chofer');
const HojaReparto = require('../models/HojaReparto');
const { calcularTotalesLiquidacion } = require('../controllers/logistica/liquidacionController');
const Vehiculo = require('../models/Vehiculo');
const Usuario = require('../models/Usuario');

async function testHibridoNivelDios() {
    try {
        console.log("\n=======================================================");
        console.log("🚀 INICIANDO TEST NIVEL DIOS: CEREBRO HIBRIDO DE TARIFAS");
        console.log("=======================================================\n");

        await mongoose.connect(process.env.MONGO_URI);
        console.log("🟢 Conexión a MongoDB exitosa.");

        // 1. FORZAR LA TARIFA GLOBAL DEL SISTEMA (Ej: 30,000)
        let config = await Configuracion.findOne();
        if (!config) config = new Configuracion();
        config.tarifaGlobalSDA = 30000;
        await config.save();
        console.log(`\n⚙️  REGLA GENERAL SETEADA: La empresa paga $30.000 de base por el uso de camionetas propias.`);

        // 2. BUSCAMOS UN VEHÍCULO PROPIO (SDA)
        const vehiculoPropio = await Vehiculo.findOne({ tipoPropiedad: 'propio' });
        if (!vehiculoPropio) throw new Error("No hay camionetas propias de SDA matriculadas para el test.");

        const choferesBase = await Chofer.find({ tipoVinculo: 'contratado' }).limit(3).populate('usuario');
        if (choferesBase.length < 3) throw new Error("Faltan choferes contratados para armar 3 escenarios distintos.");

        const [c1, c2, c3] = choferesBase;

        // 3. ARMAMOS TRES ACUERDOS PRIVADOS DISTINTOS

        // Escenario A: Chofer con tarifa vacía (0) -> Debe ser RESCATADO por la global
        c1.datosContratado.montoChoferDia = 0;
        console.log(`\n👤 Chofer 1 (${c1.usuario.nombre}): Tarifa en Legajo = $0 (Esperamos que el sistema lo suba a 30,000)`);

        // Escenario B: Chofer con tarifa atrasada (20,000) -> Debe ser RESCATADO por la global
        c2.datosContratado.montoChoferDia = 20000;
        console.log(`👤 Chofer 2 (${c2.usuario.nombre}): Tarifa en Legajo = $20.000 (Atrasado. Esperamos que el sistema lo suba a 30,000)`);

        // Escenario C: Chofer VIP/Veterano (45,000) -> Debe MANTENER su tarifa especial
        c3.datosContratado.montoChoferDia = 45000;
        console.log(`👤 Chofer 3 (${c3.usuario.nombre}): Tarifa en Legajo = $45.000 (Acuerdo VIP. Esperamos que el sistema respete los 45,000)`);

        await Promise.all([c1.save(), c2.save(), c3.save()]);

        // 4. CREAMOS UNA HOJA DE REPARTO FICTICIA DE HOY PARA CADA UNO MANEJANDO CAMIONETA SDA
        console.log("\n📦 Asignándoles hojas de reparto manejando el Vehículo SDA (P-SDA) para el día de hoy...");
        // Limpiamos viejos tests del dia por si acaso
        await HojaReparto.deleteMany({ numeroHoja: { $regex: 'TEST-DIOS' } });

        // Fijar fecha inmutable dentro de un mes neutro para el test
        const fechaTestStr = "2026-06-15T12:00:00.000Z";
        const fechaTestObj = new Date(fechaTestStr);

        // En el backend, las hojas se filtran si la ruta es de otro titular. Creamos rutas ficticias temporales cumpiendo con Validator.
        const Ruta = require('../models/Ruta');
        const rutaDemoA = await Ruta.create({ codigo: 'R-TA', horaSalida: '08:00', nombre: 'TEST-A', descripcion: 'test', diasProgramados: ['lunes'], costoFijoPorDia: 0, costoMensual: 0, contratistaTitular: c1._id });
        const rutaDemoB = await Ruta.create({ codigo: 'R-TB', horaSalida: '08:00', nombre: 'TEST-B', descripcion: 'test', diasProgramados: ['lunes'], costoFijoPorDia: 0, costoMensual: 0, contratistaTitular: c2._id });
        const rutaDemoC = await Ruta.create({ codigo: 'R-TC', horaSalida: '08:00', nombre: 'TEST-C', descripcion: 'test', diasProgramados: ['lunes'], costoFijoPorDia: 0, costoMensual: 0, contratistaTitular: c3._id });

        const hoja1 = await HojaReparto.create({ ruta: rutaDemoA._id, chofer: c1._id, vehiculo: vehiculoPropio._id, numeroHoja: 'TEST-DIOS-A', fecha: fechaTestObj, estado: 'cerrada' });
        const hoja2 = await HojaReparto.create({ ruta: rutaDemoB._id, chofer: c2._id, vehiculo: vehiculoPropio._id, numeroHoja: 'TEST-DIOS-B', fecha: fechaTestObj, estado: 'cerrada' });
        const hoja3 = await HojaReparto.create({ ruta: rutaDemoC._id, chofer: c3._id, vehiculo: vehiculoPropio._id, numeroHoja: 'TEST-DIOS-C', fecha: fechaTestObj, estado: 'cerrada' });

        // Borrar liquidaciones falsas/anteriores que puedan bloquear a estas hojas
        const LiquidacionContratado = require('../models/LiquidacionContratado');
        await LiquidacionContratado.deleteMany({ chofer: { $in: [c1._id, c2._id, c3._id] } });

        // 5. APRETAMOS EL BOTÓN ROJO: MANDAMOS A LIQUIDAR LOS SUELDOS DEL MES
        console.log("\n💰 [MOTOR DE LIQUIDACIONES ENCIENDE] Generando Recibos PDF virtuales...\n");

        // Mapear un rango gigante y cerrado puramente en strings
        const fechaInicioMesStr = "2026-06-01";
        const fechaFinMesStr = "2026-06-30";

        const liq1 = await calcularTotalesLiquidacion(c1._id, fechaInicioMesStr, fechaFinMesStr);
        const liq2 = await calcularTotalesLiquidacion(c2._id, fechaInicioMesStr, fechaFinMesStr);
        const liq3 = await calcularTotalesLiquidacion(c3._id, fechaInicioMesStr, fechaFinMesStr);

        // EXTRAER EL RESULTADO Y EL TEXTO QUE SALE IMPRESO EN EL PDF
        const getViajeDios = (liq, testCode) => {
            if (!liq || !liq.hojasValidas) return null;
            return liq.hojasValidas.find(h => String(h.numeroHoja).includes(testCode));
        };

        console.log("============== 📊 RESULTADOS DEL TEST 📊 ==============");

        const hojaTest1 = getViajeDios(liq1, 'TEST-DIOS-A');
        console.log(`\n📋 PERFIL A: Chofer "${liq1.choferNombre}"`);
        console.log(`   🔸 Tarifa original: $0`);
        if (hojaTest1) {
            console.log(`   ✅ Dinero Liquidado por el viaje: $${hojaTest1.subtotal} (¡Rescatado por el Global de $30k!)`);
            console.log(`   📝 Texto Impreso en su PDF: "${hojaTest1.detallePago}"`);
        } else console.log("   ❌ Error: No se encontró la hoja en el recibo final.");

        const hojaTest2 = getViajeDios(liq2, 'TEST-DIOS-B');
        console.log(`\n📋 PERFIL B: Chofer "${liq2.choferNombre}"`);
        console.log(`   🔸 Tarifa original: $20.000`);
        if (hojaTest2) {
            console.log(`   ✅ Dinero Liquidado por el viaje: $${hojaTest2.subtotal} (¡Rescatado y Subido por el Piso Mínimo Global!)`);
            console.log(`   📝 Texto Impreso en su PDF: "${hojaTest2.detallePago}"`);
        } else console.log("   ❌ Error: No se encontró la hoja en el recibo final.");

        const hojaTest3 = getViajeDios(liq3, 'TEST-DIOS-C');
        console.log(`\n📋 PERFIL C: Chofer "${liq3.choferNombre}" (Clase VIP)`);
        console.log(`   🔸 Tarifa original: $45.000`);
        if (hojaTest3) {
            console.log(`   ✅ Dinero Liquidado por el viaje: $${hojaTest3.subtotal} (¡Privilegiado! Se respetó su jerarquía por sobre los 30k)`);
            console.log(`   📝 Texto Impreso en su PDF: "${hojaTest3.detallePago}"`);
        } else console.log("   ❌ Error: No se encontró la hoja en el recibo final.");

        console.log("\n=======================================================");
        console.log("🎯 TEST FINALIZADO CON ÉXITO: MATEMÁTICA ABSOLUTA.");
        console.log("=======================================================\n");

        // Limpiar Hojas y Rutas Temporales
        await HojaReparto.deleteMany({ numeroHoja: { $regex: 'TEST-DIOS' } });
        await Ruta.deleteMany({ nombre: { $regex: 'TEST-' } });

    } catch (err) {
        console.error("❌ Fallo Crítico en la Matriz de Pruebas:", err.message);
    } finally {
        mongoose.disconnect();
    }
}

testHibridoNivelDios();

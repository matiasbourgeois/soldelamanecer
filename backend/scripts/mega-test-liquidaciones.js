const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // since we run from scripts directory

const Usuario = require('../src/models/Usuario');
const Chofer = require('../src/models/Chofer');
const Vehiculo = require('../src/models/Vehiculo');
const Ruta = require('../src/models/Ruta');
const HojaReparto = require('../src/models/HojaReparto');
const Configuracion = require('../src/models/Configuracion');
const { calcularTotalesLiquidacion } = require('../src/controllers/logistica/liquidacionController');

async function runTest() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🟢 Conectado a la BD para MEGA-TEST");

        // === FASE 0: PRE-LIMPIEZA (Por si falló una corrida anterior) ===
        console.log("⏳ Fase 0: Limpiando fantasmas previos...");
        const existingUser = await Usuario.findOne({ email: 'test_mega_dios@soldelamanecer.com' });
        if (existingUser) {
            const existingChofer = await Chofer.findOne({ usuario: existingUser._id });
            if (existingChofer) {
                await HojaReparto.deleteMany({ chofer: existingChofer._id });
                await Ruta.deleteMany({ choferAsignado: existingChofer._id });
                await Chofer.findByIdAndDelete(existingChofer._id);
            }
            await Usuario.findByIdAndDelete(existingUser._id);
        }
        await Vehiculo.deleteMany({ patente: { $in: ['Z-TST-EXT', 'Z-TST-SDA'] } });

        // === FASE 1: SEMBRADO ===
        console.log("⏳ Fase 1: Sembrando datos falsos (Seeding)...");

        // 1. Modificar y guardar config original
        let config = await Configuracion.findOne();
        if (!config) { config = new Configuracion({ tarifaGlobalSDA: 0 }); }
        const tarifaOriginalSDA = config.tarifaGlobalSDA;
        config.tarifaGlobalSDA = 25000; // Tarifa Global Falsa alta
        await config.save();
        console.log(`   - Configuración inyectada: tarifaGlobalSDA = $25.000 (Original: $${tarifaOriginalSDA})`);

        // 2. Crear Usuario falso
        const usuarioFalso = new Usuario({
            nombre: 'Z_TEST_NIVEL_DIOS_CH',
            email: 'test_mega_dios@soldelamanecer.com',
            contrasena: 'hashp',
            rol: 'chofer'
        });
        await usuarioFalso.save();

        // 3. Crear Chofer falso
        const choferFalso = new Chofer({
            usuario: usuarioFalso._id,
            dni: '99999999',
            telefono: '9999999999',
            tipoVinculo: 'contratado',
            datosContratado: {
                montoChoferDia: 20000 // Menor a la global para forzar la regla
            }
        });
        await choferFalso.save();
        console.log(`   - Chofer falso creado (Acuerdo personal: $20.000/día)`);

        // 4. Crear Vehículos Falsos
        const vehExterno = new Vehiculo({
            tipoPropiedad: 'externo',
            patente: 'Z-TST-EXT',
            marca: 'Test Ext',
            modelo: 'Fake',
            capacidadKg: 1000,
            estado: 'disponible'
        });
        await vehExterno.save();

        const vehPropio = new Vehiculo({
            tipoPropiedad: 'propio',
            patente: 'Z-TST-SDA',
            marca: 'Test SDA',
            modelo: 'Fake',
            capacidadKg: 1000,
            estado: 'disponible'
        });
        await vehPropio.save();
        console.log(`   - Vehículos falsos creados (Externo y Propio)`);

        // 5. Crear Rutas Falsas
        const rutaKm = new Ruta({
            codigo: 'Z-TEST-KM',
            horaSalida: '08:00',
            tipoPago: 'por_km',
            kilometrosEstimados: 100,
            precioKm: 500, // 100km * $500 = $50.000 / hoja
            choferAsignado: choferFalso._id
        });
        await rutaKm.save();

        const rutaDist = new Ruta({
            codigo: 'Z-TEST-DIST',
            horaSalida: '08:00',
            tipoPago: 'por_distribucion',
            montoPorDistribucion: 45000,
            choferAsignado: choferFalso._id
        });
        await rutaDist.save();

        const rutaMes1 = new Ruta({
            codigo: 'Z-TEST-MES-1',
            horaSalida: '08:00',
            tipoPago: 'por_mes',
            montoMensual: 1500000,
            choferAsignado: choferFalso._id
        });
        await rutaMes1.save();

        const rutaMes2 = new Ruta({
            codigo: 'Z-TEST-MES-2',
            horaSalida: '08:00',
            tipoPago: 'por_mes',
            montoMensual: 0, // Para probar que no frene al mes1
            choferAsignado: choferFalso._id
        });
        await rutaMes2.save();
        console.log(`   - 4 Rutas falsas creadas con diferentes lógicas y trampas`);

        // 6. Inyectar Hojas (Híbrido extremo)
        const baseDate = new Date('2026-03-01T12:00:00Z');

        // H1: Pura Mensual Tramposa ($0)
        let f1 = new Date(baseDate);
        await new HojaReparto({
            fecha: f1, ruta: rutaMes2._id, vehiculo: vehExterno._id, chofer: choferFalso._id,
            estado: 'en reparto', tipoPago: 'por_mes', montoMensual: 0
        }).save();

        // H2: Pura Mensual ($1.5M)
        let f2 = new Date(baseDate); f2.setDate(f2.getDate() + 1);
        await new HojaReparto({
            fecha: f2, ruta: rutaMes1._id, vehiculo: vehExterno._id, chofer: choferFalso._id,
            estado: 'en reparto', tipoPago: 'por_mes', montoMensual: 1500000
        }).save();

        // H3: Puro por KM ($50.000)
        let f3 = new Date(baseDate); f3.setDate(f3.getDate() + 2);
        await new HojaReparto({
            fecha: f3, ruta: rutaKm._id, vehiculo: vehExterno._id, chofer: choferFalso._id,
            estado: 'en reparto', tipoPago: 'por_km', precioKm: 500
        }).save();

        // H4: Distribución Pura ($45.000)
        let f4 = new Date(baseDate); f4.setDate(f4.getDate() + 3);
        await new HojaReparto({
            fecha: f4, ruta: rutaDist._id, vehiculo: vehExterno._id, chofer: choferFalso._id,
            estado: 'en reparto', tipoPago: 'por_distribucion', montoPorDistribucion: 45000
        }).save();

        // H5: Extra KM (Misma ruta KM, sumando Kms extra -> 100 base + 50 extra = 150km * $500 = $75.000)
        let f5 = new Date(baseDate); f5.setDate(f5.getDate() + 4);
        await new HojaReparto({
            fecha: f5, ruta: rutaKm._id, vehiculo: vehExterno._id, chofer: choferFalso._id,
            estado: 'en reparto', tipoPago: 'por_km', precioKm: 500, datosDrogueria: { kmExtra: 50, montoPagar: 0 }
        }).save();

        // H6: Regla SDA Vehículo (Debería ignorar la ruta y pagar Tarifa Día SDA máxima -> $25.000)
        let f6 = new Date(baseDate); f6.setDate(f6.getDate() + 5);
        await new HojaReparto({
            fecha: f6, ruta: rutaKm._id, vehiculo: vehPropio._id, chofer: choferFalso._id,
            estado: 'en reparto', tipoPago: 'por_km', precioKm: 500
        }).save();

        // Segunda vuelta a la ruta mes-1 el mismo dia (no debe sumar 1.5M otra vez)
        await new HojaReparto({
            fecha: f6, ruta: rutaMes1._id, vehiculo: vehExterno._id, chofer: choferFalso._id,
            estado: 'en reparto', tipoPago: 'por_mes', montoMensual: 1500000
        }).save();

        console.log(`   - 7 Hojas de reparto extremas inyectadas`);

        // === FASE 2: SIMULACION (Liquidator Motor) ===
        console.log(`\n⏳ Fase 2: Ejecutando Liquidador Híbrido...`);
        const targetIds = [choferFalso._id.toString()];
        const match = await calcularTotalesLiquidacion(targetIds[0], "2026-03-01", "2026-03-10");

        // EVALUACIÓN MATEMÁTICA ESTRICTA:
        // Mensual1: 1.5M (pagado una vez)
        // Mensual2: $0 (pagado una vez)
        // KM1: $50.000 (100km * 500)
        // DIST: $45.000 (valor cerrado)
        // KM Extra: $75.000 (150km * 500)
        // Veh. SDA: $25.000 (Acuerdo mio $20k < Global $25k)
        // TOTAL ESPERADO = 1.500.000 + 0 + 50.000 + 45.000 + 75.000 + 25.000 = $1.695.000
        const EXPECTED_TOTAL = 1695000;

        console.log(`\n📊 RESULTADOS:`);
        console.log(`   - Días Trabajados calculados: ${match.totales.diasTrabajados} (Sperados: 7 hojas validas)`);
        console.log(`   - Monto Total Mensual (Agrupado): $${match.montoMesAdicional}`);
        console.log(`   - Monto TOTAL Calculado por Liquidador: $${match.totales.montoTotalViajes}`);
        console.log(`   - TOTAL ESPERADO (Vía Matemáticas): $${EXPECTED_TOTAL}`);

        let subtotalMonthlyVisibles = false;
        match.hojasValidas.forEach((h, idx) => {
            console.log(`     [Hoja ${idx + 1}] Modo: ${h.detallePago} | Subtotal: $${h.subtotal} | Ruta: ${h.ruta.codigo}`);
            if (h.detallePago.includes('Mes Fijo') || h.detallePago === 'Tarifa Mensual') {
                if (h.subtotal > 0) subtotalMonthlyVisibles = true; // Error UI visible
            }
        });

        if (match.totales.montoTotalViajes === EXPECTED_TOTAL) {
            console.log(`   ✅ TEST MATEMÁTICO: APROBADO 💯`);
        } else {
            console.log(`   ❌ TEST MATEMÁTICO: FALLIDO (Diferencia: $${EXPECTED_TOTAL - match.totales.montoTotalViajes})`);
        }

        if (!subtotalMonthlyVisibles) {
            console.log(`   ✅ TEST DE UI LIMPIA (SUBTOTALES MENSUALES OCULTOS): APROBADO 💯`);
        } else {
            console.log(`   ❌ TEST DE UI LIMPIA: FALLIDO (Filtró dinero parcial en fila)`);
        }

        // === FASE 3: LIMPIEZA QUIRÚRGICA ===
        console.log(`\n⏳ Fase 3: Iniciando Limpieza Quirúrgica (Tear Down)...`);
        await HojaReparto.deleteMany({ chofer: choferFalso._id });
        await Ruta.deleteMany({ choferAsignado: choferFalso._id });
        await Vehiculo.deleteMany({ patente: { $in: ['Z-TST-EXT', 'Z-TST-SDA'] } });
        await Chofer.findByIdAndDelete(choferFalso._id);
        await Usuario.findByIdAndDelete(usuarioFalso._id);

        config.tarifaGlobalSDA = tarifaOriginalSDA;
        await config.save();

        console.log("   ✅ Limpieza completa. La BD está inmaculada.");

    } catch (error) {
        console.error("❌ ERROR FATAL DURANTE MEGA-TEST:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔴 Desconectado");
    }
}

runTest();

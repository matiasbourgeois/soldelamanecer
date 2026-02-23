const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

// Modelos
const Chofer = require("../models/Chofer");
const Usuario = require("../models/Usuario");
const Ruta = require("../models/Ruta");
const HojaReparto = require("../models/HojaReparto");

const API_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_super_segura";

async function simularLiquidacion() {
    try {
        console.log("==========================================");
        console.log("💰 MEGA TEST: LIQUIDACIÓN DE CONTRATADOS");
        console.log("==========================================\n");

        console.log("🔌 [1] Conectando a MongoDB...");
        await mongoose.connect('mongodb://127.0.0.1:27017/soldelamanecer');
        console.log("✅ Conexión establecida.");

        // 1. Conseguir token Admin para hacer las requests protegidas
        const admin = await Usuario.findOne({ rol: 'admin' });
        if (!admin) throw new Error("No hay admin en DB para simular token");

        const tokenAdmin = jwt.sign({ id: admin._id, rol: admin.rol }, JWT_SECRET, { expiresIn: '1d' });
        const api = axios.create({
            baseURL: API_URL,
            headers: { Authorization: `Bearer ${tokenAdmin}` }
        });

        // 2. Ubicar o crear al chofer asociado al mail de Matías
        console.log("\n🕵️ [2] Buscando o configurando Chofer 'Contratado' para Matías...");
        const usuarioMatias = await Usuario.findOne({ email: "matiasbourgeois@gmail.com" });
        if (!usuarioMatias) {
            throw new Error("No se encontró el usuario matiasbourgeois@gmail.com en la BD");
        }

        let chofer = await Chofer.findOne({ usuario: usuarioMatias._id });

        if (!chofer) {
            console.log("⚠️ El usuario no tenía perfil Chofer. Creando uno temporal...");
            chofer = new Chofer({
                usuario: usuarioMatias._id,
                tipoVinculo: "contratado",
                fechaIngreso: new Date(),
                telefono: "3510000000",
                dni: "99999999",
                datosContratado: {
                    cbu: "00000000000000",
                    alias: "test.admin"
                }
            });
            await chofer.save();
        } else {
            chofer.tipoVinculo = "contratado";
            await chofer.save();
        }

        console.log(`✅ Chofer Elegido: ${usuarioMatias.nombre} ${usuarioMatias.apellido} (ID: ${chofer._id}, Email: ${usuarioMatias.email})`);

        // 4. Crear Rutas Simuladas de Distintos Tipos
        console.log("\n🗺️ [3] Generando Rutas Falsas de cobreo...");
        const tiposPago = [
            { desc: "PAGO POR KM", tipoPago: "por_km", precioKm: 850, km: 100 },
            { desc: "PAGO POR DISTRIBUCION", tipoPago: "por_distribucion", montoPorDistribucion: 60000 },
            { desc: "PAGO FIXO MENSUAL", tipoPago: "por_mes", montoMensual: 450000 }
        ];

        const rutasVivas = [];
        for (const tp of tiposPago) {
            const shortRandom = Math.floor(1000 + Math.random() * 9000);
            const rx = new Ruta({
                codigo: `RTA-${tp.tipoPago.substring(4, 7).toUpperCase()}-${shortRandom}`,
                descripcion: tp.desc,
                activa: true,
                choferAsignado: chofer._id,
                tipoPago: tp.tipoPago,
                precioKm: tp.precioKm,
                kilometrosEstimados: tp.km,
                montoPorDistribucion: tp.montoPorDistribucion,
                montoMensual: tp.montoMensual,
                horaSalida: "08:00"
            });
            await rx.save();
            rutasVivas.push(rx);
        }
        console.log(`✅ Creadas ${rutasVivas.length} Rutas para la matriz de sueldo.`);

        // 5. Inyectar 20 Hojas de Reparto correspondientes al mes pasado (para forzar muchas filas y probar el layout)
        console.log("\n📄 [4] Inyectando Hojas de Reparto Cerradas (Mes Anterior)...");

        const mesPrueba = 0; // 0 = Enero, 1 = Feb, etc...
        const anoPrueba = 2026;

        for (let i = 1; i <= 20; i++) {
            const rutaElegida = rutasVivas[i % 3];
            const fechaViaje = new Date(anoPrueba, mesPrueba, i + 2);
            fechaViaje.setHours(12, 0, 0, 0);

            const hr = new HojaReparto({
                numeroHoja: `SDA-${rutaElegida.codigo}-${anoPrueba}01${(i < 10 ? '0' : '') + i}`,
                ruta: rutaElegida._id,
                chofer: chofer._id,
                fecha: fechaViaje,
                estado: "cerrada",
                kilometrosEstimados: rutaElegida.kilometrosEstimados,
                precioKm: rutaElegida.precioKm,
                montoFijo: rutaElegida.montoFijo,
                cerradaAutomaticamente: false,
                envios: []
            });
            await hr.save();
        }
        console.log(`✅ Se insertaron 20 Hojas de Reparto exitosamente.`);

        // 6. Lanzar Endpoints de Liquidación
        console.log("\n🔥 [5] SIMULACIÓN FLUX DE LIQUIDACIÓN END-TO-END...");
        const fechaIn = `2026-01-01`;
        const fechaOut = `2026-01-31`;

        const simData = await api.post("/liquidaciones/simular", {
            choferId: chofer._id,
            fechaInicio: fechaIn,
            fechaFin: fechaOut
        });

        console.log(`   🔸 PRE-LIQ RESULT: ${simData.data.hojasValidas.length} Hojas Analizadas.`);
        console.log(`   🔸 PRE-LIQ TOTAL: $${simData.data.totales.montoTotalViajes}`);

        const guardarRes = await api.post("/liquidaciones", {
            choferId: chofer._id,
            fechaInicio: fechaIn,
            fechaFin: fechaOut
        });
        const liquidacionBDId = guardarRes.data._id;
        console.log(`   🔸 Liquidación OFICIAL Guardada: ${liquidacionBDId}`);

        const mailRes = await api.post(`/liquidaciones/enviar/${liquidacionBDId}`);
        console.log(`   🔸 Email PDF enviado a MATIAS BURGEOIS!!`);

        console.log("\n==========================================");
        console.log("🏆 SIMULACIÓN PARCIAL CONCLUÍDA EXITOSAMENTE");
        console.log("==========================================\n");

        process.exit(0);

    } catch (error) {
        console.error("\n❌ FATAL ERROR IN SCRIPT:");
        console.error(error.response ? error.response.data : error.message);
        process.exit(1);
    }
}

simularLiquidacion();

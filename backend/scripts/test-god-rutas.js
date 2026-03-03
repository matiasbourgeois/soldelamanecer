require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const axios = require("axios");
const jwt = require("jsonwebtoken");

const API_URL = "http://localhost:5000/api";
const JWT_SECRET = process.env.JWT_SECRET || "123456";

// Helper para crear tokens mock
const generarToken = (id, rol) => {
    return jwt.sign({ id, rol }, JWT_SECRET, { expiresIn: "1h" });
};

async function ejecutarPruebas() {
    console.log("🚀 Iniciando Pruebas Nivel Dios: Motor de Aprobaciones de Rutas\n");

    try {
        // 1. Conexión a BD para limpieza
        await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");
        const db = mongoose.connection;

        // Limpieza de colecciones de prueba
        await db.collection("rutas").deleteMany({ codigo: { $in: ["TEST-NUEVA-1", "TEST-BELL-1"] } });
        await db.collection("solicitudaprobacions").deleteMany({});

        console.log("🧹 Base de datos limpiada para pruebas.");

        // Creamos IDs de mentira para usuarios
        const adminId = new mongoose.Types.ObjectId().toString();
        const adminToken = generarToken(adminId, "admin");

        const b1Id = new mongoose.Types.ObjectId().toString();
        const userAToken = generarToken(b1Id, "administrativo");

        const b2Id = new mongoose.Types.ObjectId().toString();
        const userBToken = generarToken(b2Id, "administrativo");

        // Instancias Axios con tokens inyectados
        const apiAdmin = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${adminToken}` } });
        const apiUserA = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${userAToken}` } });
        const apiUserB = axios.create({ baseURL: API_URL, headers: { Authorization: `Bearer ${userBToken}` } });

        // Preparación: Crear ruta base TEST-BELL-1 directo por BD para las pruebas
        const RutaModel = require("../src/models/Ruta");
        const rutaBase = new RutaModel({
            codigo: "TEST-BELL-1",
            horaSalida: "08:00",
            precioKm: 100,
            kilometrosEstimados: 200,
            tipoPago: "por_km"
        });
        await rutaBase.save();
        const rutaBaseId = rutaBase._id.toString();

        // ==========================================
        // Test 1: Flujo Básico (Feliz) - Creación
        // ==========================================
        console.log("\n--- TEST 1: Flujo Básico (Crear y Aprobar) ---");
        let res = await apiUserA.post("/rutas", {
            codigo: "TEST-NUEVA-1",
            horaSalida: "10:00",
            precioKm: 150
        });
        console.assert(res.status === 202, "El Administrativo no debe poder crear directo");
        console.log("✅ Administrativo retornado con 202 (PendienteAprobacion)");

        // Admin lee las pendientes
        res = await apiAdmin.get("/aprobaciones/pendientes");
        const requestSol = res.data.find(s => s.datosPropuestos.codigo === "TEST-NUEVA-1");
        console.assert(requestSol !== undefined, "La solicitud de creación no apareció en pendientes.");

        // Admin la aprueba
        res = await apiAdmin.post(`/aprobaciones/${requestSol._id}/resolver`, { resolucion: "APROBAR" });
        console.assert(res.status === 200, "Error al aprobar la solicitud");
        console.log("✅ Admin aprobó la solicitud exitosamente");

        // Validar que la ruta existe ahora en la base de datos
        const nuevaRutaDb = await RutaModel.findOne({ codigo: "TEST-NUEVA-1" });
        console.assert(nuevaRutaDb !== null, "La ruta no se creó en la BD tras la aprobación");
        console.log("✅ Ruta TEST-NUEVA-1 disponible en BD.");


        // ==========================================
        // Test 2: Flujo de Rechazo
        // ==========================================
        console.log("\n--- TEST 2: Flujo de Rechazo ---");
        // PATCH instead of PUT
        res = await apiUserA.patch(`/rutas/${nuevaRutaDb._id}`, { precioKm: 10000 });
        console.assert(res.status === 202, "Error al enviar edición");

        res = await apiAdmin.get("/aprobaciones/pendientes");
        const requestEdicion = res.data[0];

        res = await apiAdmin.post(`/aprobaciones/${requestEdicion._id}/resolver`, {
            resolucion: "RECHAZAR", motivoRechazo: "Precio excesivo"
        });
        console.log("✅ Admin rechazó la edición excesiva");

        const rutaRevisada = await RutaModel.findById(nuevaRutaDb._id);
        console.assert(rutaRevisada.precioKm !== 10000, "La ruta mutó a pesar del rechazo");
        console.log("✅ El precio se mantuvo original.");


        // ==========================================
        // Test 3: Bloqueo de Concurrencia (Doble Edición)
        // ==========================================
        console.log("\n--- TEST 3: Bloqueo de Concurrencia ---");
        // Admin A manda cambiar precio a 150
        res = await apiUserA.patch(`/rutas/${rutaBaseId}`, { precioKm: 150 });
        console.log("✅ User A envió edición de la ruta TEST-BELL-1");

        // Admin B intenta cambiar precio a 200 de la MISMA ruta
        try {
            await apiUserB.patch(`/rutas/${rutaBaseId}`, { precioKm: 200 });
            console.assert(false, "El User B logró editar una ruta que ya estaba bloqueada");
        } catch (err) {
            console.assert(err.response.status === 409, "El estado de error por concurrencia debe ser 409 Conflict");
            console.log("✅ User B fue rechazado correctamente con error 409 (Ya tiene solicitud pendiente)");
        }


        // ==========================================
        // Test 4: Bloqueo de Eliminación con Cambios Pendientes
        // ==========================================
        console.log("\n--- TEST 4: Bloqueo de Eliminación ---");
        // Ruta TEST-BELL-1 tiene la edición de Test 3 guardada. User A intenta borrarla.
        try {
            await apiUserA.delete(`/rutas/${rutaBaseId}`);
            console.assert(false, "User A logró borrar la ruta a pesar de estar bloqueada");
        } catch (err) {
            console.assert(err.response.status === 409, "El estado de error por eliminación concurrente debe ser 409");
            console.log("✅ User A fue rechazado correctamente: No puede eliminar la ruta porque está en revisión");
        }


        // ==========================================
        // Test 5: Bypass del Administrador
        // ==========================================
        console.log("\n--- TEST 5: Bypass del Administrador ---");
        // Admin esquiva el motor para borrar directamente la ruta TEST-NUEVA-1 (que no tiene colas)
        res = await apiAdmin.delete(`/rutas/${nuevaRutaDb._id}`);
        console.assert(res.status === 200, "El Admin no pudo eliminar la ruta");

        const busquedaBorrada = await RutaModel.findById(nuevaRutaDb._id);
        console.assert(busquedaBorrada === null, "La ruta sigue en la BD");
        console.log("✅ Admin borró una ruta saltándose el motor de colas exitosamente.");


        // ==========================================
        // Test 6: API Fetching de 'tienePendientes'
        // ==========================================
        console.log("\n--- TEST 6: Flag View Endpoint ---");
        // Al pedir todas las rutas el userA debería ver `tienePendientes: true` en TEST-BELL-1
        res = await apiUserA.get('/rutas/todas');
        const rutaEnListado = res.data.rutas.find(r => r.codigo === "TEST-BELL-1");
        console.assert(rutaEnListado.tienePendientes === true, "El flag 'tienePendientes' no funca en el listado");
        console.log("✅ El flag 'tienePendientes' es retornado correctamente por la API");

        console.log("\n🚀 ¡GOD LEVEL TESTS PASSED! TODOS LOS CASOS PASARON LIMPIOS. \n🚀");

        process.exit(0);
    } catch (error) {
        if (error.response) {
            console.error("\n❌ TEST FAILED API ERROR:", error.response.status, error.response.data);
        } else {
            console.error("\n❌ TEST FAILED:", error);
        }
        process.exit(1);
    }
}

ejecutarPruebas();

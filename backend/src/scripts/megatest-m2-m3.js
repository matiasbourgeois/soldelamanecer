const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

async function simularAscensoM2M3() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        console.log("🚀 M2: Buscando al TestChofer y validando su correo electrónico...");
        const megatester = await Usuario.findOne({ email: "megatest@soldelamanecer.com" });

        if (!megatester) {
            console.log("❌ Error fatal: El testchofer de M1 no existe en DB.");
            process.exit(1);
        }

        // Simular click en enlace del correo
        megatester.verificado = true;
        await megatester.save();
        console.log("   ✅ Cuenta de Usuario Web Verificada con éxito.");

        console.log("\n🚀 M3: Simulando Admin convirtiendo al Usuario raso en Chofer Contratado...");

        megatester.rol = "chofer";
        await megatester.save();

        const nuevoChoferDoc = new Chofer({
            usuario: megatester._id,
            telefono: megatester.telefono || "5551234567",
            tipoVinculo: "contratado",
            activo: true,
            datosContratado: {
                fechaIngreso: new Date()
            }
            // ¡Observación! Ya no usamos el campo dni aquí.
        });

        await nuevoChoferDoc.save();

        console.log("   ✅ Chofer Administrativo creado. Perfil vinculado a Usuario exitosamente.");
        console.log(`   📝 RESUMEN: \n      Nombre: ${megatester.nombre}\n      DNI: ${megatester.dni}\n      Rol Actual: ${megatester.rol}`);

        process.exit(0);

    } catch (e) {
        console.error("❌ FAILED - Error en DB:");
        console.error(e.message);
        process.exit(1);
    }
}

simularAscensoM2M3();

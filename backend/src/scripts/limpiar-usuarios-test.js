const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

async function limpiarUsuariosSobrantes() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');
        console.log("✅ Conexión a la BD exitosa para PURGA DE USUARIOS.\n");

        // Regla 1: Identificar a TODOS los usuarios que tengan "rol" chofer (los 29 + 5 que acabamos de meter)
        // Regla 2: Sumarle el email INTACTO matiasbourgeois@gmail.com

        console.log("🔍 Mapeando usuarios seguros (Importados y Admin General Matias)...");
        const usuariosAProteger = await Usuario.find({
            $or: [
                { rol: "chofer" },
                { email: "matiasbourgeois@gmail.com" }
            ]
        });

        // Extraer los _id de la lista blanca a proteger
        const idsProtegidos = usuariosAProteger.map(u => u._id);
        console.log(`🛡️  Manteniendo vivos a ${idsProtegidos.length} usuarios (Choferes Oficiales + Admin).`);

        console.log("🗑️  3, 2, 1... Iniciando Borrado Masivo de todo el resto...");
        // Ejecutar borrado general filtrando los excluidos (lista negra = los que NO estan en idsProtegidos)
        const resultadoDeBorrado = await Usuario.deleteMany({
            _id: { $nin: idsProtegidos }
        });

        console.log(`\n🎉 PURGA TERMINADA - Se eliminaron ${resultadoDeBorrado.deletedCount} usuarios falsos o de prueba.`);
        process.exit(0);

    } catch (error) {
        console.error("\n❌ FATAL ERROR AL LIMPIAR:");
        console.error(error);
        process.exit(1);
    }
}

limpiarUsuariosSobrantes();

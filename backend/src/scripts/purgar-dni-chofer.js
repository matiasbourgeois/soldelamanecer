const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Chofer = require("../models/Chofer");

async function purgarDniObsoleto() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        console.log("🚀 Purgando el campo físico 'dni' de todos los documentos en la colección Chofer...");
        // Usamos updateMany con $unset para eliminar el campo de la DB por completo
        const resultado = await Chofer.updateMany({}, { $unset: { dni: 1 } });

        console.log(`🎉 Total documentos purgados: ${resultado.modifiedCount}`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

purgarDniObsoleto();

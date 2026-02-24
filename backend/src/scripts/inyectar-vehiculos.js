const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Vehiculo = require("../models/Vehiculo");

async function importarVehiculos() {
    try {
        console.log("🔌 Conectando a MongoDB Local...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        console.log("🧼 Purgando colección local de Vehículos...");
        await Vehiculo.deleteMany({});
        console.log("   ✅ Colección vaciada.");

        console.log("📦 Leyendo archivo vehiculos_produccion.json...");
        const dataPath = path.join(__dirname, "../../vehiculos_produccion.json");
        const contenido = fs.readFileSync(dataPath, "utf8");
        const jsonVehiculos = JSON.parse(contenido);

        console.log(`🚀 Inyectando ${jsonVehiculos.length} vehículos en la BD local...`);
        let insertados = 0;

        for (const item of jsonVehiculos) {
            // MongoExport usa formato Strict (EJSON) donde el _id viene como {"$oid": "..."}
            // Mongoose a veces se marea con esto si se lo pasas crudo en findByIdAndUpdate, pero create() suele limpiarlo 
            // o podemos mapearlo nosotros:

            const doc = { ...item };

            if (doc._id && doc._id.$oid) {
                doc._id = new mongoose.Types.ObjectId(doc._id.$oid);
            }

            // Lo mismo si tiene ObjectIds anidados, pero por lo que vimos solo hay un ObjId de config de mantenimiento
            if (doc.configuracionMantenimiento && Array.isArray(doc.configuracionMantenimiento)) {
                doc.configuracionMantenimiento = doc.configuracionMantenimiento.map(m => {
                    if (m._id && m._id.$oid) {
                        m._id = new mongoose.Types.ObjectId(m._id.$oid);
                    }
                    return m;
                });
            }

            // Usamos new Model + save para que pasen validaciones
            const nuevoVehiculo = new Vehiculo(doc);
            await nuevoVehiculo.save();
            insertados++;
        }

        console.log(`🎉 Migración finalizada con éxito. Total insertados: ${insertados}`);

        process.exit(0);

    } catch (e) {
        console.error("❌ FAILED - Error inyectando BD:", e.message);
        process.exit(1);
    }
}

importarVehiculos();

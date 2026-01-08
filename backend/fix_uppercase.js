const mongoose = require('mongoose');
require('dotenv').config();
const Vehiculo = require('./src/models/Vehiculo');
const Ruta = require('./src/models/Ruta');

const MONGODB_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cotizadorDB"; // Corrected env var and DB name

const fixUppercase = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('📦 Conectado a MongoDB');

        // 1. Fix Vehiculos
        const vehiculos = await Vehiculo.find({});
        let vCount = 0;
        for (const v of vehiculos) {
            if (v.patente && v.patente !== v.patente.toUpperCase()) {
                v.patente = v.patente.toUpperCase();
                await v.save();
                vCount++;
            }
        }
        console.log(`✅ ${vCount} vehículos actualizados a mayúsculas.`);

        // 2. Fix Rutas
        const rutas = await Ruta.find({});
        let rCount = 0;
        for (const r of rutas) {
            if (r.codigo && r.codigo !== r.codigo.toUpperCase()) {
                r.codigo = r.codigo.toUpperCase();
                await r.save();
                rCount++;
            }
        }
        console.log(`✅ ${rCount} rutas actualizadas a mayúsculas.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

fixUppercase();

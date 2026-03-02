// backend/src/scripts/list-hojas-error-marzo.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const auditarHojas = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔍 Conectado a MongoDB. Buscando las últimas 30 Hojas de Reparto...");

        const hojasEncontradas = await HojaReparto.find({})
            .sort({ createdAt: -1 })
            .limit(50)
            .populate("ruta", "nombreCodigo")
            .lean();

        const output = {
            totales: hojasEncontradas.length,
            hojas: hojasEncontradas.map(hr => ({
                id: hr._id,
                fechaCreacion: hr.createdAt,
                nombre: hr.nombre,
                ruta: hr.ruta ? hr.ruta.nombreCodigo : 'Sin Ruta',
                estado: hr.estado,
                cantidadEnvios: hr.envios ? hr.envios.length : 0
            }))
        };

        fs.writeFileSync(path.join(__dirname, 'hojas-hoy.json'), JSON.stringify(output, null, 2), 'utf-8');
        console.log(`✅ Archivo exportado con éxito a hojas-hoy.json`);

    } catch (error) {
        console.error("Error en la auditoría:", error);
    } finally {
        await mongoose.disconnect();
    }
};

auditarHojas();

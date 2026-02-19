const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const Ruta = require('../models/Ruta');
const HojaReparto = require('../models/HojaReparto');
const Envio = require('../models/Envio');

async function run() {
    try {
        const uri = process.env.DB_CN_STRING || process.env.MONGO_URI || 'mongodb://localhost:27017/soldelamanecer';
        await mongoose.connect(uri);
        console.log("✅ Conectado.");

        // ID identificado previamente
        const hojaId = '69952b6d3c8fce09d83eb5e7';

        console.log(`🔍 Analizando Hoja ${hojaId}...`);
        const hoja = await HojaReparto.findById(hojaId)
            .populate({
                path: 'envios',
                select: 'numeroSeguimiento estado historialEstados updatedAt'
            })
            .populate('ruta', 'codigo nombre')
            .lean();

        if (!hoja) { console.log("❌ Hoja no encontrada"); return; }

        console.log(`📄 Hoja: ${hoja.numeroHoja} | Ruta: ${hoja.ruta?.codigo}`);
        console.log(`📦 Cantidad Envíos: ${hoja.envios.length}`);

        console.log("\n📜 HISTORIAL DE ESTADOS:");

        hoja.envios.forEach(e => {
            console.log(`\n🔹 Envío: ${e.numeroSeguimiento} (Estado Actual: ${e.estado})`);
            console.log(`   Ultima Modificación: ${e.updatedAt.toLocaleString()}`);
            if (e.historialEstados && e.historialEstados.length > 0) {
                // Mostrar los últimos 3 estados
                e.historialEstados.slice().reverse().slice(0, 3).forEach(h => {
                    console.log(`      - ${new Date(h.fecha).toLocaleTimeString()} : [${h.estado}] ${h.motivo || ''} (${h.sucursal || ''})`);
                });
            } else {
                console.log("   (Sin historial de estados)");
            }
        });

    } catch (e) { console.error(e); } finally { mongoose.disconnect(); }
}
run();

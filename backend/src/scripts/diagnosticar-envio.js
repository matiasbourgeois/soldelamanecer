const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Envio = require('../models/Envio');
const Localidad = require('../models/Localidad');
const HojaReparto = require('../models/HojaReparto');
const Ruta = require('../models/Ruta');

const buscarEnviosVillaSoto = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado\n');

        // Buscar localidad Villa de Soto
        const localidad = await Localidad.findOne({ nombre: /villa de soto/i });
        console.log('📍 Localidad Villa de Soto:', localidad?._id);

        // Buscar envíos recientes
        const envios = await Envio.find({
            localidadDestino: localidad._id
        })
            .sort({ _id: -1 })
            .limit(5)
            .populate('localidadDestino')
            .populate('hojaReparto');

        console.log(`\n📦 Envíos para Villa de Soto (últimos 5):\n`);
        envios.forEach((e, i) => {
            console.log(`${i + 1}. ID: ${e._id}`);
            console.log(`   Código: ${e.codigoSeguimiento || 'N/A'}`);
            console.log(`   Estado: ${e.estado}`);
            console.log(`   Hoja: ${e.hojaReparto ? e.hojaReparto._id : 'null'}`);
            console.log(`   Fecha: ${e.fechaCreacion || e.createdAt}`);
            console.log('');
        });

        // Buscar ruta
        const ruta = await Ruta.findOne({ codigo: 'L-CEJE-1' }).populate('localidades');
        console.log(`🗺️ Ruta L-CEJE-1: ${ruta?._id}`);
        console.log(`   Localidades: ${ruta?.localidades.map(l => l.nombre).join(', ')}\n`);

        // Ver si hay hoja hoy
        const hoy = new Date();
        const inicioDia = new Date(hoy.setHours(0, 0, 0, 0));
        const finDia = new Date(hoy.setHours(23, 59, 59, 999));

        const hojasHoy = await HojaReparto.find({
            ruta: ruta._id,
            fecha: { $gte: inicioDia, $lte: finDia }
        });

        console.log(`📋 Hojas de hoy para L-CEJE-1: ${hojasHoy.length}`);
        hojasHoy.forEach((h, i) => {
            console.log(`   ${i + 1}. ${h._id} - Estado: ${h.estado} - Envíos: ${h.envios.length}`);
        });

    } catch (error) {
        console.error('❌', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

buscarEnviosVillaSoto();

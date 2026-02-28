const mongoose = require('mongoose');
require('dotenv').config();
const { generarHojasAutomaticas } = require('./src/controllers/logistica/hojaRepartoController');
const HojaReparto = require('./src/models/HojaReparto');
const moment = require('moment-timezone');

const testCronJob = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Conectado a BD.");

        const manana = moment().tz('America/Argentina/Buenos_Aires').add(1, 'day').toDate();
        console.log("🚀 Simulando madrugada del día:", manana.toLocaleDateString('es-AR'));

        const resultados = await generarHojasAutomaticas(manana);
        console.log("Resultados de Cron:", resultados);

        const inicioDia = moment(manana).tz('America/Argentina/Buenos_Aires').startOf('day').toDate();

        const hojasNuevas = await HojaReparto.find({ fecha: { $gte: inicioDia } })
            .populate('ruta')
            .select('numeroHoja ruta estado fecha');

        console.log("\n--- HOJAS CREADAS EN BBDD ---");
        hojasNuevas.forEach(h => {
            console.log(`[${h.estado.toUpperCase()}] Fecha: ${h.fecha.toLocaleDateString()} | Ruta: ${h.ruta?.codigo} -> ID: ${h.numeroHoja || 'NULL !!'}`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        process.exit(0);
    }
};

testCronJob();

const mongoose = require('mongoose');
require('dotenv').config();

const Ruta = require('./src/models/Ruta');

async function test() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado");

    const codigos = ['L-RIV2-1', 'L-RIV3-1', 'L-RIV3-2', 'L-RCU2-1'];

    for (const codigo of codigos) {
        const ruta = await Ruta.findOne({ codigo: new RegExp(`^${codigo}$`, 'i') }).lean();
        if (ruta) {
            console.log(`RUTA: ${ruta.codigo} | TIPO PAGO: ${ruta.tipoPago} | KM: ${ruta.kilometrosEstimados} | PRECIO_KM: ${ruta.precioKm} | DIST: ${ruta.montoPorDistribucion} | MES: ${ruta.montoMensual} | CONTRATISTA: ${ruta.contratistaTitular}`);
        } else {
            console.log(`Ruta ${codigo} NO ENCONTRADA`);
        }
    }

    process.exit(0);
}

test();

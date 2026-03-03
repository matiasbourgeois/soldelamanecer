const fs = require('fs');
const path = require('path');
require('dotenv').config();
const mongoose = require('mongoose');

// Cargar modelos
const HojaReparto = require('./src/models/HojaReparto');
const Ruta = require('./src/models/Ruta');

const uri = process.env.MONGO_URI;
let out = '';

mongoose.connect(uri)
    .then(async () => {
        const count = await HojaReparto.countDocuments();
        out += `Total Hojas de Reparto: ${count}\n`;

        const hojas = await HojaReparto.find({}).sort({ fecha: -1 }).limit(20).populate('ruta');
        out += `\nTop 20 hojas más recientes:\n`;
        hojas.forEach(h => {
            const rutaCodigo = h.ruta ? h.ruta.codigo : 'N/A';
            out += `- ID: ${h._id} | Numero: ${h.numeroHoja} | Ruta: ${rutaCodigo} | Estado: ${h.estado} | Fec: ${h.fecha}\n`;
        });

        const rutasBell = await Ruta.find({ codigo: { $regex: /bell/i } });
        out += `\nRutas encontradas con 'bell': ${rutasBell.map(r => r.codigo).join(', ')}\n`;

        const bellHojas = await HojaReparto.find({
            $or: [
                { numeroHoja: { $regex: /bell/i } },
                { ruta: { $in: rutasBell.map(r => r._id) } }
            ]
        }).populate('ruta');

        out += `Hojas repartos matching /bell/ (número o ruta): ${bellHojas.length}\n`;
        bellHojas.forEach(h => {
            const rutaCodigo = h.ruta ? h.ruta.codigo : 'N/A';
            out += `- ID: ${h._id} | Numero: ${h.numeroHoja} | Ruta: ${rutaCodigo} | Estado: ${h.estado} | Fec: ${h.fecha}\n`;
        });

        fs.writeFileSync('out_utf8.txt', out);
        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        mongoose.disconnect();
    });

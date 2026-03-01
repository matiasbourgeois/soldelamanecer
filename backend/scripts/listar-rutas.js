require('dotenv').config();
const mongoose = require('mongoose');
const Ruta = require('../src/models/Ruta');

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const rutas = await Ruta.find({}, 'codigo').lean();
    console.log("Muestras de Rutas:", rutas.slice(0, 10).map(r => r.codigo));
    process.exit(0);
});

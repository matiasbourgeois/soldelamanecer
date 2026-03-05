const mongoose = require('mongoose');
const Ruta = require('./src/models/Ruta');

const run = async () => {
    await mongoose.connect("mongodb://127.0.0.1:27017/soldelamanecer");

    // Check VMAR-2
    const ruta = await Ruta.findOne({ codigo: 'VMAR-2' });
    console.log("Ruta:", ruta ? {
        _id: ruta._id,
        codigo: ruta.codigo,
        contratistaTitular: ruta.contratistaTitular,
        choferDestinado: ruta.choferDestinado
    } : null);

    // Check Aldeco
    const choferId = "6799071cae7960d783aa8739";

    const rutasComoTitular = await Ruta.find({ contratistaTitular: choferId });
    console.log(`Rutas donde ${choferId} es Titular:`, rutasComoTitular.map(r => r.codigo));

    process.exit(0);
}
run();

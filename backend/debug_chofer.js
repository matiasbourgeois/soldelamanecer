const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/monolito";

const checkChofer = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        const Usuario = require('./src/models/Usuario');
        const Chofer = require('./src/models/Chofer');

        const email = "maticheto@hotmail.com";
        const user = await Usuario.findOne({ email });

        if (!user) {
            console.log("Usuario not found!");
            return;
        }
        console.log("User found:", user.nombre, user._id, user.rol);

        const chofer = await Chofer.findOne({ usuario: user._id });
        if (!chofer) {
            console.log("Chofer profile NOT found for this user!");
        } else {
            console.log("Chofer profile found:");
            console.log("  - tipoContrato (RAW):", `"${chofer.tipoContrato}"`);
            console.log("  - vehiculoAsignado:", chofer.vehiculoAsignado);
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

checkChofer();

const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/monolito";

const debugMaticheto = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB for Deep Inspection");

        const Usuario = require('./src/models/Usuario');
        const Chofer = require('./src/models/Chofer');

        const email = "maticheto@hotmail.com";

        // 1. Find ALL Users with this email (should be unique, but checking)
        const users = await Usuario.find({ email });
        console.log(`Found ${users.length} users with email ${email}:`);
        users.forEach(u => console.log(` - ID: ${u._id}, Name: ${u.nombre}, Role: ${u.rol}`));

        if (users.length === 0) return;

        const userId = users[0]._id;

        // 2. Find ALL Chofer profiles linked to this user ID
        const profiles = await Chofer.find({ usuario: userId });
        console.log(`Found ${profiles.length} Chofer profiles for user ${userId}:`);
        profiles.forEach(p => {
            console.log(` - Profile ID: ${p._id}`);
            console.log(`   * DNI: ${p.dni}`);
            console.log(`   * TipoVinculo (DB Value): "${p.tipoVinculo}"`);
            console.log(`   * Activo: ${p.activo}`);
        });

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

debugMaticheto();

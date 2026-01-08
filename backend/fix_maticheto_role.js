const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/monolito";

const fixMatichetoRole = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB for Fixing Role");

        const Usuario = require('./src/models/Usuario');
        const email = "maticheto@hotmail.com";

        const user = await Usuario.findOne({ email });
        if (!user) {
            console.log("User not found via script!");
            return;
        }

        console.log(`Current Role: ${user.rol}`);

        if (user.rol !== 'chofer') {
            user.rol = 'chofer';
            await user.save();
            console.log(`✅ Role UPDATED to 'chofer' for user ${user.nombre}`);
        } else {
            console.log("Role is already correct.");
        }

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

fixMatichetoRole();

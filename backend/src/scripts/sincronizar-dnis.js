const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

async function sincronizarDNI() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        console.log("🚀 Sincronizando DNIs desde Chofer hacia Usuario...");
        const choferes = await Chofer.find({});
        let sincronizados = 0;

        for (const c of choferes) {
            if (c.dni && c.dni !== "00000000") {
                const u = await Usuario.findById(c.usuario);
                if (u && u.dni !== c.dni) {
                    u.dni = c.dni;
                    await u.save();
                    sincronizados++;
                    console.log(`  ✅ DNI inyectado en vista Usuario: ${u.nombre} -> ${u.dni}`);
                }
            }
        }

        console.log(`\n🎉 Total Sincronizados Frontend: ${sincronizados}`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

sincronizarDNI();

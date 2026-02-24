const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");

const parcheManual = {
    // Los que quedaron mal los vamos a hardcodear para que queden perfectos.
    "DANIEL, MORETTI JOSE": "MORETTI, JOSE DANIEL",
    "DIEGO, ZARATE ALAN": "ZARATE, ALAN DIEGO",
    "HECTOR, BURGOS MARCELO": "BURGOS, MARCELO HECTOR",
    "FEDERICO, VILATTA PABLO": "VILATTA, PABLO FEDERICO",
    "BAUDONNET, LUCAS JAVIER ALDECO": "ALDECO BAUDONNET, LUCAS JAVIER",
    "POGGI, ENZO PALLONI": "PALLONI POGGI, ENZO",
    "ANSPACH, WILLIAMS ENRIQUE RICHAR": "ANSPACH, WILLIAMS ENRIQUE RICHAR", // Este ya estaba bien, pero lo cuidamos
    "VELOZO, YOHANA MARIELA CANDELLERO": "CANDELLERO VELOZO, YOHANA MARIELA",
    "GALISIA, FOS JONATAN": "GALISIA, FOS JONATAN", // Bien
    "GARCIA, EMANUEL JESUS": "GARCIA, EMANUEL JESUS", // Bien
    "MEGATESTER, TESTCHOFER": "MEGATESTER, TESTCHOFER"
};

async function aplicarParcheNombres() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        console.log("🚀 Aplicando correcciones manuales a los choferes invertidos erróneamente...");
        let reparados = 0;

        for (const [nombreMalo, nombreBueno] of Object.entries(parcheManual)) {
            const u = await Usuario.findOne({ nombre: nombreMalo });
            if (u) {
                u.nombre = nombreBueno;
                await u.save();
                reparados++;
                console.log(`   🛠️ Reparado: [${nombreMalo}] -> [${nombreBueno}]`);
            }
        }

        // Además, me aseguro de que "ALBA EMILIO (HIJO)" que no se invirtió bien, se invierta
        const alba = await Usuario.findOne({ nombre: "ALBA, EMILIO" });
        if (alba) {
            alba.nombre = "ALBA, EMILIO (HIJO)";
            await alba.save();
        }

        console.log(`\n🎉 Total nombres compuestos reparados manualmente: ${reparados}`);
        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

aplicarParcheNombres();

const mongoose = require("mongoose");
const axios = require("axios");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");
const Vehiculo = require("../models/Vehiculo");
const Ruta = require("../models/Ruta");
const HojaReparto = require("../models/HojaReparto");

async function simularM4M5() {
    try {
        console.log("🔌 M4: Conectando a MongoDB para Asignar Herramientas Administrativas...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        const megatester = await Usuario.findOne({ email: "megatest@soldelamanecer.com" });
        const chofInfo = await Chofer.findOne({ usuario: megatester._id });

        const vehiculo = await Vehiculo.findOne();
        const ruta = await Ruta.findOne();

        // Admin asignando Herramientas Duras (App Web)
        chofInfo.vehiculoAsignado = vehiculo._id;
        chofInfo.datosContratado.rutaDefault = ruta._id;
        await chofInfo.save();

        // Admin crea Hoja de Reparto en curso de esa ruta
        const hoy = new Date();
        const inicioDia = new Date(hoy).setHours(0, 0, 0, 0);
        const finDia = new Date(hoy).setHours(23, 59, 59, 999);

        let hojaHoy = await HojaReparto.findOne({
            ruta: ruta._id,
            fecha: { $gte: inicioDia, $lte: finDia }
        });

        if (!hojaHoy) {
            hojaHoy = new HojaReparto({
                ruta: ruta._id,
                chofer: chofInfo._id,
                vehiculo: vehiculo._id,
                fecha: new Date(),
                estado: "en reparto",
                envios: []
            });
            await hojaHoy.save();
        } else {
            hojaHoy.chofer = chofInfo._id;
            hojaHoy.estado = "en reparto";
            await hojaHoy.save();
        }

        console.log(`   ✅ Vehículo ${vehiculo.patente} y Ruta ${ruta.codigo} asignados con éxito a MEGATESTER.\n`);

        console.log("🚀 M5: Simulando peticion POST /api/auth/login desde APP MOVIL (React Native)...");
        const payloadLogin = {
            email: "megatest@soldelamanecer.com",
            contrasena: "TestChofer123!"
        };

        const responseLogin = await axios.post("http://localhost:5000/api/usuarios/login", payloadLogin);

        if (responseLogin.data && responseLogin.data.token) {
            console.log("   ✅ ¡LOGIN EXITOSO!");
            console.log(`   🔑 Token recibido: ${responseLogin.data.token.substring(0, 25)}...`);
            console.log(`   👁️ Rol autorizado: ${responseLogin.data.usuario.rol}`);
        }

        process.exit(0);
    } catch (e) {
        console.error("❌ FAILED - Error en simulación M4/M5:");
        if (e.response) {
            console.error(e.response.data);
        } else {
            console.error(e.message);
        }
        process.exit(1);
    }
}

simularM4M5();

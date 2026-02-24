const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

async function cazarAnomalias() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        const usuarios = await Usuario.find({});
        const choferes = await Chofer.find({});

        console.log("=== REPORTE DE USUARIOS VIVOS ===");
        let aBorrarChoferes = [];
        let aBorrarUsuarios = [];

        // Los choferes válidos son los de DNI reales cargados hoy:
        const dnisEmpleadosValidos = ["22440281", "35576499", "21376999", "30130565", "30900903"];

        for (const u of usuarios) {
            if (u.email === "matiasbourgeois@gmail.com") {
                console.log(`✅ [ADMIN MAESTRO] ${u.email}`);
                continue;
            }

            if (u.rol === "chofer") {
                // Buscar ficha de chofer de este usuario
                const ficha = choferes.find(c => c.usuario.toString() === u._id.toString());
                if (!ficha) {
                    console.log(`❌ [ZOMBIE USUARIO CHOFER SIN FICHA] ${u.nombre} - ${u.email}`);
                    aBorrarUsuarios.push(u._id);
                    continue;
                }

                if (ficha.tipoVinculo === "contratado") {
                    // Los 29 contratados reales tienen DNI 00000000
                    if (ficha.dni === "00000000") {
                        console.log(`✅ [CONTRATADO OK] ${u.nombre}`);
                    } else {
                        console.log(`❌ [FALSO CONTRATADO VIEJO] ${u.nombre} - DNI: ${ficha.dni}`);
                        aBorrarChoferes.push(ficha._id);
                        aBorrarUsuarios.push(u._id);
                    }
                } else if (ficha.tipoVinculo === "relacionDependencia") {
                    if (dnisEmpleadosValidos.includes(ficha.dni)) {
                        console.log(`✅ [EMPLEADO OK] ${u.nombre} - DNI: ${ficha.dni}`);
                    } else {
                        console.log(`❌ [FALSO EMPLEADO VIEJO] ${u.nombre} - DNI: ${ficha.dni}`);
                        aBorrarChoferes.push(ficha._id);
                        aBorrarUsuarios.push(u._id);
                    }
                }
            } else {
                // Cualquier otro rol (admin viejo, cliente, etc)
                console.log(`❌ [INTRUSO DE OTRO ROL: ${u.rol}] ${u.nombre} - ${u.email}`);
                aBorrarUsuarios.push(u._id);
            }
        }

        // Fichas de Chofer Zombies (aquellas que no tienen usuario que las respalde)
        for (const c of choferes) {
            const existeUser = usuarios.find(u => u._id.toString() === c.usuario.toString());
            if (!existeUser && !aBorrarChoferes.includes(c._id)) {
                console.log(`❌ [ZOMBIE FICHA CHOFER HUERFANA] DNI: ${c.dni}`);
                aBorrarChoferes.push(c._id);
            }
        }

        console.log(`\n🚨 EJECUTANDO PURGA FINAL PARA DEJAR SOLO ADMIN Y LOS 34 CHOFERES...`);

        for (let id of aBorrarChoferes) { await Chofer.findByIdAndDelete(id); }
        for (let id of aBorrarUsuarios) { await Usuario.findByIdAndDelete(id); }

        console.log(`🗑️ Misión cumplida: ${aBorrarUsuarios.length} Usuarios y ${aBorrarChoferes.length} Fichas de Chofer sueltas fueron aniquiladas para siempre.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
cazarAnomalias();

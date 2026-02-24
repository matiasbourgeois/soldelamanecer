const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

const contratadosNuevos = [
    { nombreC: "Javier Aguirre", email: "jaguirre499@gmail.com" },
    { nombreC: "Emilio Alba", email: "Emiyoha_12412@hotmail.com" },
    { nombreC: "Lucas Javier Aldeco Baudonnet", email: "Lucasbaudonnet14@icloud.com" },
    { nombreC: "Alejandro Aldeco", email: "alejandroaldeco8@gmail.com" },
    { nombreC: "Trinidad Amaranto", email: "triinii2017@gmail.com" },
    { nombreC: "Diego Anchaval", email: "Diegoanchaval33@gmail.com" },
    { nombreC: "Leandro Federico Nahuel Anchaval", email: "fedeanchaval23@gmail.com" },
    { nombreC: "Lucas Anchaval", email: "anchavallucas1@gmail.com" },
    { nombreC: "Rubén Andrade", email: "rubenenriqueandrade@gmail.com" },
    { nombreC: "Lucas Arias", email: "lucas-793@hotmail.com" },
    { nombreC: "Alan Bray", email: "alanbray422@gmail.com" },
    { nombreC: "Diego Cagnolo", email: "diegocagnolo17@gmail.com" },
    { nombreC: "Diego Matias Calderon", email: "diegomatiascalderon@hotmail.com" },
    { nombreC: "Cristian Castello", email: "castelloc439@gmail.com" },
    { nombreC: "Elias Cescato", email: "infocescato@gmail.com" },
    { nombreC: "Mariano Ezequiel Cescato", email: "Cescatosetur@gmail.com" },
    { nombreC: "Lorenzo Fermanelli", email: "lorenzofermanelli38@gmail.com" },
    { nombreC: "Fos Jonatan Galisia", email: "jonatangalisia@outlook.com" },
    { nombreC: "Matias Galisia", email: "matiasnahuelgalisia@gmail.com" },
    { nombreC: "Emanuel Jesus Garcia", email: "emgarcia0712@gmail.com" },
    { nombreC: "Lucas Gordillo", email: "gordillolu1234@gmail.com" },
    { nombreC: "Eric Eugenio Linera", email: "Lineraeric09@gmail.com" },
    { nombreC: "Mariano Lujan", email: "lujanm1913@gmail.com" },
    { nombreC: "Fernando Maldonado", email: "luismaldonado08@hotmail.com" },
    { nombreC: "Lucas Ariel Navoni", email: "Lucas_navoni@hotmail.com" },
    { nombreC: "Enzo Palloni Poggi", email: "walterpalloni2@gmail.com" },
    { nombreC: "Rafael Rojas", email: "joserafael17.rojas@gmail.com" },
    { nombreC: "Jorge Torres", email: "jorgetorres6151@gmail.com" },
    { nombreC: "Gabriel Valinotto", email: "gabrielvalinotto@hotmail.com" }
];

async function importarContratados() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');
        console.log("✅ Conexión exitosa a la Base de Datos.\n");

        // 1. ELIMINAR CONTRATADOS ANTERIORES
        console.log("🗑️  1. Eliminando perfiles de contratados viejos...");
        const choferesViejos = await Chofer.find({ tipoVinculo: "contratado" });

        let borrados = 0;
        for (let choferV of choferesViejos) {
            // Borramos también la cuenta de Usuario asociada
            await Usuario.findByIdAndDelete(choferV.usuario);
            await Chofer.findByIdAndDelete(choferV._id);
            borrados++;
        }
        console.log(`✅ Se borraron ${borrados} choferes contratados y sus usuarios vinculados.\n`);

        // 2. INSERTAR NUEVOS LOTE MASIVO
        console.log("🚀 2. Iniciando registro de 29 Choferes Contratados Oficiales...");
        let insertados = 0;

        for (const data of contratadosNuevos) {
            // Verificar si el correo ya existe en sistema por las dudas
            const existeEmail = await Usuario.findOne({ email: data.email.toLowerCase() });

            if (existeEmail) {
                console.log(`⚠️ Email duplicado omitido: ${data.email} (${data.nombreC}) - Este email pertenece a otro rol o no se borró.`);
                continue;
            }

            // A) Crear Usuario
            const nombreNormalizado = data.nombreC.trim().replace(/\s+/g, ' ').toUpperCase();

            const nuevoUsuario = new Usuario({
                nombre: nombreNormalizado,
                email: data.email.toLowerCase(),
                contrasena: "SdaChofer123!",
                rol: "chofer",
                verificado: true // Se brinca la confirmacion de email
            });
            await nuevoUsuario.save();

            // B) Crear perfil Chofer oficial y amarrarlo al Usuario
            const nuevoChofer = new Chofer({
                usuario: nuevoUsuario._id,
                dni: "00000000",
                telefono: "0000000000",
                tipoVinculo: "contratado",
                activo: true,
                datosContratado: {
                    fechaIngreso: new Date()
                }
            });
            await nuevoChofer.save();

            insertados++;
            console.log(`➕ Registrado: ${nombreNormalizado} (${data.email})`);
        }

        console.log(`\n🎉 IMPORTACIÓN MASIVA EXITOSA - Total Insertados: ${insertados}/29`);
        process.exit(0);

    } catch (error) {
        console.error("\n❌ FATAL ERROR EN SCRIPT DE IMPORTACIÓN:");
        console.error(error);
        process.exit(1);
    }
}

importarContratados();

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

const empleadosNuevos = [
    { nombreBruto: "ANSPACH, WILLIAMS ENRIQUE RICHAR", dni: "22440281" },
    { nombreBruto: "CANDELLERO VELOZO, YOHANA MARIELA", dni: "35576499" },
    { nombreBruto: "ORTIZ, DARIO ADRIAN", dni: "21376999" },
    { nombreBruto: "VILATTA, MATIAS MIGUEL", dni: "30130565" },
    { nombreBruto: "ZARATE, MAURICIO ERIC", dni: "30900903" }
];

async function importarEmpleados() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');
        console.log("✅ Conexión exitosa a la Base de Datos.\n");

        console.log("🚀 Iniciando registro de 5 Choferes en Relación de Dependencia...");
        let insertados = 0;

        for (const data of empleadosNuevos) {
            // Formatear el nombre (viene como APELLIDO, NOMBRE)
            let partes = data.nombreBruto.split(",");
            let nombreFormateado = data.nombreBruto; // Fallback
            if (partes.length === 2) {
                // Invertir a Nombre Apellido
                nombreFormateado = `${partes[1]} ${partes[0]}`;
            }

            // Lavadora de strings
            const nombreNormalizado = nombreFormateado.trim().replace(/\s+/g, ' ').toUpperCase();
            // Como no tenemos email en la foto, autogeneramos uno fácil de recordar para el login
            const emailGenerico = `${data.dni}@soldelamanecer.com`;

            // Verificar si ya existe para no duplicar (por dni o email)
            const existeChofer = await Chofer.findOne({ dni: data.dni });
            const existeEmail = await Usuario.findOne({ email: emailGenerico });

            if (existeChofer || existeEmail) {
                console.log(`⚠️ Empleado omitido: ${nombreNormalizado} (DNI ${data.dni}) - Ya existe en la base de datos.`);
                continue;
            }

            // A) Crear Usuario
            const nuevoUsuario = new Usuario({
                nombre: nombreNormalizado,
                email: emailGenerico,
                contrasena: "SdaChofer123!",
                rol: "chofer",
                verificado: true
            });
            await nuevoUsuario.save();

            // B) Crear perfil Chofer oficial y amarrarlo al Usuario
            const nuevoChofer = new Chofer({
                usuario: nuevoUsuario._id,
                dni: data.dni,
                telefono: "0000000000",
                tipoVinculo: "relacionDependencia",
                activo: true
            });
            await nuevoChofer.save();

            insertados++;
            console.log(`➕ Registrado: ${nombreNormalizado} | Login: ${emailGenerico} | DNI: ${data.dni}`);
        }

        console.log(`\n🎉 IMPORTACIÓN DE EMPLEADOS EXITOSA - Total Insertados: ${insertados}/5`);
        process.exit(0);

    } catch (error) {
        console.error("\n❌ FATAL ERROR EN SCRIPT DE IMPORTACIÓN:");
        console.error(error);
        process.exit(1);
    }
}

importarEmpleados();

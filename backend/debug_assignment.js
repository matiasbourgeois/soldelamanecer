const mongoose = require("mongoose");
const Usuario = require("./src/models/Usuario");
const Chofer = require("./src/models/Chofer");
const Ruta = require("./src/models/Ruta");
const Vehiculo = require("./src/models/Vehiculo");

// String de conexión (ajustar si es necesario)
const MONGO_URI = "mongodb://127.0.0.1:27017/cotizadorDB"; // Asumo local por los logs anteriores

const inspectData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado a Mongo...");

        // 1. Listar todos los usuarios para encontrar el nombre exacto
        /*
        const usuarios = await Usuario.find({});
        console.log("\n--- LISTA DE USUARIOS ---");
        usuarios.forEach(u => console.log(`ID: ${u._id}, Nombre: ${u.nombre}, Email: ${u.email}, Rol: ${u.rol}`));
        */

        // Buscar por el email exacto que dio el usuario
        const targetEmail = "soldelamanecersrlencomiendas@gmail.com";
        const targetUser = await Usuario.findOne({ email: targetEmail });

        if (!targetUser) {
            console.log(`\n\n⚠️ CRÍTICO: No existe el usuario con email '${targetEmail}' en esta base de datos local.`);
            console.log("Esto confirma que la App móvil (local) no tiene los mismos datos que la Web.");

            // Listar parecidos
            const parecidos = await Usuario.find({ email: /soldelamanecer/i });
            console.log("Usuarios parecidos encontrados:", parecidos.map(u => u.email));

            process.exit();
        }

        console.log(`\nTARGET USER ENCONTRADO: ${targetUser.nombre} (${targetUser._id})`);

        // 2. Buscar Chofer asociado
        const chofer = await Chofer.findOne({ usuario: targetUser._id }).populate("vehiculoAsignado");
        console.log("\n--- PERFIL DE CHOFER ---");
        if (chofer) {
            console.log(`Chofer ID: ${chofer._id}, Activo: ${chofer.activo}`);
            console.log(`Vehículo Asignado (en modelo Chofer): ${chofer.vehiculoAsignado ? chofer.vehiculoAsignado.patente : 'NULL'}`);
        } else {
            console.log("ERROR: Este usuario NO tiene perfil de Chofer creado.");
        }

        // 3. Buscar Ruta asignada
        if (chofer) {
            const ruta = await Ruta.findOne({ choferAsignado: chofer._id });
            console.log("\n--- RUTA ASIGNADA ---");
            if (ruta) {
                console.log(`Ruta ID: ${ruta._id}, Código: ${ruta.codigo}`);
            } else {
                console.log("AVISO: No se encontró ruta con choferAsignado = ID del chofer.");
            }
        }

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

inspectData();

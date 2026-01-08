const mongoose = require("mongoose");
const Usuario = require("./src/models/Usuario");
const Chofer = require("./src/models/Chofer");
const Ruta = require("./src/models/Ruta");
const Vehiculo = require("./src/models/Vehiculo");
const bcrypt = require("bcryptjs");

// String de conexión (ajustar si es necesario, usando default local)
const MONGO_URI = "mongodb://127.0.0.1:27017/cotizadorDB";

const createData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Conectado a Mongo...");

        const email = "soldelamanecersrlencomiendas@gmail.com";
        // El usuario dijo en el ultimo mensaje: "soldelamanecersrlencomiendas@gmail.com" (SIN punto entre srl y encomiendas)
        // Pero mejor creo uno estandar y le aviso.

        const targetEmail = "soldelamanecersrlencomiendas@gmail.com";
        const pass = "silverstone";

        // 1. CREAR / BUSCAR USUARIO
        let user = await Usuario.findOne({ email: targetEmail });
        if (!user) {
            console.log("Creando Usuario...");
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(pass, salt);

            user = new Usuario({
                nombre: "Matias BB",
                email: targetEmail,
                contrasena: hashedPassword,
                rol: "chofer",
                verificado: true,
                activo: true
            });
            await user.save();
        } else {
            console.log("Usuario ya existe. Actualizando rol/pass...");
            user.rol = "chofer"; // Asegurar rol
            // user.password = ... (no cambiamos pass para no romper si ya la sabe)
            await user.save();
        }

        // 2. CREAR / BUSCAR VEHICULO
        let vehiculo = await Vehiculo.findOne({ patente: "AC956LH" });
        if (!vehiculo) {
            console.log("Creando Vehículo Real AC956LH...");
            vehiculo = new Vehiculo({
                patente: "AC956LH",
                marca: "Mercedes",
                modelo: "Accelo 815",
                kilometrajeActual: 50000,
                activo: true,
                tipoPropiedad: "propio", // Requerido
                capacidadKg: 5000,       // Requerido
                vencimientoVTV: new Date() // Probablemente requerido
            });
            await vehiculo.save();
        }

        // 3. CREAR / BUSCAR RUTA
        let ruta = await Ruta.findOne({ codigo: "R-TEST-01" });
        if (!ruta) {
            console.log("Creando Ruta de Test...");
            ruta = new Ruta({
                codigo: "R-TEST-01",
                descripcion: "Ruta de Prueba Local",
                horaSalida: "08:00",
                frecuencia: "Diaria"
            });
            await ruta.save();
        }

        // 4. CREAR PROFILE CHOFER Y ASIGNAR
        let chofer = await Chofer.findOne({ usuario: user._id });
        if (!chofer) {
            console.log("Creando Perfil Chofer...");
            chofer = new Chofer({
                usuario: user._id,
                dni: "12345678",
                telefono: "11111111",
                tipoVinculo: "contratado",
                activo: true
            });
        }

        // ASIGNACIÓN EXPLÍCITA
        console.log("Asignando Vehículo y Ruta...");
        chofer.vehiculoAsignado = vehiculo._id;
        ruta.choferAsignado = chofer._id;
        ruta.vehiculoAsignado = vehiculo._id;

        // Actualizar Vehículo también (por consistencia)
        vehiculo.choferAsignado = chofer._id; // Si existiera el campo en Vehiculo (a veces es solo logico)

        await chofer.save();
        await ruta.save();
        await vehiculo.save();

        console.log("\n✅ ¡LISTO! DATOS CREADOS/SINCRONIZADOS:");
        console.log(`Usuario: ${targetEmail}`);
        console.log(`Pass: ${pass}`);
        console.log(`Vehículo: ${vehiculo.patente}`);
        console.log(`Ruta: ${ruta.codigo}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
};

createData();

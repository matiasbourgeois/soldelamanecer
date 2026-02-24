const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

// Los nuevos de la segunda imagen enviados por el usuario
const contratadosNuevos = [
    { nombreC: "MORETTI JOSE DANIEL", dni: "25794190" },
    { nombreC: "ZARATE ALAN DIEGO", dni: "42784802" },
    { nombreC: "BURGOS MARCELO HECTOR", dni: "22772816" }, // Reemplaza al "Marcelo" solo
    { nombreC: "VILATTA PABLO FEDERICO", dni: "30929119" }
];

// Los DNIs y fechas de ingreso a inyectar en los ya existentes que macheamos
const diccActualizaciones = {
    // [nombre Original en DB] : { dni, fecha }
    "JAVIER AGUIRRE": { dni: "23664102", fecha: "2012-05-21" },
    "EMILIO ALBA": { dni: "38909277", fecha: "2016-01-04" },
    "ALEJANDRO ALDECO": { dni: "35065087", fecha: "2016-01-18" },
    "TRINIDAD AMARANTO": { dni: "40296346", fecha: "2017-08-10" },
    "DIEGO ANCHAVAL": { dni: "36141379", fecha: "2015-02-04" },
    "LEANDRO FEDERICO NAHUEL ANCHAVAL": { dni: "41827860", fecha: "2023-07-10" },
    "LUCAS ANCHAVAL": { dni: "36141378", fecha: "2013-03-05" },
    "RUBÉN ANDRADE": { dni: "16229475", fecha: "2009-06-01" },
    "WILLIAMS ENRIQUE RICHAR ANSPACH": { dni: "22440281", fecha: "2009-06-01" },
    "LUCAS ARIAS": { dni: "26641334", fecha: "2023-01-10" },
    "ALAN BRAY": { dni: "33825323", fecha: "2017-11-24" },
    "DIEGO CAGNOLO": { dni: "26095442", fecha: "2019-02-08" },
    "CRISTIAN CASTELLO": { dni: "26832259", fecha: "2023-07-03" },
    "MARIANO EZEQUIEL CESCATO": { dni: "33378408", fecha: "2021-07-06" },
    "MATIAS GALISIA": { dni: "35545373", fecha: "2016-09-27" },
    "FERNANDO MALDONADO": { dni: "23231776", fecha: "2023-07-17" },
    "JORGE TORRES": { dni: "12746151", fecha: "2013-02-21" },
    "MATIAS MIGUEL VILATTA": { dni: "30130565", fecha: "2020-04-01" },
    "MAURICIO ERIC ZARATE": { dni: "30900903", fecha: "2017-01-17" },
    // Los dudosos confirmados por el usuario
    "FOS JONATAN GALISIA": { dni: "35134302", fecha: "2016-01-18" },
    "EMANUEL JESUS GARCIA": { dni: "29759271", fecha: "2024-07-05" }
};

async function actualizarPoblacion() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        const usuarios = await Usuario.find({});
        const choferes = await Chofer.find({});

        console.log("\n🚀 1. ACTUALIZANDO DNI Y FECHAS DE INGRESO A CHOFERES EXISTENTES...");
        let actualizados = 0;

        for (const [nombre, datos] of Object.entries(diccActualizaciones)) {
            const u = usuarios.find(usr => usr.nombre === nombre);
            if (u) {
                const c = await Chofer.findOne({ usuario: u._id });
                if (c) {
                    c.dni = datos.dni;
                    if (!c.datosContratado) c.datosContratado = {};
                    c.datosContratado.fechaIngreso = new Date(`${datos.fecha}T12:00:00Z`);
                    await c.save();
                    actualizados++;
                    console.log(`  ✅ Actualizado DNI y Fecha a: ${nombre}`);
                }
            } else {
                console.log(`  ❌ Uy, no encontré el usuario: ${nombre}`);
            }
        }
        console.log(`🎉 Total actualizados con éxito: ${actualizados}/${Object.keys(diccActualizaciones).length}`);

        console.log("\n🚀 2. INSERTANDO LOS 4 NUEVOS CONTRATADOS...");
        let insertados = 0;

        for (const datoNuevo of contratadosNuevos) {
            // "LAVADORA" normal para estandarizar
            const nomNormalizado = datoNuevo.nombreC.trim().replace(/\s+/g, ' ').toUpperCase();
            const emailGenerico = `${datoNuevo.dni}@soldelamanecer.com`;

            // Doble chequeo por si existen
            const checkU = await Usuario.findOne({ email: emailGenerico });
            if (checkU) {
                console.log(`  ⚠️ Omitiendo a ${nomNormalizado}, ya existe el correo/dni en DB.`);
                continue;
            }

            const nuevoUser = new Usuario({
                nombre: nomNormalizado,
                email: emailGenerico,
                contrasena: "SdaChofer123!",
                rol: "chofer",
                verificado: true
            });
            await nuevoUser.save();

            const nuevoChof = new Chofer({
                usuario: nuevoUser._id,
                dni: datoNuevo.dni,
                telefono: "0000000000",
                tipoVinculo: "contratado",
                activo: true,
                datosContratado: {
                    fechaIngreso: new Date() // Como no tienen fecha en la tabliita 2
                }
            });
            await nuevoChof.save();

            insertados++;
            console.log(`  ➕ Registrado NUEVO CONTRATADO: ${nomNormalizado} (Login: ${emailGenerico})`);
        }

        console.log(`🎉 Total nuevos registrados: ${insertados}/4`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
actualizarPoblacion();

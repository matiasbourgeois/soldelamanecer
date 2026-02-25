const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Usuario = require('../models/Usuario');
const Chofer = require('../models/Chofer');

// Padrón extraído de la imagen (Omitiendo Fecha de Nacimiento)
// Los DNIs y CUITs han sido sanitizados quitando los puntos.
const padron = [
    { nombre: "Aguirre Javier", dni: "23664102", cuit: "20-23664102-7" },
    { nombre: "Alba Emilio (Hijo)", dni: "38909277", cuit: "20-38909277-9" },
    { nombre: "Alba Emilio A.", dni: "12265722", cuit: "20-12265722-5" },
    { nombre: "Aldeco Alejandro", dni: "35065087", cuit: "20-35065087-9" },
    { nombre: "Aldeco Juan David", dni: "13928583", cuit: "20-13928583-5" },
    { nombre: "Anchaval Diego", dni: "36141379", cuit: "20-36141379-9" },
    { nombre: "Anchaval Lucas", dni: "36141378", cuit: "20-36141378-9" },
    { nombre: "Anchaval Marcelo", dni: "18330181", cuit: "20-18330181-6" },
    { nombre: "Andrade Ruben", dni: "16229475", cuit: "20-16229475-6" },
    { nombre: "Anspach Williams", dni: "22440281", cuit: "20-22440281-7" },
    { nombre: "Burgos Marcelo", dni: "22772816", cuit: "20-22772816-7" },
    { nombre: "Galisia Fos Jonatan Marcelo", dni: "35134302", cuit: "20-35134302-9" },
    { nombre: "Galisia Fos Matias Nahuel", dni: "35545373", cuit: "20-35545373-9" },
    { nombre: "Palloni Walter", dni: "21695452", cuit: "20-21695452-7" },
    { nombre: "Rojas Jorge", dni: "13903724", cuit: "20-13903724-6" },
    { nombre: "Torres Jorge", dni: "12746151", cuit: "20-12746151-5" },
    { nombre: "Zárate Mauricio", dni: "30900903", cuit: "20-30900903-8" },
    { nombre: "Linera Eric", dni: "29931416", cuit: "20-29931416-3" },
    { nombre: "Castello Cristian", dni: "26832259", cuit: "20-26832259-1" },
    { nombre: "Amaranto Trinidad", dni: "40296346", cuit: "27-40296346-3" },
    { nombre: "Bray Alan", dni: "33825323", cuit: "20-33825323-1" },
    { nombre: "Cagnolo Diego", dni: "26095442", cuit: "20-26095442-4" },
    { nombre: "Navoni Lucas", dni: "38021945", cuit: "20-38021945-0" },
    { nombre: "Palloni Poggi Enzo", dni: "39545714", cuit: "20-39545714-5" },
    { nombre: "Valinotto Juan", dni: "35639218", cuit: "20-35639218-4" },
    { nombre: "Vilatta Matias", dni: "30130565", cuit: "20-30130565-7" },
    { nombre: "Cescato Mariano", dni: "33378408", cuit: "20-33378408-5" },
    { nombre: "Anchaval Federico", dni: "41827860", cuit: "23-41827860-9" },
    { nombre: "Maldonado Fernando Luis", dni: "23231776", cuit: "20-23231776-1" },
    { nombre: "Arias Lucas", dni: "26641334", cuit: "20-26641334-4" },
    { nombre: "Garcia Jesus Emanuel", dni: "29759271", cuit: "20-29759271-9" }
];

const actualizarDatos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Conectado a MongoDB. Iniciando cruce quirúrgico de datos...\n");

        let emparejados = 0;
        let noEncontrados = 0;

        for (const persona of padron) {
            // 1. Limpiar el string para buscar (quitar hijos, comas sobrantes y dejar letras base)
            let nombreBusqueda = persona.nombre
                .replace(/\(Hijo\)/ig, '')
                .replace(/\./g, '')
                .replace(/,/g, '')
                .trim();

            // Partimos en palabras. Ejemplo "Aldeco Juan David" -> ["Aldeco", "Juan", "David"]
            const partes = nombreBusqueda.split(' ').map(p => p.trim()).filter(p => p.length > 0);

            if (partes.length < 2) continue; // Mínimo necesitamos apellido y nombre

            // Construir Regex flexible para que busque en la BD si el nombre de BD contiene (Apellido Y Nombre) en cualquier orden
            // Ej: BD="Juan David Aldeco", Excel="Aldeco Juan David"
            const regexParts = partes.map(p => `(?=.*${p})`).join('');
            const regexFinal = new RegExp(`^${regexParts}.*$`, 'i');

            const usuarioDoc = await Usuario.findOne({
                nombre: { $regex: regexFinal },
                rol: { $in: ['chofer', 'administrativo', 'admin'] } // Abarcamos posibles perfiles
            });

            if (usuarioDoc) {
                let huboCambios = false;

                // Actualizar DNI
                if (!usuarioDoc.dni) {
                    usuarioDoc.dni = persona.dni;
                    huboCambios = true;
                }

                // Buscar si es chofer y actualizar CUIT
                const choferDoc = await Chofer.findOne({ usuario: usuarioDoc._id });
                if (choferDoc && choferDoc.tipoVinculo === 'contratado') {
                    if (!choferDoc.datosContratado) {
                        choferDoc.datosContratado = {};
                    }
                    if (!choferDoc.datosContratado.cuit) {
                        choferDoc.datosContratado.cuit = persona.cuit;
                        await choferDoc.save();
                        huboCambios = true;
                    }
                }

                if (huboCambios) {
                    await usuarioDoc.save();
                    console.log(`✅ MATCH ENCONTRADO [${persona.nombre}]: -> Nombre real en BD: [${usuarioDoc.nombre}]. DNI y CUIT grabados.`);
                    emparejados++;
                } else {
                    console.log(`⚠️  MATCH ENCONTRADO [${persona.nombre}] pero la BD YA TENÍA esos datos. Omitido.`);
                }
            } else {
                console.log(`❌ NO MATCH: No existe nadie en el sistema bajo [${persona.nombre}]`);
                noEncontrados++;
            }
        }

        console.log(`\nRESUMEN:`);
        console.log(`- Choferes actualizados con éxito: ${emparejados}`);
        console.log(`- Choferes no encontrados o no procesables: ${noEncontrados}`);
        console.log(`\nCruce finalizado sin crear ninguna cuenta nueva. Cerrando...`);

        process.exit(0);

    } catch (error) {
        console.error("Error fatal en el cruce de bd:", error);
        process.exit(1);
    }
};

actualizarDatos();

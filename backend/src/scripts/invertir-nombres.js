const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");

function invertirNombreAPellido(nombreActual) {
    // 1. Limpieza base
    let nombreLimpio = nombreActual.trim().replace(/\s+/g, ' ').toUpperCase();

    // 2. Si ya tiene coma, asumimos que ya está en formato "APELLIDO, NOMBRE" u otro formato raro que no queremos romper ciegamente.
    if (nombreLimpio.includes(',')) {
        return nombreLimpio;
    }

    // Algunos nombres vienen especiales, como los que tienen " (HIJO)"
    const tieneHijo = nombreLimpio.includes("(HIJO)");
    if (tieneHijo) {
        nombreLimpio = nombreLimpio.replace("(HIJO)", "").trim();
    }

    const partes = nombreLimpio.split(" ");

    // Si solo hay 1 palabra (ej: "MARCELO"), no hay mucho que invertir.
    if (partes.length < 2) {
        return nombreLimpio;
    }

    let apellido = "";
    let nombres = "";

    // Lógica básica:
    // 2 palabras: N A -> A, N
    // 3 palabras: N N A -> A, N N (casi siempre el apellido va al final en los Mocks que el usuario mandó)
    // 4 palabras (ej: FERNANDO LUIS MALDONADO): N N A A -> A A, N N. Es más difícil adivinar sin diccionarios.
    // Vamos a aplicar una heurística conservadora basándonos en los datos vistos:
    // Por lo general el usuario enviaba "Nombre Apellido", así que la última palabra o las dos últimas son el apellido.
    // Para simplificar y no arruinar apellidos compuestos, si tiene 3 palabras asumiremos que las dos primeras son nombres y la última apellido.
    // Si tiene 4 palabras, dos nombres y dos apellidos.

    if (partes.length === 2) {
        apellido = partes[1];
        nombres = partes[0];
    } else if (partes.length === 3) {
        apellido = partes[2];
        nombres = `${partes[0]} ${partes[1]}`;
    } else if (partes.length === 4) {
        // Ej: williams enrique richar anspach (4 palabras). Anspach es apellido.
        // Ej: leandro federico nahuel anchaval (4 palabras). 
        // En los listados anteriores (ej: "Fernando Luis Maldonado" o "Williams Enrique Richar Anspach"), el apellido casi siempre estaba AL FINAL.
        apellido = partes[partes.length - 1];
        nombres = partes.slice(0, partes.length - 1).join(" ");
    } else {
        // 5 o más palabras. Tomamos la última como apellido por seguridad.
        apellido = partes[partes.length - 1];
        nombres = partes.slice(0, partes.length - 1).join(" ");
    }

    let nombreFinal = `${apellido}, ${nombres}`;

    if (tieneHijo) {
        nombreFinal += " (HIJO)";
    }

    return nombreFinal;
}

async function normalizarNombres() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        console.log("🚀 Buscando Usuarios con rol 'chofer'...");
        const choferes = await Usuario.find({ rol: "chofer" });

        let actualizados = 0;
        let omitidos = 0;

        for (const c of choferes) {
            const nombreOriginal = c.nombre;
            const nombreInvertido = invertirNombreAPellido(nombreOriginal);

            if (nombreOriginal !== nombreInvertido) {
                c.nombre = nombreInvertido;
                await c.save();
                console.log(`  ✅ Modificado: [${nombreOriginal}]  --->  [${nombreInvertido}]`);
                actualizados++;
            } else {
                console.log(`  ⏭️ Omitido / Ya Normalizado: [${nombreOriginal}]`);
                omitidos++;
            }
        }

        console.log(`\n🎉 Normalización completada.`);
        console.log(`   🔸 Choferes Actualizados: ${actualizados}`);
        console.log(`   🔸 Choferes Omitidos: ${omitidos}`);

        process.exit(0);

    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

normalizarNombres();

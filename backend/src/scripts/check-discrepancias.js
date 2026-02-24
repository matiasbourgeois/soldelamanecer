const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });

const Usuario = require("../models/Usuario");
const Chofer = require("../models/Chofer");

const nuevosDatosRaw = [
    { nombreC: "Aguirre Javier", dni: "23664102", fechaIngreso: "5/21/2012" },
    { nombreC: "Alba Emilio (hijo)", dni: "38909277", fechaIngreso: "1/4/2016" },
    { nombreC: "Aldeco Alejandro", dni: "35065087", fechaIngreso: "1/18/2016" },
    { nombreC: "Amaranto Trinidad", dni: "40296346", fechaIngreso: "8/10/2017" },
    { nombreC: "Anchaval Diego", dni: "36141379", fechaIngreso: "2/4/2015" },
    { nombreC: "Anchaval Federico", dni: "41827860", fechaIngreso: "7/10/2023" },
    { nombreC: "Anchaval Lucas", dni: "36141378", fechaIngreso: "3/5/2013" },
    { nombreC: "Andrade Ruben", dni: "16229475", fechaIngreso: "6/1/2009" },
    { nombreC: "Anspach William", dni: "22440281", fechaIngreso: "6/1/2009" },
    { nombreC: "Arias Lucas", dni: "26641334", fechaIngreso: "1/10/2023" },
    { nombreC: "Bray Alan", dni: "33825323", fechaIngreso: "11/24/2017" },
    { nombreC: "Marcelo", dni: "22772816", fechaIngreso: "12/1/2013" },
    { nombreC: "Cagnolo Diego", dni: "26095442", fechaIngreso: "2/8/2019" },
    { nombreC: "Castello Cristian", dni: "26832259", fechaIngreso: "7/3/2023" },
    { nombreC: "Cescato Mariano", dni: "33378408", fechaIngreso: "7/6/2021" },
    { nombreC: "Galisia Jonathan Marcelo", dni: "35134302", fechaIngreso: "1/18/2016" },
    { nombreC: "Galisia Matias Nahuel", dni: "35545373", fechaIngreso: "9/27/2016" },
    { nombreC: "GarciaJesus Emanuel", dni: "29759271", fechaIngreso: "7/5/2024" },
    { nombreC: "Fernando Luis Maldonado", dni: "23231776", fechaIngreso: "7/17/2023" },
    { nombreC: "Torres Jorge", dni: "12746151", fechaIngreso: "2/21/2013" },
    { nombreC: "Vilatta Matias", dni: "30130565", fechaIngreso: "4/1/2020" },
    { nombreC: "Mauricio", dni: "30900903", fechaIngreso: "1/17/2017" }
];

const normalizarFuzzy = (nombreStr) => {
    let t = nombreStr.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    t = t.replace(/\(hijo\)/g, ""); // Borrar aclaraciones
    let words = t.match(/[a-z]+/g) || [];
    words = words.filter(w => w.length > 2);
    return words.sort().join(" ");
};

async function checkDiscrepancies() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');

        const usuariosDB = await Usuario.find({ rol: "chofer" }).lean();
        const choferesDB = await Chofer.find({}).lean();

        const padronDB = choferesDB.map(ch => {
            const u = usuariosDB.find(usr => usr._id.toString() === ch.usuario.toString());
            return {
                idUsuario: u ? u._id : null,
                idChofer: ch._id,
                dniOriginal: ch.dni,
                nombreOriginal: u ? u.nombre : "DESCONOCIDO",
                nombreFuzzy: u ? normalizarFuzzy(u.nombre) : "",
                email: u ? u.email : "",
                tipoVinculo: ch.tipoVinculo
            };
        }).filter(item => item.idUsuario);

        let encontrados = [];
        let noEncontrados = [];

        for (const data of nuevosDatosRaw) {
            const fuzzyImg = normalizarFuzzy(data.nombreC);
            let match = padronDB.find(x => x.dniOriginal === data.dni);
            if (!match) match = padronDB.find(x => x.nombreFuzzy === fuzzyImg);
            if (!match) {
                const wordsImg = fuzzyImg.split(" ");
                match = padronDB.find(x => {
                    const wordsDB = x.nombreFuzzy.split(" ");
                    let compartidas = 0;
                    wordsImg.forEach(wi => { if (wordsDB.includes(wi)) compartidas++; });
                    return compartidas >= 2;
                });
            }
            if (!match) {
                if (fuzzyImg.includes("marcelo") && data.dni === "22772816") {
                    match = padronDB.find(x => x.nombreFuzzy.includes("marcelo"));
                }
                if (fuzzyImg.includes("mauricio") && data.dni === "30900903") {
                    match = padronDB.find(x => x.dniOriginal === "30900903");
                }
            }

            if (match) {
                encontrados.push({ imgDatos: data, dbDatos: match });
            } else {
                noEncontrados.push(data);
            }
        }

        const encontradosIDs = encontrados.map(e => e.dbDatos.idChofer.toString());
        const losQuedados = padronDB.filter(p => !encontradosIDs.includes(p.idChofer.toString()));

        const fs = require('fs');
        fs.writeFileSync('reporte.json', JSON.stringify({
            encontradosTotal: encontrados.length,
            reconocidos: encontrados.map(c => ({
                foto: c.imgDatos.nombreC,
                enBaseDatos: c.dbDatos.nombreOriginal
            })),
            NO_reconocidos_NUEVOS: noEncontrados,
            estabanEnBD_NoEnFoto: losQuedados.map(q => `${q.nombreOriginal} (${q.tipoVinculo})`)
        }, null, 2));

        process.exit(0);
    } catch (e) {
        process.exit(1);
    }
}
checkDiscrepancies();

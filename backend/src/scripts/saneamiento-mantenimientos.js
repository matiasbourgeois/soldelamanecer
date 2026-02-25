const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Vehiculo = require("../models/Vehiculo");
const TipoMantenimiento = require("../models/TipoMantenimiento");

// Helper function to generate a code based on name
const generarCodigo = (nombre) => {
    return nombre.toUpperCase().replace(/[^a-zA-Z0-9]/g, '').substring(0, 4) + '-' + Math.floor(Math.random() * 1000);
};

const sanearMantenimientos = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Conectado a la base de datos.");

        console.log("1. Saneando TipoMantenimiento...");
        const tipos = await TipoMantenimiento.find({});
        for (let tipo of tipos) {
            if (!tipo.codigo || tipo.codigo.trim() === '') {
                tipo.codigo = generarCodigo(tipo.nombre);
                await tipo.save();
                console.log(`✅ Asignado código ${tipo.codigo} a ${tipo.nombre}`);
            }
        }

        console.log("\n2. Saneando configuraciones en Vehiculos...");
        const vehiculos = await Vehiculo.find({});
        for (let vehiculo of vehiculos) {
            let modificado = false;
            if (vehiculo.configuracionMantenimiento && vehiculo.configuracionMantenimiento.length > 0) {
                for (let i = 0; i < vehiculo.configuracionMantenimiento.length; i++) {
                    const c = vehiculo.configuracionMantenimiento[i];
                    if (!c.codigo) {
                        const tipoBase = await TipoMantenimiento.findOne({ nombre: c.nombre });
                        if (tipoBase) {
                            c.codigo = tipoBase.codigo;
                        } else {
                            c.codigo = 'DESC'; // Desconocido si no hay match
                        }
                        modificado = true;
                    }
                }
            }
            if (modificado) {
                await vehiculo.save();
                console.log(`✅ Vehículo ${vehiculo.patente} saneado.`);
            }
        }

        console.log("\n🚀 SANEAMIENTO COMPLETADO.");
        process.exit(0);
    } catch (error) {
        console.error("Error durante el saneamiento:", error);
        process.exit(1);
    }
};

sanearMantenimientos();

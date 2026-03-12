require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Usuario = require("../src/models/Usuario");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sol_del_amanecer";

async function inspectUser() {
  try {
    await mongoose.connect(uri);
    
    const emailToFind = "soldelamanecersrlencomiendas@gmail.com";
    const user = await Usuario.findOne({ email: emailToFind });

    if (user) {
        console.log("=========================================");
        console.log("USUARIO ENCONTRADO EN LA BASE DE DATOS:");
        console.log("ID:", user._id);
        console.log("Email:", user.email);
        console.log("Nombre:", user.nombre);
        console.log("Rol:", user.rol);
        console.log("Activo:", user.activo);
        console.log("Verificado:", user.verificado);
        console.log("DNI:", user.dni);
        console.log("=========================================");
    } else {
        console.log(`El usuario con email ${emailToFind} NO EXISTE en la base de datos.`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

inspectUser();

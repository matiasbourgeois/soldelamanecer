require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Usuario = require("../src/models/Usuario");
const Chofer = require("../src/models/Chofer");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/sol_del_amanecer";

async function deepSearch() {
  try {
    await mongoose.connect(uri);
    
    // Regex para ignorar mayúsculas y espacios
    const emailToSearch = "soldelamanecersrlencomiendas@gmail.com";
    const regex = new RegExp(emailToSearch.trim(), "i");

    const usuarios = await Usuario.find({ email: regex });

    console.log("--- Búsqueda Profunda (Usuarios) ---");
    if (usuarios.length > 0) {
        usuarios.forEach(u => {
            console.log(`Encontrado: ID=${u._id} | Email="${u.email}" | Activo=${u.activo}`);
        });
    } else {
        console.log("Ningún usuario matchea la regex.");
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

deepSearch();

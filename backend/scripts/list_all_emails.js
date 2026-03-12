require("dotenv").config({ path: "../.env" });
const mongoose = require("mongoose");
const Usuario = require("../src/models/Usuario");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function listAllEmails() {
  try {
    await mongoose.connect(uri);
    
    const usuarios = await Usuario.find({}).select("email activo");

    console.log(`--- TOTAL USUARIOS: ${usuarios.length} ---`);
    usuarios.forEach(u => {
        console.log(`Email: '${u.email}' | Activo: ${u.activo}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

listAllEmails();

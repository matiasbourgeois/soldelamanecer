require("dotenv").config({ path: __dirname + "/../.env" });
const mongoose = require("mongoose");
const Usuario = require("../src/models/Usuario");

const uri = process.env.MONGODB_URI;

async function fixDeletedUsersProd() {
  try {
    console.log("Conectando a MongoDB en Produccion: " + uri);
    await mongoose.connect(uri);

    const usuariosBorrados = await Usuario.find({ activo: false });
    console.log(`\nUsuarios inactivos (Eliminados) en Total: ${usuariosBorrados.length}`);
    
    let count = 0;
    for (const usuario of usuariosBorrados) {
      if (!usuario.email.startsWith("borrado_")) {
        const timestamp = Date.now() + count;
        const oldEmail = usuario.email;
        usuario.email = `borrado_${timestamp}_${oldEmail}`;
        
        if (usuario.dni && !usuario.dni.startsWith("borrado_")) {
          usuario.dni = `borrado_${timestamp}_${usuario.dni}`;
        }
        await usuario.save();
        console.log(`✅ FIX APLICADO: ${oldEmail} -> ${usuario.email}`);
        count++;
      }
    }
    console.log(`\n🎉 Finalizado! Se corrigieron ${count} usuarios en Producción.`);
  } catch (error) {
    console.error("Error crítico:", error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

fixDeletedUsersProd();

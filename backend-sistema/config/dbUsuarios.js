const mongoose = require("mongoose");

// ✅ Creamos la conexión directamente (sin async/await)
const usuariosDB = mongoose.createConnection(process.env.MONGO_URI_USUARIOS, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

usuariosDB.on("connected", () => {
  console.log("✅ Conectado a MongoDB (usuarios) desde backend-sistema");
});

usuariosDB.on("error", (err) => {
  console.error("❌ Error de conexión con usuariosDB:", err.message);
});

module.exports = usuariosDB;

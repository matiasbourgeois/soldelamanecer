// testCerrarHojas.js
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const cerrarHojasVencidas = require("./tasks/cronCerrarHojas");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log("🟢 Conectado a Mongo. Ejecutando cierre de hojas vencidas...");
  await cerrarHojasVencidas();
  mongoose.connection.close();
}).catch(err => {
  console.error("❌ Error de conexión:", err);
});

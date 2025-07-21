const cors = require("cors");
const express = require("express");
const connectDB = require("./config/db");
require("dotenv").config();


const app = express();
app.use(cors({
  origin: "http://localhost:5173", // o "*", si querés permitir todos
  credentials: true,
}));
app.use(express.json());

// Conectar a Mongo
connectDB();

// 🕐 Ejecutar cron de cierre de hojas vencidas
const iniciarCierreAutomatico = require("./tasks/cronCerrarHojas");
iniciarCierreAutomatico();

// Rutas

app.use("/api/rutas", require("./routes/rutas"));

const choferRoutes = require("./routes/choferes");
app.use("/api/choferes", choferRoutes);

// ✅ Nueva ruta para vehículos
const vehiculoRoutes = require("./routes/vehiculos");
app.use("/api/vehiculos", vehiculoRoutes);

const localidadesRoutes = require("./routes/localidades");
app.use("/api/localidades", localidadesRoutes);

const envioRoutes = require("./routes/envios");
app.use("/api/envios", envioRoutes);

const remitoRoutes = require("./routes/remitos");
app.use("/api/remitos", remitoRoutes);

const destinatarioRoutes = require("./routes/destinatarios");
app.use("/api/destinatarios", destinatarioRoutes);

const usuariosSistemaRoutes = require("./routes/usuariosSistema");
app.use("/api/usuarios", usuariosSistemaRoutes);

const hojaRepartoRoutes = require('./routes/hojaRepartoRoutes');
app.use('/api/hojas-reparto', hojaRepartoRoutes);

const seguimientoRoutes = require("./routes/seguimiento");
app.use("/api/seguimiento", seguimientoRoutes);




const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
  console.log(`🟢 Backend del sistema iniciado en el puerto ${PORT}`);
});

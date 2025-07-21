require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const verificarToken = require("./middleware/authMiddleware"); // 🛡️ Middleware de autenticación

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware CORS con dominios permitidos
app.use(cors({
    origin: [
        'https://www.soldelamanecer.ar',
        'https://soldelamanecer.ar',
        'http://localhost:5173'
    ],
    credentials: true
}));

app.use(express.json());

// Conectar a MongoDB
console.log("🔹 MONGO_URI:", process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log("📌 Conectado a MongoDB"))
    .catch(err => console.error("Error de conexión a MongoDB:", err));

// Rutas públicas
app.use("/api/auth", require("./routes/auth.js"));
app.use("/api/cotizaciones", require("./routes/cotizaciones.js"));
app.use("/api/encomiendas", require("./routes/encomiendas.js"));
app.use("/api/localidades", require("./routes/localidades"));

// Rutas protegidas con JWT
app.use("/api/historial-viajes", verificarToken, require("./routes/historialViajes.js"));
app.use("/api/historial-encomiendas", verificarToken, require("./routes/historialEncomiendas.js"));

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("🚀 Servidor funcionando correctamente");
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

const express = require('express');
const dotenv = require('dotenv');
const conectarDB = require('./config/db');
const cors = require('cors');
const path = require("path");

dotenv.config();
const app = express();

// Conexión a MongoDB
conectarDB();

// Middlewares
// Configurar CORS de forma explícita
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Ruta principal de usuarios
app.use('/api/usuarios', require('./routes/usuarios'));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend-usuarios corriendo en http://localhost:${PORT}`);
});

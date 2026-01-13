const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middlewares Globales
// CORS Dinámico y Debug
app.use((req, res, next) => {
    console.log(`[CORS DEBUG] Origin: ${req.headers.origin} | Method: ${req.method} | Path: ${req.path}`);
    next();
});

app.use(cors({
    origin: true, // Refleja el origen de la petición automáticamente
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (PDFs, Uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/pdfs", express.static(path.join(__dirname, "../pdfs")));

// Rutas (Placeholder para Phase 2)
app.get("/", (req, res) => {
    res.json({ message: "API Monolito Sol del Amanecer - Running 🚀" });
});

app.use("/api", require("./routes")); // Mounts index.js

module.exports = app;

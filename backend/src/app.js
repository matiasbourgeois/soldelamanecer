const express = require("express");
const cors = require("cors");
const path = require("path");
const logger = require("./utils/logger");

const app = express();

// Middlewares Globales
// CORS Dinámico y Debug
app.use((req, res, next) => {
    logger.debug(`[CORS DEBUG] Origin: ${req.headers.origin} | Method: ${req.method} | Path: ${req.path}`);
    next();
});

app.use(cors({
    origin: [
        'https://www.soldelamanecer.ar',
        'https://soldelamanecer.ar',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (PDFs, Uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads"), {
    setHeaders: (res, path, stat) => {
        res.set("Access-Control-Allow-Origin", "*");
        res.set("Cross-Origin-Resource-Policy", "cross-origin");
    }
}));
app.use("/pdfs", express.static(path.join(__dirname, "../pdfs")));

// Rutas (Placeholder para Phase 2)
app.get("/health", (req, res) => {
    res.json({ message: "API Monolito Sol del Amanecer - Running 🚀" });
});

app.use("/api", require("./routes")); // Mounts index.js

// --- SERVIR FRONTEND (SPA FALLBACK) ---
// 1. Servir archivos estáticos del build de React
app.use(express.static(path.join(__dirname, "../../frontend-sda/dist")));

// 2. Ruta comodín para manejar el F5/Routing de React
// IMPORTANTE: Esta ruta DEBE ir al final de todo
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../../frontend-sda/dist", "index.html"));
});

module.exports = app;

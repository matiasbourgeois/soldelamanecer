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
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como apps móviles o curl)
        if (!origin) return callback(null, true);

        const allowedOrigins = [
            'https://www.soldelamanecer.ar',
            'https://soldelamanecer.ar',
            'http://localhost:5173',
            'http://localhost:3000'
        ];

        if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('soldelamanecer.ar')) {
            callback(null, true);
        } else {
            logger.warn(`[CORS REJECTED] Origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

// Responder explícitamente a preflight OPTIONS
app.options('*', cors());
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

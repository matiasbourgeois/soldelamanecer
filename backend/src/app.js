const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

// Middlewares Globales
app.use(cors());
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

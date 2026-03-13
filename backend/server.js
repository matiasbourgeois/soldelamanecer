const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const app = require("./src/app");
const connectDB = require("./src/config/db");
const logger = require("./src/utils/logger");

// Cron Jobs
require("./src/tasks/cronCerrarHojas")(); // ✅ Re-habilitado 13/03/2026 — Cierre automático nocturno de hojas vencidas
require("./src/tasks/cronGenerarHojas")();
require("./src/tasks/cronCambiarEstados")();  // Cambio automático pendiente -> en reparto
require("./src/tasks/cronLiquidaciones")();  // Aceptación tácita de liquidaciones (3 días)

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`✅ Servidor Monolito corriendo en el puerto ${PORT}`);
    logger.info(`🌐 Base URL: http://localhost:${PORT}`);
});
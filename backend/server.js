const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, ".env") });

const app = require("./src/app");
const connectDB = require("./src/config/db");
const logger = require("./src/utils/logger");

// Cron Jobs
// require("./src/tasks/cronCerrarHojas")(); // Desactivado por pedido (ya no se necesita)
require("./src/tasks/cronGenerarHojas")();
require("./src/tasks/cronCambiarEstados")();  // Cambio automático pendiente -> en reparto

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`✅ Servidor Monolito corriendo en el puerto ${PORT}`);
    logger.info(`🌐 Base URL: http://localhost:${PORT}`);
});

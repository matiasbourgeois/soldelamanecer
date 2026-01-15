const dotenv = require("dotenv");
dotenv.config(); // 👈 MUST be first

const app = require("./src/app");
const connectDB = require("./src/config/db");
const logger = require("./src/utils/logger");

// Cron Jobs
require("./src/tasks/cronCerrarHojas")();

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`✅ Servidor Monolito corriendo en el puerto ${PORT}`);
    logger.info(`🌐 Base URL: http://localhost:${PORT}`);
});

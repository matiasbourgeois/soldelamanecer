const dotenv = require("dotenv");
dotenv.config(); // 👈 MUST be first

const app = require("./src/app");
const connectDB = require("./src/config/db");

// Cron Jobs
require("./src/tasks/cronCerrarHojas")();

connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Servidor Monolito corriendo en el puerto ${PORT}`);
    console.log(`🌐 Base URL: http://localhost:${PORT}`);
});

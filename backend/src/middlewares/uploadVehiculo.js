const multer = require("multer");
const path = require("path");
const fs = require('fs');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = path.join(process.cwd(), "uploads", "vehiculos");
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `vehiculo_${req.params.id}_${uniqueSuffix}${ext}`);
    }
});

const uploadVehiculo = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const tiposValidos = /jpeg|jpg|png|pdf/;
        const esValido = tiposValidos.test(path.extname(file.originalname).toLowerCase());
        if (esValido) {
            cb(null, true);
        } else {
            cb(new Error("Solo se permiten imágenes (JPG, PNG) y archivos PDF"));
        }
    }
});

module.exports = uploadVehiculo;

const multer = require("multer");
const path = require("path");

// Almacenamiento en /uploads/perfiles/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(process.cwd(), "uploads", "perfiles");
    const fs = require('fs');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nombre = `perfil_${req.usuario.id}${ext}`;
    cb(null, nombre);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const tiposValidos = /jpeg|jpg|png/;
    const esValido = tiposValidos.test(path.extname(file.originalname).toLowerCase());
    esValido ? cb(null, true) : cb(new Error("Tipo de archivo no permitido"));
  }
});

module.exports = upload;

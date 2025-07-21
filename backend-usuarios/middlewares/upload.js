const multer = require("multer");
const path = require("path");

// Almacenamiento en /uploads/perfiles/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/perfiles/");
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

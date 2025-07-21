const mongoose = require("mongoose");

const LocalidadSchema = new mongoose.Schema({
    localidad: { type: String, required: true },
    frecuencia: { type: String, required: true },
    horarios: { type: String, required: true },
    codigoPostal: { type: String, required: true }
}, { collection: "localidades" }); // 💡 Forzamos a que use la colección "localidades"

const Localidad = mongoose.model("Localidad", LocalidadSchema);

module.exports = Localidad;

const mongoose = require("mongoose");

const ViajeSchema = new mongoose.Schema({
    tipoVehiculo: { type: String, required: true },
    zona: { type: String, required: true },
    kilometros: { type: Number, required: function () { return this.zona === "Córdoba Interior"; } }, 
    precio: { type: Number, required: true },
    fechaHora: { type: Date, default: Date.now }
});

// 💡 Asegurar que siempre use la colección "viajes"
const Viaje = mongoose.model("Viaje", ViajeSchema, "viajes");

module.exports = Viaje;

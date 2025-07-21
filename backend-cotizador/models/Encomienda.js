const mongoose = require("mongoose");

// Esquema para cada bulto dentro de una cotización
const BultoSchema = new mongoose.Schema({
    peso: { type: Number, required: true }, 
    dimensiones: { 
        largo: { type: Number, required: true }, 
        ancho: { type: Number, required: true }, 
        profundidad: { type: Number, required: true }
    }, 
    tipoPaquete: { type: String, required: true }, // Determinado automáticamente
    precioBase: { type: Number, required: true }, 
    precioExtra: { type: Number, required: true }, 
    iva: { type: Number, required: true }, 
    total: { type: Number, required: true } // Precio final del bulto con IVA
});

// Esquema principal de la cotización de encomiendas
const EncomiendaSchema = new mongoose.Schema({
    bultos: [BultoSchema], // 🔥 Ahora es un array de bultos
    destino: { type: String, required: true },
    totalCotizacion: { type: Number, required: true }, // 🔥 Total de toda la cotización
    fechaHora: { type: Date, default: Date.now }
});

const Encomienda = mongoose.model("Encomienda", EncomiendaSchema);

module.exports = Encomienda;

const Envio = require("../../models/Envio");

const buscarPorNumeroSeguimiento = async (req, res) => {
  try {
    const { numeroSeguimiento } = req.params;

    const envio = await Envio.findOne({ numeroSeguimiento })
      .populate("localidadDestino", "nombre")
      .populate("destinatario", "nombre direccion localidad provincia email telefono")
      .populate("clienteRemitente", "nombre email")
      .lean();

    if (!envio) {
      return res.status(404).json({ error: "Envío no encontrado" });
    }

    res.json({
      estadoActual: envio.estado,
      historial: envio.historialEstados,
      destinatario: envio.destinatario,
      localidadDestino: envio.localidadDestino,
      fecha: envio.fechaCreacion,
      sucursal: envio.sucursalOrigen,
      remitente: envio.clienteRemitente,
    });
  } catch (error) {
    console.error("Error al buscar por número de seguimiento:", error);
    res.status(500).json({ error: "Error al buscar el envío" });
  }
};

module.exports = { buscarPorNumeroSeguimiento };

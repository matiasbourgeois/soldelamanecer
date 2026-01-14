const TipoMantenimiento = require("../../models/TipoMantenimiento");

exports.obtenerTodos = async (req, res) => {
    try {
        const tipos = await TipoMantenimiento.find().sort({ nombre: 1 });
        res.json(tipos);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener los tipos de mantenimiento" });
    }
};

exports.crear = async (req, res) => {
    try {
        const { nombre, frecuenciaKmDefault, descripcion } = req.body;
        const nuevoTipo = new TipoMantenimiento({ nombre, frecuenciaKmDefault, descripcion });
        await nuevoTipo.save();
        res.status(201).json(nuevoTipo);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ error: "Ya existe un mantenimiento con ese nombre" });
        }
        res.status(500).json({ error: "Error al crear el tipo de mantenimiento" });
    }
};

exports.actualizar = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, frecuenciaKmDefault, descripcion } = req.body;
        const tipoActualizado = await TipoMantenimiento.findByIdAndUpdate(
            id,
            { nombre, frecuenciaKmDefault, descripcion },
            { new: true, runValidators: true }
        );
        if (!tipoActualizado) return res.status(404).json({ error: "Tipo no encontrado" });
        res.json(tipoActualizado);
    } catch (error) {
        res.status(500).json({ error: "Error al actualizar el tipo de mantenimiento" });
    }
};

exports.eliminar = async (req, res) => {
    try {
        const { id } = req.params;
        const tipoEliminado = await TipoMantenimiento.findByIdAndDelete(id);
        if (!tipoEliminado) return res.status(404).json({ error: "Tipo no encontrado" });
        res.json({ message: "Tipo eliminado correctamente" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar el tipo de mantenimiento" });
    }
};

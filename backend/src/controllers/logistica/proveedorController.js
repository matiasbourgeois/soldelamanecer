const Proveedor = require("../../models/Proveedor");
const path = require("path");
const fs = require('fs');

// Obtener todos los proveedores
const obtenerProveedores = async (req, res) => {
    try {
        const { busqueda } = req.query;
        let query = {};

        if (busqueda) {
            query = {
                $or: [
                    { razonSocial: { $regex: busqueda, $options: "i" } },
                    { cuit: { $regex: busqueda, $options: "i" } }
                ]
            };
        }

        const proveedores = await Proveedor.find(query)
            .populate("vehiculoDefault", "patente marca modelo")
            .populate("rutaDefault", "codigo descripcion precioKm kilometrosEstimados");

        res.json(proveedores);
    } catch (error) {
        console.error("Error al obtener proveedores:", error);
        res.status(500).json({ error: "Error al obtener proveedores" });
    }
};

// Crear proveedor
const crearProveedor = async (req, res) => {
    try {
        const nuevoProveedor = new Proveedor(req.body);
        await nuevoProveedor.save();
        res.status(201).json(nuevoProveedor);
    } catch (error) {
        console.error("Error al crear proveedor:", error);
        if (error.code === 11000) {
            return res.status(400).json({ error: "El CUIT ya está registrado." });
        }
        res.status(500).json({ error: "Error al crear proveedor" });
    }
};

// Actualizar proveedor
const actualizarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const proveedor = await Proveedor.findByIdAndUpdate(id, req.body, { new: true })
            .populate("vehiculoDefault")
            .populate("rutaDefault");

        if (!proveedor) return res.status(404).json({ error: "Proveedor no encontrado" });
        res.json(proveedor);
    } catch (error) {
        console.error("Error al actualizar proveedor:", error);
        res.status(500).json({ error: "Error al actualizar proveedor" });
    }
};

// Eliminar proveedor
const eliminarProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        await Proveedor.findByIdAndDelete(id);
        res.json({ mensaje: "Proveedor eliminado" });
    } catch (error) {
        console.error("Error al eliminar proveedor:", error);
        res.status(500).json({ error: "Error al eliminar proveedor" });
    }
};

// Subir un documento específico
const subirDocumentoProveedor = async (req, res) => {
    try {
        const { id } = req.params;
        const { tipoDoc } = req.body; // dni, carnetConducir, constanciaARCA, contrato, antecedentesPenales

        if (!req.file) return res.status(400).json({ error: "No se subió ningún archivo." });

        const proveedor = await Proveedor.findById(id);
        if (!proveedor) return res.status(404).json({ error: "Proveedor no encontrado" });

        // Eliminar archivo anterior si existe
        if (proveedor.documentos[tipoDoc]?.path) {
            const oldPath = path.join(process.cwd(), proveedor.documentos[tipoDoc].path);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        proveedor.documentos[tipoDoc] = {
            path: `uploads/vehiculos/${req.file.filename}`, // Usamos la misma carpeta para simplificar
            fechaSubida: new Date()
        };

        await proveedor.save();
        res.json({ mensaje: "Documento subido con éxito", proveedor });
    } catch (error) {
        console.error("Error al subir documento:", error);
        res.status(500).json({ error: "Error interno al subir documento" });
    }
};

module.exports = {
    obtenerProveedores,
    crearProveedor,
    actualizarProveedor,
    eliminarProveedor,
    subirDocumentoProveedor
};

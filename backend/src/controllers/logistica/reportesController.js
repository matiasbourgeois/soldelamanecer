const mongoose = require("mongoose");
const Envio = require("../../models/Envio");
const HojaReparto = require("../../models/HojaReparto");
const Vehiculo = require("../../models/Vehiculo");
const Chofer = require("../../models/Chofer");

exports.getDashboardStats = async (req, res) => {
    try {
        // -------------------------------------------------------------------------
        // 1. KPI Cards (Operativa General)
        // -------------------------------------------------------------------------
        const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const startOfLastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);

        const [
            totalEnviosMes,
            totalEnviosMesAnterior,
            enviosEntregados,
            enviosPendientes,
            enviosEnReparto,
            enviosNoEntregados
        ] = await Promise.all([
            // Volumen Mes Actual
            Envio.countDocuments({ fechaCreacion: { $gte: startOfMonth } }),
            // Volumen Mes Anterior (para tendencia)
            Envio.countDocuments({ fechaCreacion: { $gte: startOfLastMonth, $lt: startOfMonth } }),
            // Estados Globales (Histórico o Mes?) -> Vamos por Histórico total para "Efectividad Global"
            Envio.countDocuments({ estado: "entregado" }),
            Envio.countDocuments({ estado: "pendiente" }),
            Envio.countDocuments({ estado: "en reparto" }),
            Envio.countDocuments({ estado: { $in: ["no entregado", "rechazado", "devuelto"] } })
        ]);

        const totalProcesados = enviosEntregados + enviosNoEntregados;
        const efectividad = totalProcesados > 0
            ? ((enviosEntregados / totalProcesados) * 100).toFixed(1)
            : 0;

        // -------------------------------------------------------------------------
        // 2. Salud de Flota y Fuerza Laboral
        // -------------------------------------------------------------------------
        const [
            vehiculosDisponibles,
            vehiculosEnMantenimiento,
            vehiculosTotal,
            choferesActivos,
            choferesTotal
        ] = await Promise.all([
            Vehiculo.countDocuments({ estado: "disponible", activo: true }),
            Vehiculo.countDocuments({ estado: "en mantenimiento", activo: true }),
            Vehiculo.countDocuments({ activo: true }),
            Chofer.countDocuments({ activo: true }), // Asumimos que "activo" es operativo
            Chofer.countDocuments({})
        ]);

        // -------------------------------------------------------------------------
        // 3. Gráficos: Distribución de Estados (Pie Chart)
        // -------------------------------------------------------------------------
        // Agregamos todos los estados relevantes
        const estadoDistribucion = [
            { name: "Entregado", value: enviosEntregados, color: "#1098ad" }, // Cyan
            { name: "Pendiente", value: enviosPendientes, color: "#fab005" }, // Yellow
            { name: "En Reparto", value: enviosEnReparto, color: "#228be6" }, // Blue
            { name: "Fallido", value: enviosNoEntregados, color: "#fa5252" }  // Red
        ];

        // -------------------------------------------------------------------------
        // 4. Gráficos: Top Choferes (Ranking)
        // -------------------------------------------------------------------------
        // Agregación compleja: Contar Envíos Entregados por Chofer (vía HojaReparto)
        // Nota: Esto es costoso, simplificamos contando Hojas Cerradas por ahora, 
        // o hacemos un lookup. Vamos por Hojas Completadas por Chofer.
        const topChoferesRaw = await HojaReparto.aggregate([
            { $match: { estado: "cerrada" } },
            { $group: { _id: "$chofer", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
            {
                $lookup: {
                    from: "chofers",
                    localField: "_id",
                    foreignField: "_id",
                    as: "choferInfo"
                }
            },
            {
                $lookup: {
                    from: "usuarios",
                    localField: "choferInfo.usuario",
                    foreignField: "_id",
                    as: "usuarioInfo"
                }
            },
            {
                $project: {
                    nombre: { $arrayElemAt: ["$usuarioInfo.nombre", 0] },
                    viajes: "$count"
                }
            }
        ]);

        // Sanitizar nulls si hay data corrupta
        const topChoferes = topChoferesRaw
            .filter(c => c.nombre)
            .map(c => ({ name: c.nombre, value: c.viajes }));


        res.json({
            kpis: {
                enviosMes: totalEnviosMes,
                tendencia: totalEnviosMes >= totalEnviosMesAnterior ? "up" : "down",
                porcentajeTendencia: totalEnviosMesAnterior > 0
                    ? (((totalEnviosMes - totalEnviosMesAnterior) / totalEnviosMesAnterior) * 100).toFixed(0)
                    : 100,
                efectividad: efectividad,
                enviosEnCalle: enviosEnReparto,
                pendientes: enviosPendientes
            },
            flota: {
                disponible: vehiculosDisponibles,
                mantenimiento: vehiculosEnMantenimiento,
                total: vehiculosTotal,
                propio: await Vehiculo.countDocuments({ tipoPropiedad: "propio" }),
                externo: await Vehiculo.countDocuments({ tipoPropiedad: "externo" })
            },
            choferes: {
                activos: choferesActivos,
                total: choferesTotal
            },
            graficos: {
                estados: estadoDistribucion,
                topChoferes: topChoferes
            }
        });

    } catch (error) {
        console.error("Error en Dashboard Stats:", error);
        res.status(500).json({ msg: "Error al obtener métricas", error: error.message });
    }
};

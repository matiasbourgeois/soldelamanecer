const LiquidacionContratado = require("../models/LiquidacionContratado");
const Vehiculo = require("../models/Vehiculo");
const logger = require("../utils/logger");

/**
 * GET /api/notificaciones
 * Consolida alertas de mantenimiento de vehículos + rechazos de liquidaciones.
 * Accesible para roles: admin, administrativo (con JWT).
 */
const obtenerNotificaciones = async (req, res) => {
    try {
        const notificaciones = [];

        // ─── 1. ALERTAS DE MANTENIMIENTO DE VEHÍCULOS ────────────────────────
        const vehiculos = await Vehiculo.find({ activo: true }).select(
            "numero patente marca modelo kilometrajeActual configuracionMantenimiento"
        );

        for (const v of vehiculos) {
            if (!v.configuracionMantenimiento || v.configuracionMantenimiento.length === 0) continue;

            for (const c of v.configuracionMantenimiento) {
                const kmRecorrido = (v.kilometrajeActual || 0) - (c.ultimoKm || 0);
                const restante = (c.frecuenciaKm || 0) - kmRecorrido;

                let severidad = null;
                if (restante <= 0) severidad = "critica";
                else if (restante <= 500) severidad = "advertencia";

                if (!severidad) continue;

                const identificador = v.patente || v.numero || v._id;
                const exceso = restante < 0 ? Math.abs(restante) : null;

                notificaciones.push({
                    id: `mant-${v._id}-${c._id || c.tipo}`,
                    tipo: "mantenimiento",
                    severidad,
                    titulo: `${c.tipo || "Mantenimiento"} — ${identificador}`,
                    descripcion: severidad === "critica"
                        ? `Vencido hace ${exceso} km (${v.marca || ""} ${v.modelo || ""})`
                        : `Vence en ${restante} km (${v.marca || ""} ${v.modelo || ""})`,
                    href: "/admin/mantenimiento/metricas",
                    vehiculoId: v._id,
                    fecha: c.fechaUltimoService || null
                });
            }
        }

        // ─── 2. LIQUIDACIONES RECHAZADAS ─────────────────────────────────────
        const rechazadas = await LiquidacionContratado.find({ estado: "rechazado" })
            .populate({ path: "chofer", populate: { path: "usuario", select: "nombre" } })
            .sort({ "fechas.creacion": -1 })
            .limit(20);

        for (const liq of rechazadas) {
            const nombreChofer = liq.chofer?.usuario?.nombre || "Contratado";
            const motivo = liq.motivoRechazo || "Sin motivo especificado";
            const motivoResumido = motivo.length > 80 ? motivo.substring(0, 77) + "..." : motivo;

            const mes = new Intl.DateTimeFormat("es-AR", {
                timeZone: "UTC", month: "long", year: "numeric"
            }).format(new Date(liq.periodo?.inicio || Date.now()));

            notificaciones.push({
                id: `liq-${liq._id}`,
                tipo: "liquidacion_rechazada",
                severidad: "urgente",
                titulo: `Liquidación rechazada — ${nombreChofer}`,
                descripcion: `${mes}: "${motivoResumido}"`,
                href: "/admin/liquidaciones?tab=historial",
                liquidacionId: liq._id,
                fecha: liq.fechas?.creacion || null
            });
        }

        // ─── 3. ORDENAR: urgente → critica → advertencia, luego por fecha ─────
        const ORDEN_SEVERIDAD = { urgente: 0, critica: 1, advertencia: 2 };
        notificaciones.sort((a, b) => {
            const diff = (ORDEN_SEVERIDAD[a.severidad] ?? 9) - (ORDEN_SEVERIDAD[b.severidad] ?? 9);
            if (diff !== 0) return diff;
            return new Date(b.fecha || 0) - new Date(a.fecha || 0);
        });

        res.json({
            total: notificaciones.length,
            urgentes: notificaciones.filter(n => n.severidad === "urgente").length,
            criticas: notificaciones.filter(n => n.severidad === "critica").length,
            advertencias: notificaciones.filter(n => n.severidad === "advertencia").length,
            notificaciones
        });

    } catch (error) {
        logger.error("❌ Error obteniendo notificaciones:", error);
        res.status(500).json({ error: "Error al obtener notificaciones" });
    }
};

module.exports = { obtenerNotificaciones };

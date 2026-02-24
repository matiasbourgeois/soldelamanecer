const LiquidacionContratado = require("../../models/LiquidacionContratado");
const HojaReparto = require("../../models/HojaReparto");
const Chofer = require("../../models/Chofer");
const logger = require("../../utils/logger");

const calcularTotalesLiquidacion = async (choferId, fechaInicio, fechaFin) => {
    const fnInicio = new Date(fechaInicio);
    fnInicio.setHours(0, 0, 0, 0);
    const fnFin = new Date(fechaFin);
    fnFin.setHours(23, 59, 59, 999);

    // Buscar Hojas del periodo donde:
    // - chofer == choferId (el titular maneja él mismo)
    // - O bien la ruta tiene contratistaTitular == choferId (el titular es dueño pero otro maneja)
    const Ruta = require("../../models/Ruta");
    const rutasComoTitular = await Ruta.find({ contratistaTitular: choferId }).lean();
    const idsRutasComoTitular = rutasComoTitular.map(r => r._id);

    // FIX: Para las rutas donde el chofer maneja, NO debe haber otro contratista titular
    const rutasConOtroTitular = await Ruta.find({
        contratistaTitular: { $nin: [null, choferId] }
    }).lean();
    const idsRutasConOtroTitular = rutasConOtroTitular.map(r => r._id);

    const queryHojas = {
        fecha: { $gte: fnInicio, $lte: fnFin },
        estado: { $ne: 'pendiente' }, // Solo hojas confirmadas/cerradas
        $or: [
            { chofer: choferId, ruta: { $nin: idsRutasConOtroTitular } },  // Maneja él mismo y la ruta no es de otro
            { ruta: { $in: idsRutasComoTitular } }                         // Es el titular de la ruta aunque maneje otro
        ]
    };

    const hojas = await HojaReparto.find(queryHojas).populate('ruta vehiculo');
    logger.info(`GOD-TEST Backend -> Query Hojas: ${JSON.stringify(queryHojas)}. Hojas encontradas: ${hojas.length}`);

    if (hojas.length === 0) return { hojasValidas: [], totales: null };

    // Filtro estricto: evitar hojas que ya se liquidaron (excepto si fue rechazada o anulada)
    const idsHojas = hojas.map(h => h._id);
    const liquidacionesViejas = await LiquidacionContratado.find({
        hojasReparto: { $in: idsHojas },
        estado: { $nin: ['rechazado', 'anulado'] }
    });

    logger.info(`GOD-TEST Backend -> Calculando Totales - Hojas Viejas Encontradas: ${liquidacionesViejas.length}. Params: ids: ${idsHojas.length}`);

    const idsLiquidados = new Set();
    liquidacionesViejas.forEach(l => {
        l.hojasReparto.forEach(id => idsLiquidados.add(id.toString()));
    });

    const hojasValidas = hojas.filter(h => !idsLiquidados.has(h._id.toString()));
    logger.info(`GOD-TEST Backend -> Set idsLiquidados tiene ${idsLiquidados.size} elementos. hojasValidas quedaron en ${hojasValidas.length}`);

    const choferData = await Chofer.findById(choferId).populate("usuario");

    let diasTrabajados = 0;
    let kmBaseAcumulados = 0;
    let kmExtraAcumulados = 0;
    let montoTotalViajes = 0;

    let tieneMesFijo = false;
    let montoMesAdicional = 0;

    const hojasConDetalle = hojasValidas.map(hojaObj => {
        const hoja = typeof hojaObj.toObject === 'function' ? hojaObj.toObject() : hojaObj;
        diasTrabajados++;
        let pagoHoja = 0;

        const usaVehiculoSDA = hoja.vehiculo && hoja.vehiculo.tipoPropiedad === 'propio';

        if (usaVehiculoSDA) {
            pagoHoja = choferData.datosContratado?.montoChoferDia || 0;
            montoTotalViajes += pagoHoja;
            hoja.detallePago = `Vehículo SDA: $${pagoHoja}`;
            hoja.subtotal = pagoHoja;
        } else {
            const ruta = hoja.ruta;
            const extra = hoja.datosDrogueria?.kmExtra || 0;
            const kmBase = hoja.kilometrosEstimados || ruta?.kilometrosEstimados || 0;

            kmBaseAcumulados += kmBase;
            kmExtraAcumulados += extra;

            const esEspecial = hoja.numeroHoja && hoja.numeroHoja.includes('SDA-ESPECIAL');
            const tipoPagoEval = esEspecial ? (hoja.tipoPago || 'por_km') : (ruta?.tipoPago || 'por_km');

            if (tipoPagoEval === 'por_km') {
                const precio = esEspecial ? (hoja.precioKm || 0) : (hoja.precioKm || ruta?.precioKm || 0);
                pagoHoja = (kmBase + extra) * precio;
                montoTotalViajes += pagoHoja;
                hoja.detallePago = `Por KM (${kmBase + extra} km): $${pagoHoja}`;
                hoja.subtotal = pagoHoja;
            } else if (tipoPagoEval === 'por_distribucion') {
                pagoHoja = esEspecial ? 0 : (ruta?.montoPorDistribucion || 0);
                montoTotalViajes += pagoHoja;
                hoja.detallePago = `Por Distribución: $${pagoHoja}`;
                hoja.subtotal = pagoHoja;
            } else if (tipoPagoEval === 'por_mes') {
                hoja.detallePago = esEspecial ? 'Mes Fijo (Especial)' : `Mes Fijo ($${ruta?.montoMensual || 0})`;
                hoja.subtotal = 0;
                if (!tieneMesFijo && !esEspecial) {
                    tieneMesFijo = true;
                    montoMesAdicional = ruta?.montoMensual || 0;
                }
            } else if (tipoPagoEval === 'por_vuelta') {
                pagoHoja = (hoja.cantidadVueltas || 0) * (hoja.precioPorVuelta || 0);
                montoTotalViajes += pagoHoja;
                hoja.detallePago = `Por Vuelta (${hoja.cantidadVueltas} vnts): $${pagoHoja}`;
                hoja.subtotal = pagoHoja;
            } else if (tipoPagoEval === 'fijo_viaje') {
                pagoHoja = hoja.montoFijo || 0;
                montoTotalViajes += pagoHoja;
                hoja.detallePago = `Fijo Viaje: $${pagoHoja}`;
                hoja.subtotal = pagoHoja;
            } else {
                hoja.detallePago = `Sin tipoPago`;
                hoja.subtotal = 0;
            }
        }
        return hoja;
    });

    if (tieneMesFijo) {
        montoTotalViajes += montoMesAdicional;
    }

    return {
        hojasValidas: hojasConDetalle,
        montoMesAdicional,
        totales: {
            diasTrabajados,
            kmBaseAcumulados,
            kmExtraAcumulados,
            montoTotalViajes
        },
        choferNombre: choferData.usuario?.nombre
    };
};

const generarReporteSimulado = async (req, res) => {
    try {
        const { choferId, fechaInicio, fechaFin } = req.body;

        if (!choferId || !fechaInicio || !fechaFin) {
            return res.status(400).json({ error: "Faltan parámetros de búsqueda (choferId, fechaInicio, fechaFin)" });
        }

        const resultado = await calcularTotalesLiquidacion(choferId, fechaInicio, fechaFin);
        res.json(resultado);
    } catch (error) {
        logger.error("❌ Error en simulador de liquidaciones:", error);
        res.status(500).json({ error: "Error al generar el reporte de liquidación" });
    }
};

const guardarLiquidacion = async (req, res) => {
    try {
        const { choferId, fechaInicio, fechaFin } = req.body;

        if (!choferId || !fechaInicio || !fechaFin) {
            return res.status(400).json({ error: "Faltan parámetros" });
        }

        // Se vuelve a calcular firmemente en backend por seguridad
        const { hojasValidas, totales } = await calcularTotalesLiquidacion(choferId, fechaInicio, fechaFin);

        if (!hojasValidas || hojasValidas.length === 0) {
            return res.status(400).json({ error: "No hay hojas nuevas para liquidar en ese periodo. Ya se han liquidado." });
        }

        const nuevaLiquidacion = new LiquidacionContratado({
            chofer: choferId,
            periodo: {
                inicio: new Date(fechaInicio),
                fin: new Date(fechaFin)
            },
            hojasReparto: hojasValidas.map(h => h._id),
            totales,
            estado: 'borrador'
        });

        await nuevaLiquidacion.save();
        logger.info(`✅ Liquidación guardada: ${nuevaLiquidacion._id} para Chofer: ${choferId}`);

        res.status(201).json(nuevaLiquidacion);
    } catch (error) {
        logger.error("❌ Error al guardar liquidación:", error);
        res.status(500).json({ error: "Error al guardar la liquidación oficial" });
    }
};

const obtenerLiquidaciones = async (req, res) => {
    try {
        const { choferId } = req.query;
        let filtro = {};
        if (choferId) filtro.chofer = choferId;

        const liquidaciones = await LiquidacionContratado.find(filtro)
            .populate({ path: "chofer", populate: { path: "usuario", select: "nombre dni" } })
            .sort({ "fechas.creacion": -1 });

        res.json(liquidaciones);
    } catch (error) {
        logger.error("❌ Error listando liquidaciones:", error);
        res.status(500).json({ error: "Error al listar las liquidaciones" });
    }
};

const crypto = require("crypto");
const { generatePDF } = require("../../utils/pdfService");
const path = require("path");
const fs = require("fs");
const { enviarNotificacionEstado } = require("../../utils/emailService"); // We can use transporter directly if we need attachments
const nodemailer = require("nodemailer");

// Usa la misma config de transporter que en emailService
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const enviarConformidad = async (req, res) => {
    try {
        const { id } = req.params;
        const liquidacion = await LiquidacionContratado.findById(id)
            .populate({ path: "chofer", populate: { path: "usuario" } })
            .populate({
                path: "hojasReparto",
                populate: [
                    { path: "ruta" },
                    { path: "vehiculo" }
                ]
            });

        if (!liquidacion) return res.status(404).json({ error: "Liquidación no encontrada" });
        if (!liquidacion.chofer?.usuario?.email) {
            return res.status(400).json({ error: "El chofer no tiene un email registrado en su usuario." });
        }

        // Generar token único de 32 bytes en hex
        const token = crypto.randomBytes(32).toString('hex');
        liquidacion.tokenAceptacion = token;
        liquidacion.estado = 'enviado';
        liquidacion.fechas.envio = new Date();

        await liquidacion.save();

        // ─── 1. PREPARAR DATOS PARA EL PDF ───
        const fondoPath = path.join(process.cwd(), "templates", "Copia de HOJADEREPARTO.png"); // Reusamos el fondo de SDA
        let fondoBase64 = "";
        if (fs.existsSync(fondoPath)) {
            fondoBase64 = fs.readFileSync(fondoPath, "base64");
        }

        let totalKmBase = 0;
        let totalKmExtra = 0;
        let tieneMesFijo = false;
        let montoMesAdicional = 0;
        let subtotalViajes = 0;

        const hojasDetalladas = liquidacion.hojasReparto.map(h => {
            const esVehiculoSDA = h.vehiculo && h.vehiculo.propiedadExterna === false;
            let kmBase = 0;
            let extra = 0;
            let montoStr = "-";

            if (esVehiculoSDA) {
                const pagoFijo = liquidacion.chofer.datosContratado?.pagoPorDiaSDA || liquidacion.chofer.datosContratado?.montoChoferDia || 0;
                montoStr = pagoFijo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                subtotalViajes += pagoFijo;
            } else {
                kmBase = h.kilometrosEstimados || h.ruta?.kilometrosEstimados || 0;
                extra = h.datosDrogueria?.kmExtra || 0;
                totalKmBase += kmBase;
                totalKmExtra += extra;

                if (h.ruta?.tipoPago === 'por_km') {
                    const precio = h.precioKm || h.ruta?.precioKm || 0;
                    const pago = (kmBase + extra) * precio;
                    montoStr = pago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                    subtotalViajes += pago;
                } else if (h.ruta?.tipoPago === 'por_distribucion') {
                    const pago = h.ruta?.montoPorDistribucion || 0;
                    montoStr = pago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                    subtotalViajes += pago;
                } else if (h.ruta?.tipoPago === 'por_mes') {
                    montoStr = "-";
                    if (!tieneMesFijo) {
                        tieneMesFijo = true;
                        montoMesAdicional = h.ruta?.montoMensual || liquidacion.chofer.datosContratado?.tarifaMensualAdicional || 0;
                    }
                }
            }

            return {
                fecha: new Date(h.fecha).toLocaleDateString("es-AR"),
                ruta: h.ruta?.codigo || "-",
                descripcion: h.ruta?.descripcion || "-",
                horaSalida: h.ruta?.horaSalida || "-",
                vehiculo: h.vehiculo?.patente || "-",
                kmBase: kmBase > 0 ? kmBase : "-",
                kmExtra: extra > 0 ? extra : "-",
                observaciones: h.cierre?.observaciones || h.observaciones || "-",
                monto: montoStr
            };
        });

        // Asegurarse de que total a pagar no quede dessincronizado de DB
        const totalPagarCalculadoDb = liquidacion.totales?.montoTotalViajes || 0;

        const formateadorFecha = new Intl.DateTimeFormat('es-AR', {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const formateadorMes = new Intl.DateTimeFormat('es-AR', {
            timeZone: 'UTC',
            month: 'long',
            year: 'numeric'
        });
        const txtMesEnvio = formateadorMes.format(new Date(liquidacion.periodo.inicio));
        const periodoMesEnvio = txtMesEnvio.charAt(0).toUpperCase() + txtMesEnvio.slice(1);

        const dataPDF = {
            pdfMargin: { top: '40px', bottom: '40px', left: '50px', right: '50px' },
            imagen_fondo: fondoBase64 ? `data:image/png;base64,${fondoBase64}` : "",
            periodoMes: periodoMesEnvio,
            fechaInicio: formateadorFecha.format(new Date(liquidacion.periodo.inicio)),
            fechaFin: formateadorFecha.format(new Date(liquidacion.periodo.fin)),
            chofer: liquidacion.chofer.usuario.nombre,
            dni: liquidacion.chofer.usuario.dni,
            diasTrabajados: liquidacion.totales?.diasTrabajados || liquidacion.hojasReparto.length,
            totalKmBase: liquidacion.totales?.kmBaseAcumulados || totalKmBase,
            totalKmExtra: liquidacion.totales?.kmExtraAcumulados || totalKmExtra,
            montoTotalViajesFormat: subtotalViajes.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
            montoMesAdicional: tieneMesFijo || montoMesAdicional > 0,
            montoMesAdicionalFormat: montoMesAdicional.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
            montoTotal: totalPagarCalculadoDb.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
            hojas: hojasDetalladas
        };

        const fileName = `Liquidacion_${liquidacion.chofer.usuario.dni}_${Date.now()}.pdf`;
        const outputPath = path.join(process.cwd(), "pdfs", "liquidaciones", fileName);

        // Crear carpeta si no existe
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await generatePDF("liquidacion_contratado.html", dataPDF, outputPath);

        // ─── 2. ENVIAR EMAIL ───
        const linkAceptacion = `${process.env.FRONTEND_URL || 'https://soldelamanecer.ar'}/conformidad/${token}`;

        await transporter.sendMail({
            from: `"Sol del Amanecer SRL" <${process.env.EMAIL_USER}>`,
            to: liquidacion.chofer.usuario.email,
            subject: `Resumen de Liquidación - Sol del Amanecer`,
            html: `
            <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 20px;">
                <h2 style="color: #0891b2;">Resumen de Liquidación de Viajes</h2>
                <p>Hola <strong>${liquidacion.chofer.usuario.nombre}</strong>,</p>
                <p>Adjuntamos el resumen de viajes realizados correspondientes al período del ${dataPDF.fechaInicio} al ${dataPDF.fechaFin}.</p>
                <p>El importe total a liquidar es de: <strong>${dataPDF.montoTotal}</strong></p>
                <p style="margin-top: 15px;">Hacé clic en el siguiente botón para revisar el detalle online, donde vas a poder <strong>Aceptar</strong> la liquidación, o bien <strong>Rechazarla</strong> introduciendo el motivo de la diferencia.</p>
                <br>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${linkAceptacion}" style="background-color: #0284c7; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                        REVISAR LIQUIDACIÓN CERRADA
                    </a>
                </div>
                <p style="font-size: 12px; color: #64748b;">Si no confirmas la recepción en un plazo de 3 días, se considerará conformada automáticamente según los términos y condiciones de Sol del Amanecer.</p>
            </div>
            `,
            attachments: [
                {
                    filename: 'Resumen_Liquidacion.pdf',
                    path: outputPath
                }
            ]
        });

        logger.info(`📧 Liquidación ${id} enviada por mail a ${liquidacion.chofer.usuario.email}`);

        res.json(liquidacion);

    } catch (error) {
        logger.error("❌ Error enviando email de conformidad:", error);
        res.status(500).json({ error: "Error enviando email" });
    }
};

const descargarPDFLiquidacion = async (req, res) => {
    try {
        const { id } = req.params;
        const liquidacion = await LiquidacionContratado.findById(id)
            .populate({ path: "chofer", populate: { path: "usuario" } })
            .populate({
                path: "hojasReparto",
                populate: [
                    { path: "ruta" },
                    { path: "vehiculo" }
                ]
            });

        if (!liquidacion) return res.status(404).json({ error: "Liquidación no encontrada" });

        // ─── 1. PREPARAR DATOS PARA EL PDF ───
        const fondoPath = path.join(process.cwd(), "templates", "Copia de HOJADEREPARTO.png");
        let fondoBase64 = "";
        if (fs.existsSync(fondoPath)) {
            fondoBase64 = fs.readFileSync(fondoPath, "base64");
        }

        let totalKmBase = 0;
        let totalKmExtra = 0;
        let tieneMesFijo = false;
        let montoMesAdicional = 0;
        let subtotalViajes = 0;

        const hojasDetalladas = liquidacion.hojasReparto.map(h => {
            const esVehiculoSDA = h.vehiculo && h.vehiculo.propiedadExterna === false;
            let kmBase = 0;
            let extra = 0;
            let montoStr = "-";

            if (esVehiculoSDA) {
                const pagoFijo = liquidacion.chofer.datosContratado?.pagoPorDiaSDA || liquidacion.chofer.datosContratado?.montoChoferDia || 0;
                montoStr = pagoFijo.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                subtotalViajes += pagoFijo;
            } else {
                kmBase = h.kilometrosEstimados || h.ruta?.kilometrosEstimados || 0;
                extra = h.datosDrogueria?.kmExtra || 0;
                totalKmBase += kmBase;
                totalKmExtra += extra;

                const esEspecial = h.numeroHoja && h.numeroHoja.includes('SDA-ESPECIAL');
                const tipoPagoEval = esEspecial ? (h.tipoPago || 'por_km') : (h.ruta?.tipoPago || 'por_km');

                if (tipoPagoEval === 'por_km') {
                    const precio = esEspecial ? (h.precioKm || 0) : (h.precioKm || h.ruta?.precioKm || 0);
                    const pago = (kmBase + extra) * precio;
                    montoStr = pago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                    subtotalViajes += pago;
                } else if (tipoPagoEval === 'por_distribucion') {
                    const pago = esEspecial ? 0 : (h.ruta?.montoPorDistribucion || 0);
                    montoStr = pago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                    subtotalViajes += pago;
                } else if (tipoPagoEval === 'por_mes') {
                    montoStr = "-";
                    if (!tieneMesFijo && !esEspecial) {
                        tieneMesFijo = true;
                        montoMesAdicional = h.ruta?.montoMensual || liquidacion.chofer.datosContratado?.tarifaMensualAdicional || 0;
                    }
                } else if (tipoPagoEval === 'por_vuelta') {
                    const pago = (h.cantidadVueltas || 0) * (h.precioPorVuelta || 0);
                    montoStr = pago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                    subtotalViajes += pago;
                } else if (tipoPagoEval === 'fijo_viaje') {
                    const pago = h.montoFijo || 0;
                    montoStr = pago.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
                    subtotalViajes += pago;
                }
            }

            return {
                fecha: new Date(h.fecha).toLocaleDateString("es-AR"),
                ruta: h.ruta?.codigo || "-",
                descripcion: h.ruta?.descripcion || "-",
                horaSalida: h.ruta?.horaSalida || "-",
                vehiculo: h.vehiculo?.patente || "-",
                kmBase: kmBase > 0 ? kmBase : "-",
                kmExtra: extra > 0 ? extra : "-",
                observaciones: h.cierre?.observaciones || h.observaciones || "-",
                monto: montoStr
            };
        });

        const totalPagarCalculadoDb = liquidacion.totales?.montoTotalViajes || 0;

        const formateadorFecha = new Intl.DateTimeFormat('es-AR', {
            timeZone: 'UTC',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const formateadorMes = new Intl.DateTimeFormat('es-AR', {
            timeZone: 'UTC',
            month: 'long',
            year: 'numeric'
        });
        const txtMesDesc = formateadorMes.format(new Date(liquidacion.periodo.inicio));
        const periodoMesDesc = txtMesDesc.charAt(0).toUpperCase() + txtMesDesc.slice(1);

        const dataPDF = {
            pdfMargin: { top: '40px', bottom: '40px', left: '50px', right: '50px' },
            imagen_fondo: fondoBase64 ? `data:image/png;base64,${fondoBase64}` : "",
            periodoMes: periodoMesDesc,
            fechaInicio: formateadorFecha.format(new Date(liquidacion.periodo.inicio)),
            fechaFin: formateadorFecha.format(new Date(liquidacion.periodo.fin)),
            chofer: liquidacion.chofer.usuario.nombre,
            dni: liquidacion.chofer.usuario.dni,
            diasTrabajados: liquidacion.totales?.diasTrabajados || liquidacion.hojasReparto.length,
            totalKmBase: liquidacion.totales?.kmBaseAcumulados || totalKmBase,
            totalKmExtra: liquidacion.totales?.kmExtraAcumulados || totalKmExtra,
            montoTotalViajesFormat: subtotalViajes.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
            montoMesAdicional: tieneMesFijo || montoMesAdicional > 0,
            montoMesAdicionalFormat: montoMesAdicional.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
            montoTotal: totalPagarCalculadoDb.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }),
            hojas: hojasDetalladas
        };

        const fileName = `Liquidacion_${liquidacion.chofer.usuario.dni}_${Date.now()}.pdf`;
        const outputPath = path.join(process.cwd(), "pdfs", "liquidaciones", fileName);

        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        await generatePDF("liquidacion_contratado.html", dataPDF, outputPath);

        // Send PDF for download
        res.download(outputPath, fileName, (err) => {
            if (err) {
                logger.error(`Error enviando archivo PDF: ${err.message}`);
            }
            // Opcional: eliminar el archivo pdf temporal después de descargarlo
            // fs.unlinkSync(outputPath);
        });

    } catch (error) {
        logger.error("❌ Error descargando PDF de liquidación:", error);
        res.status(500).json({ error: "Error generando PDF" });
    }
};

const obtenerLiquidacionPublica = async (req, res) => {
    try {
        const { token } = req.params;
        const liquidacion = await LiquidacionContratado.findOne({ tokenAceptacion: token })
            .populate({ path: "chofer", populate: { path: "usuario", select: "nombre" } });

        if (!liquidacion) return res.status(404).json({ error: "Enlace inválido o expirado" });

        res.json({
            choferNombre: liquidacion.chofer?.usuario?.nombre || 'Chofer',
            fechaInicio: liquidacion.periodo.inicio,
            fechaFin: liquidacion.periodo.fin,
            montoTotal: liquidacion.totales.montoTotalViajes,
            estado: liquidacion.estado
        });
    } catch (error) {
        logger.error("❌ Error obteniendo liquidacion publica:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

const aceptarLiquidacion = async (req, res) => {
    try {
        const { token } = req.params;
        const liquidacion = await LiquidacionContratado.findOne({ tokenAceptacion: token });

        if (!liquidacion) return res.status(404).json({ error: "Enlace inválido o expirado" });
        if (liquidacion.estado === 'aceptado_manual' || liquidacion.estado === 'aceptado_automatico') {
            return res.status(400).json({ error: "Esta liquidación ya fue aceptada previamente." });
        }
        if (liquidacion.estado === 'rechazado' || liquidacion.estado === 'anulado') {
            return res.status(400).json({ error: "No es posible aceptar una liquidación anulada o rechazada." });
        }

        liquidacion.estado = 'aceptado_manual';
        liquidacion.fechas.aceptacion = new Date();
        await liquidacion.save();

        res.json({ message: "Conformidad registrada exitosamente", liquidacion });
    } catch (error) {
        logger.error("❌ Error aceptando liquidacion publica:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

const rechazarLiquidacion = async (req, res) => {
    try {
        const { token } = req.params;
        const { motivo } = req.body;

        if (!motivo) return res.status(400).json({ error: "Debe ingresar el motivo del rechazo." });

        const liquidacion = await LiquidacionContratado.findOne({ tokenAceptacion: token });

        if (!liquidacion) return res.status(404).json({ error: "Enlace inválido o expirado" });

        if (liquidacion.estado === 'aceptado_manual' || liquidacion.estado === 'aceptado_automatico') {
            return res.status(400).json({ error: "Ya habías aceptado esta liquidación. Contactá con administración." });
        }

        liquidacion.estado = 'rechazado';
        liquidacion.motivoRechazo = motivo;
        await liquidacion.save();

        logger.info(`🚫 Liquidación ${liquidacion._id} rechazada por chofer. Motivo: ${motivo}`);
        res.json({ message: "Liquidación rechazada, el equipo de administración fue notificado", liquidacion });
    } catch (error) {
        logger.error("❌ Error rechazando liquidacion publica:", error);
        res.status(500).json({ error: "Error interno" });
    }
};

const anularLiquidacion = async (req, res) => {
    try {
        const { id } = req.params;

        const liquidacion = await LiquidacionContratado.findById(id).populate({ path: "chofer", populate: { path: "usuario" } });
        if (!liquidacion) return res.status(404).json({ error: "Liquidación no encontrada" });

        if (liquidacion.estado === 'anulado') {
            return res.status(400).json({ error: "Esta liquidación ya está anulada" });
        }

        liquidacion.estado = 'anulado';
        liquidacion.motivoRechazo = `ANULADA POR ADMINISTRACIÓN: ${req.usuario?.nombre || 'Admin'}`;
        await liquidacion.save();

        logger.info(`⚠️ Liquidación ${liquidacion._id} anulada forzosamente por ${req.usuario?.nombre || 'Admin'}`);

        // Opcional: enviar email de anulación al chofer
        try {
            if (liquidacion.chofer?.usuario?.email) {
                await transporter.sendMail({
                    from: `"Sol del Amanecer SRL" <${process.env.EMAIL_USER}>`,
                    to: liquidacion.chofer.usuario.email,
                    subject: `Aviso Importante: Liquidación Anulada`,
                    html: `
                    <div style="font-family: Arial, sans-serif; color: #1e293b; padding: 20px;">
                        <h2 style="color: #dc2626;">Aviso de Liquidación Anulada</h2>
                        <p>Hola <strong>${liquidacion.chofer.usuario.nombre}</strong>,</p>
                        <p>Te informamos que la liquidación correspondiente al período del ${new Date(liquidacion.periodo.inicio).toLocaleDateString()} al ${new Date(liquidacion.periodo.fin).toLocaleDateString()} <strong>ha sido anulada por el equipo de administración</strong>.</p>
                        <p>En breve recibirás un nuevo detalle corregido de tus viajes.</p>
                        <p style="font-size: 14px; margin-top: 30px; color: #64748b;">Atte. Sol del Amanecer SRL</p>
                    </div>
                    `
                });
            }
        } catch (emailErr) {
            logger.error(`No se pudo enviar email de anulación: ${emailErr.message}`);
        }

        res.json({ message: "Liquidación Anulada exitosamente", liquidacion });
    } catch (error) {
        logger.error("❌ Error anulando liquidacion:", error);
        res.status(500).json({ error: "Error interno al anular" });
    }
};

module.exports = {
    generarReporteSimulado,
    guardarLiquidacion,
    obtenerLiquidaciones,
    enviarConformidad,
    obtenerLiquidacionPublica,
    aceptarLiquidacion,
    rechazarLiquidacion,
    anularLiquidacion,
    descargarPDFLiquidacion
};

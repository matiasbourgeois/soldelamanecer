require('dotenv').config();
const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/soldelamanecer";

async function analizarLiquidacion() {
    try {
        console.log("🔌 Conectando a MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Conectado a MongoDB");

        const Chofer = require('../src/models/Chofer');
        const Ruta = require('../src/models/Ruta');
        const HojaReparto = require('../src/models/HojaReparto');
        require('../src/models/Usuario'); // Fix MissingSchemaError
        const moment = require('moment-timezone');

        // 1. Buscar al contratado "aldeco alejandro"
        // Puede estar en el modelo Chofer (que incluye contratistas)
        // Buscamos ignorando mayúsculas/minúsculas
        let chofer = await Chofer.findOne({
            $or: [
                { nombre: { $regex: 'aldeco alejandro', $options: 'i' } },
                { apellido: { $regex: 'aldeco', $options: 'i' }, nombre: { $regex: 'alejandro', $options: 'i' } }
            ]
        }).populate("usuario");

        if (!chofer) {
            // Busqueda más amplia si no lo encuentra exacto
            const todosChoferes = await Chofer.find().populate("usuario");
            const aldeco = todosChoferes.find(c => {
                const nombreCompleto = `${c.nombre || ''} ${c.apellido || ''} ${c.usuario?.nombre || ''}`;
                return nombreCompleto.toLowerCase().includes('aldeco');
            });

            if (!aldeco) {
                console.log("❌ No se encontró al chofer/contratista Aldeco Alejandro.");
                process.exit(0);
            }
            chofer = aldeco;
        }

        console.log(`\n======================================================`);
        console.log(`👤 CONTRATISTA ENCONTRADO: ${chofer.nombre || (chofer.usuario ? chofer.usuario.nombre : 'Sin nombre')} ${chofer.apellido || ''} (ID: ${chofer._id})`);
        console.log(`======================================================`);

        // 2. Buscar rutas asignadas a este chofer
        const rutasAsignadas = await Ruta.find({
            activa: true,
            $or: [
                { choferAsignado: chofer._id },
                { contratistaTitular: chofer._id } // Por si usa este campo
            ]
        });

        console.log(`\n🗺️ RUTAS ASIGNADAS (${rutasAsignadas.length}):`);
        rutasAsignadas.forEach(r => {
            console.log(`   - Código: ${r.codigo} | Frecuencia: ${r.frecuencia?.textoLegible || 'No definida'} | Vínculo: ${r.choferAsignado?.toString() === chofer._id.toString() ? 'Chofer Asignado' : 'Contratista Titular'}`);
        });

        if (rutasAsignadas.length === 0) {
            console.log("⚠️ No tiene rutas asignadas. No se le generarán hojas automáticamente.");
        }

        // 3. Simular las hojas que DEBERÍA tener en Marzo (Del 1 al 5 de Marzo)
        console.log(`\n📅 SIMULACIÓN DE HOJAS ESPERADAS PARA MARZO (Del 01/03/2026 al 05/03/2026):`);

        let hojasEsperadas = [];

        const fechaInicio = moment.tz("2026-03-01T00:00:00", 'America/Argentina/Buenos_Aires');
        const fechaFin = moment.tz("2026-03-05T23:59:59", 'America/Argentina/Buenos_Aires');

        // Iterar día por día
        for (let m = moment(fechaInicio); m.isSameOrBefore(fechaFin); m.add(1, 'days')) {
            const diaIndex = m.day() === 0 ? 6 : m.day() - 1; // 0=Lun, 6=Dom
            const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            const esFeriadoStr = (m.format('YYYY-MM-DD') === '2026-03-03' || m.format('YYYY-MM-DD') === '2026-03-04') ? '(Feriado Carnaval - NO SE TRABAJÓ)' : ''; // Simulando conocimiento de carnaval si lo hubo

            console.log(`\n   🔹 ${diasNombres[diaIndex]} ${m.format('DD/MM/YYYY')} ${esFeriadoStr}`);

            for (const ruta of rutasAsignadas) {
                let saleDichoDia = false;
                if (ruta.frecuencia?.diasSemana && Array.isArray(ruta.frecuencia.diasSemana)) {
                    saleDichoDia = ruta.frecuencia.diasSemana[diaIndex];
                }

                if (saleDichoDia) {
                    const numeroHojaEsperado = `${ruta.codigo.replace(/^[LRM]-/, '')}-${m.format('YYYYMMDD')}`;
                    console.log(`      + Debería tener la hoja: ${numeroHojaEsperado} (Ruta: ${ruta.codigo})`);
                    hojasEsperadas.push({
                        fecha: m.clone().toDate(),
                        fechaStr: m.format('DD/MM/YYYY'),
                        ruta: ruta.codigo,
                        numeroHojaEsperado
                    });
                }
            }
        }

        console.log(`\n======================================================`);
        console.log(`📦 HOJAS REALES EXISTENTES EN BASE DE DATOS PARA ESTE CHOFER EN MARZO:`);

        // Buscar las hojas reales en el mes de marzo para este chofer
        const hojasReales = await HojaReparto.find({
            chofer: chofer._id,
            fecha: {
                $gte: fechaInicio.toDate(),
                $lte: fechaFin.toDate()
            }
        }).populate('ruta');

        console.log(`   Se encontraron ${hojasReales.length} hojas reales:`);
        hojasReales.forEach(h => {
            console.log(`   - ${moment(h.fecha).tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY')}: ${h.numeroHoja} (Ruta: ${h.ruta?.codigo || 'N/A'}) [Estado: ${h.estado}]`);
        });

        // 5. Comparar y buscar discrepancias
        console.log(`\n🔥 ANÁLISIS DE DISCREPANCIAS (Lo que falta):`);

        let faltantes = 0;

        for (const esperada of hojasEsperadas) {
            const encontrada = hojasReales.find(hr => {
                const fechaHr = moment(hr.fecha).tz('America/Argentina/Buenos_Aires').format('DD/MM/YYYY');
                return fechaHr === esperada.fechaStr && hr.ruta?.codigo === esperada.ruta;
            });

            if (!encontrada) {
                console.log(`   ❌ FATA HOJA: Ruta ${esperada.ruta} para el día ${esperada.fechaStr}. (El cron no la generó o se borró/no se hizo backfill)`);
                faltantes++;
            }
        }

        if (faltantes === 0) {
            console.log(`   ✅ NO FALTAN HOJAS. El contratista tiene todas las hojas que su ruta indica para los días laborables.`);
        } else {
            console.log(`   ⚠️ CONCLUSIÓN: Le faltan ${faltantes} hojas en marzo.`);
            console.log(`   Posibles causas:`);
            console.log(`   1. El servidor estuvo apagado y el backfill no cubrió esos días o rutas específicas.`);
            console.log(`   2. Esas fechas fueron feriados nacionales (el cron silencioso de la madrugada saltea feriados).`);
            console.log(`   3. Alguien anuló/canceló/eliminó esas hojas manualmente.`);
            console.log(`   4. La ruta no estaba asignada a este chofer en ese momento del pasado.`);
        }

    } catch (e) {
        console.error("❌ Error Fatal en script de análisis:", e);
    } finally {
        await mongoose.disconnect();
        console.log("\n🔌 Desconectado de MongoDB.");
        process.exit(0);
    }
}

analizarLiquidacion();

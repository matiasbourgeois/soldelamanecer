/**
 * Script de Testing Completo del Flujo de Frecuencias y Feriados
 * Ejecución: node src/scripts/test-flujo-completo.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../../.env') });

const Ruta = require('../models/Ruta');
const HojaReparto = require('../models/HojaReparto');
const Envio = require('../models/Envio');
const { generarHojasAutomaticas } = require('../controllers/logistica/hojaRepartoController');
const { esFeriado, obtenerFeriados } = require('../services/feriadoService');

const testFlujoCompleto = async () => {
    console.log('🧪 ════════════════════════════════════════════');
    console.log('🧪 INICIANDO TEST COMPLETO DEL SISTEMA');
    console.log('🧪 ════════════════════════════════════════════\n');

    try {
        // Conectar a MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB\n');

        // ═══════════════════════════════════════════════
        // TEST 1: API de Feriados
        // ═══════════════════════════════════════════════
        console.log('1️⃣ TEST: API de Feriados Argentina');
        console.log('   ─────────────────────────────────');

        const hoy = new Date();
        const anio = hoy.getFullYear();
        console.log(`   📅 Consultando feriados de ${anio}...`);

        const feriados = await obtenerFeriados(anio);
        console.log(`   ✅ ${feriados.length} feriados encontrados`);
        console.log(`   📋 Primeros 5: ${feriados.slice(0, 5).join(', ')}`);

        const esFeriadoHoy = await esFeriado(hoy);
        console.log(`   📆 ¿Hoy (${hoy.toISOString().split('T')[0]}) es feriado? ${esFeriadoHoy ? '✅ SÍ' : '❌ NO'}\n`);

        // ═══════════════════════════════════════════════
        // TEST 2: Validación de Frecuencias
        // ═══════════════════════════════════════════════
        console.log('2️⃣ TEST: Validación de Frecuencias');
        console.log('   ─────────────────────────────────');

        const rutas = await Ruta.find({ activa: true }).limit(5);
        console.log(`   🗺️ Rutas activas encontradas: ${rutas.length}`);

        rutas.forEach((ruta, i) => {
            const frecuencia = ruta.frecuencia;
            if (frecuencia && frecuencia.diasSemana) {
                const diasActivos = frecuencia.diasSemana.filter(Boolean).length;
                console.log(`   ${i + 1}. ${ruta.codigo}: ${frecuencia.textoLegible || 'Sin texto'} (${diasActivos} días)`);
            } else {
                console.log(`   ${i + 1}. ${ruta.codigo}: ⚠️ Frecuencia antigua (String)`);
            }
        });
        console.log('');

        // ═══════════════════════════════════════════════
        // TEST 3: Generación de Hojas (Simulación)
        // ═══════════════════════════════════════════════
        console.log('3️⃣ TEST: Generación de Hojas de Reparto');
        console.log('   ─────────────────────────────────');

        console.log(`   🔁 Ejecutando generarHojasAutomaticas()...`);
        const resultados = await generarHojasAutomaticas(hoy, esFeriadoHoy);

        console.log(`   ✅ Creadas: ${resultados.creadas}`);
        console.log(`   ⏭️ Saltadas: ${resultados.saltadas}`);
        console.log(`   ❌ Errores: ${resultados.errores}\n`);

        // ═══════════════════════════════════════════════
        // TEST 4: Filtrado de Envíos por Localidad
        // ═══════════════════════════════════════════════
        console.log('4️⃣ TEST: Filtrado de Envíos por Localidad');
        console.log('   ─────────────────────────────────');

        if (rutas.length > 0) {
            const rutaPrueba = await Ruta.findOne({ activa: true }).populate('localidades');
            if (rutaPrueba && rutaPrueba.localidades && rutaPrueba.localidades.length > 0) {
                const localidadesIds = rutaPrueba.localidades.map(l => l._id);

                const enviosDisponibles = await Envio.find({
                    estado: 'pendiente',
                    hojaReparto: null,
                    localidadDestino: { $in: localidadesIds }
                });

                console.log(`   🗺️ Ruta: ${rutaPrueba.codigo}`);
                console.log(`   📍 Localidades: ${rutaPrueba.localidades.map(l => l.nombre).join(', ')}`);
                console.log(`   📦 Envíos disponibles: ${enviosDisponibles.length}\n`);
            } else {
                console.log(`   ⚠️ No hay rutas con localidades configuradas\n`);
            }
        }

        // ═══════════════════════════════════════════════
        // TEST 5: Hojas Pendientes de Hoy
        // ═══════════════════════════════════════════════
        console.log('5️⃣ TEST: Hojas Pendientes de Hoy');
        console.log('   ─────────────────────────────────');

        const inicioDia = new Date();
        inicioDia.setHours(0, 0, 0, 0);
        const finDia = new Date();
        finDia.setHours(23, 59, 59, 999);

        const hojasPendientes = await HojaReparto.find({
            estado: 'pendiente',
            fecha: { $gte: inicioDia, $lte: finDia }
        }).populate('ruta');

        console.log(`   📋 Hojas pendientes hoy: ${hojasPendientes.length}`);
        hojasPendientes.forEach((hoja, i) => {
            console.log(`   ${i + 1}. Ruta: ${hoja.ruta?.codigo || 'N/A'} - Hora salida: ${hoja.ruta?.horaSalida || 'N/A'}`);
        });

        console.log('\n');
        console.log('🧪 ════════════════════════════════════════════');
        console.log('✅ TEST COMPLETO FINALIZADO EXITOSAMENTE');
        console.log('🧪 ════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ ERROR EN TESTING:', error);
    } finally {
        await mongoose.connection.close();
        console.log('📴 Conexión a MongoDB cerrada');
        process.exit(0);
    }
};

testFlujoCompleto();

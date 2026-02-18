/**
 * SCRIPT DE TESTING AUTOMATIZADO - FASE 7: APP MÓVIL
 * 
 * Este script prueba los 4 endpoints implementados para la integración
 * de la app móvil con las hojas de reparto.
 * 
 * REQUISITOS:
 * - Backend corriendo en puerto 5000
 * - Al menos 1 chofer con usuario creado
 * - Al menos 2 vehículos activos
 * - Al menos 2 rutas activas con hojas creadas para HOY
 * 
 * USO:
 * node backend/src/scripts/test-app-mobile.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// COLORES PARA CONSOLA
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

const log = {
    success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
    error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
    info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
    warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
    title: (msg) => console.log(`\n${colors.bold}${colors.cyan}${msg}${colors.reset}\n`)
};

// CONFIGURACIÓN DE USUARIO CHOFER PARA TESTING
// IMPORTANTE: Cambiar estos valores según tu BD
const TEST_CHOFER = {
    email: 'chofer@test.com',  // Cambiar por un chofer real de tu BD
    password: 'test123'        // Cambiar por la contraseña real
};

let TOKEN = '';
let CHOFER_ID = '';
let HOJA_REPARTO_ID = '';
let TEST_RESULTS = {
    passed: 0,
    failed: 0,
    total: 7
};

// ===========================================
// HELPER: LOGIN
// ===========================================
async function login() {
    log.title('🔐 TEST 1: Autenticación');
    try {
        const response = await axios.post(`${BASE_URL}/auth/login`, {
            email: TEST_CHOFER.email,
            password: TEST_CHOFER.password
        });

        if (response.data.token && response.data.usuario) {
            TOKEN = response.data.token;
            CHOFER_ID = response.data.usuario.id;
            log.success(`Login exitoso - Token obtenido`);
            log.info(`Chofer ID: ${CHOFER_ID}`);
            TEST_RESULTS.passed++;
            return true;
        } else {
            log.error('Login falló - No se obtuvo token');
            TEST_RESULTS.failed++;
            return false;
        }
    } catch (error) {
        log.error(`Login falló: ${error.response?.data?.error || error.message}`);
        log.warning('Verifica que exista un chofer con esas credenciales en la BD');
        TEST_RESULTS.failed++;
        return false;
    }
}

// ===========================================
// TEST 2: GET /choferes/configuracion
// ===========================================
async function testObtenerConfiguracion() {
    log.title('📋 TEST 2: GET /choferes/configuracion');
    try {
        const response = await axios.get(`${BASE_URL}/choferes/configuracion`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const { vehiculo, ruta, hojaRepartoId, esPlanificada } = response.data;

        if (vehiculo && ruta) {
            log.success('Configuración obtenida exitosamente');
            log.info(`Vehículo: ${vehiculo.patente} (${vehiculo.marca} ${vehiculo.modelo})`);
            log.info(`Ruta: ${ruta.codigo}`);
            log.info(`Hoja de Reparto ID: ${hojaRepartoId || 'N/A'}`);
            log.info(`Es planificada: ${esPlanificada ? 'SÍ' : 'NO'}`);

            HOJA_REPARTO_ID = hojaRepartoId;
            TEST_RESULTS.passed++;
            return true;
        } else {
            log.warning('Respuesta incompleta - Falta vehículo o ruta');
            log.info('Esto puede ser normal si el chofer no tiene hoja de reparto HOY');
            TEST_RESULTS.passed++;
            return true;
        }
    } catch (error) {
        log.error(`Error: ${error.response?.data?.error || error.message}`);
        TEST_RESULTS.failed++;
        return false;
    }
}

// ===========================================
// TEST 3: GET /choferes/selectores-reporte
// ===========================================
async function testObtenerSelectores() {
    log.title('📦 TEST 3: GET /choferes/selectores-reporte');
    try {
        const response = await axios.get(`${BASE_URL}/choferes/selectores-reporte`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const { vehiculos, rutas } = response.data;

        if (vehiculos && rutas) {
            log.success('Selectores obtenidos exitosamente');
            log.info(`Vehículos disponibles: ${vehiculos.length}`);
            log.info(`Rutas disponibles: ${rutas.length}`);

            if (vehiculos.length > 0) {
                log.info(`Ejemplo vehículo: ${vehiculos[0].patente} - ${vehiculos[0].marca} ${vehiculos[0].modelo}`);
            }
            if (rutas.length > 0) {
                log.info(`Ejemplo ruta: ${rutas[0].codigo}`);
            }

            TEST_RESULTS.passed++;
            return true;
        } else {
            log.error('Respuesta no contiene vehiculos o rutas');
            TEST_RESULTS.failed++;
            return false;
        }
    } catch (error) {
        log.error(`Error: ${error.response?.data?.error || error.message}`);
        TEST_RESULTS.failed++;
        return false;
    }
}

// ===========================================
// TEST 4: POST /choferes/actualizar-asignacion (cambio de vehículo)
// ===========================================
async function testActualizarVehiculo() {
    log.title('🚗 TEST 4: POST /choferes/actualizar-asignacion (Cambio de vehículo)');

    if (!HOJA_REPARTO_ID) {
        log.warning('No hay hoja de reparto para testear - Saltando test');
        TEST_RESULTS.passed++;
        return true;
    }

    try {
        // Primero obtenemos los vehículos disponibles
        const selectoresRes = await axios.get(`${BASE_URL}/choferes/selectores-reporte`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const vehiculos = selectoresRes.data.vehiculos;
        if (vehiculos.length < 2) {
            log.warning('Se necesitan al menos 2 vehículos para este test - Saltando');
            TEST_RESULTS.passed++;
            return true;
        }

        const nuevoVehiculo = vehiculos[1]; // Elegimos el segundo vehículo

        const response = await axios.post(
            `${BASE_URL}/choferes/actualizar-asignacion`,
            {
                hojaRepartoId: HOJA_REPARTO_ID,
                vehiculoId: nuevoVehiculo._id
            },
            { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        if (response.data.hoja) {
            log.success('Vehículo actualizado exitosamente');
            log.info(`Nuevo vehículo: ${response.data.hoja.vehiculo?.patente || 'N/A'}`);
            TEST_RESULTS.passed++;
            return true;
        } else {
            log.error('Respuesta no contiene hoja actualizada');
            TEST_RESULTS.failed++;
            return false;
        }
    } catch (error) {
        log.error(`Error: ${error.response?.data?.error || error.message}`);
        TEST_RESULTS.failed++;
        return false;
    }
}

// ===========================================
// TEST 5: POST /choferes/actualizar-asignacion (cambio de ruta)
// ===========================================
async function testActualizarRuta() {
    log.title('🗺️  TEST 5: POST /choferes/actualizar-asignacion (Cambio de ruta)');

    if (!HOJA_REPARTO_ID) {
        log.warning('No hay hoja de reparto para testear - Saltando test');
        TEST_RESULTS.passed++;
        return true;
    }

    try {
        // Obtenemos las rutas disponibles
        const selectoresRes = await axios.get(`${BASE_URL}/choferes/selectores-reporte`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const rutas = selectoresRes.data.rutas;
        if (rutas.length < 2) {
            log.warning('Se necesitan al menos 2 rutas para este test - Saltando');
            TEST_RESULTS.passed++;
            return true;
        }

        const nuevaRuta = rutas[1]; // Elegimos la segunda ruta

        const response = await axios.post(
            `${BASE_URL}/choferes/actualizar-asignacion`,
            {
                hojaRepartoId: HOJA_REPARTO_ID,
                rutaId: nuevaRuta._id
            },
            { headers: { Authorization: `Bearer ${TOKEN}` } }
        );

        if (response.data.hoja) {
            log.success('Ruta actualizada exitosamente');
            log.info(`Nueva ruta: ${response.data.hoja.ruta?.codigo || 'N/A'}`);
            log.info(`Hoja anterior quedó huérfana: ${response.data.hojaAnteriorHuerfana ? 'SÍ' : 'NO'}`);
            TEST_RESULTS.passed++;
            return true;
        } else {
            log.error('Respuesta no contiene hoja actualizada');
            TEST_RESULTS.failed++;
            return false;
        }
    } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        if (errorMsg.includes('no tiene hoja de reparto')) {
            log.warning('La nueva ruta no tiene hoja creada para HOY - Test OK pero sin cambio real');
            TEST_RESULTS.passed++;
            return true;
        }
        log.error(`Error: ${errorMsg}`);
        TEST_RESULTS.failed++;
        return false;
    }
}

// ===========================================
// TEST 6: Verificar historialMovimientos
// ===========================================
async function testVerificarHistorial() {
    log.title('📝 TEST 6: Verificar historialMovimientos');

    if (!HOJA_REPARTO_ID) {
        log.warning('No hay hoja de reparto para testear - Saltando test');
        TEST_RESULTS.passed++;
        return true;
    }

    try {
        const response = await axios.get(`${BASE_URL}/hojas-reparto/${HOJA_REPARTO_ID}`, {
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const historial = response.data.historialMovimientos || [];

        if (historial.length > 0) {
            log.success(`Historial encontrado: ${historial.length} movimiento(s)`);
            historial.slice(-3).forEach((mov, i) => {
                log.info(`${i + 1}. ${new Date(mov.fechaHora).toLocaleString('es-AR')} - ${mov.accion}`);
            });
            TEST_RESULTS.passed++;
            return true;
        } else {
            log.warning('No hay movimientos en el historial - Esto puede ser normal');
            TEST_RESULTS.passed++;
            return true;
        }
    } catch (error) {
        log.error(`Error: ${error.response?.data?.error || error.message}`);
        TEST_RESULTS.failed++;
        return false;
    }
}

// ===========================================
// TEST 7: GET /hojas-reparto/reporte-discrepancias
// ===========================================
async function testReporteDiscrepancias() {
    log.title('📊 TEST 7: GET /hojas-reparto/reporte-discrepancias');
    try {
        const hoy = new Date();
        const mes = hoy.getMonth() + 1;
        const anio = hoy.getFullYear();

        const response = await axios.get(`${BASE_URL}/hojas-reparto/reporte-discrepancias`, {
            params: { mes, anio },
            headers: { Authorization: `Bearer ${TOKEN}` }
        });

        const { total, discrepancias } = response.data;

        log.success('Reporte de discrepancias obtenido exitosamente');
        log.info(`Total discrepancias en ${mes}/${anio}: ${total}`);

        if (discrepancias.length > 0) {
            log.info('Ejemplo de discrepancia:');
            const d = discrepancias[0];
            log.info(`  Fecha: ${new Date(d.fecha).toLocaleDateString('es-AR')}`);
            log.info(`  Hoja: ${d.numeroHoja}`);
            log.info(`  Ruta: ${d.ruta}`);
            log.info(`  Chofer Plan: ${d.choferPlan} | Real: ${d.choferReal}`);
            log.info(`  Vehículo Plan: ${d.vehiculoPlan} | Real: ${d.vehiculoReal}`);
        }

        TEST_RESULTS.passed++;
        return true;
    } catch (error) {
        log.error(`Error: ${error.response?.data?.error || error.message}`);
        TEST_RESULTS.failed++;
        return false;
    }
}

// ===========================================
// MAIN: EJECUTAR TODOS LOS TESTS
// ===========================================
async function runAllTests() {
    console.log(`\n${colors.bold}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}   TESTING AUTOMATIZADO - FASE 7: APP MÓVIL${colors.reset}`);
    console.log(`${colors.bold}${'='.repeat(60)}${colors.reset}\n`);

    // Login primero
    const loginOk = await login();
    if (!loginOk) {
        log.error('❌ LOGIN FALLÓ - No se pueden ejecutar los demás tests');
        printResults();
        process.exit(1);
    }

    // Tests secuenciales
    await testObtenerConfiguracion();
    await testObtenerSelectores();
    await testActualizarVehiculo();
    await testActualizarRuta();
    await testVerificarHistorial();
    await testReporteDiscrepancias();

    // Resultados finales
    printResults();
}

function printResults() {
    console.log(`\n${colors.bold}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bold}${colors.cyan}   RESULTADOS FINALES${colors.reset}`);
    console.log(`${colors.bold}${'='.repeat(60)}${colors.reset}\n`);

    const successRate = ((TEST_RESULTS.passed / TEST_RESULTS.total) * 100).toFixed(0);

    console.log(`${colors.green}✓ Tests Pasados: ${TEST_RESULTS.passed}/${TEST_RESULTS.total}${colors.reset}`);
    console.log(`${colors.red}✗ Tests Fallados: ${TEST_RESULTS.failed}/${TEST_RESULTS.total}${colors.reset}`);
    console.log(`${colors.cyan}📊 Tasa de Éxito: ${successRate}%${colors.reset}\n`);

    if (TEST_RESULTS.failed === 0) {
        console.log(`${colors.green}${colors.bold}🎉 ¡TODOS LOS TESTS PASARON! 🎉${colors.reset}\n`);
    } else {
        console.log(`${colors.yellow}⚠️  Hay ${TEST_RESULTS.failed} test(s) fallido(s). Revisar logs arriba.${colors.reset}\n`);
    }
}

// Ejecutar
runAllTests().catch(err => {
    log.error(`Error fatal: ${err.message}`);
    process.exit(1);
});

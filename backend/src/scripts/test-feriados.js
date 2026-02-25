const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { esFeriado, obtenerFeriados } = require('./../services/feriadoService');

async function testFeriados() {
    console.log("=== INICIANDO TEST DE FERIADOS NACIONALES ===");
    console.log("Fecha actual:", new Date().toString());

    // Test 1: Obtener todos los feriados del año actual
    const anioActual = new Date().getFullYear();
    console.log(`\n1. Probando obtenerFeriados(${anioActual})...`);
    const listaFeriados = await obtenerFeriados(anioActual);
    console.log(`Feriados encontrados: ${listaFeriados.length}`);
    if (listaFeriados.length > 0) {
        console.log("Muestra de feriados:", listaFeriados.slice(0, 5));
    } else {
        console.log("⚠️ ATENCIÓN: La API no devolvió feriados.");
    }

    // Test 2: Comprobar un feriado conocido (ej. 1 de Mayo o 25 de Mayo)
    console.log("\n2. Probando fechas específicas con esFeriado()...");

    // Tratamos de buscar un feriado en la lista para testearlo seguro
    if (listaFeriados.length > 0) {
        const fechaFeriadoStr = listaFeriados[0]; // Ej: '2026-01-01'
        // Cuidado con el timezone de JS al crear fechas desde strings YYYY-MM-DD
        const fechaFeriadoObj = new Date(fechaFeriadoStr + 'T12:00:00Z');

        console.log(`Prueba con fecha que DEBERÍA SER feriado (${fechaFeriadoStr}):`);
        const resultFeriado = await esFeriado(fechaFeriadoObj);
        console.log(`Resultado: ${resultFeriado ? '✅ ES FERIADO' : '❌ FALLÓ (dice que NO es)'}`);

        const fechaNormal = new Date('2026-03-14T12:00:00Z'); // Asumiendo que 14 marzo no es feriado
        console.log(`\nPrueba con fecha normal (2026-03-14):`);
        const resultNormal = await esFeriado(fechaNormal);
        console.log(`Resultado: ${!resultNormal ? '✅ NO ES FERIADO' : '❌ FALLÓ (dice que SÍ es)'}`);
    }

    console.log("\n=== TEST FINALIZADO ===");
}

testFeriados();

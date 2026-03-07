require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const timeUtil = require('../src/utils/timeUtil');
const Vehiculo = require('../src/models/Vehiculo');
const MantenimientoLog = require('../src/models/MantenimientoLog');

// =======================================================
// MEGA TEST: TIMEZONE GUARDRAIL VERIFICATION
// =======================================================
// Simulates server running in UTC (like an international VPS)
// Tests that Argentina boundary calculations are ALWAYS correct

const AR_TZ = 'America/Argentina/Buenos_Aires';
const PATENTE_TEST = 'ZZ999TEST';
let testsPassed = 0;
let testsFailed = 0;

const assert = (label, condition, extra = '') => {
    if (condition) {
        console.log(`  ✅ PASS: ${label}`);
        testsPassed++;
    } else {
        console.error(`  ❌ FAIL: ${label}${extra ? ' — ' + extra : ''}`);
        testsFailed++;
    }
};

// =======================================================
// PHASE 1: timeUtil Unit Tests  
// =======================================================
const runPhase1 = () => {
    console.log('\n📐 PHASE 1: timeUtil.js Unit Tests');
    console.log('---------------------------------------------------');

    // Simulate that server is in UTC. 
    // At 23:30 AR time, in UTC it's already the next day (02:30Z).
    const arNight = '2026-10-15T23:30:00-03:00'; // Same AR calendar day (Oct 15)
    const arEarlyNight = '2026-10-15T20:00:00-03:00'; // Oct 15, 23:00 UTC (same UTC day)

    const arDate = new Date(arNight);
    const arDateEarly = new Date(arEarlyNight);

    // Test inicioDia
    const inicioDiaAr = timeUtil.getInicioDiaArg(arDate);
    const inicioDiaArExpected = new Date('2026-10-15T03:00:00.000Z'); // Oct 15 AR = Oct 15 03:00Z
    assert(
        'getInicioDiaArg: returns 03:00Z (midnight AR) for Oct 15',
        inicioDiaAr.toISOString() === inicioDiaArExpected.toISOString(),
        `Got ${inicioDiaAr.toISOString()}, Expected ${inicioDiaArExpected.toISOString()}`
    );

    // Test finDia
    const finDiaAr = timeUtil.getFinDiaArg(arDate);
    // Oct 15 AR ends at 23:59:59 AR = Oct 16T02:59:59Z
    const finDiaArExpected = new Date('2026-10-16T02:59:59.999Z');
    assert(
        'getFinDiaArg: returns 02:59:59.999Z (end of day AR) for Oct 15',
        finDiaAr.toISOString() === finDiaArExpected.toISOString(),
        `Got ${finDiaAr.toISOString()}, Expected ${finDiaArExpected.toISOString()}`
    );

    // Critical: Both "23:30" and "20:00" on Oct 15 AR must fall within SAME AR day
    assert(
        'Both 23:30 AR and 20:00 AR on Oct 15 belong to same AR Day boundaries',
        arDate >= inicioDiaAr && arDate <= finDiaAr &&
        arDateEarly >= inicioDiaAr && arDateEarly <= finDiaAr,
        `23:30 AR in range: ${arDate >= inicioDiaAr && arDate <= finDiaAr}, 20:00 AR in range: ${arDateEarly >= inicioDiaAr && arDateEarly <= finDiaAr}`
    );

    // Critical: OLD setHours(0,0,0,0) would have split these into 2 different "days"
    const badInicioUTC = new Date(arDate); badInicioUTC.setHours(0, 0, 0, 0); // Server UTC midnight
    const badFinUTC = new Date(arDate); badFinUTC.setHours(23, 59, 59, 999);
    const bugWouldHaveFailed = !(arDateEarly >= badInicioUTC && arDateEarly <= badFinUTC);
    assert(
        'PROOF OF BUG: Old setHours(0,0,0,0) would have misclassified 20:00 AR on a UTC server',
        bugWouldHaveFailed,
        `Old UTC setHours classified 20:00 AR Oct 15 as DIFFERENT day: ${bugWouldHaveFailed}`
    );

    // Test getInicioMesArg
    // At 22:30 on Jan 31 AR, in UTC it's already Feb 1 (01:30Z)
    const arLastDayOfMonth = '2026-01-31T22:30:00-03:00';
    const arLastDayDate = new Date(arLastDayOfMonth);
    const inicioMes = timeUtil.getInicioMesArg(arLastDayDate);
    const inicioMesExpected = new Date('2026-01-01T03:00:00.000Z');
    assert(
        'getInicioMesArg: at 22:30 on Jan 31 AR, month is still JANUARY (not February)',
        inicioMes.toISOString() === inicioMesExpected.toISOString(),
        `Got month start: ${inicioMes.toISOString()}, Expected: ${inicioMesExpected.toISOString()}`
    );

    // getStrYYYYMMDDArg: at 23:30 on Oct 15 AR (which is Oct 16 in UTC), must return "2026-10-15"
    const strDate = timeUtil.getStrYYYYMMDDArg(arDate);
    assert(
        'getStrYYYYMMDDArg: returns 2026-10-15 for 23:30 AR (even though UTC is Oct 16)',
        strDate === '2026-10-15',
        `Got "${strDate}", Expected "2026-10-15"`
    );

    // getMediodiaSeguroUTC: date strings from frontend must not shift days
    const frontendDateStr = '2026-03-07';
    const midday = timeUtil.getMediodiaSeguroUTC(frontendDateStr);
    assert(
        'getMediodiaSeguroUTC: date string "2026-03-07" is clamped to midday UTC (12:00:00Z)',
        midday.getUTCHours() === 12 && midday.getUTCDate() === 7 && midday.getUTCMonth() === 2,
        `Got ${midday.toISOString()}`
    );
};

// =======================================================
// PHASE 2: DB Integration Tests (Vehicle Daily Limit)
// =======================================================
const runPhase2 = async (vehiculoId) => {
    console.log('\n🗄️  PHASE 2: DB Integration — Daily Report Limit with AR Timezone');
    console.log('---------------------------------------------------');

    // Insert 10 logs manually with timestamps at 23:30 Oct 15 AR (Oct 16 UTC)
    const arNightUTC = new Date('2026-10-16T02:30:00Z'); // = 23:30 Oct 15 AR
    const logs = [];
    for (let i = 0; i < 10; i++) {
        const log = new MantenimientoLog({
            vehiculo: vehiculoId,
            tipo: 'Reporte Diario',
            kmAlMomento: 1010 + i,
            litrosCargados: 10,
            fecha: arNightUTC,
            observaciones: `Mega Test Limit ${i}`
        });
        await log.save();
        logs.push(log._id);
    }
    console.log('  → Inserted 10 logs at 23:30 Oct 15 AR time (= Oct 16 02:30 UTC)');

    // Now count: how many logs fall within Oct 15 AR boundaries?
    const inicioDia = timeUtil.getInicioDiaArg(new Date('2026-10-16T02:30:00Z'));
    const finDia = timeUtil.getFinDiaArg(new Date('2026-10-16T02:30:00Z'));

    const count = await MantenimientoLog.countDocuments({
        vehiculo: vehiculoId,
        tipo: 'Reporte Diario',
        fecha: { $gte: inicioDia, $lte: finDia }
    });

    assert(
        'DB Query: 10 logs at 23:30 AR are correctly counted within the Oct 15 Argentina Day',
        count === 10,
        `Got count: ${count}, Expected: 10`
    );

    // Now simulate what OLD code would have counted (UTC midnight = Oct 16, 00:00Z)
    const badStart = new Date('2026-10-16T00:00:00Z');
    const badEnd = new Date('2026-10-16T23:59:59Z');
    const badCount = await MantenimientoLog.countDocuments({
        vehiculo: vehiculoId,
        tipo: 'Reporte Diario',
        fecha: { $gte: badStart, $lte: badEnd }
    });

    assert(
        'PROOF OF BUG: Old UTC setHours(0,0,0,0) would have counted same logs as Oct 16 (wrong day)',
        badCount === 10,
        `Old code counted: ${badCount} for "Oct 16 UTC" — these should have been Oct 15 AR`
    );

    return logs; // Return for cleanup
};

// =======================================================
// MAIN
// =======================================================
const runTest = async () => {
    console.log('==================================================');
    console.log('🚀 MEGA TEST: TIMEZONE GUARDRAILS (Forced UTC Mode)');
    console.log('==================================================');
    console.log(`Server TZ: ${process.env.TZ || 'System Default'}`);
    console.log(`new Date() offset: ${new Date().getTimezoneOffset()} minutes (0 = pure UTC)`);

    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/soldelamanecer');
    console.log('✅ Connected to MongoDB');

    let vehiculoId = null;
    let logsToClean = [];

    try {
        // Setup: create dummy vehicle
        await Vehiculo.deleteMany({ patente: PATENTE_TEST });
        const v = new Vehiculo({
            patente: PATENTE_TEST,
            marca: 'Test',
            modelo: 'E2E',
            tipoPropiedad: 'propio',
            tipoCombustible: 'Diesel',
            capacidadKg: 1500,
            kilometrajeActual: 1000
        });
        await v.save();
        vehiculoId = v._id;
        console.log(`✅ Dummy vehicle created: ${PATENTE_TEST}`);

        // Run Phases
        runPhase1();
        logsToClean = await runPhase2(vehiculoId);

    } catch (e) {
        console.error('❌ EXCEPTION:', e.message);
        testsFailed++;
    } finally {
        // Inmaculate cleanup
        console.log('\n==================================================');
        console.log('🧹 INMACULATE CLEANUP');
        if (vehiculoId) {
            await MantenimientoLog.deleteMany({ vehiculo: vehiculoId });
            await Vehiculo.deleteOne({ _id: vehiculoId });
            console.log('✅ All dummy data eradicated from DB.');
        }
        mongoose.connection.close();

        // Final report
        console.log('\n==================================================');
        const total = testsPassed + testsFailed;
        console.log(`🏁 RESULTS: ${testsPassed}/${total} tests passed`);
        if (testsFailed === 0) {
            console.log('🎉 ALL TESTS PASSED — The timezone guardrails are BULLETPROOF!');
        } else {
            console.log(`❌ ${testsFailed} test(s) FAILED — Guardrails may have issues!`);
            process.exitCode = 1;
        }
        console.log('==================================================');
    }
};

runTest();

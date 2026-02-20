const { MongoClient } = require('mongodb');

async function run() {
    const client = new MongoClient('mongodb://localhost:27017');
    try {
        await client.connect();
        const db = client.db('soldelamanecer');
        const liqs = await db.collection('liquidacioncontratados').find().toArray();
        let count = 0;

        for (const liq of liqs) {
            let updated = false;
            let dFin = new Date(liq.periodo.fin);
            if (dFin.getUTCDate() === 1 && dFin.getUTCHours() === 0) {
                // If the end date was caught shifting to day 1 (e.g., Feb 1st 00:00:00Z)
                dFin.setUTCDate(0); // Moves it back to the last day of the previous month
                updated = true;
            }

            let dInicio = new Date(liq.periodo.inicio);
            if (dInicio.getUTCHours() !== 0) {
                // Force to exactly 00:00:00Z
                dInicio.setUTCHours(0, 0, 0, 0);
                updated = true;
            }

            if (updated) {
                await db.collection('liquidacioncontratados').updateOne(
                    { _id: liq._id },
                    { $set: { 'periodo.fin': dFin, 'periodo.inicio': dInicio } }
                );
                console.log('Fixed', liq._id, 'to', dInicio.toISOString(), '-', dFin.toISOString());
                count++;
            }
        }
        console.log(`Se corrigieron ${count} liquidaciones.`);
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}
run();

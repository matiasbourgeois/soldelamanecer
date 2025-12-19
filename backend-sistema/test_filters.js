const axios = require('axios');

async function testFilters() {
    try {
        const url = 'http://localhost:5003/api/hojas-reparto/paginado';

        // 1. Fetch ALL (limit 50)
        console.log("--- Fetching ALL ---");
        const resAll = await axios.get(url, { params: { limite: 50, estado: '' } });
        console.log(`Total: ${resAll.data.total}`);
        resAll.data.hojas.slice(0, 5).forEach(h => console.log(`[${h.fecha}] ${h.numeroHoja}`));

        // 2. Fetch with Date Filter (Range from Screenshot: May 3 to May 9)
        console.log("\n--- Fetching FLTERED (2025-05-03 to 2025-05-09) ---");
        const resFiltered = await axios.get(url, {
            params: {
                limite: 50,
                desde: '2025-05-03T00:00:00.000Z',
                hasta: '2025-05-09T00:00:00.000Z'
            }
        });
        console.log(`Total Filtered: ${resFiltered.data.total}`);
        resFiltered.data.hojas.forEach(h => console.log(`[${h.fecha}] ${h.numeroHoja}`));

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) console.error(error.response.data);
    }
}

testFilters();

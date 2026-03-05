const axios = require('axios');

const run = async () => {
    try {
        const res = await axios.post('http://localhost:5000/api/liquidaciones/simular', {
            choferId: "6799071cae7960d783aa8739",
            fechaInicio: "2026-03-05T00:00:00",
            fechaFin: "2026-03-05T23:59:59"
        });
        console.log("Totales:", res.data.totales);
        console.log("Length hojasValidas:", res.data.hojasValidas.length);
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}
run();

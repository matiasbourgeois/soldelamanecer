const axios = require('axios');
async function run() {
    try {
        const res = await axios.get('http://localhost:5003/api/remitos?pagina=0&limite=1');
        const remito = res.data.resultados[0];
        console.log("ID_ENVIO:", remito.envio._id || remito.envio);
    } catch (e) { console.error(e); }
}
run();

const fs = require("fs");
const path = require("path");
const axios = require("axios");

const archivo = path.join(__dirname, "rutas_cargadas.json");
const URL = "http://localhost:5003/api/rutas";

function esValida(ruta) {
  const hora = String(ruta.horaSalida || "").trim();
  const codigo = String(ruta.codigo || "").trim();
  return codigo && hora && /^\d{1,2}:\d{2}$/.test(hora);
}

async function cargarRutas() {
  try {
    const rutas = JSON.parse(fs.readFileSync(archivo, "utf-8"));

    const rutasValidas = rutas.filter(esValida);

    for (let ruta of rutasValidas) {
      const { zona, localidades, choferAsignado, vehiculoAsignado, ...datosRuta } = ruta;

      try {
        const res = await axios.post(URL, datosRuta);
      } catch (error) {
        console.error(`❌ Error al cargar ${datosRuta.codigo}:`);
        if (error.response) {
          console.error("➡️ Código de estado:", error.response.status);
          console.error("📄 Mensaje:", error.response.data);
        } else {
          console.error("📛 Error sin respuesta:", error.message);
        }
      }
    }

  } catch (error) {
    console.error("❌ Error leyendo el archivo JSON:", error.message);
  }
}

cargarRutas();

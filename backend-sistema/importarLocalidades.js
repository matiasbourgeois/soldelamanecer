const mongoose = require("mongoose");
const axios = require("axios");

// Conexión a tu base cotizadorDB (ajustá si estás en VPS o usás credenciales)
mongoose.connect("mongodb://localhost:27017/cotizadorDB");

const Provincia = require("./models/Provincia"); // Ajustá la ruta si es necesario
const LocalidadGeneral = require("./models/LocalidadGeneral");

// Mapeo de nombres EXACTOS que acepta la API oficial (con tildes y formato correcto)
const mapaNombresAPI = {
  "Buenos Aires": "Buenos Aires",
  "Catamarca": "Catamarca",
  "Chaco": "Chaco",
  "Chubut": "Chubut",
  "Córdoba": "Córdoba",
  "Corrientes": "Corrientes",
  "Entre Ríos": "Entre Ríos",
  "Formosa": "Formosa",
  "Jujuy": "Jujuy",
  "La Pampa": "La Pampa",
  "La Rioja": "La Rioja",
  "Mendoza": "Mendoza",
  "Misiones": "Misiones",
  "Neuquén": "Neuquén",
  "Río Negro": "Río Negro",
  "Salta": "Salta",
  "San Juan": "San Juan",
  "San Luis": "San Luis",
  "Santa Cruz": "Santa Cruz",
  "Santa Fe": "Santa Fe",
  "Santiago del Estero": "Santiago del Estero",
  "Tierra del Fuego, Antártida e Islas del Atlántico Sur": "Tierra del Fuego",
  "Tucumán": "Tucumán",
  "Ciudad Autónoma de Buenos Aires": "Ciudad Autónoma de Buenos Aires"
};

const importarLocalidades = async () => {
  try {
    const provincias = await Provincia.find();
    if (provincias.length === 0) throw new Error("❌ No hay provincias cargadas.");

    for (const provincia of provincias) {
      const nombreAPI = mapaNombresAPI[provincia.nombre];

      if (!nombreAPI) {
        console.warn(`⚠️ Provincia no mapeada para la API: ${provincia.nombre}`);
        continue;
      }

      console.log(`📦 Importando localidades de ${provincia.nombre}...`);

      const response = await axios.get("https://apis.datos.gob.ar/georef/api/localidades", {
        params: {
          provincia: nombreAPI,
          max: 5000 // podés ajustar este valor si querés limitar
        }
      });

      const localidades = response.data.localidades || [];

      const docs = localidades.map((loc) => ({
        nombre: loc.nombre,
        codigoPostal: loc.codigo_postal || "",
        provincia: provincia._id
      }));

      await LocalidadGeneral.insertMany(docs);
      console.log(`✅ Cargadas ${docs.length} localidades de ${provincia.nombre}`);
    }

    console.log("🎉 Todas las localidades fueron importadas correctamente.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error al importar localidades:", err.response?.data || err.message);
    process.exit(1);
  }
};

importarLocalidades();

import React, { useState, useEffect } from "react";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import { apiUsuarios, apiCotizador } from "@core/api/apiSistema";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";



function CotizacionEncomiendas() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destino: "",
    bultos: [{ peso: "", dimensiones: { largo: "", ancho: "", profundidad: "" } }],
  });

  const [localidades, setLocalidades] = useState([]);
  const [selectedLocalidad, setSelectedLocalidad] = useState(null);

  useEffect(() => {
    fetch(apiCotizador("/api/localidades"))
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("❌ Error: La respuesta no es un array", data);
          return;
        }

        // Convertir datos en opciones para react-select, asegurando acceso correcto a las claves
        const opciones = data.map(loc => {
          if (!loc || typeof loc !== "object" || !loc.Localidad) {
            console.error("⚠️ Localidad inválida detectada:", loc);
            return {
              value: "Desconocido",
              label: "Desconocido",
              frecuencia: "No disponible",
              horarios: "No disponible",
              codigoPostal: "No disponible"
            };
          }

          return {
            value: loc.Localidad.trim(),
            label: loc.Localidad.trim(),
            frecuencia: loc.Frecuencia ? loc.Frecuencia.trim() : "No disponible",
            horarios: loc.Horarios ? loc.Horarios.trim() : "No disponible",
            codigoPostal: loc.Codigo_Postal ? loc.Codigo_Postal.trim() : "No disponible"
          };
        });

        setLocalidades(opciones);
      })
      .catch((error) => console.error("❌ Error cargando localidades:", error));
  }, []);


  const handleDestinoChange = (selectedOption) => {
    if (selectedOption) {
      setFormData({ ...formData, destino: selectedOption.value });
      setSelectedLocalidad(selectedOption);
    }
  };

  const agregarBulto = () => {
    setFormData({
      ...formData,
      bultos: [...formData.bultos, { peso: "", dimensiones: { largo: "", ancho: "", profundidad: "" } }],
    });
  };

  const eliminarBulto = (index) => {
    if (formData.bultos.length > 1) {
      const nuevosBultos = formData.bultos.filter((_, i) => i !== index);
      setFormData({ ...formData, bultos: nuevosBultos });
    }
  };

  const handleChange = (e, index) => {
    const { name, value } = e.target;
    const nuevosBultos = [...formData.bultos];

    if (["largo", "ancho", "profundidad"].includes(name)) {
      nuevosBultos[index].dimensiones[name] = value;
    } else {
      nuevosBultos[index][name] = value;
    }
    setFormData({ ...formData, bultos: nuevosBultos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch(apiCotizador("/api/encomiendas"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate("/resultado-encomienda", { state: { cotizacion: data } });
      } else {
        mostrarAlerta(data.error || "Error al enviar la cotización", "danger");
      }
    } catch (error) {
      console.error("❌ Error:", error);
      mostrarAlerta("Error de conexión con el servidor", "danger");
    }
  };

  return (
    <div className="container mt-5">
      <div className="mx-auto" style={{ maxWidth: "700px" }}>
        <div className="p-4 border rounded bg-white shadow" style={{ width: "100%" }}>
          <h2 className="text-center mb-4 text-warning">Cotización de Encomiendas</h2>
          <form onSubmit={handleSubmit}>

            {/* Buscador con react-select */}
            <div className="mb-3">
              <label className="form-label">Localidad Destino:</label>
              <Select
                options={localidades}
                onChange={handleDestinoChange}
                placeholder="Selecciona una localidad..."
                className="text-dark"
                isSearchable
              />
            </div>

            {/* Información de la localidad seleccionada */}
            {selectedLocalidad && (
              <div className="p-3 bg-light border rounded mb-3 text-dark">
                <p><strong>Frecuencia:</strong> {selectedLocalidad.frecuencia}</p>
                <p><strong>Horarios:</strong> {selectedLocalidad.horarios}</p>
                <p><strong>Código Postal:</strong> {selectedLocalidad.codigoPostal || "No disponible"}</p>
              </div>
            )}

            {/* Bultos */}
            {formData.bultos.map((bulto, index) => (
              <div key={index} className="mb-3 p-3 border rounded" style={{ backgroundColor: "#f8f9fa", color: "#212529" }}>
                <h5 className="d-flex justify-content-between" style={{ color: "#212529" }}>
                  Bulto {index + 1}
                  {formData.bultos.length > 1 && (
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => eliminarBulto(index)}>
                      Eliminar
                    </button>
                  )}
                </h5>
                <label className="form-label">Peso (kg):</label>
                <input
                  type="number"
                  name="peso"
                  className="form-control mb-2"
                  onChange={(e) => handleChange(e, index)}
                  required
                  min="1"
                  value={bulto.peso}
                />

                <label className="form-label">Dimensiones (cm):</label>
                <div className="d-flex gap-2">
                  <input
                    type="number"
                    name="largo"
                    placeholder="Largo"
                    className="form-control"
                    onChange={(e) => handleChange(e, index)}
                    required
                    min="1"
                    value={bulto.dimensiones.largo}
                  />
                  <input
                    type="number"
                    name="ancho"
                    placeholder="Ancho"
                    className="form-control"
                    onChange={(e) => handleChange(e, index)}
                    required
                    min="1"
                    value={bulto.dimensiones.ancho}
                  />
                  <input
                    type="number"
                    name="profundidad"
                    placeholder="Profundidad"
                    className="form-control"
                    onChange={(e) => handleChange(e, index)}
                    required
                    min="1"
                    value={bulto.dimensiones.profundidad}
                  />
                </div>
              </div>
            ))}

            <button type="button" className="btn btn-light w-100 mb-3" onClick={agregarBulto}>
              + Agregar otro bulto
            </button>

            <button type="submit" className="btn btn-warning w-100">Cotizar Encomienda</button>
          </form>
        </div>
      </div>
    </div>



  );
}

export default CotizacionEncomiendas;

import React, { useState, useEffect } from "react";
import { apiCotizador } from "../../utils/api";
import { useContext } from "react";
import AuthContext from "../../context/AuthProvider";



function Historial() {
  const [viajes, setViajes] = useState([]);
  const [encomiendas, setEncomiendas] = useState([]);
  const [error, setError] = useState("");
  const [orden, setOrden] = useState({ columna: "fechaHora", ascendente: false });
  const [detallesVisibles, setDetallesVisibles] = useState({}); // 🔹 Estado para manejar los desplegables

  useEffect(() => {
    const { auth } = useContext(AuthContext);
    const token = auth.token;

    fetch(apiCotizador("/api/historial"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setViajes(
            data.viajes.map((viaje) => ({
              ...viaje,
              precio: viaje.precio ? viaje.precio.toFixed(2) : "No disponible",
            }))
          );

          setEncomiendas(
            data.encomiendas.map((encomienda) => ({
              ...encomienda,
              pesoTotal: encomienda.bultos.reduce((acc, bulto) => acc + bulto.peso, 0),
              precioTotal: encomienda.totalCotizacion || "No disponible",
            }))
          );
        }
      })
      .catch((error) => {
        console.error("Error al obtener el historial:", error);
        setError("Error al obtener el historial de cotizaciones.");
      });
  }, []);

  // 🔹 Función para alternar detalles de encomienda
  const toggleDetalles = (id) => {
    setDetallesVisibles((prev) => ({
      ...prev,
      [id]: !prev[id], // Alterna entre mostrar u ocultar
    }));
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4">Historial de Cotizaciones</h2>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <>
          {/* 🔹 TABLA DE ENCOMIENDAS CON DETALLES */}
          <h3 className="text-warning text-center mt-4">Historial de Encomiendas</h3>
          <div className="table-responsive" style={{ maxHeight: "400px", overflowY: "auto" }}>
            <table className="table table-dark table-striped">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Destino</th>
                  <th>Peso</th>
                  <th>Precio</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {encomiendas.map((encomienda) => (
                  <>
                    {/* 🔹 Fila principal de la encomienda */}
                    <tr key={encomienda._id}>
                      <td>{new Date(encomienda.fechaHora).toLocaleDateString("es-ES")} {new Date(encomienda.fechaHora).toLocaleTimeString("es-ES", { hour12: false, hour: "2-digit", minute: "2-digit" })}</td>
                      <td>{encomienda.destino}</td>
                      <td>{encomienda.pesoTotal > 0 ? `${encomienda.pesoTotal} kg` : "No disponible"}</td>
                      <td>{typeof encomienda.precioTotal === "number" ? `$${encomienda.precioTotal.toFixed(2)}` : "$No disponible"}</td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => toggleDetalles(encomienda._id)}
                        >
                          {detallesVisibles[encomienda._id] ? "Ocultar" : "Ver Detalles"}
                        </button>
                      </td>
                    </tr>

                    {/* 🔹 Fila desplegable con los detalles de los bultos */}
                    {detallesVisibles[encomienda._id] && (
                      <tr>
                        <td colSpan="5">
                          <div className="p-3 bg-secondary rounded">
                            <h5 className="text-white">Detalles de los Bultos</h5>
                            <table className="table table-sm table-bordered text-white">
                              <thead>
                                <tr>
                                  <th>Peso</th>
                                  <th>Dimensiones</th>
                                  <th>Tipo</th>
                                  <th>Precio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {encomienda.bultos.map((bulto, index) => (
                                  <tr key={index}>
                                    <td>{bulto.peso} kg</td>
                                    <td>{bulto.dimensiones.largo}x{bulto.dimensiones.ancho}x{bulto.dimensiones.profundidad} cm</td>
                                    <td>{bulto.tipoPaquete}</td>
                                    <td>${bulto.total.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default Historial;

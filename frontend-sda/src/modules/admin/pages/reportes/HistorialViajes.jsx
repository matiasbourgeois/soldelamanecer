import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiCotizador } from "../../../../core/api/apiSistema";
import { useContext } from "react";
import AuthContext from "../../../../core/context/AuthProvider";



function HistorialViajes() {
  const [viajes, setViajes] = useState([]);
  const [error, setError] = useState("");
  const [orden, setOrden] = useState({ columna: "fechaHora", ascendente: false });
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  useEffect(() => {
    const token = auth?.token;

    if (!token) {
      navigate("/login");
      return;
    }

    fetch(apiCotizador("/api/historial-viajes"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          if (data.error === "Token inválido" || data.error.includes("Token")) {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            navigate("/login");
          } else {
            setError(data.error);
          }
        } else {
          setViajes(data);
        }
      })
      .catch((error) => {
        console.error("Error al obtener el historial:", error);
        setError("Error al obtener el historial de cotizaciones.");
      });
  }, [navigate]);

  const ordenarViajes = (columna) => {
    const esAscendente = orden.columna === columna ? !orden.ascendente : true;
    const viajesOrdenados = [...viajes].sort((a, b) => {
      let valorA = a[columna];
      let valorB = b[columna];

      if (columna === "fechaHora") {
        valorA = new Date(a.fechaHora).getTime();
        valorB = new Date(b.fechaHora).getTime();
      }

      return esAscendente ? (valorA > valorB ? 1 : -1) : (valorA < valorB ? 1 : -1);
    });

    setViajes(viajesOrdenados);
    setOrden({ columna, ascendente: esAscendente });
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 text-warning">Historial de Viajes</h2>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="table table-bordered">
            <thead className="table-light text-dark border">
              <tr>
                <th onClick={() => ordenarViajes("fechaHora")} style={{ cursor: "pointer" }}>
                  Fecha y Hora {orden.columna === "fechaHora" ? (orden.ascendente ? "🔼" : "🔽") : ""}
                </th>
                <th onClick={() => ordenarViajes("tipoVehiculo")} style={{ cursor: "pointer" }}>
                  Vehículo {orden.columna === "tipoVehiculo" ? (orden.ascendente ? "🔼" : "🔽") : ""}
                </th>
                <th onClick={() => ordenarViajes("zona")} style={{ cursor: "pointer" }}>
                  Zona {orden.columna === "zona" ? (orden.ascendente ? "🔼" : "🔽") : ""}
                </th>
                <th onClick={() => ordenarViajes("kilometros")} style={{ cursor: "pointer" }}>
                  Kilómetros {orden.columna === "kilometros" ? (orden.ascendente ? "🔼" : "🔽") : ""}
                </th>
                <th onClick={() => ordenarViajes("precio")} style={{ cursor: "pointer" }}>
                  Precio {orden.columna === "precio" ? (orden.ascendente ? "🔼" : "🔽") : ""}
                </th>
              </tr>
            </thead>
            <tbody>
              {viajes.map((viaje, index) => (
                <tr key={index}>
                  <td>
                    {viaje.fechaHora && !isNaN(new Date(viaje.fechaHora).getTime())
                      ? new Date(viaje.fechaHora).toLocaleDateString("es-ES") +
                      " " +
                      new Date(viaje.fechaHora).toLocaleTimeString("es-ES", {
                        hour12: false,
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                      : "Fecha no disponible"}
                  </td>
                  <td>{viaje.tipoVehiculo}</td>
                  <td>{viaje.zona}</td>
                  <td>{viaje.kilometros && viaje.kilometros > 0 ? `${viaje.kilometros} km` : "s/ km"}</td>
                  <td className="fw-bold text-dark">${viaje.precio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistorialViajes;

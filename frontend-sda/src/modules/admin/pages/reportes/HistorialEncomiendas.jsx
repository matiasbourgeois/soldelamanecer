import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiCotizador } from "../../../utils/api";
import AuthContext from "../../../context/AuthProvider";

function HistorialEncomiendas() {
  const [encomiendas, setEncomiendas] = useState([]);
  const [error, setError] = useState("");
  const [detallesVisibles, setDetallesVisibles] = useState({});
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext); // ✅ AHORA ESTÁ ARRIBA, fuera del useEffect

  useEffect(() => {
    const token = auth?.token;

    if (!token) {
      navigate("/login");
      return;
    }

    fetch(apiCotizador("/api/historial-encomiendas"), {
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
          setEncomiendas(data);
        }
      })
      .catch((error) => {
        console.error("Error al obtener el historial:", error);
        setError("Error al obtener el historial de cotizaciones.");
      });
  }, [navigate, auth]);

  const toggleDetalles = (index) => {
    setDetallesVisibles((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="container mt-5">
      <h2 className="text-center mb-4 text-warning">Historial de Encomiendas</h2>

      {error ? (
        <div className="alert alert-danger">{error}</div>
      ) : (
        <div className="table-responsive" style={{ maxHeight: "500px", overflowY: "auto" }}>
          <table className="table table-bordered">
            <thead className="table-light text-dark border">
              <tr>
                <th>Fecha y Hora</th>
                <th>Destino</th>
                <th>Peso Total</th>
                <th>Precio Total</th>
                <th>Detalles</th>
              </tr>
            </thead>
            <tbody>
              {encomiendas.map((encomienda, index) => {
                const pesoTotal = encomienda.bultos
                  ? encomienda.bultos.reduce((acc, bulto) => acc + (bulto.peso || 0), 0)
                  : 0;
                const totalConIVA = encomienda.total || "No disponible";
                return (
                  <React.Fragment key={index}>
                    <tr>
                      <td>
                        {encomienda.fecha && encomienda.hora
                          ? `${encomienda.fecha} ${encomienda.hora}`
                          : "Fecha no disponible"}
                      </td>
                      <td>{encomienda.destino}</td>
                      <td>{pesoTotal > 0 ? `${pesoTotal} kg` : "No disponible"}</td>
                      <td className="fw-bold text-dark">{totalConIVA}</td>
                      <td>
                        <button className="btn btn-sm btn-warning" onClick={() => toggleDetalles(index)}>
                          {detallesVisibles[index] ? "Ocultar" : "Ver"} Detalles
                        </button>
                      </td>
                    </tr>
                    {detallesVisibles[index] && (
                      <tr>
                        <td colSpan="5">
                          <div className="p-3 bg-light border rounded">
                            <h5 className="text-center text-warning mb-3">Detalles de los Bultos</h5>
                            <table className="table table-bordered table-sm">
                              <thead className="table-light text-dark">
                                <tr>
                                  <th>#</th>
                                  <th>Peso</th>
                                  <th>Dimensiones</th>
                                  <th>Tipo</th>
                                  <th>Precio</th>
                                </tr>
                              </thead>
                              <tbody>
                                {encomienda.bultos.map((bulto, i) => (
                                  <tr key={i}>
                                    <td>{i + 1}</td>
                                    <td>{bulto.peso ? `${bulto.peso} kg` : "No disponible"}</td>
                                    <td>
                                      {bulto.dimensiones
                                        ? `${bulto.dimensiones.largo} x ${bulto.dimensiones.ancho} x ${bulto.dimensiones.profundidad} cm`
                                        : "No disponible"}
                                    </td>
                                    <td>{bulto.tipoPaquete || "No disponible"}</td>
                                    <td>{bulto.total ? `$${bulto.total.toFixed(2)}` : "No disponible"}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default HistorialEncomiendas;

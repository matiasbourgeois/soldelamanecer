import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Pencil, GripVertical } from "lucide-react";
import { FormControl, InputGroup } from "react-bootstrap";
import { apiSistema } from "../../utils/api";
import "../../styles/tablasSistema.css";
import { mostrarAlerta } from "../../utils/alertaGlobal";
import { confirmarAccion } from "../../utils/confirmarAccion";

const TablaVehiculos = ({
  vehiculos,
  onEditar,
  recargar,
  paginaActual,
  setPaginaActual,
  totalVehiculos,
  setBusqueda
}) => {

  const [filtro, setFiltro] = useState("");
  const [vehiculosFiltrados, setVehiculosFiltrados] = useState([]);

  useEffect(() => {
    const texto = filtro.toLowerCase();
    const filtrados = vehiculos.filter((v) => {
      return (
        v.patente.toLowerCase().includes(texto) ||
        v.marca.toLowerCase().includes(texto) ||
        v.modelo.toLowerCase().includes(texto)
      );
    });
    setVehiculosFiltrados(filtrados);
  }, [filtro, vehiculos]);

  const toggleActivo = async (vehiculo) => {
    const confirmado = await confirmarAccion(
      vehiculo.activo ? "¿Desactivar vehículo?" : "¿Reactivar vehículo?",
      vehiculo.activo
        ? "Este vehículo ya no podrá asignarse hasta reactivarlo."
        : "El vehículo estará nuevamente disponible para asignaciones.",
      "warning"
    );
  
    if (!confirmado) return;

    try {
      const res = await fetch(apiSistema(`/api/vehiculos/${vehiculo._id}/estado`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !vehiculo.activo }),
      });

      if (res.ok) {
        recargar();
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "Error al cambiar estado del vehículo", "danger");
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      mostrarAlerta("Error de conexión", "danger");
    }
  };

  const limite = 10;
  const paginasPorGrupo = 5;
  const totalPaginas = Math.ceil(totalVehiculos / limite);
  const totalGrupos = Math.ceil(totalPaginas / paginasPorGrupo);
  const grupoActual = Math.floor(paginaActual / paginasPorGrupo);
  const start = grupoActual * paginasPorGrupo;
  const end = Math.min(start + paginasPorGrupo, totalPaginas);

  const mostrarCantidad = () => {
    const desde = paginaActual * limite + 1;
    const hasta = Math.min((paginaActual + 1) * limite, totalVehiculos);
    return `Mostrando ${desde} a ${hasta} de ${totalVehiculos} vehículos`;
  };


  return (
    <>
      <InputGroup className="mb-3">
        <FormControl
          className="input-sistema"
          placeholder="Buscar vehículo por patente, marca o modelo..."
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(0);
          }}
        />
      </InputGroup>


      <div className="table-responsive">
        <table className="table align-middle text-center shadow-sm rounded tabla-montserrat">
          <thead className="encabezado-moderno">
            <tr>
              <th></th>
              <th>Patente</th>
              <th>Marca</th>
              <th>Modelo</th>
              <th>Capacidad (kg)</th>
              <th>Estado</th>
              <th>Tipo</th>
              <th>Activo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {vehiculosFiltrados.length > 0 ? (
              vehiculosFiltrados.map((v) => (
                <tr key={v._id} className="tabla-moderna-fila">
                  <td>
                    <GripVertical size={20} className="text-muted" />
                  </td>
                  <td>{v.patente}</td>
                  <td>{v.marca}</td>
                  <td>{v.modelo}</td>
                  <td>{v.capacidadKg}</td>
                  <td>{v.estado}</td>
                  <td>{v.tipoPropiedad}</td>
                  <td>
                    <span className={v.activo ? "estado-activo" : "estado-inactivo"}>
                      {v.activo ? "Sí" : "No"}
                    </span>
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn-icono btn-editar"
                        title="Editar"
                        onClick={() => onEditar(v)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className={`btn-icono ${v.activo ? "btn-desactivar" : "btn-activar"
                          }`}
                        title={v.activo ? "Desactivar" : "Reactivar"}
                        onClick={() => toggleActivo(v)}
                      >
                        {v.activo ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-muted py-4">
                  No se encontraron vehículos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {totalPaginas > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap">
            <div className="text-muted small">{mostrarCantidad()}</div>

            <div className="d-flex gap-1 flex-wrap">
              {grupoActual > 0 && (
                <button className="paginacion-btn" onClick={() => setPaginaActual(start - paginasPorGrupo)}>
                  ◀◀
                </button>
              )}

              {paginaActual > 0 && (
                <button className="paginacion-btn" onClick={() => setPaginaActual(paginaActual - 1)}>
                  ◀
                </button>
              )}

              {Array.from({ length: end - start }).map((_, i) => {
                const pageIndex = start + i;
                return (
                  <button
                    key={pageIndex}
                    className={`paginacion-btn ${paginaActual === pageIndex ? "activo" : ""}`}
                    onClick={() => setPaginaActual(pageIndex)}
                  >
                    {pageIndex + 1}
                  </button>
                );
              })}

              {paginaActual < totalPaginas - 1 && (
                <button className="paginacion-btn" onClick={() => setPaginaActual(paginaActual + 1)}>
                  ▶
                </button>
              )}

              {grupoActual < totalGrupos - 1 && (
                <button className="paginacion-btn" onClick={() => setPaginaActual(end)}>
                  ▶▶
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </>
  );
};

export default TablaVehiculos;

import React, { useState } from "react";
import ModalLocalidadesRuta from "./ModalLocalidadesRuta";
import { Pencil, Trash2 } from "lucide-react";
import "../../styles/paginacion.css";


const TablaRutas = ({
  rutas = [],
  onEditar,
  onEliminar,
  recargar,
  paginaActual = 0,
  totalRutas = 0,
  setPaginaActual
}) => {

  const [mostrarModal, setMostrarModal] = useState(false);
  const [localidadesModal, setLocalidadesModal] = useState([]);

  const abrirModalLocalidades = (localidades) => {
    setLocalidadesModal(localidades);
    setMostrarModal(true);
  };

  return (
    <>
      <div className="table-responsive">
        <table className="table align-middle text-center shadow-sm rounded tabla-montserrat">
          <thead className="encabezado-moderno">
            <tr>
              <th></th>
              <th>Código</th>
              <th>Hora de Salida</th>
              <th>Frecuencia</th>
              <th>Descripción</th>
              <th>Chofer</th>
              <th>Vehículo</th>
              <th>Localidades</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(rutas) && rutas.length > 0 ? (
              rutas.map((r) => (
                <tr key={r._id} className="tabla-moderna-fila">
                  <td className="text-muted" style={{ fontSize: "1.2rem" }}>⋮⋮</td>
                  <td>{r.codigo}</td>
                  <td>{r.horaSalida}</td>
                  <td>{r.frecuencia}</td>
                  <td>{r.descripcion}</td>
                  <td>
                    {r.choferAsignado?.usuario?.nombre
                      ? `${r.choferAsignado.usuario.nombre} ${r.choferAsignado.usuario.apellido || ""}`.trim()
                      : "Sin asignar"}
                  </td>
                  <td>{r.vehiculoAsignado?.patente || "Sin asignar"}</td>
                  <td>
                  {r.localidades?.length > 1 ? (
                      <button
                        className="btn-pill-texto"
                        onClick={() => abrirModalLocalidades(r.localidades)}
                      >
                        Ver Localidades
                      </button>
                    ) : (
                      r.localidades?.map((l) => l.nombre).join(", ")
                    )}
                  </td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn-icono btn-editar"
                        title="Editar"
                        onClick={() => onEditar(r)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="btn-icono btn-eliminar"
                        title="Eliminar"
                        onClick={() => onEliminar(r._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="text-muted py-4">
                  No hay rutas registradas.
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>

      <ModalLocalidadesRuta
        mostrar={mostrarModal}
        onClose={() => setMostrarModal(false)}
        localidades={localidadesModal}
      />
      {totalRutas > 10 && (
        <div className="paginacion-container mt-3">
          <span className="paginacion-info">
            Mostrando {rutas.length} de {totalRutas} rutas
          </span>

          <div className="paginacion-botones">
            {(() => {
              const totalPaginas = Math.ceil(totalRutas / 10);
              const visiblePages = 5;
              const totalGrupos = Math.ceil(totalPaginas / visiblePages);
              const grupoActual = Math.floor(paginaActual / visiblePages);
              const start = grupoActual * visiblePages;
              const end = Math.min(start + visiblePages, totalPaginas);

              return (
                <>
                  {grupoActual > 0 && (
                    <button
                      className="paginacion-btn"
                      onClick={() => setPaginaActual(start - visiblePages)}
                    >
                      ◀◀
                    </button>
                  )}

                  {paginaActual > 0 && (
                    <button
                      className="paginacion-btn"
                      onClick={() => setPaginaActual(paginaActual - 1)}
                    >
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
                    <button
                      className="paginacion-btn"
                      onClick={() => setPaginaActual(paginaActual + 1)}
                    >
                      ▶
                    </button>
                  )}

                  {grupoActual < totalGrupos - 1 && (
                    <button
                      className="paginacion-btn"
                      onClick={() => setPaginaActual(end)}
                    >
                      ▶▶
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

    </>
  );
};

export default TablaRutas;

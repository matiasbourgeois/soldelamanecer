import React, { useState, useEffect } from "react";
import { Pencil, GripVertical, Trash2 } from "lucide-react";

// ✅ Importar estilos globales
import "../../styles/tablasSistema.css";
import "../../styles/botonesSistema.css";
import "../../styles/formularioSistema.css";
import "../../styles/paginacion.css";


const TablaChoferes = ({
  choferes,
  onEditar,
  onEliminar,
  paginaActual,
  totalChoferes,
  setPaginaActual
}) => {
  const limite = 10;
  const paginasPorGrupo = 5;
  const totalPaginas = Math.ceil(totalChoferes / limite);
  const totalGrupos = Math.ceil(totalPaginas / paginasPorGrupo);
  const grupoActual = Math.floor(paginaActual / paginasPorGrupo);
  const start = grupoActual * paginasPorGrupo;
  const end = Math.min(start + paginasPorGrupo, totalPaginas);

  const mostrarCantidad = () => {
    const desde = paginaActual * limite + 1;
    const hasta = Math.min((paginaActual + 1) * limite, totalChoferes);
    return `Mostrando ${desde} a ${hasta} de ${totalChoferes} choferes`;
  };

  return (
    <>

      <div className="table-responsive">
        <table className="table align-middle text-center shadow-sm rounded tabla-montserrat">
          <thead className="encabezado-moderno">
            <tr>
              <th></th>
              <th>Nombre</th>
              <th>DNI</th>
              <th>Teléfono</th>
              <th>Tipo de contratación</th>
              <th>Email</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(choferes) && choferes.length > 0 ? (
              choferes.map((chofer) => (
                <tr key={chofer._id} className="tabla-moderna-fila">
                  <td><GripVertical size={20} className="text-muted" /></td>
                  <td>{chofer.usuario?.nombre || "N/A"}</td>
                  <td>{chofer.usuario?.dni || "-"}</td>
                  <td>{chofer.usuario?.telefono || "-"}</td>
                  <td>
                    {chofer.tipoVinculo === "contratado"
                      ? "Contratado"
                      : "Relación de dependencia"}
                  </td>
                  <td>{chofer.usuario?.email || "N/A"}</td>
                  <td>
                    <div className="d-flex justify-content-center gap-2">
                      <button
                        className="btn-icono btn-editar"
                        title="Editar"
                        onClick={() => onEditar(chofer)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="btn-icono btn-eliminar"
                        title="Eliminar"
                        onClick={() => onEliminar(chofer._id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-muted py-4">
                  No se encontraron choferes.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>
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


    </>
  );
};

export default TablaChoferes;

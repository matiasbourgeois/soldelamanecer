import React, { useEffect, useState } from "react";
import TablaLocalidades from "./TablaLocalidades";
import FormularioLocalidad from "./FormularioLocalidad";
import axios from "axios";
import { apiSistema } from "../../utils/api";
import { InputGroup, FormControl } from "react-bootstrap";
import { mostrarAlerta } from "../../utils/alertaGlobal";
import { confirmarAccion } from "../../utils/confirmarAccion";



// ✅ Estilos globales
import "../../styles/botonesSistema.css";
import "../../styles/formularioSistema.css";
import "../../styles/titulosSistema.css";


const LocalidadesAdmin = () => {
  const [localidades, setLocalidades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [limite] = useState(10);
  const [totalLocalidades, setTotalLocalidades] = useState(0);
  const [filtro, setFiltro] = useState("");


  const obtenerLocalidades = async () => {
    try {
      const query = new URLSearchParams();
      query.append("pagina", paginaActual);
      query.append("limite", limite);
      if (filtro) query.append("busqueda", filtro);

      const { data } = await axios.get(apiSistema(`/api/localidades/paginadas?${query.toString()}`));
      setLocalidades(data.resultados);
      setTotalLocalidades(data.total);
    } catch (error) {
      console.error("❌ Error al obtener localidades:", error);
    }
  };


  const guardarLocalidad = async (localidad) => {
    try {
      if (localidad._id) {
        await axios.put(apiSistema(`/api/localidades/${localidad._id}`), localidad);
      } else {
        await axios.post(apiSistema("/api/localidades"), localidad);
      }
      obtenerLocalidades();
      cerrarFormulario();
    } catch (error) {
      console.error("❌ Error al guardar localidad:", error);
      mostrarAlerta(error?.response?.data?.msg || "Error al guardar", "danger");
    }
  };

  const eliminarLocalidad = async (id) => {
    const confirmado = await confirmarAccion(
      "¿Eliminar localidad?",
      "Esta acción no se puede deshacer"
    );
    if (!confirmado) return;    
    try {
      await axios.delete(apiSistema(`/api/localidades/${id}`));
      obtenerLocalidades();
    } catch (error) {
      console.error("❌ Error al eliminar localidad:", error);
      mostrarAlerta("Error al eliminar la localidad", "danger");
    }
  };

  const cambiarEstado = async (id) => {
    try {
      await axios.patch(apiSistema(`/api/localidades/estado/${id}`));
      obtenerLocalidades();
    } catch (error) {
      console.error("❌ Error al cambiar estado:", error);
    }
  };

  const editarLocalidad = (localidad) => {
    setLocalidadSeleccionada(localidad);
    setShowForm(true);
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setLocalidadSeleccionada(null);
  };

  useEffect(() => {
    obtenerLocalidades();
  }, [paginaActual, filtro]);


  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="titulo-seccion">Gestión de Localidades</h2>
        <button className="btn-sda-principal" onClick={() => setShowForm(true)}>
          Agregar nueva localidad
        </button>
      </div>

      <InputGroup className="mb-3">
        <FormControl
          className="input-sistema"
          placeholder="Buscar localidad por nombre..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        />
      </InputGroup>

      <TablaLocalidades
        localidades={localidades}
        onEdit={editarLocalidad}
        onDelete={eliminarLocalidad}
        onToggleEstado={cambiarEstado}
      />

      {totalLocalidades > limite && (
        <div className="paginacion-container mt-3">
          <span className="paginacion-info">
            Mostrando {localidades.length} de {totalLocalidades} localidades
          </span>

          <div className="paginacion-botones">
            {(() => {
              const totalPaginas = Math.ceil(totalLocalidades / limite);
              const visiblePages = 5;
              const totalGrupos = Math.ceil(totalPaginas / visiblePages);
              const grupoActual = Math.floor(paginaActual / visiblePages);
              const start = grupoActual * visiblePages;
              const end = Math.min(start + visiblePages, totalPaginas);

              return (
                <>
                  {grupoActual > 0 && (
                    <button className="paginacion-btn" onClick={() => setPaginaActual(start - visiblePages)}>
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
                </>
              );
            })()}
          </div>
        </div>
      )}


      <FormularioLocalidad
        show={showForm}
        handleClose={cerrarFormulario}
        guardar={guardarLocalidad}
        localidad={localidadSeleccionada}
      />
    </div>
  );
};

export default LocalidadesAdmin;

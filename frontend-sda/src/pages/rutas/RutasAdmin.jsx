import React, { useEffect, useState } from "react";
import TablaRutas from "./TablaRutas";
import FormularioRuta from "./FormularioRuta";
import { apiSistema } from "../../utils/api";
import { FormControl, InputGroup } from "react-bootstrap";
import { Link } from "react-router-dom";
import { mostrarAlerta } from "../../utils/alertaGlobal";
import { confirmarAccion } from "../../utils/confirmarAccion";



// ✅ Importar estilos globales
import "../../styles/botonesSistema.css";
import "../../styles/tablasSistema.css";
import "../../styles/formularioSistema.css";
import "../../styles/titulosSistema.css";

const RutasAdmin = () => {
  const [rutas, setRutas] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [rutaEditando, setRutaEditando] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [totalRutas, setTotalRutas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(0);



  const fetchRutas = async (pagina = 0, busqueda = "") => {
    try {
      const res = await fetch(apiSistema(`/api/rutas?pagina=${pagina}&busqueda=${busqueda}`));
      const data = await res.json();
      setRutas(data.rutas);
      setTotalRutas(data.total);
      setPaginaActual(pagina);
    } catch (error) {
      console.error("Error al obtener rutas:", error);
    }
  };



  const fetchLocalidades = async () => {
    try {
      const res = await fetch(apiSistema("/api/localidades"));
      const data = await res.json();
      setLocalidades(data);
    } catch (error) {
      console.error("Error al obtener localidades:", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRutas(paginaActual, filtro);
    }, 300); // espera 300ms luego de dejar de escribir

    return () => clearTimeout(timeout); // limpia si el usuario sigue escribiendo
  }, [paginaActual, filtro]);



  const abrirModal = (ruta = null) => {
    setRutaEditando(ruta);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setRutaEditando(null);
    setMostrarModal(false);
  };

  const eliminarRuta = async (id) => {
    const confirmado = await confirmarAccion(
      "¿Eliminar ruta?",
      "Esta acción no se puede deshacer"
    );
    if (!confirmado) return;

    try {
      const res = await fetch(apiSistema(`/api/rutas/${id}`), {
        method: "DELETE",
      });

      if (res.ok) {
        mostrarAlerta("Ruta eliminada correctamente.", "success");
        fetchRutas();
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "Error al eliminar la ruta", "danger");
      }
    } catch (error) {
      console.error("Error al eliminar ruta:", error);
      mostrarAlerta("Error de conexión", "danger");
    }
  };


  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="titulo-seccion">Gestión de Rutas</h2>

        <div className="d-flex">
          <button className="btn-sda-principal me-2" onClick={() => abrirModal()}>
            Agregar nueva ruta
          </button>

          <Link
            to="/admin/localidades"
            className="btn-sda-secundario"
          >
            Gestionar Localidades
          </Link>

        </div>
      </div>

      <InputGroup className="mb-3">
        <FormControl
          className="input-sistema"
          placeholder="Buscar por código de ruta..."
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPaginaActual(0); // Esto solo reinicia la paginación, luego el useEffect se encarga
          }}
        />

      </InputGroup>

      <TablaRutas
        rutas={rutas}
        onEditar={abrirModal}
        onEliminar={eliminarRuta}
        recargar={fetchRutas}
        paginaActual={paginaActual}
        totalRutas={totalRutas}
        setPaginaActual={setPaginaActual}
      />


      {mostrarModal && (
        <FormularioRuta
          onClose={cerrarModal}
          ruta={rutaEditando}
          localidades={localidades}
          recargar={fetchRutas}
        />
      )}
    </div>
  );
};

export default RutasAdmin;

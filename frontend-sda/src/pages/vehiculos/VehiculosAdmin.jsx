import React, { useEffect, useState } from "react";
import TablaVehiculos from "./TablaVehiculos";
import FormularioVehiculo from "./FormularioVehiculo";
import { apiSistema } from "../../utils/api";
import "../../styles/botonesSistema.css";
import "../../styles/tablasSistema.css";
import "../../styles/formularioSistema.css";
import "../../styles/titulosSistema.css";

const VehiculosAdmin = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [vehiculoEditando, setVehiculoEditando] = useState(null);
  const [paginaActual, setPaginaActual] = useState(0);
  const [limite] = useState(10);
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [busqueda, setBusqueda] = useState("");


  const fetchVehiculos = async () => {
    try {
      const res = await fetch(
        apiSistema(`/api/vehiculos/paginado?pagina=${paginaActual}&limite=${limite}&busqueda=${busqueda}`)
      );
      const data = await res.json();
      setVehiculos(data.resultados);
      setTotalVehiculos(data.total);
    } catch (error) {
      console.error("Error al obtener vehículos:", error);
    }
  };


  useEffect(() => {
    fetchVehiculos();
  }, [paginaActual, busqueda]);

  const abrirModal = (vehiculo = null) => {
    setVehiculoEditando(vehiculo);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setVehiculoEditando(null);
    setMostrarModal(false);
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="titulo-seccion">Gestión de Vehículos</h2>
        <button className="btn-sistema btn-sda-principal" onClick={() => abrirModal()}>
          Agregar nuevo vehículo
        </button>
      </div>

      <TablaVehiculos
        vehiculos={vehiculos}
        onEditar={abrirModal}
        recargar={fetchVehiculos}
        paginaActual={paginaActual}
        setPaginaActual={setPaginaActual}
        totalVehiculos={totalVehiculos}
        setBusqueda={setBusqueda}
      />

      {mostrarModal && (
        <FormularioVehiculo
          onClose={cerrarModal}
          vehiculo={vehiculoEditando}
          recargar={fetchVehiculos}
        />
      )}
    </div>
  );
};

export default VehiculosAdmin;

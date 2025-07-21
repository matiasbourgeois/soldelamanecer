import React, { useEffect, useState } from "react";
import axios from "axios";
import TablaChoferes from "../../components/choferes/TablaChoferes";
import FormularioChofer from "../../components/choferes/FormularioChofer";
import { useContext } from "react";
import { FormControl } from "react-bootstrap";
import AuthContext from "../../context/AuthProvider";
import { apiSistema, apiUsuariosApi } from "../../utils/api";
import { confirmarAccion } from "../../utils/confirmarAccion";
import "../../styles/botonesSistema.css";
import "../../styles/tablasSistema.css";
import "../../styles/formularioSistema.css";
import "../../styles/titulosSistema.css";




const ChoferesAdmin = () => {
  const { auth } = useContext(AuthContext);
  const [choferes, setChoferes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [formulario, setFormulario] = useState({
    dni: "",
    telefono: "",
    tipoVinculo: "contratado",
  });
  const [paginaActual, setPaginaActual] = useState(0);
  const [totalChoferes, setTotalChoferes] = useState(0);
  // más adelante vamos a usar esto para búsqueda:
  const [filtro, setFiltro] = useState("");


  const [modoEdicion, setModoEdicion] = useState(false);
  const [choferEditando, setChoferEditando] = useState(null);

  useEffect(() => {
    fetchChoferes(paginaActual, filtro);
  }, [paginaActual, filtro]);

  const fetchChoferes = async (pagina = 0, busqueda = "") => {
    try {
      const res = await fetch(
        apiSistema(`/api/choferes?pagina=${pagina}&busqueda=${busqueda}`)
      );
      const data = await res.json();

      setChoferes(data.resultados);
      setTotalChoferes(data.total);
      setPaginaActual(pagina);
    } catch (error) {
      console.error("Error al obtener choferes:", error);
    }
  };


  const fetchUsuarios = async () => {
    try {
      const token = auth?.token;
      const { data } = await axios.get(apiUsuariosApi("/"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const filtrados = data.filter(
        (u) => u.rol === "cliente"
      );

      setUsuarios(filtrados);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  const handleAbrirModal = () => {
    fetchUsuarios();
    setMostrarModal(true);
  };

  const handleBuscarUsuario = (e) => {
    setBusqueda(e.target.value);
  };

  const handleSeleccionUsuario = (id) => {
    const usuario = usuarios.find((u) => u._id === id);
    setUsuarioSeleccionado(usuario);
  };

  const handleChangeFormulario = (e) => {
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  const handleChangeUsuario = (e) => {
    const { name, value } = e.target;
    setUsuarioSeleccionado((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditarChofer = async (chofer) => {
    try {
      const token = auth?.token;

      // 1. Traer datos completos del usuario desde backend usuarios (puerto 5002)
      const { data } = await axios.get(apiUsuariosApi(`/${chofer.usuario._id}`), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // 2. Setear los datos del usuario (actualizados) y del chofer
      setUsuarioSeleccionado(data.usuario); // 👈 ya viene completo
      setFormulario({
        dni: chofer.dni,
        telefono: chofer.telefono,
        tipoVinculo: chofer.tipoVinculo,
      });

      // 3. Marcar edición y abrir modal
      setModoEdicion(true);
      setChoferEditando(chofer);
      setMostrarModal(true);

    } catch (error) {
      console.error("❌ Error al obtener usuario para edición:", error);
    }
  };


  const handleCrearChofer = async () => {
    if (!usuarioSeleccionado) return;

    try {
      const token = auth?.token;

      // 1. Actualizar los datos del usuario en el backend de usuarios
      await axios.put(apiUsuariosApi(`/${usuarioSeleccionado._id}`), {
        nombre: usuarioSeleccionado.nombre,
        dni: usuarioSeleccionado.dni,
        telefono: usuarioSeleccionado.telefono,
        direccion: usuarioSeleccionado.direccion,
        localidad: usuarioSeleccionado.localidad,
        provincia: usuarioSeleccionado.provincia,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // 2. Crear el chofer en el backend del sistema
      await axios.post(apiSistema("/api/choferes"), {
        usuario: usuarioSeleccionado._id,
        dni: usuarioSeleccionado.dni,
        telefono: usuarioSeleccionado.telefono,
        tipoVinculo: formulario.tipoVinculo,
      });


      // Reiniciar el estado y actualizar la lista
      setMostrarModal(false);
      setUsuarioSeleccionado(null);
      setFormulario({ dni: "", telefono: "", tipoVinculo: "contratado" });
      setBusqueda("");
      fetchChoferes();
    } catch (error) {
      console.error("Error al crear chofer:", error);
    }
  };

  const handleActualizarChofer = async () => {
    if (!usuarioSeleccionado || !choferEditando) return;

    try {
      const token = auth?.token;

      // 1. Actualizar usuario en backend usuarios
      await axios.put(apiUsuariosApi(`/${usuarioSeleccionado._id}`), {
        nombre: usuarioSeleccionado.nombre,
        dni: usuarioSeleccionado.dni,
        telefono: usuarioSeleccionado.telefono,
        direccion: usuarioSeleccionado.direccion,
        localidad: usuarioSeleccionado.localidad,
        provincia: usuarioSeleccionado.provincia,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });

      // 2. Actualizar chofer en backend sistema
      await axios.put(apiSistema(`/api/choferes/${choferEditando._id}`), {
        dni: formulario.dni,
        telefono: formulario.telefono,
        tipoVinculo: formulario.tipoVinculo,
      });

      // 3. Resetear estado
      setMostrarModal(false);
      setUsuarioSeleccionado(null);
      setFormulario({ dni: "", telefono: "", tipoVinculo: "contratado" });
      setModoEdicion(false);
      setChoferEditando(null);
      fetchChoferes();
    } catch (error) {
      console.error("Error al actualizar chofer:", error);
    }
  };


  const handleEliminarChofer = async (id) => {
    const confirmar = await confirmarAccion("¿Eliminar chofer?", "Esta acción no se puede deshacer");
    if (!confirmar) return;
    try {
      await axios.delete(apiSistema(`/api/choferes/${id}`));
      fetchChoferes();
    } catch (error) {
      console.error("Error al eliminar chofer:", error);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="titulo-seccion">Gestión de Choferes</h2>
        <button className="btn-sda-principal me-2" onClick={handleAbrirModal}>
          Agregar nuevo chofer
        </button>
      </div>

      <FormControl
        className="input-sistema mb-3"
        placeholder="Buscar por nombre, DNI o teléfono..."
        value={filtro}
        onChange={(e) => {
          setFiltro(e.target.value);
          setPaginaActual(0);
        }}
      />
      <TablaChoferes
        choferes={choferes}
        onEditar={handleEditarChofer}
        onEliminar={handleEliminarChofer}
        paginaActual={paginaActual}
        totalChoferes={totalChoferes}
        setPaginaActual={setPaginaActual}
      />

      <FormularioChofer
        mostrar={mostrarModal}
        onHide={() => {
          setMostrarModal(false);
          setUsuarioSeleccionado(null);
          setFormulario({ dni: "", telefono: "", tipoVinculo: "contratado" });
        }}

        busqueda={busqueda}
        handleBuscarUsuario={handleBuscarUsuario}
        modoEdicion={modoEdicion}
        handleActualizarChofer={handleActualizarChofer}
        usuariosFiltrados={usuariosFiltrados}
        usuarioSeleccionado={usuarioSeleccionado}
        handleSeleccionUsuario={handleSeleccionUsuario}
        formulario={formulario}
        handleChangeFormulario={handleChangeFormulario}
        handleCrearChofer={handleCrearChofer}
        handleChangeUsuario={handleChangeUsuario}
      />
    </div>
  );
};

export default ChoferesAdmin;

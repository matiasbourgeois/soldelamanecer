import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import TablaChoferes from "../../components/choferes/TablaChoferes";
import FormularioChofer from "../../components/choferes/FormularioChofer";
import AuthContext from "../../context/AuthProvider";
import { apiSistema, apiUsuariosApi } from "../../utils/api";
import { confirmarAccion } from "../../utils/confirmarAccion.jsx";
import { Container, Paper, Title, Group, Button, TextInput } from "@mantine/core";
import { Plus, Search } from "lucide-react";
import { mostrarAlerta } from "../../utils/alertaGlobal.jsx";

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
  const [paginaActual, setPaginaActual] = useState(1); // Mantine starts at 1
  const [totalChoferes, setTotalChoferes] = useState(0);
  const [filtro, setFiltro] = useState("");

  const [modoEdicion, setModoEdicion] = useState(false);
  const [choferEditando, setChoferEditando] = useState(null);

  useEffect(() => {
    fetchChoferes(paginaActual, filtro);
  }, [paginaActual, filtro]);

  const fetchChoferes = async (pagina = 1, busqueda = "") => {
    try {
      const res = await fetch(
        apiSistema(`/api/choferes?pagina=${pagina - 1}&busqueda=${busqueda}`)
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
      // CRITICAL: Logic preserved - filtering users with role "cliente"
      const filtrados = data.filter(
        (u) => u.rol === "cliente"
      );

      console.log("Usuarios filtered:", filtrados);
      setUsuarios(filtrados);
    } catch (error) {
      console.error("Error al obtener usuarios:", error);
    }
  };

  const handleAbrirModal = () => {
    console.log("Opening modal...");
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
    // If it's a direct value (from Mantine Select) or event
    const name = e.target ? e.target.name : e.name; // Logic adaptation might be needed depending on form component
    // Keep it generic for now, we will adapt in FormularioChofer
    setFormulario({ ...formulario, [e.target.name]: e.target.value });
  };

  // Custom handler for Mantine inputs in form
  const handleFormularioChange = (name, value) => {
    setFormulario(prev => ({ ...prev, [name]: value }));
  }

  const handleChangeUsuario = (e) => {
    const { name, value } = e.target;
    setUsuarioSeleccionado((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  // Custom handler for Mantine inputs in user edit (TextInput passes event)
  const handleUsuarioChange = (e) => {
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
      mostrarAlerta("Error al cargar datos del usuario", "danger");
    }
  };


  const handleCrearChofer = async () => {
    if (!usuarioSeleccionado) {
      mostrarAlerta("Debe seleccionar un usuario.", "warning");
      return;
    }

    // Validations
    if (!usuarioSeleccionado.nombre || !usuarioSeleccionado.dni || !usuarioSeleccionado.telefono || !formulario.tipoVinculo) {
      mostrarAlerta("Por favor, complete todos los campos obligatorios (Nombre, DNI, Teléfono, Tipo de Contratación).", "warning");
      return;
    }

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
      mostrarAlerta("Chofer creado correctamente", "success");
      setMostrarModal(false);
      setUsuarioSeleccionado(null);
      setFormulario({ dni: "", telefono: "", tipoVinculo: "contratado" });
      setBusqueda("");
      fetchChoferes(paginaActual, filtro);
    } catch (error) {
      console.error("Error al crear chofer:", error);
      mostrarAlerta("Error al crear chofer", "danger");
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
      mostrarAlerta("Chofer actualizado correctamente", "success");
      setMostrarModal(false);
      setUsuarioSeleccionado(null);
      setFormulario({ dni: "", telefono: "", tipoVinculo: "contratado" });
      setModoEdicion(false);
      setChoferEditando(null);
      fetchChoferes(paginaActual, filtro);
    } catch (error) {
      console.error("Error al actualizar chofer:", error);
      mostrarAlerta("Error al actualizar chofer", "danger");
    }
  };


  const handleEliminarChofer = async (id) => {
    const confirmar = await confirmarAccion("¿Eliminar chofer?", "Esta acción no se puede deshacer");
    if (!confirmar) return;
    try {
      await axios.delete(apiSistema(`/api/choferes/${id}`));
      mostrarAlerta("Chofer eliminado", "success");
      fetchChoferes(paginaActual, filtro);
    } catch (error) {
      console.error("Error al eliminar chofer:", error);
      mostrarAlerta("Error al eliminar chofer", "danger");
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  return (
    <Container size="xl" py="md">
      <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} fw={700} c="dimmed">
            Gestión de Choferes
          </Title>
          <Button
            leftSection={<Plus size={18} />}
            color="cyan"
            variant="filled"
            onClick={handleAbrirModal}
          >
            Nuevo Chofer
          </Button>
        </Group>

        <TextInput
          placeholder="Buscar por nombre, DNI o teléfono..."
          leftSection={<Search size={16} />}
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPaginaActual(1);
          }}
          mb="md"
          radius="md"
          w={{ base: "100%", sm: 350 }}
        />

        <TablaChoferes
          choferes={choferes}
          onEditar={handleEditarChofer}
          onEliminar={handleEliminarChofer}
          paginaActual={paginaActual}
          totalChoferes={totalChoferes}
          setPaginaActual={setPaginaActual}
        />
      </Paper>

      <FormularioChofer
        mostrar={mostrarModal}
        onHide={() => {
          setMostrarModal(false);
          setUsuarioSeleccionado(null);
          setFormulario({ dni: "", telefono: "", tipoVinculo: "contratado" });
          setModoEdicion(false);
          setChoferEditando(null);
        }}

        busqueda={busqueda}
        handleBuscarUsuario={handleBuscarUsuario}
        modoEdicion={modoEdicion}
        handleActualizarChofer={handleActualizarChofer}
        usuariosFiltrados={usuariosFiltrados}
        usuarioSeleccionado={usuarioSeleccionado}
        handleSeleccionUsuario={handleSeleccionUsuario}
        formulario={formulario}
        handleFormularioChange={handleFormularioChange}
        handleCrearChofer={handleCrearChofer}
        handleUsuarioChange={handleUsuarioChange}
      />
    </Container>
  );
};

export default ChoferesAdmin;

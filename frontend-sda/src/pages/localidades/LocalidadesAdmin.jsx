import React, { useEffect, useState } from "react";
import TablaLocalidades from "./TablaLocalidades";
import FormularioLocalidad from "./FormularioLocalidad";
import axios from "axios";
import { apiSistema } from "../../utils/api";
import { Container, Paper, Title, Group, Button, TextInput, Transition } from "@mantine/core";
import { Plus, Search, MapPin } from "lucide-react";
import { mostrarAlerta } from "../../utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../utils/confirmarAccion.jsx";

const LocalidadesAdmin = () => {
  const [localidades, setLocalidades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [localidadSeleccionada, setLocalidadSeleccionada] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1); // Mantine uses 1-based
  const [limite] = useState(10);
  const [totalLocalidades, setTotalLocalidades] = useState(0);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(false);


  const obtenerLocalidades = async (pagina = 1, busqueda = "") => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      // Backend expects 0-indexed page
      query.append("pagina", pagina - 1);
      query.append("limite", limite);
      if (busqueda) query.append("busqueda", busqueda);

      const { data } = await axios.get(apiSistema(`/api/localidades/paginadas?${query.toString()}`));
      setLocalidades(data.resultados);
      setTotalLocalidades(data.total);
    } catch (error) {
      console.error("❌ Error al obtener localidades:", error);
    } finally {
      setLoading(false);
    }
  };


  const guardarLocalidad = async (localidad) => {
    try {
      if (localidad._id) {
        await axios.put(apiSistema(`/api/localidades/${localidad._id}`), localidad);
      } else {
        await axios.post(apiSistema("/api/localidades"), localidad);
      }
      mostrarAlerta(localidad._id ? "✅ Localidad actualizada" : "✅ Localidad creada", "success");
      obtenerLocalidades(paginaActual, filtro);
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
      mostrarAlerta("✅ Localidad eliminada", "success");
      obtenerLocalidades(paginaActual, filtro);
    } catch (error) {
      console.error("❌ Error al eliminar localidad:", error);
      mostrarAlerta("Error al eliminar la localidad", "danger");
    }
  };

  const cambiarEstado = async (id) => {
    try {
      await axios.patch(apiSistema(`/api/localidades/estado/${id}`));
      // Optimistic or refresh? Refresh is safer.
      obtenerLocalidades(paginaActual, filtro);
    } catch (error) {
      console.error("❌ Error al cambiar estado:", error);
      mostrarAlerta("Error al cambiar estado", "danger");
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
    const timeout = setTimeout(() => {
      obtenerLocalidades(paginaActual, filtro);
    }, 300);
    return () => clearTimeout(timeout);
  }, [paginaActual, filtro]);


  return (
    <Container size="xl" py="md">
      <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} fw={700} c="dimmed">
            Gestión de Localidades
          </Title>
          <Button
            leftSection={<Plus size={18} />}
            color="cyan"
            variant="filled"
            onClick={() => setShowForm(true)}
          >
            Nueva Localidad
          </Button>
        </Group>

        <TextInput
          placeholder="Buscar localidad por nombre..."
          leftSection={<Search size={16} />}
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPaginaActual(1);
          }}
          mb="md"
          radius="md"
          w={{ base: "100%", sm: 300 }}
        />

        <TablaLocalidades
          localidades={localidades}
          onEdit={editarLocalidad}
          onDelete={eliminarLocalidad}
          onToggleEstado={cambiarEstado}
          loading={loading}
          paginaActual={paginaActual}
          setPaginaActual={setPaginaActual}
          totalLocalidades={totalLocalidades}
          limite={limite}
        />
      </Paper>

      <FormularioLocalidad
        show={showForm}
        handleClose={cerrarFormulario}
        guardar={guardarLocalidad}
        localidad={localidadSeleccionada}
      />
    </Container>
  );
};

export default LocalidadesAdmin;

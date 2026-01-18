import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TablaRutas from "./TablaRutas";
import FormularioRuta from "./FormularioRuta";
import { apiSistema } from "../../../../core/api/apiSistema";
import { Container, Paper, Title, Group, Button, TextInput, Transition } from "@mantine/core";
import { Plus, Map, Search } from "lucide-react";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../../../core/utils/confirmarAccion.jsx";

const RutasAdmin = () => {
  const navigate = useNavigate();
  const [rutas, setRutas] = useState([]);
  const [localidades, setLocalidades] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [rutaEditando, setRutaEditando] = useState(null);
  const [filtro, setFiltro] = useState("");
  const [totalRutas, setTotalRutas] = useState(0);
  const [paginaActual, setPaginaActual] = useState(1); // Mantine uses 1-based index
  const [loading, setLoading] = useState(false);

  const limite = 10;

  const fetchRutas = async (pagina = 1, busqueda = "") => {
    setLoading(true);
    try {
      // Backend usually expects 0-based index if not changed, let's adjust if needed.
      // Based on previous code: fetchRutas(paginaActual, filtro) where paginaActual was 0 initial.
      const pageIndex = pagina - 1;
      const res = await fetch(apiSistema(`/rutas?pagina=${pageIndex}&busqueda=${busqueda}`));
      const data = await res.json();
      if (res.ok) {
        setRutas(data.rutas);
        setTotalRutas(data.total);
        setPaginaActual(pagina);
      } else {
        console.error("Error fetching rutas:", data.error);
      }
    } catch (error) {
      console.error("Error al obtener rutas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalidades = async () => {
    try {
      const res = await fetch(apiSistema("/localidades"));
      const data = await res.json();
      setLocalidades(data);
    } catch (error) {
      console.error("Error al obtener localidades:", error);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRutas(paginaActual, filtro);
    }, 300);
    return () => clearTimeout(timeout);
  }, [paginaActual, filtro]);

  useEffect(() => {
    fetchLocalidades();
  }, []); // Load once

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
      const res = await fetch(apiSistema(`/rutas/${id}`), {
        method: "DELETE",
      });

      if (res.ok) {
        mostrarAlerta("✅ Ruta eliminada correctamente.", "success");
        fetchRutas(paginaActual, filtro);
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "❌ Error al eliminar la ruta", "danger");
      }
    } catch (error) {
      console.error("Error al eliminar ruta:", error);
      mostrarAlerta("❌ Error de conexión", "danger");
    }
  };

  return (
    <Container size="xl" py="md">
      <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} fw={700} c="dimmed">
            Gestión de Rutas
          </Title>
          <Group>
            <Button
              leftSection={<Map size={18} />}
              variant="default"
              onClick={() => navigate('/admin/localidades')}
            >
              Gestionar Localidades
            </Button>
            <Button
              leftSection={<Plus size={18} />}
              color="cyan"
              variant="filled"
              onClick={() => abrirModal()}
            >
              Nueva Ruta
            </Button>
          </Group>
        </Group>

        <TextInput
          placeholder="Buscar por código de ruta..."
          leftSection={<Search size={16} />}
          value={filtro}
          onChange={(e) => {
            setFiltro(e.target.value);
            setPaginaActual(1); // Reset to first page on search
          }}
          mb="md"
          radius="md"
          w={{ base: "100%", sm: 300 }}
        />

        <TablaRutas
          rutas={rutas}
          onEditar={abrirModal}
          onEliminar={eliminarRuta}
          paginaActual={paginaActual}
          totalRutas={totalRutas}
          setPaginaActual={setPaginaActual}
          loading={loading}
          recargar={() => fetchRutas(paginaActual, filtro)}
        />
      </Paper>

      {mostrarModal && (
        <FormularioRuta
          onClose={cerrarModal}
          ruta={rutaEditando}
          localidades={localidades}
          recargar={() => fetchRutas(paginaActual, filtro)}
        />
      )}
    </Container>
  );
};

export default RutasAdmin;

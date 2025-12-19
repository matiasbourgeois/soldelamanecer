import React, { useEffect, useState } from "react";
import TablaVehiculos from "./TablaVehiculos";
import FormularioVehiculo from "./FormularioVehiculo";
import { apiSistema } from "../../utils/api";
import { Container, Paper, Title, Group, Button, TextInput, Stack, Text } from "@mantine/core";
import { Plus, Search } from "lucide-react";

const VehiculosAdmin = () => {
  const [vehiculos, setVehiculos] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [vehiculoEditando, setVehiculoEditando] = useState(null);
  const [paginaActual, setPaginaActual] = useState(1); // Mantine 1-based
  const [limite] = useState(10);
  const [totalVehiculos, setTotalVehiculos] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchVehiculos = async (pagina = paginaActual, search = busqueda) => {
    setLoading(true);
    try {
      const res = await fetch(
        apiSistema(`/api/vehiculos/paginado?pagina=${pagina - 1}&limite=${limite}&busqueda=${search}`)
      );
      const data = await res.json();
      if (res.ok) {
        setVehiculos(data.resultados);
        setTotalVehiculos(data.total);
        setPaginaActual(pagina);
      } else {
        console.error("Error fetching vehicles:", data);
      }
    } catch (error) {
      console.error("Error al obtener vehículos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchVehiculos(paginaActual, busqueda);
    }, 300);
    return () => clearTimeout(timeout);
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
    <Container size="xl" py="xl">
      <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
        {/* Header Section */}
        <Group justify="space-between" mb="md">
          <Title order={2} fw={700} c="dimmed">
            Gestión de Vehículos
          </Title>
          <Button
            leftSection={<Plus size={18} />}
            color="cyan"
            variant="filled"
            onClick={() => abrirModal()}
          >
            Nuevo Vehículo
          </Button>
        </Group>

        {/* Search Bar */}
        <TextInput
          placeholder="Buscar por patente, marca o modelo..."
          leftSection={<Search size={16} />}
          value={busqueda}
          onChange={(e) => {
            setBusqueda(e.target.value);
            setPaginaActual(1);
          }}
          mb="md"
          radius="md"
          w={{ base: "100%", sm: 300 }}
        />

        {/* Content Table */}
        <TablaVehiculos
          vehiculos={vehiculos}
          onEditar={abrirModal}
          recargar={() => fetchVehiculos(paginaActual, busqueda)}
          paginaActual={paginaActual}
          setPaginaActual={setPaginaActual}
          totalVehiculos={totalVehiculos}
          limite={limite}
          loading={loading}
        />
      </Paper>

      {mostrarModal && (
        <FormularioVehiculo
          onClose={cerrarModal}
          vehiculo={vehiculoEditando}
          recargar={() => fetchVehiculos(paginaActual, busqueda)}
        />
      )}
    </Container>
  );
};

export default VehiculosAdmin;

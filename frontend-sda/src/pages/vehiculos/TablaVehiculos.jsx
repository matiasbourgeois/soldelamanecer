import React from "react";
import { Eye, EyeOff, Pencil, Trash2, Truck } from "lucide-react";
import { apiSistema } from "../../utils/api";
import { mostrarAlerta } from "../../utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../utils/confirmarAccion.jsx";
import {
  Table,
  ScrollArea,
  ActionIcon,
  Group,
  Text,
  Badge,
  Pagination,
  Loader,
  Center,
  Tooltip,
  ThemeIcon
} from "@mantine/core";

const TablaVehiculos = ({
  vehiculos = [],
  onEditar,
  recargar,
  paginaActual,
  setPaginaActual,
  totalVehiculos,
  limite = 10,
  loading = false
}) => {

  const toggleActivo = async (vehiculo) => {
    const confirmado = await confirmarAccion(
      vehiculo.activo ? "¿Desactivar vehículo?" : "¿Reactivar vehículo?",
      vehiculo.activo
        ? "Este vehículo ya no podrá asignarse hasta reactivarlo."
        : "El vehículo estará nuevamente disponible para asignaciones.",
      "warning"
    );

    if (!confirmado) return;

    try {
      const res = await fetch(apiSistema(`/api/vehiculos/${vehiculo._id}/estado`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !vehiculo.activo }),
      });

      if (res.ok) {
        mostrarAlerta(vehiculo.activo ? "Vehículo desactivado" : "Vehículo reactivado", "success");
        recargar();
      } else {
        const data = await res.json();
        mostrarAlerta(data.error || "Error al cambiar estado del vehículo", "danger");
      }
    } catch (error) {
      console.error("Error al cambiar estado:", error);
      mostrarAlerta("Error de conexión", "danger");
    }
  };

  const eliminarVehiculo = async (id) => {
    const confirmado = await confirmarAccion("¿Eliminar Vehículo?", "Esta acción es irreversible.");
    if (!confirmado) return;

    try {
      const res = await fetch(apiSistema(`/api/vehiculos/${id}`), { method: 'DELETE' });
      if (res.ok) {
        mostrarAlerta("Vehículo eliminado", "success");
        recargar();
      } else {
        mostrarAlerta("Error al eliminar", "danger");
      }
    } catch (e) {
      console.error(e);
      mostrarAlerta("Error de conexión", "danger");
    }
  }

  const totalPaginas = Math.ceil(totalVehiculos / limite);

  const getEstadoBadge = (estado) => {
    switch (estado.toLowerCase()) {
      case 'disponible': return <Badge variant="light" color="teal" size="sm">Disponible</Badge>;
      case 'en mantenimiento': return <Badge variant="light" color="orange" size="sm">Mantenimiento</Badge>;
      case 'fuera de servicio': return <Badge variant="light" color="red" size="sm">Fuera de Servicio</Badge>;
      default: return <Badge variant="light" color="gray" size="sm">{estado}</Badge>;
    }
  };

  return (
    <>
      <ScrollArea>
        <Table verticalSpacing="xs" withTableBorder={false}>
          <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
            <Table.Tr>
              <Table.Th>Vehículo</Table.Th>
              <Table.Th>Capacidad</Table.Th>
              <Table.Th>Estado</Table.Th>
              <Table.Th>Propiedad</Table.Th>
              <Table.Th ta="center">Disponibilidad</Table.Th>
              <Table.Th ta="right">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Center py="xl">
                    <Loader color="cyan" type="dots" />
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : vehiculos.length > 0 ? (
              vehiculos.map((v) => (
                <Table.Tr key={v._id} style={{ transition: 'background-color 0.2s' }}>
                  <Table.Td>
                    <Group gap={6}>
                      <ThemeIcon variant="filled" color="cyan" size="sm" radius="sm">
                        <Truck size={14} style={{ stroke: 'white' }} stroke={1.5} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="sm" c="dark.4">{v.marca} {v.modelo}</Text>
                        <Text size="xs" c="dimmed" ff="monospace" fw={600} style={{ letterSpacing: 0.5 }}>
                          {v.patente}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>{v.capacidadKg.toLocaleString()} kg</Text>
                  </Table.Td>
                  <Table.Td>{getEstadoBadge(v.estado)}</Table.Td>
                  <Table.Td>
                    <Badge variant="outline" color="gray" size="sm" style={{ textTransform: 'capitalize' }}>
                      {v.tipoPropiedad}
                    </Badge>
                  </Table.Td>
                  <Table.Td ta="center">
                    <Badge
                      variant={v.activo ? "dot" : "outline"}
                      color={v.activo ? "teal" : "gray"}
                      size="sm"
                    >
                      {v.activo ? "Activo" : "Inactivo"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="flex-end" gap={4}>
                      <Tooltip label="Editar" withArrow>
                        <ActionIcon variant="subtle" color="gray" onClick={() => onEditar(v)}>
                          <Pencil size={18} stroke={1.5} style={{ stroke: '#495057' }} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label={v.activo ? "Desactivar" : "Reactivar"} withArrow>
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => toggleActivo(v)}
                        >
                          {v.activo ?
                            <EyeOff size={18} stroke={1.5} style={{ stroke: '#495057' }} /> :
                            <Eye size={18} stroke={1.5} style={{ stroke: '#495057' }} />
                          }
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar" withArrow>
                        <ActionIcon variant="subtle" color="gray" onClick={() => eliminarVehiculo(v._id)}>
                          <Trash2 size={18} stroke={1.5} style={{ stroke: '#495057' }} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" py="xl" c="dimmed">No se encontraron vehículos.</Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      {totalPaginas > 1 && (
        <Group justify="flex-end" mt="md">
          <Pagination
            total={totalPaginas}
            value={paginaActual}
            onChange={setPaginaActual}
            color="cyan"
            radius="md"
            withEdges
          />
        </Group>
      )}
    </>
  );
};

export default TablaVehiculos;

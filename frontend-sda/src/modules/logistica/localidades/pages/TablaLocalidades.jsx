import React from "react";
import {
  Pencil,
  Trash2,
  MapPin,
  Check,
  X
} from "lucide-react";
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
  Switch
} from "@mantine/core";

const TablaLocalidades = ({
  localidades,
  onEdit,
  onToggleEstado,
  onDelete,
  loading = false,
  paginaActual,
  setPaginaActual,
  totalLocalidades,
  limite = 10
}) => {

  const totalPaginas = Math.ceil(totalLocalidades / limite);

  return (
    <>
      <ScrollArea>
        <Table striped highlightOnHover verticalSpacing="sm" withTableBorder={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>Frecuencia</Table.Th>
              <Table.Th>Horarios</Table.Th>
              <Table.Th>Código Postal</Table.Th>
              <Table.Th ta="center">Estado</Table.Th>
              <Table.Th ta="center">Acciones</Table.Th>
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
            ) : localidades.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" py="md" c="dimmed">
                    No hay localidades registradas.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              localidades.map((loc) => (
                <Table.Tr key={loc._id}>
                  <Table.Td>
                    <Group gap="xs">
                      <MapPin size={16} color="gray" style={{ stroke: '#495057' }} />
                      <Text fw={500}>{loc.nombre}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td><Text size="sm">{loc.frecuencia}</Text></Table.Td>
                  <Table.Td><Text size="sm">{loc.horarios}</Text></Table.Td>
                  <Table.Td><Badge variant="outline" color="gray">{loc.codigoPostal}</Badge></Table.Td>
                  <Table.Td ta="center">
                    <Tooltip label={loc.activa ? "Desactivar" : "Activar"}>
                      <Switch
                        checked={loc.activa}
                        onChange={() => onToggleEstado(loc._id)}
                        color="teal"
                        size="sm"
                        onLabel={<Check size={12} style={{ display: 'block' }} />}
                        offLabel={<X size={12} style={{ display: 'block' }} />}
                      />
                    </Tooltip>
                  </Table.Td>
                  <Table.Td>
                    <Group justify="center" gap={8}>
                      <Tooltip label="Editar">
                        <ActionIcon variant="subtle" color="gray" onClick={() => onEdit(loc)} style={{ stroke: '#495057' }}>
                          <Pencil size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar">
                        <ActionIcon variant="subtle" color="gray" onClick={() => onDelete(loc._id)} style={{ stroke: '#495057' }}>
                          <Trash2 size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
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

export default TablaLocalidades;

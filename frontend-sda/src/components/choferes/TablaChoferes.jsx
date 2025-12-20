import React from "react";
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
  Avatar
} from "@mantine/core";
import { Pencil, Trash2, User } from "lucide-react";

// ✅ Importar estilos globales (Mantine doesn't need these but keeping for reference if needed, removing bootstrap dependent ones)
// import "@styles/tablasSistema.css"; // Removed

const TablaChoferes = ({
  choferes = [],
  onEditar,
  onEliminar,
  paginaActual,
  totalChoferes,
  setPaginaActual
}) => {
  const limite = 10;
  const totalPaginas = Math.ceil(totalChoferes / limite);

  return (
    <>
      <ScrollArea>
        <Table striped highlightOnHover verticalSpacing="sm" withTableBorder={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nombre</Table.Th>
              <Table.Th>DNI</Table.Th>
              <Table.Th>Teléfono</Table.Th>
              <Table.Th>Tipo de contratación</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th ta="center">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {Array.isArray(choferes) && choferes.length > 0 ? (
              choferes.map((chofer) => (
                <Table.Tr key={chofer._id}>
                  <Table.Td>
                    <Group gap="xs">
                      <User size={16} color="gray" style={{ stroke: '#495057' }} />
                      <Text fw={500}>{chofer.usuario?.nombre || "N/A"}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>{chofer.usuario?.dni || "-"}</Table.Td>
                  <Table.Td>{chofer.usuario?.telefono || "-"}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={chofer.tipoVinculo === "contratado" ? "blue" : "teal"}
                      variant="light"
                    >
                      {chofer.tipoVinculo === "contratado"
                        ? "Contratado"
                        : "Relación de dependencia"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{chofer.usuario?.email || "N/A"}</Table.Td>
                  <Table.Td>
                    <Group justify="center" gap={8}>
                      <Tooltip label="Editar">
                        <ActionIcon variant="subtle" color="gray" onClick={() => onEditar(chofer)} style={{ stroke: '#495057' }}>
                          <Pencil size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar">
                        <ActionIcon variant="subtle" color="gray" onClick={() => onEliminar(chofer._id)} style={{ stroke: '#495057' }}>
                          <Trash2 size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={6}>
                  <Text ta="center" py="xl" c="dimmed">
                    No se encontraron choferes.
                  </Text>
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

export default TablaChoferes;

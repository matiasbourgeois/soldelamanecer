import React, { useState } from "react";
import ModalLocalidadesRuta from "./ModalLocalidadesRuta";
import { Pencil, Trash2, MapPin } from "lucide-react";
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
  Button
} from "@mantine/core";

const TablaRutas = ({
  rutas = [],
  onEditar,
  onEliminar,
  recargar,
  paginaActual = 1,
  totalRutas = 0,
  setPaginaActual,
  loading = false
}) => {

  const [mostrarModal, setMostrarModal] = useState(false);
  const [localidadesModal, setLocalidadesModal] = useState([]);

  const abrirModalLocalidades = (localidades) => {
    setLocalidadesModal(localidades);
    setMostrarModal(true);
  };

  const totalPaginas = Math.ceil(totalRutas / 10);

  return (
    <>
      <ScrollArea>
        <Table striped highlightOnHover verticalSpacing="sm" withTableBorder={false}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Código</Table.Th>
              <Table.Th>Salida</Table.Th>
              <Table.Th>Frecuencia</Table.Th>
              <Table.Th>Descripción</Table.Th>
              <Table.Th>Chofer</Table.Th>
              <Table.Th>Vehículo</Table.Th>
              <Table.Th>Localidades</Table.Th>
              <Table.Th ta="center">Acciones</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Center py="xl">
// LOADER
                    <Loader color="cyan" type="dots" />
                  </Center>
                </Table.Td>
              </Table.Tr>
            ) : Array.isArray(rutas) && rutas.length > 0 ? (
              rutas.map((r) => (
                <Table.Tr key={r._id}>
                  <Table.Td>
                    <Badge color="cyan" variant="light" size="lg" w={100} style={{ display: 'flex', justifyContent: 'center' }}>
                      {r.codigo}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{r.horaSalida}</Table.Td>
                  <Table.Td>
                    <Text size="sm">{r.frecuencia}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed" lineClamp={1} w={200} title={r.descripcion}>
                      {r.descripcion}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {r.choferAsignado?.usuario?.nombre ? (
                      <Text fw={500} size="sm">
                        {r.choferAsignado.usuario.nombre} {r.choferAsignado.usuario.apellido || ""}
                      </Text>
                    ) : (
                      <Text c="dimmed" size="xs">Sin asignar</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {r.vehiculoAsignado ? (
                      <Badge color="gray" variant="outline" w={100} style={{ display: 'flex', justifyContent: 'center' }}>
                        {r.vehiculoAsignado.patente}
                      </Badge>
                    ) : (
                      <Text c="dimmed" size="xs">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {r.localidades?.length > 1 ? (
                      <Button
                        variant="light"
                        color="cyan"
                        size="xs"
                        px={8}
                        leftSection={<MapPin size={14} style={{ marginRight: -4 }} />}
                        onClick={() => abrirModalLocalidades(r.localidades)}
                      >
                        Ver Localidades
                      </Button>
                    ) : (
                      <Text size="sm">{r.localidades?.[0]?.nombre || "-"}</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Group justify="center" gap={8}>
                      <Tooltip label="Editar Ruta">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => onEditar(r)}
                          style={{ stroke: '#495057' }}
                        >
                          <Pencil size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar Ruta">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          onClick={() => onEliminar(r._id)}
                          style={{ stroke: '#495057' }}
                        >
                          <Trash2 size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))
            ) : (
              <Table.Tr>
                <Table.Td colSpan={8}>
                  <Text ta="center" py="md" c="dimmed">
                    No se encontraron rutas registradas.
                  </Text>
                </Table.Td>
              </Table.Tr>
            )}
          </Table.Tbody>
        </Table>
      </ScrollArea >

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
      )
      }

      <ModalLocalidadesRuta
        mostrar={mostrarModal}
        onClose={() => setMostrarModal(false)}
        localidades={localidadesModal}
      />
    </>
  );
};

export default TablaRutas;

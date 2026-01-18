import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Container, Paper, Title, Table, Group, TextInput, Pagination,
  Button, Text, Loader, Center, ActionIcon, Tooltip, Badge, Stack, Box
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { useDebouncedValue } from "@mantine/hooks";
import { Search, Calendar as CalendarIcon, FileText, X } from "lucide-react";
import { apiSistema } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";

const ConsultarRemitos = () => {
  // 🟢 CHANGE: Default dates to null to show ALL history by default
  const [filtroDesde, setFiltroDesde] = useState(null);
  const [filtroHasta, setFiltroHasta] = useState(null);

  const [remitos, setRemitos] = useState([]);
  const [filtroNumero, setFiltroNumero] = useState("");
  // 🟢 Debounce for search to avoid API flood
  const [debouncedFiltroNumero] = useDebouncedValue(filtroNumero, 500);

  const [loading, setLoading] = useState(false);
  const [paginaActual, setPaginaActual] = useState(1); // Mantine starts at 1
  const [limite] = useState(10);
  const [totalRemitos, setTotalRemitos] = useState(0);

  useEffect(() => {
    fetchRemitos();
  }, [paginaActual, debouncedFiltroNumero, filtroDesde, filtroHasta]); // Use debounced value

  const fetchRemitos = async () => {
    setLoading(true);

    // Helper to safety format dates
    const formatDateForApi = (date) => {
      if (!date) return "";
      try {
        const d = new Date(date);
        return isNaN(d.getTime()) ? "" : d.toISOString();
      } catch (e) {
        return "";
      }
    };

    try {
      const params = new URLSearchParams();
      params.append("pagina", paginaActual - 1); // Backend expects 0-indexed
      params.append("limite", limite);

      if (debouncedFiltroNumero) params.append("numero", debouncedFiltroNumero);

      const desdeFormatted = formatDateForApi(filtroDesde);
      if (desdeFormatted) params.append("desde", desdeFormatted);

      // 🟢 FIX: Set "Hasta" to end of day (23:59:59) to include the selected day
      if (filtroHasta) {
        const hastaEndOfDay = new Date(filtroHasta);
        hastaEndOfDay.setHours(23, 59, 59, 999);
        const hastaFormatted = formatDateForApi(hastaEndOfDay);
        if (hastaFormatted) params.append("hasta", hastaFormatted);
      }

      const res = await axios.get(apiSistema(`/remitos?${params.toString()}`));

      console.log("🔽 Remitos recibidos:", res.data);

      setRemitos(res.data.resultados);
      setTotalRemitos(res.data.total);
    } catch (error) {
      console.error("❌ Error al obtener remitos:", error.message);
      mostrarAlerta("Error al cargar remitos", "error");
    } finally {
      setLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setFiltroNumero("");
    setFiltroDesde(null);
    setFiltroHasta(null);
    setPaginaActual(1);
  };

  const totalPaginas = Math.ceil(totalRemitos / limite);

  return (
    <Container size="xl" py="xl">
      <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
        {/* Header Section */}
        <Group justify="space-between" mb="md">
          <Title order={2} fw={700} c="dimmed">
            Consultar Remitos
          </Title>
          {(filtroNumero || filtroDesde || filtroHasta) && (
            <Button variant="subtle" color="red" leftSection={<X size={16} />} onClick={limpiarFiltros} size="xs">
              Limpiar Filtros
            </Button>
          )}
        </Group>

        {/* Filters Section */}
        <Group mb="lg" align="flex-end">
          <TextInput
            label="Buscar por Número"
            placeholder="Ej: 8"
            leftSection={<Search size={16} />}
            value={filtroNumero}
            onChange={(e) => {
              setFiltroNumero(e.target.value);
              setPaginaActual(1);
            }}
            w={{ base: "100%", sm: 300 }}
          />
          <DatePickerInput
            label="Desde"
            placeholder="Fecha inicial"
            leftSection={<CalendarIcon size={16} />}
            value={filtroDesde}
            onChange={(date) => {
              setFiltroDesde(date);
              setPaginaActual(1);
            }}
            clearable
            w={{ base: "100%", sm: 180 }}
          />
          <DatePickerInput
            label="Hasta"
            placeholder="Fecha final"
            leftSection={<CalendarIcon size={16} />}
            value={filtroHasta}
            onChange={(date) => {
              setFiltroHasta(date);
              setPaginaActual(1);
            }}
            clearable
            w={{ base: "100%", sm: 180 }}
          />
        </Group>

        {/* Tabla */}
        {loading ? (
          <Center p="xl"><Loader color="cyan" type="dots" /></Center>
        ) : (
          <>
            <Table.ScrollContainer minWidth={800}>
              <Table verticalSpacing="xs" withTableBorder={false}>
                <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                  <Table.Tr>
                    <Table.Th>N° Remito</Table.Th>
                    <Table.Th>Fecha</Table.Th>
                    <Table.Th>Remitente</Table.Th>
                    <Table.Th>Destinatario</Table.Th>
                    <Table.Th>Localidad</Table.Th>
                    <Table.Th>Detalles</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>Acciones</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {remitos.length > 0 ? (
                    remitos.map((remito) => (
                      <Table.Tr key={remito._id} style={{ transition: 'background-color 0.2s' }}>
                        <Table.Td>
                          <Text size="sm" ff="monospace" fw={600} c="dark.3">
                            #{remito.numeroRemito}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{new Date(remito.fechaEmision).toLocaleDateString()}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500} c="dark.4">{remito.clienteRemitente?.nombre || "-"}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500} c="dark.4">{remito.destinatario?.nombre || "-"}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {remito.localidadDestino?.nombre || "-"}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="xs" c="dimmed">
                            {remito.encomienda?.cantidad} bultos • {remito.encomienda?.peso} kg
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ textAlign: 'center' }}>
                          <Tooltip label="Descargar PDF" withArrow>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              component="a"
                              href={apiSistema(`/remitos/${typeof remito.envio === 'object' ? remito.envio._id : remito.envio}/pdf?t=${Date.now()}`)}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <FileText size={18} />
                            </ActionIcon>
                          </Tooltip>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={7}>
                        <Center py="xl">
                          <Text c="dimmed">No se encontraron remitos.</Text>
                        </Center>
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>

            {/* Paginación */}
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
        )}
      </Paper>
    </Container>
  );
};

export default ConsultarRemitos;

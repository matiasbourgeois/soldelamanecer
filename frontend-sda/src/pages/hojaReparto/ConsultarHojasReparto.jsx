import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
    Container, Paper, Title, Table, Group, TextInput, Pagination,
    Text, Loader, Center, ActionIcon, Tooltip, Badge, Select, Button,
    ScrollArea, LoadingOverlay
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
    Search, FileText, Eye, Truck, User, X
} from "lucide-react";
import { apiSistema } from "../../utils/api";
import { mostrarAlerta } from "../../utils/alertaGlobal.jsx";
import '@mantine/dates/styles.css';

const ConsultarHojasReparto = () => {
    const [hojas, setHojas] = useState([]);
    const [filtro, setFiltro] = useState("");
    const [filtroDesde, setFiltroDesde] = useState(null);
    const [filtroHasta, setFiltroHasta] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState("");

    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    // Pagination
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [limite] = useState(10);
    const [total, setTotal] = useState(0);

    const exportarHoja = async (hojaId, numeroHoja) => {
        try {
            const response = await axios.get(apiSistema(`/api/hojas-reparto/exportar/${hojaId}`), {
                responseType: "blob",
            });

            await new Promise((resolve) => setTimeout(resolve, 300));

            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Hoja de Reparto - ${numeroHoja}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error("❌ Error al exportar hoja:", error);
            mostrarAlerta("Error al exportar la hoja de reparto", "danger");
        }
    };

    const obtenerHojas = async () => {
        setCargando(true);
        try {
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

            const params = new URLSearchParams();
            params.append("pagina", paginaActual - 1);
            params.append("limite", limite);
            if (filtro) params.append("busqueda", filtro);
            if (filtroEstado) params.append("estado", filtroEstado);

            const desdeFormatted = formatDateForApi(filtroDesde);
            if (desdeFormatted) params.append("desde", desdeFormatted);

            if (filtroHasta) {
                const hastaFormatted = formatDateForApi(filtroHasta);
                if (hastaFormatted) params.append("hasta", hastaFormatted);
            }

            const res = await axios.get(apiSistema(`/api/hojas-reparto/paginado?${params.toString()}`));

            setHojas(res.data.hojas || []);
            setTotalPaginas(Math.ceil(res.data.total / limite));
            setTotal(res.data.total || 0);
        } catch (error) {
            console.error("Error al obtener hojas de reparto:", error);
            mostrarAlerta("Error al obtener hojas", "error");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        obtenerHojas();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [paginaActual, filtro, filtroDesde, filtroHasta, filtroEstado]);

    const verDetalle = (idHoja) => {
        navigate(`/hojas-reparto/${idHoja}`);
    };

    const limpiarFiltros = () => {
        setFiltro("");
        setFiltroDesde(null);
        setFiltroHasta(null);
        setFiltroEstado("");
        setPaginaActual(1);
    };

    return (
        <Container size="xl" py="xl">
            <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
                {/* Header Section */}
                <Group justify="space-between" mb="md">
                    <Title order={2} fw={700} c="dimmed">
                        Gestión de Hojas de Reparto
                    </Title>
                    {/* No button for 'Nueva Hoja' as requested */}
                </Group>

                {/* Filters Section */}
                <Group mb="md" align="flex-end">
                    <TextInput
                        placeholder="Buscar por N° de Hoja..."
                        leftSection={<Search size={16} />}
                        value={filtro}
                        onChange={(e) => {
                            setFiltro(e.target.value);
                            setPaginaActual(1);
                        }}
                        radius="md"
                        w={{ base: "100%", sm: 250 }}
                    />
                    <Select
                        placeholder="Estado"
                        data={[
                            { value: "", label: "Todos" },
                            { value: "en reparto", label: "En Reparto" },
                            { value: "cerrada", label: "Cerrada" },
                            { value: "pendiente", label: "Pendiente" }
                        ]}
                        value={filtroEstado}
                        onChange={(val) => {
                            setFiltroEstado(val || "");
                            setPaginaActual(1);
                        }}
                        w={{ base: "100%", sm: 150 }}
                        radius="md"
                        allowDeselect={false}
                    />
                    <DatePickerInput
                        placeholder="Desde"
                        value={filtroDesde}
                        onChange={(date) => {
                            setFiltroDesde(date);
                            setPaginaActual(1);
                        }}
                        clearable
                        radius="md"
                        w={{ base: "100%", sm: 150 }}
                    />
                    <DatePickerInput
                        placeholder="Hasta"
                        value={filtroHasta}
                        onChange={(date) => {
                            setFiltroHasta(date);
                            setPaginaActual(1);
                        }}
                        clearable
                        radius="md"
                        w={{ base: "100%", sm: 150 }}
                    />
                    {(filtro || filtroEstado || filtroDesde || filtroHasta) && (
                        <ActionIcon
                            variant="light"
                            color="red"
                            size="lg"
                            radius="md"
                            onClick={limpiarFiltros}
                            mb={2}
                        >
                            <X size={18} />
                        </ActionIcon>
                    )}
                </Group>

                {/* Data Table */}
                <ScrollArea>
                    <LoadingOverlay visible={cargando} zIndex={100} overlayProps={{ radius: "sm", blur: 2 }} />
                    <Table verticalSpacing="xs" withTableBorder={false}>
                        <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                            <Table.Tr>
                                <Table.Th>Hoja</Table.Th>
                                <Table.Th>Fecha</Table.Th>
                                <Table.Th>Chofer</Table.Th>
                                <Table.Th>Vehículo</Table.Th>
                                <Table.Th ta="center">Estado</Table.Th>
                                <Table.Th ta="center">Envíos</Table.Th>
                                <Table.Th ta="right">Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {hojas.length > 0 ? (
                                hojas.map((hoja) => (
                                    <Table.Tr key={hoja._id} style={{ transition: 'background-color 0.2s' }}>
                                        <Table.Td>
                                            <Text fw={700} size="sm" c="dark.4">
                                                {hoja.numeroHoja || "-"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed">
                                                {hoja.fecha ? new Date(hoja.fecha).toLocaleDateString() : "-"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={6}>
                                                <User size={14} color="gray" />
                                                <Text size="sm" fw={500}>
                                                    {hoja.chofer?.usuario?.nombre || "Sin Asignar"}
                                                </Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group gap={6}>
                                                <Truck size={14} color="gray" />
                                                <Text size="sm" ff="monospace">
                                                    {hoja.vehiculo?.patente || "-"}
                                                </Text>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge
                                                variant="light"
                                                color={
                                                    hoja.estado === 'en reparto' ? 'blue' :
                                                        hoja.estado === 'cerrada' ? 'green' :
                                                            'gray'
                                                }
                                                size="sm"
                                                w={120}
                                            >
                                                {hoja.estado?.toUpperCase()}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge variant="outline" color="gray" size="sm" circle>
                                                {hoja.envios?.length || 0}
                                            </Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="flex-end" gap={4}>
                                                <Tooltip label="Ver Detalle" withArrow>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="gray"
                                                        onClick={() => verDetalle(hoja._id)}
                                                    >
                                                        <Eye size={18} stroke={1.5} style={{ stroke: '#495057' }} />
                                                    </ActionIcon>
                                                </Tooltip>
                                                <Tooltip label="Exportar PDF" withArrow>
                                                    <ActionIcon
                                                        variant="subtle"
                                                        color="red"
                                                        onClick={() => exportarHoja(hoja._id, hoja.numeroHoja)}
                                                    >
                                                        <FileText size={18} stroke={1.5} style={{ stroke: 'var(--mantine-color-red-6)' }} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={7}>
                                        <Text ta="center" py="xl" c="dimmed">No se encontraron hojas de reparto.</Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                {/* Pagination */}
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
            </Paper>
        </Container>
    );
};

export default ConsultarHojasReparto;

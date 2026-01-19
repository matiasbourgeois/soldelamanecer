import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import {
    Container, Paper, Title, Table, Group, TextInput, Select,
    Button, Pagination, Badge, ActionIcon, Tooltip, Text, Loader, Center, Stack, ThemeIcon, Box, rem
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { IconSearch, IconTrash, IconCalendar, IconX, IconFileText } from "@tabler/icons-react"; // Or lucide-react if standard
import { Search, Trash2, Calendar as CalendarIcon, X, Package, FileText } from "lucide-react"; // Using Lucide as per project standard
import AuthContext from "../../../../core/context/AuthProvider";
import { apiSistema } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../../../core/utils/confirmarAccion.jsx";
import { useDebouncedValue } from "@mantine/hooks";
import '@mantine/dates/styles.css'; // Ensure styles are imported if needed globally or here

const ConsultarEnvios = () => {
    const { auth } = useContext(AuthContext);

    // States
    const [envios, setEnvios] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    // FIX: Default dates to null to show ALL recent history by default (Backend sorts desc)
    const [filtroFechaDesde, setFiltroFechaDesde] = useState(null);
    const [filtroFechaHasta, setFiltroFechaHasta] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState("");
    const [busqueda, setBusqueda] = useState("");
    const [debouncedBusqueda] = useDebouncedValue(busqueda, 500);

    // Pagination
    const [paginaActual, setPaginaActual] = useState(1); // Mantine starts at 1
    const [totalEnvios, setTotalEnvios] = useState(0);
    const LIMITE = 10;

    const fetchEnvios = async () => {
        if (!auth?.token || !auth?.rol) return;
        setLoading(true);

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
            const desde = formatDateForApi(filtroFechaDesde);
            const hasta = formatDateForApi(filtroFechaHasta);
            const pageIndex = paginaActual - 1;

            const res = await axios.get(apiSistema(
                `/envios?pagina=${pageIndex}&limite=${LIMITE}&estado=${filtroEstado || ""}&fechaDesde=${desde}&fechaHasta=${hasta}&busqueda=${debouncedBusqueda}`
            ), {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            // Add permissions
            const enviosConPermisos = res.data.resultados.map((envio) => ({
                ...envio,
                permisoEliminar:
                    auth.rol === "admin" ||
                    (auth.rol === "administrativo" && envio.estado === "pendiente"),
            }));

            setEnvios(enviosConPermisos);
            setTotalEnvios(res.data.total);
        } catch (error) {
            console.error("Error al obtener los envíos:", error);
            mostrarAlerta("Error al cargar los envíos", "danger");
        } finally {
            setLoading(false);
        }
    };

    // Effect for fetching
    useEffect(() => {
        if (auth?.rol) {
            fetchEnvios();
        }
    }, [auth.rol, paginaActual, filtroEstado, filtroFechaDesde, filtroFechaHasta, debouncedBusqueda]);

    const handleEliminarEnvio = async (id) => {
        const confirmar = await confirmarAccion("¿Eliminar envío?", "Esta acción no se puede deshacer");
        if (!confirmar) return;

        try {
            await axios.delete(apiSistema(`/envios/${id}`), {
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            setEnvios(prev => prev.filter((e) => e._id !== id));
            mostrarAlerta("Envío eliminado correctamente.", "success");
            // Optional: Refetch to update pagination count
            fetchEnvios();
        } catch (error) {
            console.error("Error al eliminar el envío:", error);
            mostrarAlerta("No se pudo eliminar el envío.", "danger");
        }
    };

    const limpiarFiltros = () => {
        setFiltroFechaDesde(null);
        setFiltroFechaHasta(null);
        setFiltroEstado("");
        setBusqueda("");
        setPaginaActual(1);
    };

    const getEstadoColor = (estado) => {
        switch (estado?.toLowerCase()) {
            case "pendiente": return "blue";
            case "en reparto": return "yellow"; // Changed from 'info'/cyan to yellow for better visibility
            case "entregado": return "green";
            case "devuelto": return "orange";
            case "rechazado": return "red";
            case "no entregado": return "red";
            case "reagendado": return "grape";
            case "cancelado": return "gray";
            default: return "gray";
        }
    };

    if (!auth?.rol) return <Center p="xl"><Loader /></Center>;

    return (
        <Container size="xl" py="xl">
            <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
                {/* Header Section matching VehiculosAdmin */}
                <Group justify="space-between" mb="md">
                    <Title order={2} fw={700} c="dimmed">
                        Consultar Envíos
                    </Title>
                    {/* Botón limpiar filtros si hay alguno activo */}
                    {(filtroFechaDesde || filtroFechaHasta || filtroEstado || busqueda) && (
                        <Button variant="subtle" color="red" leftSection={<X size={16} />} onClick={limpiarFiltros} size="xs">
                            Limpiar Filtros
                        </Button>
                    )}
                </Group>

                {/* Filters Section - Adapted to fit cleanly */}
                <Group mb="lg" align="flex-end">
                    <TextInput
                        label="Buscar"
                        placeholder="Remito o seguimiento..."
                        leftSection={<Search size={16} />}
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value);
                            setPaginaActual(1);
                        }}
                        w={{ base: "100%", sm: 300 }}
                    />
                    <Select
                        label="Estado"
                        placeholder="Todos"
                        data={[
                            { value: "", label: "Todos" },
                            { value: "pendiente", label: "Pendiente" },
                            { value: "en reparto", label: "En reparto" },
                            { value: "entregado", label: "Entregado" },
                            { value: "devuelto", label: "Devuelto" },
                            { value: "rechazado", label: "Rechazado" },
                            { value: "no entregado", label: "No entregado" },
                            { value: "reagendado", label: "Reagendado" },
                            { value: "cancelado", label: "Cancelado" },
                        ]}
                        value={filtroEstado}
                        onChange={(val) => {
                            setFiltroEstado(val || "");
                            setPaginaActual(1);
                        }}
                        allowDeselect={false}
                        w={{ base: "100%", sm: 200 }}
                    />
                    <DatePickerInput
                        label="Desde"
                        placeholder="dd/mm/aaaa"
                        value={filtroFechaDesde}
                        onChange={(date) => {
                            setFiltroFechaDesde(date);
                            setPaginaActual(1);
                        }}
                        leftSection={<CalendarIcon size={16} />}
                        clearable
                        w={{ base: "100%", sm: 180 }}
                    />
                    <DatePickerInput
                        label="Hasta"
                        placeholder="dd/mm/aaaa"
                        value={filtroFechaHasta}
                        onChange={(date) => {
                            setFiltroFechaHasta(date);
                            setPaginaActual(1);
                        }}
                        leftSection={<CalendarIcon size={16} />}
                        clearable
                        w={{ base: "100%", sm: 180 }}
                    />
                </Group>

                {/* Table Section matching TablaVehiculos style */}
                {loading ? (
                    <Center p="xl"><Loader color="cyan" type="dots" /></Center>
                ) : (
                    <>
                        <Table.ScrollContainer minWidth={800}>
                            <Table verticalSpacing="xs" withTableBorder={false}>
                                <Table.Thead style={{ backgroundColor: '#f9fafb' }}>
                                    <Table.Tr>
                                        <Table.Th>Fecha</Table.Th>
                                        <Table.Th>Remitente</Table.Th>
                                        <Table.Th>Destinatario</Table.Th>
                                        <Table.Th>Localidad</Table.Th>
                                        <Table.Th>Remito</Table.Th>
                                        <Table.Th>Seguimiento</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {envios.length > 0 ? (
                                        envios.map((envio) => (
                                            <Table.Tr key={envio._id} style={{ transition: 'background-color 0.2s' }}>
                                                <Table.Td>
                                                    <Text size="sm">{new Date(envio.fechaCreacion).toLocaleDateString()}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500} c="dark.4">{envio.clienteRemitente?.nombre || "-"}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={500} c="dark.4">{envio.destinatario?.nombre || "-"}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" c="dimmed">
                                                        {envio.localidadDestino?.nombre || "-"}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="xs" c="dimmed" ff="monospace">
                                                        {envio.remitoNumero || "—"}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="xs" c="blue" fw={600} ff="monospace">
                                                        {envio.numeroSeguimiento || "—"}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge
                                                        color={getEstadoColor(envio.estado)}
                                                        variant="light"
                                                        size="sm"
                                                        w={120}
                                                        style={{ textTransform: 'capitalize' }}
                                                    >
                                                        {envio.estado}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td style={{ textAlign: 'right' }}>
                                                    <Tooltip label="Descargar Remito PDF" withArrow>
                                                        <ActionIcon
                                                            variant="subtle"
                                                            color="red"
                                                            component="a"
                                                            href={apiSistema(`/remitos/${envio._id}/pdf?t=${Date.now()}`)}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            mr="xs"
                                                        >
                                                            <IconFileText size={20} stroke={1.5} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    {envio.permisoEliminar && (
                                                        <Tooltip label="Eliminar" withArrow>
                                                            <ActionIcon
                                                                color="gray"
                                                                variant="subtle"
                                                                onClick={() => handleEliminarEnvio(envio._id)}
                                                            >
                                                                <Trash2 size={18} stroke={1.5} style={{ stroke: '#495057' }} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Table.Td>
                                            </Table.Tr>
                                        ))
                                    ) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={8}>
                                                <Center py="xl">
                                                    <Text c="dimmed">No se encontraron envíos</Text>
                                                </Center>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>

                        {/* Pagination matching TablaVehiculos */}
                        {totalEnvios > 0 && (
                            <Group justify="flex-end" mt="md">
                                <Pagination
                                    total={Math.ceil(totalEnvios / LIMITE)}
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

export default ConsultarEnvios;

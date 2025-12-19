import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container, Paper, Title, Text, Group, Grid, LoadingOverlay,
    ThemeIcon, Table, Badge, Stack, Card, Button, Divider, Tabs, rem, SimpleGrid, ActionIcon
} from "@mantine/core";
import {
    Calendar, User, Truck, FileText, ArrowLeft,
    MapPin, Package, Ruler, ClipboardList, CheckCircle
} from "lucide-react";
import { apiSistema } from "../../utils/api";
import { mostrarAlerta } from "../../utils/alertaGlobal.jsx";
import MapaEntregas from "./MapaEntregas";

const DetalleHojaReparto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [hoja, setHoja] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [activeTab, setActiveTab] = useState("lista");

    useEffect(() => {
        const obtenerDetalle = async () => {
            try {
                const res = await axios.get(apiSistema(`/api/hojas-reparto/${id}`));
                setHoja(res.data);
            } catch (error) {
                console.error("Error al obtener hoja:", error);

            } finally {
                setCargando(false);
            }
        };
        obtenerDetalle();
    }, [id]);

    const exportarHoja = async (hojaId, numeroHoja) => {
        try {
            const response = await axios.get(apiSistema(`/api/hojas-reparto/exportar/${hojaId}`), {
                responseType: "blob",
            });
            const blob = new Blob([response.data], { type: "application/pdf" });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Hoja de Reparto - ${numeroHoja}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error(error);
            mostrarAlerta("Error al exportar PDF", "error");
        }
    };

    if (cargando) return <LoadingOverlay visible={true} overlayProps={{ radius: "sm", blur: 2 }} />;

    if (!hoja) return (
        <Container size="sm" py="xl" ta="center">
            <h3 className="titulo-seccion mb-4">No se encontró la hoja.</h3>
            <Button variant="light" onClick={() => navigate(-1)}>Volver</Button>
        </Container>
    );

    return (
        <Container size="xl" py={40} pb={100}>
            {/* 🔙 BACK BUTTON */}
            <Button
                variant="subtle"
                color="gray"
                leftSection={<ArrowLeft size={18} />}
                onClick={() => navigate(-1)}
                mb="md"
                pl={0}
            >
                Volver al listado
            </Button>

            {/* 🔹 HEADER EDITORIAL */}
            <Group justify="space-between" align="start" mb={40}>
                <Stack gap={0}>
                    <Group gap="xs" mb={5}>
                        <ThemeIcon variant="light" color="cyan" size="md" radius="md">
                            <ClipboardList size={16} />
                        </ThemeIcon>
                        <Text tt="uppercase" c="cyan" fw={800} fz="xs" ls={1.5}>
                            Detalle de Distribución
                        </Text>
                    </Group>
                    <Title
                        order={1}
                        style={{
                            fontSize: rem(42),
                            fontWeight: 900,
                            letterSpacing: '-1.5px',
                            color: 'var(--mantine-color-dark-8)',
                            lineHeight: 1.1
                        }}
                    >
                        Hoja {hoja.numeroHoja}
                    </Title>
                    <Text c="dimmed" size="lg" mt="xs">
                        Operación asignada al chofer {hoja.chofer?.usuario?.nombre}.
                    </Text>
                </Stack>

                <Group align="center">
                    <Badge
                        size="xl"
                        radius="md"
                        variant="light"
                        color={hoja.estado === 'cerrada' ? 'green' : hoja.estado === 'en reparto' ? 'blue' : 'gray'}
                        h={42}
                        style={{ display: 'flex', alignItems: 'center' }}
                    >
                        {hoja.estado?.toUpperCase()}
                    </Badge>
                    <Button
                        variant="light"
                        color="red"
                        size="md"
                        radius="md"
                        leftSection={<FileText size={18} />}
                        onClick={() => exportarHoja(hoja._id, hoja.numeroHoja)}
                    >
                        Exportar PDF
                    </Button>
                </Group>
            </Group>

            {/* 🔹 INFO CARDS GRID */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md" mb={40}>
                <Card shadow="sm" radius="md" padding="lg" withBorder>
                    <Group>
                        <ThemeIcon color="blue" variant="light" size={42} radius="md">
                            <Calendar size={22} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Fecha Emisión</Text>
                            <Text fw={700} size="md">{new Date(hoja.fecha).toLocaleDateString()}</Text>
                        </div>
                    </Group>
                </Card>
                <Card shadow="sm" radius="md" padding="lg" withBorder>
                    <Group>
                        <ThemeIcon color="cyan" variant="light" size={42} radius="md">
                            <User size={22} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Chofer</Text>
                            <Text fw={700} size="md" truncate w={150}>{hoja.chofer?.usuario?.nombre || "Sin datos"}</Text>
                        </div>
                    </Group>
                </Card>
                <Card shadow="sm" radius="md" padding="lg" withBorder>
                    <Group>
                        <ThemeIcon color="indigo" variant="light" size={42} radius="md">
                            <Truck size={22} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Vehículo</Text>
                            <Text fw={700} size="md">{hoja.vehiculo?.patente || "-"}</Text>
                        </div>
                    </Group>
                </Card>
                <Card shadow="sm" radius="md" padding="lg" withBorder>
                    <Group>
                        <ThemeIcon color="teal" variant="light" size={42} radius="md">
                            <CheckCircle size={22} />
                        </ThemeIcon>
                        <div>
                            <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Envíos</Text>
                            <Text fw={700} size="md">{hoja.envios?.length || 0} Remitos</Text>
                        </div>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* 🔹 TABS: CONTENT SEGREGATION */}
            <Tabs value={activeTab} onChange={setActiveTab} color="cyan" radius="md">
                <Tabs.List mb="lg">
                    <Tabs.Tab value="lista" leftSection={<Package size={16} />}>
                        Listado de Remitos
                    </Tabs.Tab>
                    <Tabs.Tab value="mapa" leftSection={<MapPin size={16} />}>
                        Mapa de Ruta
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="lista">
                    <Paper shadow="sm" radius="lg" withBorder>
                        <Table.ScrollContainer minWidth={800}>
                            <Table verticalSpacing="sm" withTableBorder={false}>
                                <Table.Thead bg="gray.1">
                                    <Table.Tr>
                                        <Table.Th c="dimmed" tt="uppercase" fz="xs" fw={700}>Remito</Table.Th>
                                        <Table.Th c="dimmed" tt="uppercase" fz="xs" fw={700}>Destinatario</Table.Th>
                                        <Table.Th c="dimmed" tt="uppercase" fz="xs" fw={700}>Dirección</Table.Th>
                                        <Table.Th c="dimmed" tt="uppercase" fz="xs" fw={700}>Localidad</Table.Th>
                                        <Table.Th c="dimmed" tt="uppercase" fz="xs" fw={700} ta="center">Bultos</Table.Th>
                                        <Table.Th c="dimmed" tt="uppercase" fz="xs" fw={700}>Tipo</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {hoja.envios?.length > 0 ? (
                                        hoja.envios.map((envio) => (
                                            <Table.Tr key={envio._id}>
                                                <Table.Td>
                                                    <Badge variant="outline" color="dark" radius="sm">
                                                        {envio.remitoNumero || "-"}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text fw={600} size="sm">{envio.destinatario?.nombre}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text c="dimmed" size="sm" truncate w={200}>
                                                        {envio.destinatario?.direccion}
                                                    </Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="dot" color="gray" size="sm">
                                                        {envio.localidadDestino?.nombre}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td ta="center">
                                                    <Badge circle size="lg" color="blue" variant="light">
                                                        {envio.encomienda?.cantidad}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Badge variant="light" color="cyan" size="sm" w={100}>
                                                        {envio.encomienda?.tipoPaquete}
                                                    </Badge>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))
                                    ) : (
                                        <Table.Tr>
                                            <Table.Td colSpan={6}>
                                                <Text ta="center" py="xl" c="dimmed">No hay envíos en esta hoja.</Text>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Table.ScrollContainer>
                    </Paper>
                </Tabs.Panel>

                <Tabs.Panel value="mapa">
                    {/* Key property forces remount when tab becomes active, fixing resize issues */}
                    <Paper shadow="sm" radius="lg" withBorder p={0} overflow="hidden">
                        <div style={{ height: '500px', width: '100%' }}>
                            {activeTab === 'mapa' && <MapaEntregas envios={hoja.envios} />}
                        </div>
                    </Paper>
                </Tabs.Panel>
            </Tabs>

        </Container>
    );
};

export default DetalleHojaReparto;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { apiSistema } from "../../../../core/api/apiSistema";
import {
    Container,
    Paper,
    Title,
    Text,
    Timeline,
    ThemeIcon,
    Badge,
    Group,
    Grid,
    Button,
    Loader,
    Center,
    Alert,
    Box,
    Divider,
    Stack // Added Stack for new layout
} from "@mantine/core";
import {
    IconTruckDelivery,
    IconPackage,
    IconMapPin,
    IconClock,
    IconCheck,
    IconArrowLeft,
    IconAlertCircle,
    IconCalendar
} from "@tabler/icons-react";

const ResultadoSeguimiento = () => {
    const { codigo } = useParams();
    const navigate = useNavigate();
    const [envio, setEnvio] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const buscarEnvio = async () => {
            try {
                setLoading(true);
                const { data } = await axios.get(apiSistema(`/api/seguimiento/${codigo}`));

                setEnvio(data);
                setError("");
            } catch (err) {
                console.error("❌ Error al buscar envío:", err);
                setError("No se encontró ningún envío con ese número.");
            } finally {
                setLoading(false);
            }
        };

        if (codigo) {
            buscarEnvio();
        }
    }, [codigo]);

    if (loading) {
        return (
            <Center h="100vh" bg="white">
                <Loader color="cyan" size="xl" type="dots" />
            </Center>
        );
    }

    if (error) {
        return (
            <Container size="sm" mt={100}>
                <Alert icon={<IconAlertCircle size={20} />} title="No Encontrado" color="red" radius="md" variant="filled">
                    {error}
                </Alert>
                <Center mt="xl">
                    <Button variant="subtle" color="gray" onClick={() => navigate('/seguimiento')}>
                        <IconArrowLeft size={18} style={{ marginRight: 8 }} /> Volver
                    </Button>
                </Center>
            </Container>
        );
    }

    if (!envio) return null;

    const getStatusColor = (status) => {
        const s = status?.toLowerCase() || "";
        if (s.includes("entregado") || s.includes("completado")) return "teal";
        if (s.includes("cancelado")) return "red";
        if (s.includes("camino") || s.includes("viaje")) return "cyan";
        return "blue";
    };

    return (
        <div style={{ backgroundColor: "#ffffff", flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* HERO STATUS HEADER (COMPACT) */}
            <div style={{
                background: 'white',
                padding: '40px 0 20px 0',
                color: '#1e293b',
                borderBottom: '1px solid #e2e8f0',
                position: 'relative'
            }}>
                <Container fluid px={50}>
                    <Group justify="space-between" align="center" mb="md">
                        <Button
                            variant="subtle"
                            color="gray"
                            size="sm"
                            leftSection={<IconArrowLeft size={16} />}
                            onClick={() => navigate('/seguimiento')}
                        >
                            Volver
                        </Button>
                        <Badge
                            variant="light"
                            color="cyan"
                            size="lg"
                            radius="sm"
                            style={{ letterSpacing: 1, fontWeight: 800 }}
                        >
                            {envio.estadoActual}
                        </Badge>
                    </Group>

                    <Title order={1} style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-2px', lineHeight: 1 }}>
                        {codigo}
                    </Title>
                    <Text size="sm" mt="xs" c="dimmed">
                        Sol del Amanecer • Logística en Tiempo Real
                    </Text>
                </Container>
            </div>

            {/* MAIN CONTENT Area with local scroll if needed */}
            <Box style={{ flex: 1, overflowY: 'auto', paddingTop: 30, paddingBottom: 40 }}>
                <Container fluid px={50}>
                    <Grid gutter={40}>

                        {/* LEFT: DELIVERY INFO */}
                        <Grid.Col span={{ base: 12, md: 5 }}> {/* INCREASED SPAN TO 5 */}
                            <Paper shadow="xl" radius="lg" p={30} bg="white" withBorder style={{ height: '100%', borderColor: '#f1f3f5' }}>
                                <Text c="dimmed" size="xs" tt="uppercase" fw={800} ls={2} mb="xl">
                                    Detalles de Entrega
                                </Text>

                                <Stack gap="xl">
                                    <Group wrap="nowrap" align="flex-start">
                                        <ThemeIcon size={48} radius="md" variant="light" color="blue">
                                            <IconPackage size={26} stroke={1.5} />
                                        </ThemeIcon>
                                        <div style={{ flex: 1 }}> {/* ADDED flex: 1 */}
                                            <Text size="sm" c="dimmed" fw={600}>REMITENTE</Text>
                                            <Text size="lg" fw={800} c="dark.7" style={{ lineHeight: 1.2 }}>{envio.remitente?.nombre}</Text>
                                            <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word' }}>{envio.remitente?.email}</Text>
                                        </div>
                                    </Group>

                                    <Divider color="gray.1" />

                                    <Group wrap="nowrap" align="flex-start">
                                        <ThemeIcon size={48} radius="md" variant="light" color="cyan">
                                            <IconMapPin size={26} stroke={1.5} />
                                        </ThemeIcon>
                                        <div style={{ flex: 1 }}> {/* ADDED flex: 1 */}
                                            <Text size="sm" c="dimmed" fw={600}>DESTINATARIO</Text>
                                            <Text size="lg" fw={800} c="dark.7" style={{ lineHeight: 1.2 }}>{envio.destinatario?.nombre}</Text>
                                            <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word' }}>{envio.destinatario?.direccion}</Text>
                                            <Badge variant="dot" color="cyan" mt="xs" size="md">
                                                {envio.localidadDestino?.nombre}
                                            </Badge>
                                        </div>
                                    </Group>
                                </Stack>
                            </Paper>
                        </Grid.Col>

                        {/* RIGHT: TIMELINE */}
                        <Grid.Col span={{ base: 12, md: 7 }}> {/* REDUCED SPAN TO 7 */}
                            <Paper shadow="xl" radius="lg" p={40} bg="white" withBorder style={{ height: '100%', borderColor: '#f1f3f5' }}>
                                <Group justify="space-between" mb={30}>
                                    <Title order={3} fw={800} c="dark.8">Historial</Title>
                                    <IconClock size={24} color="var(--mantine-color-gray-4)" />
                                </Group>

                                <Timeline active={0} bulletSize={40} lineWidth={2} color="cyan">
                                    {envio.historial?.slice().reverse().map((evento, index) => (
                                        <Timeline.Item
                                            key={index}
                                            bullet={
                                                index === 0 ? <IconTruckDelivery size={20} /> : <IconCheck size={20} />
                                            }
                                            title={
                                                <Text fw={700} size="md" c={index === 0 ? "cyan.9" : "dark.5"}>
                                                    {evento.estado.toUpperCase()}
                                                </Text>
                                            }
                                            lineVariant={index === 0 ? "solid" : "dashed"}
                                        >
                                            <Text size="sm" c="dimmed" mt={4}>
                                                {evento.sucursal}
                                            </Text>
                                            <Text size="xs" c="dimmed" mt={4}>
                                                {new Date(evento.fecha).toLocaleDateString()} • {new Date(evento.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </Timeline.Item>
                                    ))}
                                </Timeline>
                            </Paper>
                        </Grid.Col>
                    </Grid>
                </Container>
            </Box>
        </div>
    );
};

export default ResultadoSeguimiento;

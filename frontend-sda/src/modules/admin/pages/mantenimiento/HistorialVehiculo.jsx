import React, { useState, useEffect } from "react";
import {
    Container, Grid, Paper, Title, Text, Group, Avatar, Badge,
    Timeline, ThemeIcon, RingProgress, Select, LoadingOverlay,
    ActionIcon, Box, Card, Divider, Button, Center, Stack,
    TextInput, Pagination, HoverCard, Progress, List, ScrollArea
} from "@mantine/core";
import {
    Wrench, DollarSign, ClipboardList, PenTool,
    Calendar, AlertTriangle, Check, Search,
    FileText, RotateCw, Truck, User, Info,
    Hash, Droplets, MapPin, Gauge, Clock
} from "lucide-react";
import { DonutChart } from '@mantine/charts';
import { apiSistema } from "../../../../core/api/apiSistema";
import axios from "axios";
import { notifications } from "@mantine/notifications";

const HistorialVehiculo = () => {
    const [vehiculos, setVehiculos] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [vehiculo, setVehiculo] = useState(null);
    const [historial, setHistorial] = useState([]);
    const [stats, setStats] = useState({
        totalCost: 0,
        healthScore: 100,
        diario: { rendimiento: 0, recorrido: 0, litros: 0 },
        mensual: { rendimiento: 0, recorrido: 0, litros: 0 }
    });
    const [loading, setLoading] = useState(false);

    // Paginación y Búsqueda
    const [pagina, setPagina] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [busqueda, setBusqueda] = useState("");
    const limite = 10;

    // Initial Fetch (Lista de vehículos)
    useEffect(() => {
        const fetchList = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get(apiSistema("/api/vehiculos"), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const mapped = res.data.map(v => ({ value: v._id, label: `${v.patente} - ${v.marca} ${v.modelo}` }));
                setVehiculos(mapped);
                if (mapped.length > 0) setSelectedId(mapped[0].value);
            } catch (e) {
                console.error(e);
            }
        };
        fetchList();
    }, []);

    // Fetch Details when Select or Page changes
    useEffect(() => {
        if (!selectedId) return;
        fetchDetails(selectedId, pagina);
    }, [selectedId, pagina]);

    const fetchDetails = async (id, page = 1) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // 1. Obtener datos detallados del vehículo
            // Usamos el listado ya que el backend por ahora devuelve todo en /api/vehiculos
            const resVehiculos = await axios.get(apiSistema(`/api/vehiculos`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const v = resVehiculos.data.find(veh => veh._id === id);

            // 2. Obtener Historial PAGINADO
            const resLogs = await axios.get(apiSistema(`/api/vehiculos/${id}/mantenimiento/historial?pagina=${page - 1}&limite=${limite}`), {
                headers: { Authorization: `Bearer ${token}` }
            });

            const realHistory = resLogs.data.logs || [];
            const total = resLogs.data.total || 0;

            // 3. Obtener Estadísticas Reales (Diaria/Mensual) desde el backend
            const resStats = await axios.get(apiSistema(`/api/vehiculos/${id}/estadisticas`), {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (v) {
                setVehiculo(v);
                setHistorial(realHistory);
                setTotalItems(total);

                // Inversión y Salud (lógica simplificada para el ejemplo)
                const totalCostCurrentPage = realHistory.reduce((acc, curr) => acc + (curr.costo || 0), 0);

                let totalScore = 100;
                v.configuracionMantenimiento?.forEach(c => {
                    const recorrido = v.kilometrajeActual - c.ultimoKm;
                    if (recorrido >= c.frecuenciaKm) totalScore -= 20;
                    else if (recorrido >= c.frecuenciaKm * 0.8) totalScore -= 5;
                });

                setStats({
                    totalCost: totalCostCurrentPage,
                    healthScore: Math.max(0, totalScore),
                    diario: resStats.data.diario || { rendimiento: 0, recorrido: 0, litros: 0 },
                    mensual: resStats.data.mensual || { rendimiento: 0, recorrido: 0, litros: 0 }
                });
            }

        } catch (error) {
            console.error("Error fetching history:", error);
            notifications.show({ title: 'Error', message: 'No se pudo cargar el historial', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (tipo) => {
        if (!tipo) return { icon: <Wrench size={20} />, color: "gray", label: "General" };
        if (tipo === "Reporte Diario") return { icon: <ClipboardList size={20} />, color: "cyan", label: "Reporte App" };
        if (tipo.toLowerCase().includes("aceite")) return { icon: <Droplets size={20} />, color: "orange", label: "Service Aceite" };
        return { icon: <Wrench size={20} />, color: "indigo", label: "Mantenimiento" };
    };

    // Filtrado local básico para la búsqueda en la página actual
    const historialFiltrado = (historial || []).filter(h => {
        if (!h) return false;
        const search = busqueda.toLowerCase();
        return (
            (h.tipo && h.tipo.toLowerCase().includes(search)) ||
            (h.observaciones && h.observaciones.toLowerCase().includes(search)) ||
            (h.registradoPor?.nombre && h.registradoPor.nombre.toLowerCase().includes(search))
        );
    });

    if (!vehiculo && !loading) return null;

    return (
        <ScrollArea h="calc(100vh - 60px)" offsetScrollbars scrollbarSize={12}>
            <Container size="xl" py="lg" style={{ position: 'relative', minHeight: '80vh' }}>
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

                {/* --- HEADER & SELECTOR --- */}
                <Group justify="space-between" mb="xl" align="flex-end">
                    <div>
                        <Title order={2} c="indigo.9" fw={900}>Auditoría de Flota</Title>
                        <Text c="dimmed">Seguimiento detallado y reportes de choferes</Text>
                    </div>
                    <Select
                        data={vehiculos}
                        value={selectedId}
                        onChange={(val) => { setSelectedId(val); setPagina(1); }}
                        searchable
                        placeholder="Seleccionar Vehículo..."
                        leftSection={<Truck size={16} />}
                        style={{ width: 350 }}
                        styles={{ input: { borderRadius: '12px', border: '2px solid #e0e7ff' } }}
                    />
                </Group>

                {vehiculo && (
                    <Grid gutter="lg">
                        {/* ZONE 1: IDENTITY CARD (ENRICHED) */}
                        <Grid.Col span={{ base: 12, md: 4 }}>
                            <Paper shadow="md" radius="lg" p="xl" bg="white" withBorder style={{ borderTop: '6px solid var(--mantine-color-indigo-6)' }}>
                                <Center mb="lg">
                                    <Box style={{ position: 'relative' }}>
                                        <Avatar size={120} radius="xl" color="indigo" variant="light" src={null} bga="indigo.0">
                                            <Truck size={60} color="var(--mantine-color-indigo-6)" />
                                        </Avatar>
                                        <Badge
                                            color={vehiculo.activo ? "teal" : "red"}
                                            variant="filled"
                                            style={{ position: 'absolute', bottom: 5, right: 5, border: '3px solid white' }}
                                        >
                                            {vehiculo.activo ? "ACTIVO" : "Baja"}
                                        </Badge>
                                    </Box>
                                </Center>

                                <Title ta="center" order={2} style={{ letterSpacing: -1, fontSize: 32 }}>{vehiculo.patente}</Title>
                                <Text ta="center" c="dimmed" fw={600} mb="xl">{vehiculo.marca} {vehiculo.modelo}</Text>

                                <Stack gap="xs">
                                    <Paper withBorder p="sm" radius="md" bg="gray.0">
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Gauge size={16} color="gray" />
                                                <Text size="xs" fw={700} c="dimmed">ODÓMETRO</Text>
                                            </Group>
                                            <Text fw={900} size="sm">{vehiculo.kilometrajeActual?.toLocaleString()} km</Text>
                                        </Group>
                                    </Paper>

                                    <Paper withBorder p="sm" radius="md" bg="gray.0">
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Hash size={16} color="gray" />
                                                <Text size="xs" fw={700} c="dimmed">CAPACIDAD</Text>
                                            </Group>
                                            <Text fw={700} size="sm">{vehiculo.capacidadKg?.toLocaleString()} kg</Text>
                                        </Group>
                                    </Paper>

                                    <Paper withBorder p="sm" radius="md" bg="gray.0">
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Info size={16} color="gray" />
                                                <Text size="xs" fw={700} c="dimmed">PROPIEDAD</Text>
                                            </Group>
                                            <Badge variant="light" color={vehiculo.tipoPropiedad === 'propio' ? 'blue' : 'orange'} size="sm">
                                                {vehiculo.tipoPropiedad?.toUpperCase()}
                                            </Badge>
                                        </Group>
                                    </Paper>

                                    <Paper withBorder p="sm" radius="md" bg="gray.0">
                                        <Group justify="space-between">
                                            <Group gap="xs">
                                                <Check size={16} color="gray" />
                                                <Text size="xs" fw={700} c="dimmed">ESTADO</Text>
                                            </Group>
                                            <Badge variant="outline" color={vehiculo.estado === 'disponible' ? 'teal' : 'red'} size="sm">
                                                {vehiculo.estado?.toUpperCase()}
                                            </Badge>
                                        </Group>
                                    </Paper>
                                </Stack>

                                <Divider my="xl" label=" Rendimiento del Vehículo " labelPosition="center" />

                                <Stack gap="md">
                                    {/* CARD DIARIA */}
                                    <Paper withBorder p="md" radius="md" bg="blue.0" style={{ borderLeft: '6px solid var(--mantine-color-blue-6)' }}>
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="xs">
                                                <Calendar size={18} color="var(--mantine-color-blue-7)" />
                                                <Text fw={800} size="sm" c="blue.8">HOY</Text>
                                            </Group>
                                            <Badge color="blue" variant="filled">{stats.diario.rendimiento} km/L</Badge>
                                        </Group>
                                        <Grid gutter="xs">
                                            <Grid.Col span={6}>
                                                <Text size="xs" c="dimmed" fw={700}>RECORRIDO</Text>
                                                <Text fw={800} size="sm">{stats.diario.recorrido} km</Text>
                                            </Grid.Col>
                                            <Grid.Col span={6}>
                                                <Text size="xs" c="dimmed" fw={700}>LITROS</Text>
                                                <Text fw={800} size="sm">{stats.diario.litros} L</Text>
                                            </Grid.Col>
                                        </Grid>
                                    </Paper>

                                    {/* CARD MENSUAL */}
                                    <Paper withBorder p="md" radius="md" bg="indigo.0" style={{ borderLeft: '6px solid var(--mantine-color-indigo-6)' }}>
                                        <Group justify="space-between" mb="xs">
                                            <Group gap="xs">
                                                <Clock size={18} color="var(--mantine-color-indigo-7)" />
                                                <Text fw={800} size="sm" c="indigo.8">ÚLTIMOS 30 DÍAS</Text>
                                            </Group>
                                            <Badge color="indigo" variant="filled">{stats.mensual.rendimiento} km/L</Badge>
                                        </Group>
                                        <Grid gutter="xs">
                                            <Grid.Col span={6}>
                                                <Text size="xs" c="dimmed" fw={700}>RECORRIDO TOTAL</Text>
                                                <Text fw={800} size="sm">{stats.mensual.recorrido} km</Text>
                                            </Grid.Col>
                                            <Grid.Col span={6}>
                                                <Text size="xs" c="dimmed" fw={700}>LITROS TOTALES</Text>
                                                <Text fw={800} size="sm">{stats.mensual.litros} L</Text>
                                            </Grid.Col>
                                        </Grid>
                                    </Paper>
                                </Stack>

                                <Divider my="xl" label=" Salud de Mantenimiento " labelPosition="center" />

                                <Center>
                                    <RingProgress
                                        size={140}
                                        thickness={12}
                                        roundCaps
                                        sections={[{ value: stats.healthScore, color: stats.healthScore > 80 ? 'teal' : stats.healthScore > 50 ? 'yellow' : 'red' }]}
                                        label={
                                            <div style={{ textAlign: 'center' }}>
                                                <Text fw={900} size="lg">{stats.healthScore}%</Text>
                                                <Text size="xs" c="dimmed" fw={700}>SALUD</Text>
                                            </div>
                                        }
                                    />
                                </Center>
                            </Paper>
                        </Grid.Col>

                        {/* ZONE 2: TIMELINE & LOGS */}
                        <Grid.Col span={{ base: 12, md: 8 }}>
                            <Grid mb="lg">
                                <Grid.Col span={12}>
                                    <Paper shadow="xs" radius="lg" p="lg" withBorder>
                                        <Group justify="space-between" mb="md">
                                            <Group>
                                                <Title order={4}>Cronología Operativa</Title>
                                                <Badge variant="light" color="indigo">
                                                    Viendo {historialFiltrado.length} de {totalItems} registros
                                                </Badge>
                                            </Group>
                                            <TextInput
                                                placeholder="Buscar en historial..."
                                                leftSection={<Search size={14} />}
                                                size="xs"
                                                w={250}
                                                value={busqueda}
                                                onChange={(e) => setBusqueda(e.target.value)}
                                            />
                                        </Group>

                                        {historialFiltrado.length > 0 ? (
                                            <Timeline active={0} bulletSize={38} lineWidth={2} mt="xl">
                                                {historialFiltrado.map((item, idx) => {
                                                    const config = getStatusIcon(item.tipo);
                                                    return (
                                                        <Timeline.Item
                                                            key={idx}
                                                            bullet={
                                                                <ThemeIcon
                                                                    size={38}
                                                                    variant="light"
                                                                    color={config.color}
                                                                    radius="xl"
                                                                >
                                                                    {config.icon}
                                                                </ThemeIcon>
                                                            }
                                                            title={
                                                                <Group justify="space-between" pr="md">
                                                                    <Text fw={700} size="sm">{item.tipo}</Text>
                                                                    <Badge variant="outline" color="gray" size="xs">
                                                                        {new Date(item.fecha).toLocaleString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                                                                    </Badge>
                                                                </Group>
                                                            }
                                                        >
                                                            <Box mt={4} p="md" radius="md" style={{ backgroundColor: '#f8fafc', borderLeft: `4px solid var(--mantine-color-${config.color}-5)` }}>
                                                                <Grid gutter="xs">
                                                                    <Grid.Col span={6}>
                                                                        <Group gap={6}>
                                                                            <User size={14} color="#64748b" />
                                                                            <Text size="xs" fw={700} c="dark.3">Chofer: {item.registradoPor?.nombre || "Sistema"}</Text>
                                                                        </Group>
                                                                    </Grid.Col>
                                                                    <Grid.Col span={6}>
                                                                        <Group gap={6}>
                                                                            <Calendar size={14} color="#64748b" />
                                                                            <Text size="xs" fw={700} c="dark.3">{new Date(item.fecha).toLocaleDateString()}</Text>
                                                                        </Group>
                                                                    </Grid.Col>

                                                                    <Grid.Col span={12}><Divider variant="dashed" my={4} /></Grid.Col>

                                                                    <Grid.Col span={4}>
                                                                        <Stack gap={0}>
                                                                            <Group gap={4}>
                                                                                <Gauge size={12} color="#0891b2" />
                                                                                <Text size="xs" c="dimmed" fw={700}>ODÓMETRO</Text>
                                                                            </Group>
                                                                            <Text fw={800} size="sm" c="cyan.9">{item.kmAlMomento?.toLocaleString()} km</Text>
                                                                        </Stack>
                                                                    </Grid.Col>

                                                                    {item.litrosCargados > 0 && (
                                                                        <Grid.Col span={4}>
                                                                            <Stack gap={0}>
                                                                                <Group gap={4}>
                                                                                    <Droplets size={12} color="#f97316" />
                                                                                    <Text size="xs" c="dimmed" fw={700}>COMBUSTIBLE</Text>
                                                                                </Group>
                                                                                <Text fw={800} size="sm" c="orange.8">{item.litrosCargados} L</Text>
                                                                            </Stack>
                                                                        </Grid.Col>
                                                                    )}

                                                                    {item.ruta && (
                                                                        <Grid.Col span={4}>
                                                                            <Stack gap={0}>
                                                                                <Group gap={4}>
                                                                                    <MapPin size={12} color="#14b8a6" />
                                                                                    <Text size="xs" c="dimmed" fw={700}>RUTA</Text>
                                                                                </Group>
                                                                                <Text fw={800} size="sm" c="teal.7">{item.ruta.codigo}</Text>
                                                                            </Stack>
                                                                        </Grid.Col>
                                                                    )}

                                                                    {item.observaciones && (
                                                                        <Grid.Col span={12} mt={4}>
                                                                            <Text size="xs" style={{ fontStyle: 'italic', backgroundColor: 'white', padding: '6px', borderRadius: '4px' }}>
                                                                                "{item.observaciones}"
                                                                            </Text>
                                                                        </Grid.Col>
                                                                    )}

                                                                    {item.costo > 0 && (
                                                                        <Grid.Col span={12} mt={4}>
                                                                            <Badge color="indigo" variant="light" size="sm" leftSection={<DollarSign size={10} />}>
                                                                                Costo: ${item.costo?.toLocaleString()}
                                                                            </Badge>
                                                                        </Grid.Col>
                                                                    )}
                                                                </Grid>
                                                            </Box>
                                                        </Timeline.Item>
                                                    );
                                                })}
                                            </Timeline>
                                        ) : (
                                            <Center h={300} bg="gray.0" style={{ borderRadius: 16 }}>
                                                <Stack align="center" gap="xs">
                                                    <FileText size={48} color="#cbd5e1" />
                                                    <Text c="dimmed" fw={600}>No se encontraron registros en esta página.</Text>
                                                </Stack>
                                            </Center>
                                        )}

                                        {totalItems > limite && (
                                            <Group justify="center" mt="xl" py="md" style={{ borderTop: '1px solid #f1f5f9' }}>
                                                <Pagination
                                                    total={Math.ceil(totalItems / limite)}
                                                    value={pagina}
                                                    onChange={setPagina}
                                                    color="indigo"
                                                    radius="md"
                                                    withEdges
                                                />
                                            </Group>
                                        )}
                                    </Paper>
                                </Grid.Col>
                            </Grid>
                        </Grid.Col>
                    </Grid>
                )}
            </Container>
        </ScrollArea>
    );
};

export default HistorialVehiculo;

import React, { useState, useEffect } from "react";
import {
    Container, Grid, Paper, Title, Text, Group, Avatar, Badge,
    Timeline, ThemeIcon, RingProgress, Select, LoadingOverlay,
    ActionIcon, Box, Card, Divider, Button, Center, Stack
} from "@mantine/core";
import {
    Wrench, DollarSign, ClipboardList, PenTool,
    Calendar, AlertTriangle, Check, Search,
    FileText, RotateCw
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
    const [stats, setStats] = useState({ totalCost: 0, costPerKm: 0, healthScore: 100 });
    const [loading, setLoading] = useState(false);

    // Initial Fetch
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

    // Fetch Details when Select changes
    useEffect(() => {
        if (!selectedId) return;
        fetchDetails(selectedId);
    }, [selectedId]);

    const fetchDetails = async (id) => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");

            // 1. Obtener datos del vehículo (Buscamos en el endpoint general por ahora)
            const resVehiculos = await axios.get(apiSistema(`/api/vehiculos`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const v = resVehiculos.data.find(v => v._id === id);

            // 2. Obtener Historial REAL desde el backend
            const resLogs = await axios.get(apiSistema(`/api/vehiculos/${id}/mantenimiento/historial`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const realHistory = resLogs.data || [];

            if (v) {
                setVehiculo(v);
                setHistorial(realHistory);

                // Calculate KPIs
                const total = realHistory.reduce((acc, curr) => acc + (curr.costo || 0), 0);
                const kmRecorridos = v.kilometrajeActual || 1;

                // Mock health score logic based on real frequency
                const recentIssues = realHistory.filter(h => {
                    const diffTime = Math.abs(new Date() - new Date(h.fecha));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays < 90;
                }).length;

                setStats({
                    totalCost: total,
                    costPerKm: total / kmRecorridos,
                    healthScore: Math.max(0, 100 - (recentIssues * 15))
                });
            }

        } catch (error) {
            console.error("Error fetching history:", error);
            notifications.show({ title: 'Error', message: 'No se pudo cargar el historial', color: 'red' });
        } finally {
            setLoading(false);
        }
    };

    if (!vehiculo && !loading) return null;

    return (
        <Container size="xl" py="lg" style={{ position: 'relative', minHeight: '80vh' }}>
            <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

            {/* --- HEADER & SELECTOR --- */}
            <Group justify="space-between" mb="xl" align="flex-end">
                <div>
                    <Title order={2} c="indigo.9">Auditoría de Flota</Title>
                    <Text c="dimmed">Expediente digital y análisis de costos</Text>
                </div>
                <Select
                    data={vehiculos}
                    value={selectedId}
                    onChange={setSelectedId}
                    searchable
                    placeholder="Buscar patente..."
                    leftSection={<Search size={16} />}
                    style={{ width: 300 }}
                    styles={{ input: { borderColor: 'var(--mantine-color-indigo-3)', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' } }}
                />
            </Group>

            {vehiculo && (
                <Grid gutter="lg">
                    {/* ZONE 1: IDENTITY CARD */}
                    <Grid.Col span={{ base: 12, md: 4 }}>
                        <Paper shadow="md" radius="lg" p="xl" bg="white" withBorder style={{ height: '100%', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'var(--mantine-color-indigo-5)' }} />

                            <Center mb="lg">
                                <Avatar size={120} radius="xl" color="indigo" variant="light">
                                    <ClipboardList size={60} />
                                </Avatar>
                            </Center>

                            <Text ta="center" fw={900} size="xl" style={{ fontSize: 32, letterSpacing: -1 }}>
                                {vehiculo.patente}
                            </Text>
                            <Text ta="center" c="dimmed" fw={500} size="lg" mb="xl">
                                {vehiculo.marca} {vehiculo.modelo}
                            </Text>

                            <Group justify="space-between" mb="md" p="xs" bg="gray.1" style={{ borderRadius: 8 }}>
                                <Text size="sm" fw={700} c="dimmed">ESTADO</Text>
                                <Badge color="green" size="lg" variant="dot">OPERATIVO</Badge>
                            </Group>

                            <Group justify="space-between" mb="md" p="xs" bg="gray.1" style={{ borderRadius: 8 }}>
                                <Text size="sm" fw={700} c="dimmed">KILOMETRAJE</Text>
                                <Text fw={900}>{vehiculo.kilometrajeActual?.toLocaleString()} km</Text>
                            </Group>

                            {/* Health Ring */}
                            <Center mt="xl">
                                <RingProgress
                                    size={140}
                                    thickness={12}
                                    roundCaps
                                    sections={[{ value: stats.healthScore, color: stats.healthScore > 80 ? 'teal' : stats.healthScore > 50 ? 'yellow' : 'red' }]}
                                    label={
                                        <div style={{ textAlign: 'center' }}>
                                            <Text fw={900} size="xl">{stats.healthScore}%</Text>
                                            <Text size="xs" c="dimmed">SALUD</Text>
                                        </div>
                                    }
                                />
                            </Center>
                        </Paper>
                    </Grid.Col>

                    {/* ZONE 2: FINANCIAL KPI STRIP (Stacked layout for visual impact) */}
                    <Grid.Col span={{ base: 12, md: 8 }}>
                        <Grid>
                            <Grid.Col span={6}>
                                <Paper shadow="sm" radius="md" p="lg" withBorder bg="indigo.0" style={{ borderColor: 'var(--mantine-color-indigo-2)' }}>
                                    <Group>
                                        <ThemeIcon size={48} radius="md" color="indigo" variant="white">
                                            <DollarSign size={28} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xs" tt="uppercase" fw={700} c="indigo.7">Inversión Total</Text>
                                            <Text size="xl" fw={900} style={{ fontSize: 28 }}>${stats.totalCost.toLocaleString()}</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            </Grid.Col>
                            <Grid.Col span={6}>
                                <Paper shadow="sm" radius="md" p="lg" withBorder>
                                    <Group>
                                        <ThemeIcon size={48} radius="md" color="gray" variant="light">
                                            <Wrench size={28} />
                                        </ThemeIcon>
                                        <div>
                                            <Text size="xs" tt="uppercase" fw={700} c="dimmed">Costo por KM</Text>
                                            <Text size="xl" fw={900} style={{ fontSize: 28 }}>${stats.costPerKm.toFixed(2)}</Text>
                                        </div>
                                    </Group>
                                </Paper>
                            </Grid.Col>
                        </Grid>

                        {/* ZONE 3: TIMELINE FEED */}
                        <Grid mt="lg">
                            <Grid.Col span={8}>
                                <Paper shadow="sm" radius="md" p="xl" withBorder style={{ minHeight: 400 }}>
                                    <Title order={4} mb="lg">Cronología de Servicios</Title>

                                    {historial.length > 0 ? (
                                        <Timeline active={0} bulletSize={32} lineWidth={2}>
                                            {historial.map((item, idx) => (
                                                <Timeline.Item
                                                    key={idx}
                                                    bullet={
                                                        <ThemeIcon
                                                            size={32}
                                                            variant="gradient"
                                                            gradient={{ from: 'indigo', to: 'cyan' }}
                                                            radius="xl"
                                                        >
                                                            <PenTool size={16} />
                                                        </ThemeIcon>
                                                    }
                                                    title={
                                                        <Text fw={700} size="sm">{item.tipo || "Mantenimiento General"}</Text>
                                                    }
                                                >
                                                    <Text c="dimmed" size="xs" mt={4}>
                                                        {new Date(item.fecha).toLocaleDateString()} • {item.kmAlMomento?.toLocaleString()} km
                                                    </Text>
                                                    <Text size="sm" mt={4} style={{ fontStyle: 'italic' }}>
                                                        "{item.observaciones || 'Sin observaciones'}"
                                                    </Text>
                                                    <Badge color="gray" variant="light" mt="xs">
                                                        Costo: ${item.costo?.toLocaleString()}
                                                    </Badge>
                                                </Timeline.Item>
                                            ))}
                                        </Timeline>
                                    ) : (
                                        <Center h={300} bg="gray.0" style={{ borderRadius: 8 }}>
                                            <Stack align="center" gap="xs">
                                                <FileText size={40} color="gray" />
                                                <Text c="dimmed">Sin historial registrado.</Text>
                                            </Stack>
                                        </Center>
                                    )}
                                </Paper>
                            </Grid.Col>

                            {/* ZONE 4: CHARTS */}
                            <Grid.Col span={4}>
                                <Paper shadow="sm" radius="md" p="lg" withBorder h="100%">
                                    <Title order={5} mb="lg" ta="center">Distribución</Title>
                                    <DonutChart
                                        data={[
                                            { name: 'Mantenimiento', value: stats.totalCost, color: 'indigo.6' },
                                            { name: 'Repuestos', value: 0, color: 'cyan.6' }, // Mock structure for expansion
                                            { name: 'Otros', value: 0, color: 'gray.4' },
                                        ]}
                                        size={160}
                                        thickness={20}
                                        withTooltip
                                        mx="auto"
                                    />
                                    <Divider my="lg" />
                                    <Text size="xs" c="dimmed" ta="center">
                                        Visualización de costos acumulados por categoría.
                                    </Text>
                                </Paper>
                            </Grid.Col>
                        </Grid>
                    </Grid.Col>
                </Grid>
            )}
        </Container>
    );
};

export default HistorialVehiculo;

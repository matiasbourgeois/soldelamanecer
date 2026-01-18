import React, { useState, useEffect } from 'react';
import {
    Title, Paper, Text, Group, Box, Badge, ThemeIcon,
    Button, Container, rem, SimpleGrid, Stack, Divider, Avatar,
    RingProgress, Center, Loader, ActionIcon, ScrollArea
} from '@mantine/core';
import {
    AlertTriangle, CheckCircle2, Truck, Activity,
    CalendarClock, LayoutDashboard, Wrench, Siren, Timer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { apiSistema } from '../../../../core/api/apiSistema';

const MantenimientoMetricas = () => {
    const [vehiculos, setVehiculos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchVehiculos();
    }, []);

    const fetchVehiculos = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(apiSistema('/vehiculos/paginado?pagina=0&limite=100'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = response.data.resultados || response.data;
            setVehiculos(data);
        } catch (error) {
            console.error("Error fetching vehicles", error);
        } finally {
            setCargando(false);
        }
    };

    // --- LOGIC ---
    const getStatus = (v, config) => {
        const kmRecorrido = v.kilometrajeActual - config.ultimoKm;
        const restante = config.frecuenciaKm - kmRecorrido;
        if (restante <= 0) return 'RED';
        if (restante <= 1000) return 'YELLOW';
        return 'GREEN';
    };

    const processNotifications = () => {
        let critical = [];
        let warning = [];
        let healthyCount = 0;

        vehiculos.forEach(v => {
            let hasIssues = false;
            if (v.configuracionMantenimiento) {
                v.configuracionMantenimiento.forEach(c => {
                    const status = getStatus(v, c);
                    const restante = c.frecuenciaKm - (v.kilometrajeActual - c.ultimoKm);
                    const kmUsed = v.kilometrajeActual - c.ultimoKm;
                    const progress = Math.min(100, Math.max(0, (kmUsed / c.frecuenciaKm) * 100));

                    const item = { ...c, vehiculo: v, restante, progress, status };

                    if (status === 'RED') {
                        critical.push(item);
                        hasIssues = true;
                    } else if (status === 'YELLOW') {
                        warning.push(item);
                        hasIssues = true;
                    }
                });
            }
            if (!hasIssues) healthyCount++;
        });

        const total = vehiculos.length || 1;
        const healthScore = Math.round((healthyCount / total) * 100);

        return { critical, warning, healthScore, healthyCount };
    };

    const { critical, warning, healthScore } = processNotifications();

    // --- COMPONENTS ---

    const MetricCard = ({ title, value, color, icon: Icon, description, isScore }) => (
        <Paper
            withBorder
            p="lg"
            radius="md"
            shadow="sm"
            style={{
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'default',
                height: '100%'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-md)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--mantine-shadow-sm)';
            }}
        >
            <Group justify="space-between" align="flex-start" mb="xs" wrap="nowrap">
                <div style={{ overflow: 'hidden' }}>
                    <Text
                        c="dimmed"
                        tt="uppercase"
                        fw={700}
                        size="xs"
                        style={{ letterSpacing: '0.5px' }}
                        truncate
                    >
                        {title}
                    </Text>
                    <Text fw={900} size={rem(42)} mt={4} style={{ lineHeight: 1, letterSpacing: '-1px' }}>
                        {value}
                    </Text>
                </div>
                {isScore ? (
                    <RingProgress
                        size={80}
                        roundCaps
                        thickness={8}
                        sections={[{ value: parseFloat(value), color: color }]}
                        label={
                            <Center>
                                <Icon size={24} style={{ opacity: 0.8 }} color={`var(--mantine-color-${color}-filled)`} />
                            </Center>
                        }
                    />
                ) : (
                    // MANUAL BOX TO GUARANTEE ICON VISIBILITY
                    <Box
                        w={64}
                        h={64}
                        style={{
                            backgroundColor: `var(--mantine-color-${color}-filled)`,
                            borderRadius: '16px', // Squircle
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            boxShadow: `0 8px 16px -4px var(--mantine-color-${color}-3)` // Subtle Glow
                        }}
                    >
                        <Icon size={32} color="white" strokeWidth={2} />
                    </Box>
                )}
            </Group>
            <Text c="dimmed" size="xs" fw={500} truncate>
                {description}
            </Text>
        </Paper>
    );

    const AlertCard = ({ item, type }) => {
        const isCritical = type === 'critical';
        const color = isCritical ? 'red' : 'yellow';
        const Icon = isCritical ? AlertTriangle : CalendarClock;

        return (
            <Paper shadow="sm" radius="md" withBorder p="md" style={{ position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: `var(--mantine-color-${color}-5)` }} />

                <Group justify="space-between" mb="xs" pl="sm">
                    <Group gap="xs">
                        <Avatar color={color} variant="light" radius="xl" size="sm">
                            <Icon size={14} />
                        </Avatar>
                        <Text fw={700} size="xs" c={color} tt="uppercase">
                            {isCritical ? 'Vencido' : 'Próximo'}
                        </Text>
                    </Group>
                    <Badge color="gray" variant="light" size="sm">
                        {item.vehiculo.patente}
                    </Badge>
                </Group>

                <Text fw={700} size="md" mt="xs" pl="sm" lineClamp={1}>
                    {item.nombre}
                </Text>
                <Text size="sm" c="dimmed" pl="sm" mb="md">
                    {item.vehiculo.marca} {item.vehiculo.modelo}
                </Text>

                <Group pl="sm" mb="md" grow>
                    <div>
                        <Text size="xs" c="dimmed">Condición</Text>
                        <Text size="sm" fw={600} c={color}>
                            {isCritical ? `Excedido ${Math.abs(item.restante)} km` : `Restan ${item.restante} km`}
                        </Text>
                    </div>
                </Group>

                <Button
                    fullWidth
                    variant="light"
                    color={color}
                    size="xs"
                    onClick={() => navigate('/admin/mantenimiento/control')}
                >
                    Gestionar
                </Button>
            </Paper>
        );
    };

    return (
        <ScrollArea h="calc(100vh - 60px)" offsetScrollbars scrollbarSize={12}>
            <Container size="xl" py="xl">
                {/* HEADER */}
                <Group justify="space-between" mb={40} align="flex-end">
                    <div>
                        <Group gap="xs" mb={5}>
                            <ThemeIcon variant="transparent" color="cyan" size="sm">
                                <Truck size={20} />
                            </ThemeIcon>
                            <Text tt="uppercase" c="cyan" fw={800} fz="xs" ls={1.5}>
                                Logística & Flota
                            </Text>
                        </Group>
                        <Title order={1} fw={900} style={{ letterSpacing: '-1px' }}>
                            Centro de Control
                        </Title>
                        <Text c="dimmed" size="lg">Monitoreo de estado y mantenimiento preventivo.</Text>
                    </div>
                    <Button
                        variant="default"
                        size="md"
                        leftSection={<LayoutDashboard size={18} />}
                        onClick={() => navigate('/admin/mantenimiento/control')}
                    >
                        Ir a Tabla General
                    </Button>
                </Group>

                {cargando ? (
                    <Stack align="center" py="xl">
                        <Loader size="lg" />
                        <Text c="dimmed">Analizando flota...</Text>
                    </Stack>
                ) : (
                    <>
                        {/* METRICS GRID */}
                        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb={50}>
                            <MetricCard
                                title="Salud de Flota"
                                value={`${healthScore}%`}
                                color={healthScore > 80 ? 'teal' : 'yellow'}
                                icon={Activity}
                                description="Puntaje global operativo"
                                isScore
                            />
                            <MetricCard
                                title="Total Vehículos"
                                value={vehiculos.length}
                                color="blue"
                                icon={Truck} // Standard but distinct
                                description="Unidades registradas en sistema"
                            />
                            <MetricCard
                                title="Alertas Críticas"
                                value={critical.length}
                                color="red"
                                icon={AlertTriangle} // High visibility
                                description="Acción inmediata requerida"
                            />
                            <MetricCard
                                title="Mantenimientos Próximos"
                                value={warning.length}
                                color="orange"
                                icon={CalendarClock} // Clear meaning
                                description="En menos de 1000 km"
                            />
                        </SimpleGrid>

                        {/* CONTENT SECTIONS */}
                        <Stack gap={40}>

                            {/* CRITICAL SECTION */}
                            <Box>
                                <Group mb="md">
                                    <Title order={3} fw={800}>Prioridad Alta</Title>
                                    <Badge color="red" variant="filled" size="lg" circle>{critical.length}</Badge>
                                </Group>

                                {critical.length === 0 ? (
                                    <Paper withBorder p="xl" bg="var(--mantine-color-gray-0)" ta="center" radius="md">
                                        <ThemeIcon color="green" variant="light" size={50} radius="xl" mb="md">
                                            <CheckCircle2 size={28} />
                                        </ThemeIcon>
                                        <Title order={4}>Todo en orden</Title>
                                        <Text c="dimmed">No hay vehículos con mantenimiento vencido.</Text>
                                    </Paper>
                                ) : (
                                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                                        {critical.map((item, i) => (
                                            <AlertCard key={i} item={item} type="critical" />
                                        ))}
                                    </SimpleGrid>
                                )}
                            </Box>

                            <Divider variant="dashed" />

                            {/* WARNING SECTION */}
                            <Box>
                                <Group mb="md">
                                    <Title order={3} fw={800} c="dimmed">Planificación</Title>
                                    <Badge color="yellow" variant="light" size="lg" circle>{warning.length}</Badge>
                                </Group>

                                {warning.length === 0 ? (
                                    <Text c="dimmed" fs="italic">No hay mantenimientos próximos.</Text>
                                ) : (
                                    <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
                                        {warning.map((item, i) => (
                                            <AlertCard key={i} item={item} type="warning" />
                                        ))}
                                    </SimpleGrid>
                                )}
                            </Box>

                        </Stack>
                    </>
                )}
            </Container>
        </ScrollArea>
    );
};

export default MantenimientoMetricas;

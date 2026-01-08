import React from "react";
import { useNavigate } from "react-router-dom";
import {
    Container, Title, SimpleGrid, Card, Text, Group, ThemeIcon, UnstyledButton, rem, Box
} from "@mantine/core";
import { Wrench, BarChart3, ArrowRight, Truck, ClipboardList as IconClipboardHeart } from "lucide-react";

const MenuMantenimiento = () => {
    const navigate = useNavigate();

    const acciones = [
        {
            titulo: "Control de Mantenimientos",
            descripcion: "Semáforos de estado, registro de servicios históricos y configuración de alertas.",
            icono: <Wrench size={32} />,
            ruta: "/admin/mantenimiento/control",
            color: "cyan",
            bgPattern: "linear-gradient(135deg, rgba(21, 170, 191, 0.05) 0%, rgba(21, 170, 191, 0.1) 100%)"
        },
        {
            titulo: "Tablero de Notificaciones",
            descripcion: "Alertas críticas, vehículos vencidos y gestión de prioridades.",
            icono: <BarChart3 size={32} />,
            ruta: "/admin/mantenimiento/metricas",
            color: "violet",
            bgPattern: "linear-gradient(135deg, rgba(121, 80, 242, 0.05) 0%, rgba(121, 80, 242, 0.1) 100%)"
        },
        {
            titulo: "Historial por Vehículo",
            descripcion: "Expediente digital completo. Cronología de reparaciones y análisis de costos.",
            icono: <IconClipboardHeart size={32} />,
            ruta: "/admin/mantenimiento/historial",
            color: "indigo",
            bgPattern: "linear-gradient(135deg, rgba(76, 110, 245, 0.05) 0%, rgba(76, 110, 245, 0.1) 100%)"
        }
    ];

    return (
        <Container size="xl" py={50}>
            {/* Minimalist Header */}
            <Group justify="space-between" align="flex-end" mb={50}>
                <Box>
                    <Group align="center" gap="xs" mb={5}>
                        <ThemeIcon variant="light" color="cyan" size="md" radius="md">
                            <Truck size={16} />
                        </ThemeIcon>
                        <Text tt="uppercase" c="cyan" fw={800} fz="xs" ls={1.5}>
                            Logística & Distribución
                        </Text>
                    </Group>
                    <Title order={1} style={{ fontSize: rem(42), fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--mantine-color-dark-8)' }}>
                        Panel de Mantenimiento
                    </Title>
                    <Text c="dimmed" size="lg" mt={5} maw={600} lh={1.4}>
                        Gestión integral del estado de la flota. Controlá vencimientos y analizá costos operativos.
                    </Text>
                </Box>
            </Group>

            {/* Premium Actions Grid */}
            <SimpleGrid cols={{ base: 1, md: 3 }} spacing={30}>
                {acciones.map((accion, index) => (
                    <Card
                        key={index}
                        shadow="none"
                        padding={30}
                        radius={20}
                        component={UnstyledButton}
                        onClick={() => navigate(accion.ruta)}
                        style={{
                            border: '1px solid var(--mantine-color-gray-2)',
                            background: 'var(--mantine-color-white)',
                            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-10px)';
                            e.currentTarget.style.boxShadow = `0 20px 40px -10px var(--mantine-color-${accion.color}-2)`;
                            e.currentTarget.style.borderColor = `var(--mantine-color-${accion.color}-3)`;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                            e.currentTarget.style.borderColor = 'var(--mantine-color-gray-2)';
                        }}
                    >
                        {/* Decorative Background */}
                        <div style={{
                            position: 'absolute',
                            top: 0, right: 0, bottom: 0, left: 0,
                            background: accion.bgPattern,
                            opacity: 0,
                            transition: 'opacity 0.3s ease'
                        }}
                            onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
                            onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
                        />

                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <Group justify="space-between" align="start" mb={30}>
                                <ThemeIcon
                                    size={70}
                                    radius={20}
                                    variant="light"
                                    color={accion.color}
                                    style={{ transition: 'all 0.3s ease' }}
                                >
                                    {React.cloneElement(accion.icono, { size: 32 })}
                                </ThemeIcon>

                                <ThemeIcon
                                    size="lg"
                                    radius="xl"
                                    variant="subtle"
                                    color={accion.color}
                                    className="arrow-icon"
                                >
                                    <ArrowRight size={22} />
                                </ThemeIcon>
                            </Group>

                            <Title order={3} fw={800} mb={10} style={{ fontSize: rem(24) }}>
                                {accion.titulo}
                            </Title>

                            <Text size="md" c="dimmed" lh={1.5} mb={20}>
                                {accion.descripcion}
                            </Text>
                        </div>
                    </Card>
                ))}
            </SimpleGrid>
        </Container>
    );
};

export default MenuMantenimiento;

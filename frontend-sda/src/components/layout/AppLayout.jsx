import React from 'react';
import {
    AppShell,
    Burger,
    Group,
    NavLink,
    ScrollArea,
    Avatar,
    Text,
    Box,
    Divider,
    rem,
    useMantineTheme,
    Badge,
    UnstyledButton,
    Stack,
    Button,
    ActionIcon,
    Indicator
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Home as IconHome,
    User as IconUser,
    Truck as IconTruckDelivery,
    Users as IconUsers,
    LogOut as IconLogout,
    Package as IconPackage,
    BarChart as IconChartBar,
    Navigation as IconSteeringWheel,
    Map as IconMapRoute,
    FileText as IconFileDescription,
    Mail as IconMail,
    ChevronRight as IconChevronRight,
    Calculator as IconCalculator,
    Wrench as IconTool,
    Bell as IconBell,
    AlertTriangle as IconAlertTriangle,
    Gamepad2
} from 'lucide-react';
import { apiSistema, apiUsuarios, apiEstaticos } from '../../core/api/apiSistema';
import axios from 'axios';

import { useState, useEffect } from 'react';

export function AppLayout({ children, auth, handleLogout }) {
    const theme = useMantineTheme();
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const [isLogoutHovered, setIsLogoutHovered] = useState(false);
    const [notificationsCount, setNotificationsCount] = useState(0);

    const navigate = useNavigate();
    const location = useLocation();

    // Check Maintenance Status for Notifications
    useEffect(() => {
        if (!['admin', 'administrativo'].includes(auth?.rol)) return;

        const checkMaintenance = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(apiSistema('/vehiculos/paginado?pagina=0&limite=100'), {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const vehiculos = response.data.resultados || response.data;
                let criticalCount = 0;

                vehiculos.forEach(v => {
                    if (v.configuracionMantenimiento) {
                        v.configuracionMantenimiento.forEach(c => {
                            const kmRecorrido = v.kilometrajeActual - c.ultimoKm;
                            const restante = c.frecuenciaKm - kmRecorrido;
                            if (restante <= 0) criticalCount++; // RED Status
                        });
                    }
                });
                setNotificationsCount(criticalCount);
            } catch (error) {
                console.error("Error checking notifications:", error);
            }
        };

        checkMaintenance();
        const interval = setInterval(checkMaintenance, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [auth]);

    const isActive = (path) => location.pathname === path;
    const isParentActive = (paths) => paths.some(path => location.pathname.startsWith(path));

    // --- STANDARD MANTINE OCEAN STYLE ---
    const getLinkProps = (path) => {
        const active = isActive(path);
        return {
            active,
            onClick: () => {
                navigate(path);
                if (mobileOpened) toggleMobile();
            },
            variant: active ? 'filled' : 'subtle',
            color: 'cyan',
            style: {
                borderRadius: theme.radius.md,
                marginBottom: 4,
                fontWeight: active ? 600 : 500,
            },
        };
    };

    const renderNavItems = () => {
        return (
            <Box px="md">
                <Text size="xs" fw={700} c="dimmed" mb="xs" pl={4} tt="uppercase" style={{ letterSpacing: 1 }}>
                    Principal
                </Text>

                <NavLink
                    label="Mi Perfil"
                    leftSection={<IconUser size={20} stroke={1.5} />}
                    rightSection={isActive('/perfil') && <IconChevronRight size={14} />}
                    {...getLinkProps('/perfil')}
                />



                <NavLink
                    label="Seguimiento de Envíos"
                    leftSection={<IconPackage size={20} stroke={1.5} />}
                    rightSection={isActive('/seguimiento') && <IconChevronRight size={14} />}
                    {...getLinkProps('/seguimiento')}
                />

                <NavLink
                    label="Cotizador Online de Cargas Dedicadas"
                    leftSection={<IconCalculator size={20} stroke={1.5} />}
                    component="a"
                    href="https://cotizadorlogistico.site/"
                    target="_blank"
                    variant="subtle"
                    color="cyan"
                    style={{
                        borderRadius: theme.radius.md,
                        marginBottom: 4,
                        fontWeight: 500,
                    }}
                />

                {/* ROLE: CLIENTE */}
                {auth?.rol === 'cliente' && (
                    <NavLink
                        label="Mis Envíos"
                        leftSection={<IconPackage size={20} stroke={1.5} />}
                        rightSection={isActive('/mis-envios') && <IconChevronRight size={14} />}
                        {...getLinkProps('/mis-envios')}
                    />
                )}

                {/* SECCIÓN ADMINISTRACIÓN */}
                {['admin', 'administrativo'].includes(auth?.rol) && (
                    <>
                        <Divider my="md" color="gray.2" />
                        <Text size="xs" fw={700} c="dimmed" mb="xs" pl={4} tt="uppercase" style={{ letterSpacing: 1 }}>
                            Gestión
                        </Text>

                        {/* Grupo Operativo */}
                        <NavLink
                            label="Gestión Operativa"
                            leftSection={<IconTruckDelivery size={20} stroke={1.5} />}
                            childrenOffset={28}
                            defaultOpened={isParentActive(['/admin/rutas', '/admin/choferes', '/admin/vehiculos'])}
                            style={{ borderRadius: theme.radius.md, fontWeight: 600, color: theme.colors.gray[7] }}
                        >
                            <NavLink
                                label="Rutas"
                                leftSection={<IconMapRoute size={18} />}
                                {...getLinkProps('/admin/rutas')}
                            />
                            <NavLink
                                label="Choferes"
                                leftSection={<IconUsers size={18} />}
                                {...getLinkProps('/admin/choferes')}
                            />
                            <NavLink
                                label="Vehículos"
                                leftSection={<IconSteeringWheel size={18} />}
                                {...getLinkProps('/admin/vehiculos')}
                            />
                        </NavLink>

                        {/* Mantenimiento (NUEVO) */}
                        <NavLink
                            label="Mantenimiento Vehículos"
                            leftSection={<IconCalculator size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/mantenimiento') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/mantenimiento')}
                        />

                        {/* Grupo Envíos */}
                        <NavLink
                            label="Gestión de Envíos"
                            leftSection={<IconPackage size={20} stroke={1.5} />}
                            childrenOffset={28}
                            defaultOpened={isParentActive(['/envios/gestion', '/hojas-reparto'])}
                            style={{ borderRadius: theme.radius.md, fontWeight: 600, color: theme.colors.gray[7] }}
                        >
                            <NavLink
                                label="Envíos"
                                leftSection={<IconMail size={18} />}
                                {...getLinkProps('/envios/gestion')}
                            />
                            <NavLink
                                label="Hojas de Reparto"
                                leftSection={<IconFileDescription size={18} />}
                                {...getLinkProps('/hojas-reparto')}
                            />
                        </NavLink>

                        {/* Reportes */}
                        <NavLink
                            label="Reportes y Métricas"
                            leftSection={<IconChartBar size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/reportes') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/reportes')}
                        />
                    </>
                )}

                {/* SECCIÓN ADMIN SYSTEM */}
                {auth?.rol === 'admin' && (
                    <>
                        <Divider my="md" color="gray.2" />
                        <NavLink
                            label="Juegos"
                            leftSection={<Gamepad2 size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/juegos') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/juegos')}
                        />
                        <NavLink
                            label="Usuarios del Sistema"
                            leftSection={<IconUsers size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/usuarios') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/usuarios')}
                        />
                    </>
                )}
            </Box>
        );
    };

    return (
        <AppShell
            header={{ height: 60 }}
            navbar={{
                width: 300,
                breakpoint: 'md',
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }}
            padding={location.pathname === '/admin/juegos' ? 0 : 'md'}
            style={{ backgroundColor: '#f3f4f6' }} // Light gray background for content area
        >
            {/* ... Header and Navbar components ... */}
            <AppShell.Header style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Group h="100%" px="md" justify="space-between">
                    {/* BRANDING LEFT */}
                    <Group>
                        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="md" size="sm" />
                        <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="md" size="sm" />

                        <Group gap="xs">
                            <Text
                                fw={900}
                                size="xl"
                                style={{
                                    fontFamily: 'Inter, sans-serif',
                                    letterSpacing: '-0.5px',
                                    color: 'var(--mantine-color-cyan-9)'
                                }}
                            >
                                SOL DEL AMANECER
                            </Text>
                        </Group>
                    </Group>

                    {/* GLOBAL NOTIFICATION BELL (RIGHT SIDE) */}
                    <Group>
                        <style>
                            {`
                            @keyframes pulse-ring {
                                0% { transform: scale(0.8); opacity: 0.5; }
                                100% { transform: scale(2.5); opacity: 0; }
                            }
                            @keyframes float {
                                0% { transform: translateY(0px); }
                                50% { transform: translateY(-2px); }
                                100% { transform: translateY(0px); }
                            }
                            `}
                        </style>
                        {['admin', 'administrativo'].includes(auth?.rol) && (
                            <Group gap={10} align="center">
                                <div style={{ position: 'relative' }}>
                                    {notificationsCount > 0 && (
                                        <div
                                            style={{
                                                position: 'absolute',
                                                top: '50%',
                                                left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: 12,
                                                height: 12,
                                                borderRadius: '50%',
                                                backgroundColor: 'rgba(255, 50, 50, 0.5)',
                                                animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
                                            }}
                                        />
                                    )}
                                    <ActionIcon
                                        variant={notificationsCount > 0 ? "filled" : "default"}
                                        color={notificationsCount > 0 ? "red" : "gray"}
                                        size={34}
                                        radius="xl"
                                        onClick={() => navigate('/admin/mantenimiento/metricas')}
                                        style={{
                                            transition: 'all 0.3s ease',
                                            border: notificationsCount > 0 ? '2px solid white' : '1px solid var(--mantine-color-gray-3)',
                                            boxShadow: notificationsCount > 0 ? '0 4px 12px rgba(255, 0, 0, 0.3)' : 'none',
                                            zIndex: 2
                                        }}
                                    >
                                        {notificationsCount > 0 ? (
                                            <IconBell size={18} fill="white" strokeWidth={1.5} />
                                        ) : (
                                            <IconBell size={16} strokeWidth={1.5} />
                                        )}
                                    </ActionIcon>
                                    {notificationsCount > 0 && (
                                        <Badge
                                            size="xs"
                                            circle
                                            color="orange"
                                            variant="filled"
                                            style={{
                                                position: 'absolute',
                                                top: -4,
                                                right: -4,
                                                border: '2px solid white',
                                                zIndex: 3,
                                                minWidth: 16,
                                                height: 16,
                                                padding: 0,
                                                fontSize: 9
                                            }}
                                        >
                                            {notificationsCount}
                                        </Badge>
                                    )}
                                </div>
                            </Group>
                        )}
                    </Group>
                </Group>
            </AppShell.Header>

            <AppShell.Navbar p={0} style={{ borderRight: '1px solid rgba(0,0,0,0.05)', backgroundColor: 'white' }}>
                <AppShell.Section grow component={ScrollArea} py="lg">
                    {renderNavItems()}
                </AppShell.Section>

                <AppShell.Section p="md" style={{ borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <Box
                        p="sm"
                        style={{
                            borderRadius: theme.radius.md,
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #e9ecef'
                        }}
                    >
                        <Stack gap="xs">
                            <Group wrap="nowrap">
                                <Avatar
                                    src={auth?.fotoPerfil ? `${apiEstaticos(auth.fotoPerfil)}` : null}
                                    size="md"
                                    radius="xl"
                                    color="cyan"
                                    variant="filled"
                                >
                                    {auth?.nombre?.[0]?.toUpperCase()}
                                </Avatar>
                                <div style={{ flex: 1, overflow: 'hidden' }}>
                                    <Text size="sm" fw={600} lineClamp={1} c="dark.4" style={{ lineHeight: 1.2 }}>
                                        {auth?.nombre}
                                    </Text>
                                    <Text
                                        size="10px"
                                        fw={700}
                                        c="cyan.6"
                                        tt="uppercase"
                                        style={{ letterSpacing: '0.5px', marginTop: 2 }}
                                    >
                                        {auth?.rol}
                                    </Text>
                                    <Text size="xs" c="dimmed" lineClamp={1} mt={2}>
                                        {auth?.email}
                                    </Text>
                                </div>
                            </Group>

                            <Divider color="gray.2" />

                            <Button
                                fullWidth
                                variant="subtle"
                                color="gray"
                                leftSection={<IconLogout size={16} stroke={1.5} />}
                                onClick={handleLogout}
                                onMouseEnter={() => setIsLogoutHovered(true)}
                                onMouseLeave={() => setIsLogoutHovered(false)}
                                justify="flex-start"
                                size="sm"
                                radius="sm"
                                style={{
                                    color: isLogoutHovered ? theme.colors.red[8] : theme.colors.gray[6],
                                    backgroundColor: isLogoutHovered ? theme.colors.red[1] : 'transparent',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                Cerrar Sesión
                            </Button>
                        </Stack>
                    </Box>
                </AppShell.Section>
            </AppShell.Navbar>

            <AppShell.Main>
                <Box
                    style={location.pathname === '/admin/juegos'
                        ? { maxWidth: 'none', margin: '0', width: '100%', height: '100%' }
                        : { maxWidth: 1600, margin: '0 auto' }
                    }
                >
                    {children}
                </Box>
            </AppShell.Main>
        </AppShell>
    );
}

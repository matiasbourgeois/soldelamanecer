import React, { useState, useEffect, useRef } from 'react';
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
    useMantineTheme,
    Badge,
    Stack,
    Button,
    ActionIcon,
    Popover,
    Paper
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useNavigate, useLocation } from 'react-router-dom';
import {
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
    UserCheck as IconUserCheck,
    Gamepad2,
    Banknote as IconBanknote,
    Shield as IconShield,
    MapPin as IconMapPin,
    Settings as IconSettings
} from 'lucide-react';
import { apiSistema, apiEstaticos } from '../../core/api/apiSistema';
import clienteAxios from '../../core/api/clienteAxios';
import { NotificacionesPanel } from './NotificacionesPanel';

export function AppLayout({ children, auth, handleLogout }) {
    const theme = useMantineTheme();
    // 📐 Responsive: monitores 19" (1366x768)
    const isSmall = useMediaQuery('(max-width: 1440px)');
    const isVerySmall = useMediaQuery('(max-width: 1366px)');
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const [isLogoutHovered, setIsLogoutHovered] = useState(false);
    const [panelAbierto, setPanelAbierto] = useState(false);
    const [notifDatos, setNotifDatos] = useState(null);
    const [notifCargando, setNotifCargando] = useState(false);
    const [notifError, setNotifError] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();

    // Total para el badge = urgentes + criticas + advertencias
    const totalNotif = notifDatos?.total || 0;
    const hayCriticas = (notifDatos?.urgentes || 0) + (notifDatos?.criticas || 0) > 0;

    const fetchNotificaciones = async () => {
        if (!['admin', 'administrativo'].includes(auth?.rol)) return;
        try {
            setNotifCargando(true);
            setNotifError(null);
            const { data } = await clienteAxios.get('/notificaciones');
            setNotifDatos(data);
        } catch (err) {
            console.error('Error cargando notificaciones:', err);
            setNotifError('No se pudieron cargar las alertas.');
        } finally {
            setNotifCargando(false);
        }
    };

    useEffect(() => {
        if (!['admin', 'administrativo'].includes(auth?.rol)) return;
        fetchNotificaciones();
        const interval = setInterval(fetchNotificaciones, 60000);
        return () => clearInterval(interval);
    }, [auth]);

    // Refresco inmediato cuando otra página despacha 'notif:refresh'
    useEffect(() => {
        const handler = () => fetchNotificaciones();
        window.addEventListener('notif:refresh', handler);
        return () => window.removeEventListener('notif:refresh', handler);
    }, []);

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
                {/* ─── PRINCIPAL ─── */}
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
                    label="Cotizador Online"
                    leftSection={<IconCalculator size={20} stroke={1.5} />}
                    component="a"
                    href="https://cotizadorlogistico.site/"
                    target="_blank"
                    variant="subtle"
                    color="cyan"
                    style={{ borderRadius: theme.radius.md, marginBottom: 4, fontWeight: 500 }}
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

                {/* ─── SECCIÓN DE ADMINISTRACIÓN Y GESTIÓN ─── */}
                {['admin', 'administrativo'].includes(auth?.rol) && (
                    <>
                        <Divider my="md" color="gray.2" />

                        {/* DOMINIO: COMERCIAL & CLIENTES */}
                        <Text size="xs" fw={700} c="dimmed" mb="xs" pl={4} tt="uppercase" style={{ letterSpacing: 1 }}>
                            Comercial
                        </Text>

                        <NavLink
                            label="Gestión de Clientes"
                            leftSection={<IconUserCheck size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/clientes') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/clientes')}
                        />

                        <Divider my="md" color="gray.2" />

                        {/* DOMINIO: LOGÍSTICA & TRÁFICO */}
                        <Text size="xs" fw={700} c="dimmed" mb="xs" pl={4} tt="uppercase" style={{ letterSpacing: 1 }}>
                            Logística & Tráfico
                        </Text>

                        <NavLink
                            label="Gestión de Cargas"
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

                        <NavLink
                            label="Distribución"
                            leftSection={<IconMapRoute size={20} stroke={1.5} />}
                            childrenOffset={28}
                            defaultOpened={isParentActive(['/admin/rutas', '/admin/control-operativo'])}
                            style={{ borderRadius: theme.radius.md, fontWeight: 600, color: theme.colors.gray[7] }}
                        >
                            <NavLink
                                label="Rutas"
                                leftSection={<IconMapPin size={18} />}
                                {...getLinkProps('/admin/rutas')}
                            />
                            <NavLink
                                label="Control Operativo"
                                leftSection={<IconSteeringWheel size={18} />}
                                {...getLinkProps('/admin/control-operativo')}
                            />
                        </NavLink>

                        <Divider my="md" color="gray.2" />

                        {/* DOMINIO: RECURSOS & ACTIVOS */}
                        <Text size="xs" fw={700} c="dimmed" mb="xs" pl={4} tt="uppercase" style={{ letterSpacing: 1 }}>
                            Recursos & Activos
                        </Text>

                        <NavLink
                            label="Flota Vehicular"
                            leftSection={<IconTruckDelivery size={20} stroke={1.5} />}
                            childrenOffset={28}
                            defaultOpened={isParentActive(['/admin/vehiculos', '/admin/mantenimiento'])}
                            style={{ borderRadius: theme.radius.md, fontWeight: 600, color: theme.colors.gray[7] }}
                        >
                            <NavLink
                                label="Vehículos"
                                leftSection={<IconTruckDelivery size={18} />}
                                {...getLinkProps('/admin/vehiculos')}
                            />
                            <NavLink
                                label="Mantenimiento"
                                leftSection={<IconTool size={18} />}
                                {...getLinkProps('/admin/mantenimiento')}
                            />
                        </NavLink>

                        <NavLink
                            label="Personal y Contratistas"
                            leftSection={<IconUsers size={20} stroke={1.5} />}
                            childrenOffset={28}
                            defaultOpened={isParentActive(['/admin/choferes', '/admin/contratados'])}
                            style={{ borderRadius: theme.radius.md, fontWeight: 600, color: theme.colors.gray[7] }}
                        >
                            <NavLink
                                label="Choferes"
                                leftSection={<IconUsers size={18} />}
                                {...getLinkProps('/admin/choferes')}
                            />
                            <NavLink
                                label="Contratados Externos"
                                leftSection={<IconUserCheck size={18} />}
                                {...getLinkProps('/admin/contratados')}
                            />
                        </NavLink>

                        <Divider my="md" color="gray.2" />

                        {/* DOMINIO: ADMINISTRACIÓN Y ANALÍTICA */}
                        <Text size="xs" fw={700} c="dimmed" mb="xs" pl={4} tt="uppercase" style={{ letterSpacing: 1 }}>
                            Administración
                        </Text>

                        <NavLink
                            label="Finanzas y Pagos"
                            leftSection={<IconBanknote size={20} stroke={1.5} />}
                            childrenOffset={28}
                            defaultOpened={isParentActive(['/admin/liquidaciones'])}
                            style={{ borderRadius: theme.radius.md, fontWeight: 600, color: theme.colors.gray[7] }}
                        >
                            <NavLink
                                label="Liquidación Contratados"
                                leftSection={<IconCalculator size={18} />}
                                {...getLinkProps('/admin/liquidaciones')}
                            />
                        </NavLink>

                        <NavLink
                            label="Reportes y Exportaciones"
                            leftSection={<IconChartBar size={20} stroke={1.5} />}
                            childrenOffset={28}
                            defaultOpened={isParentActive(['/admin/reportes'])}
                            style={{ borderRadius: theme.radius.md, fontWeight: 600, color: theme.colors.gray[7] }}
                        >
                            <NavLink
                                label="Dashboard General"
                                leftSection={<IconChartBar size={18} />}
                                {...getLinkProps('/admin/reportes')}
                            />
                            <NavLink
                                label="Logística y Rutas"
                                leftSection={<IconMapPin size={18} />}
                                {...getLinkProps('/admin/reportes/logistica')}
                            />
                        </NavLink>
                    </>
                )}

                {/* ─── DOMINIO: SISTEMA (Solo Admin) ─── */}
                {auth?.rol === 'admin' && (
                    <>
                        <Divider my="md" color="gray.2" />
                        <Text size="xs" fw={700} c="dimmed" mb="xs" pl={4} tt="uppercase" style={{ letterSpacing: 1 }}>
                            Sistema
                        </Text>

                        <NavLink
                            label="Bandeja de Aprobaciones"
                            leftSection={<IconShield size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/aprobaciones') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/aprobaciones')}
                        />
                        <NavLink
                            label="Configuración General"
                            leftSection={<IconSettings size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/configuracion') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/configuracion')}
                        />
                        <NavLink
                            label="Usuarios del Sistema"
                            leftSection={<IconShield size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/usuarios') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/usuarios')}
                        />
                        <NavLink
                            label="Juegos y Easter Eggs"
                            leftSection={<Gamepad2 size={20} stroke={1.5} />}
                            rightSection={isActive('/admin/juegos') && <IconChevronRight size={14} />}
                            {...getLinkProps('/admin/juegos')}
                        />
                    </>
                )}
            </Box>
        );
    };

    return (
        <AppShell
            header={{ height: isVerySmall ? 50 : 60 }}
            navbar={{
                width: isSmall ? 255 : 300,
                breakpoint: 'md',
                collapsed: { mobile: !mobileOpened, desktop: !desktopOpened },
            }}
            padding={location.pathname === '/admin/juegos' ? 0 : (isSmall ? 'sm' : 'md')}
            style={{ backgroundColor: '#f3f4f6' }}
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
                        <style>{`
                            @keyframes pulse-ring {
                                0% { transform: scale(0.8); opacity: 0.5; }
                                100% { transform: scale(2.5); opacity: 0; }
                            }
                            @keyframes bell-ok-glow {
                                0%   { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); }
                                50%  { box-shadow: 0 0 0 7px rgba(16,185,129,0); }
                                100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
                            }
                            @keyframes bell-ok-shimmer {
                                0%   { opacity: 0; transform: translateX(-100%) rotate(25deg); }
                                40%  { opacity: 0.45; }
                                100% { opacity: 0; transform: translateX(200%) rotate(25deg); }
                            }
                        `}</style>

                        {['admin', 'administrativo'].includes(auth?.rol) && (
                            <Popover
                                opened={panelAbierto}
                                onChange={setPanelAbierto}
                                position="bottom-end"
                                offset={8}
                                shadow="xl"
                                radius="lg"
                                withArrow
                                arrowPosition="side"
                                withinPortal
                            >
                                <Popover.Target>
                                    <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => setPanelAbierto(o => !o)}>

                                        {/* Anillo pulsante — solo en alertas críticas */}
                                        {hayCriticas && (
                                            <div style={{
                                                position: 'absolute', top: '50%', left: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: 12, height: 12, borderRadius: '50%',
                                                backgroundColor: 'rgba(255, 50, 50, 0.5)',
                                                animation: 'pulse-ring 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite'
                                            }} />
                                        )}

                                        {/* El botón de la campanita */}
                                        <ActionIcon
                                            variant="filled"
                                            size={36} radius="xl"
                                            style={{
                                                transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
                                                overflow: 'hidden',
                                                position: 'relative',
                                                zIndex: 2,
                                                // Verde cuando OK, naranja/rojo cuando hay alertas
                                                backgroundColor: totalNotif === 0
                                                    ? '#10b981'
                                                    : hayCriticas ? '#ef4444' : '#f97316',
                                                border: totalNotif === 0
                                                    ? '2px solid rgba(255,255,255,0.35)'
                                                    : '2px solid white',
                                                boxShadow: totalNotif === 0
                                                    ? '0 4px 14px rgba(16,185,129,0.45)'
                                                    : hayCriticas
                                                        ? '0 4px 14px rgba(239,68,68,0.45)'
                                                        : '0 4px 14px rgba(249,115,22,0.45)',
                                                animation: totalNotif === 0
                                                    ? 'bell-ok-glow 2.5s ease-in-out infinite'
                                                    : 'none',
                                            }}
                                        >
                                            {/* Shimmer de luz diagonal — solo en estado OK */}
                                            {totalNotif === 0 && (
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)',
                                                    animation: 'bell-ok-shimmer 3s ease-in-out infinite',
                                                    pointerEvents: 'none'
                                                }} />
                                            )}
                                            <IconBell
                                                size={18}
                                                fill="white"
                                                color="white"
                                                strokeWidth={1.5}
                                            />
                                        </ActionIcon>

                                        {/* Badge con el total — solo cuando hay alertas */}
                                        {totalNotif > 0 && (
                                            <Badge size="xs" circle
                                                color={hayCriticas ? 'red' : 'orange'}
                                                variant="filled"
                                                style={{
                                                    position: 'absolute', top: -4, right: -4,
                                                    border: '2px solid white', zIndex: 3,
                                                    minWidth: 16, height: 16, padding: 0, fontSize: 9
                                                }}
                                            >
                                                {totalNotif > 99 ? '99+' : totalNotif}
                                            </Badge>
                                        )}
                                    </div>
                                </Popover.Target>

                                <Popover.Dropdown p={0} style={{ overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    <NotificacionesPanel
                                        datos={notifDatos}
                                        cargando={notifCargando}
                                        error={notifError}
                                        onClose={() => setPanelAbierto(false)}
                                    />
                                </Popover.Dropdown>
                            </Popover>
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
                        : { maxWidth: 1600, margin: '0 auto', width: '100%' }
                    }
                >
                    {children}
                </Box>
            </AppShell.Main>
        </AppShell>
    );
}

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
    Button
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
    Calculator as IconCalculator
} from 'lucide-react';
import { apiUsuarios } from '../../core/api/apiSistema';

import { useState } from 'react';

export function AppLayout({ children, auth, handleLogout }) {
    const theme = useMantineTheme();
    const [mobileOpened, { toggle: toggleMobile }] = useDisclosure();
    const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
    const [isLogoutHovered, setIsLogoutHovered] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

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
            padding="md"
            style={{ backgroundColor: '#f3f4f6' }} // Light gray background for content area
        >
            <AppShell.Header style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                <Group h="100%" px="md" justify="space-between">
                    <Group>
                        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="md" size="sm" />
                        <Burger opened={desktopOpened} onClick={toggleDesktop} visibleFrom="md" size="sm" />

                        {/* Premium Brand Logo */}
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
                                    src={auth?.fotoPerfil ? `${apiUsuarios(auth.fotoPerfil)}` : null}
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
                <Box style={{ maxWidth: 1600, margin: '0 auto' }}>
                    {children}
                </Box>
            </AppShell.Main>
        </AppShell>
    );
}

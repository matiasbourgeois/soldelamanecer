import React from 'react';
import {
    Box, Text, Stack, Group, ThemeIcon, Badge, ScrollArea,
    Divider, ActionIcon, Loader, Center
} from '@mantine/core';
import {
    Wrench as IconTool,
    AlertTriangle as IconAlertTriangle,
    X as IconX,
    ChevronRight as IconChevronRight,
    Bell as IconBell,
    FileX as IconFileX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TIPO_CONFIG = {
    mantenimiento: {
        icono: IconTool,
        colorCritica: 'red',
        colorAdvertencia: 'orange',
        label: 'Mantenimiento'
    },
    liquidacion_rechazada: {
        icono: IconFileX,
        colorCritica: 'red',
        colorAdvertencia: 'orange',
        label: 'Liquidación'
    }
};

const SEVERIDAD_CONFIG = {
    urgente: { color: 'red', label: 'URGENTE', bg: '#fef2f2', border: '#fca5a5' },
    critica: { color: 'red', label: 'CRÍTICO', bg: '#fef2f2', border: '#fca5a5' },
    advertencia: { color: 'orange', label: 'ADVERTENCIA', bg: '#fff7ed', border: '#fed7aa' }
};

function TarjetaNotificacion({ notif, onNavigate }) {
    const navigate = useNavigate();
    const tipo = TIPO_CONFIG[notif.tipo] || TIPO_CONFIG.mantenimiento;
    const severidad = SEVERIDAD_CONFIG[notif.severidad] || SEVERIDAD_CONFIG.advertencia;
    const Icono = tipo.icono;

    const handleClick = () => {
        navigate(notif.href);
        onNavigate?.();
    };

    return (
        <Box
            onClick={handleClick}
            style={{
                background: severidad.bg,
                border: `1px solid ${severidad.border}`,
                borderRadius: 8,
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
            <ThemeIcon color={severidad.color} size={32} radius="md" variant="light" style={{ flexShrink: 0, marginTop: 1 }}>
                <Icono size={16} />
            </ThemeIcon>
            <Box style={{ flex: 1, minWidth: 0 }}>
                <Group justify="space-between" wrap="nowrap" gap={4}>
                    <Text size="xs" fw={700} c="dark.6" lineClamp={1}>{notif.titulo}</Text>
                    <Badge size="xs" color={severidad.color} variant="filled" style={{ flexShrink: 0 }}>
                        {severidad.label}
                    </Badge>
                </Group>
                <Text size="xs" c="dimmed" mt={2} lineClamp={2}>{notif.descripcion}</Text>
            </Box>
            <IconChevronRight size={14} color="#94a3b8" style={{ flexShrink: 0, marginTop: 4 }} />
        </Box>
    );
}

export function NotificacionesPanel({ datos, cargando, error, onClose }) {
    const notificaciones = datos?.notificaciones || [];

    if (cargando) {
        return (
            <Center p="xl">
                <Stack align="center" gap="xs">
                    <Loader size="sm" color="cyan" />
                    <Text size="xs" c="dimmed">Cargando alertas...</Text>
                </Stack>
            </Center>
        );
    }

    if (error) {
        return (
            <Center p="xl">
                <Text size="xs" c="red">{error}</Text>
            </Center>
        );
    }

    return (
        <Box style={{ width: 360 }}>
            {/* Header del panel */}
            <Group justify="space-between" p="md" pb="xs" style={{ borderBottom: '1px solid #f1f5f9' }}>
                <Group gap="xs">
                    <IconBell size={16} color="#0891b2" />
                    <Text fw={700} size="sm">Notificaciones</Text>
                    {notificaciones.length > 0 && (
                        <Badge size="sm" color="red" variant="filled" circle>
                            {notificaciones.length}
                        </Badge>
                    )}
                </Group>
                <ActionIcon size="sm" variant="subtle" color="gray" onClick={onClose}>
                    <IconX size={14} />
                </ActionIcon>
            </Group>

            {/* Resumen de conteos */}
            {notificaciones.length > 0 && (
                <Group p="xs" px="md" gap="xs" style={{ borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
                    {datos.urgentes > 0 && (
                        <Badge size="xs" color="red" variant="dot">{datos.urgentes} rechazo{datos.urgentes > 1 ? 's' : ''}</Badge>
                    )}
                    {datos.criticas > 0 && (
                        <Badge size="xs" color="red" variant="dot">{datos.criticas} crítico{datos.criticas > 1 ? 's' : ''}</Badge>
                    )}
                    {datos.advertencias > 0 && (
                        <Badge size="xs" color="orange" variant="dot">{datos.advertencias} advertencia{datos.advertencias > 1 ? 's' : ''}</Badge>
                    )}
                </Group>
            )}

            {/* Lista de notificaciones */}
            <ScrollArea.Autosize mah={400}>
                {notificaciones.length === 0 ? (
                    <Center p="xl">
                        <Stack align="center" gap="xs">
                            <ThemeIcon color="teal" size={40} radius="xl" variant="light">
                                <IconBell size={20} />
                            </ThemeIcon>
                            <Text size="sm" fw={600} c="teal">Todo en orden</Text>
                            <Text size="xs" c="dimmed" ta="center">Sin alertas pendientes en este momento.</Text>
                        </Stack>
                    </Center>
                ) : (
                    <Stack gap="xs" p="md">
                        {/* Separar por tipo para mejor organización visual */}
                        {['urgente', 'critica'].some(s => notificaciones.find(n => n.severidad === s)) && (
                            <>
                                <Text size="10px" fw={700} tt="uppercase" c="red.7" style={{ letterSpacing: 1 }}>
                                    🔴 Requieren Atención Inmediata
                                </Text>
                                {notificaciones
                                    .filter(n => n.severidad === 'urgente' || n.severidad === 'critica')
                                    .map(n => (
                                        <TarjetaNotificacion key={n.id} notif={n} onNavigate={onClose} />
                                    ))}
                            </>
                        )}

                        {notificaciones.find(n => n.severidad === 'advertencia') && (
                            <>
                                {notificaciones.find(n => n.severidad === 'urgente' || n.severidad === 'critica') && (
                                    <Divider my={4} />
                                )}
                                <Text size="10px" fw={700} tt="uppercase" c="orange.7" style={{ letterSpacing: 1 }}>
                                    🟠 Advertencias
                                </Text>
                                {notificaciones
                                    .filter(n => n.severidad === 'advertencia')
                                    .map(n => (
                                        <TarjetaNotificacion key={n.id} notif={n} onNavigate={onClose} />
                                    ))}
                            </>
                        )}
                    </Stack>
                )}
            </ScrollArea.Autosize>

            {/* Footer */}
            <Box p="xs" style={{ borderTop: '1px solid #f1f5f9', textAlign: 'center' }}>
                <Text size="10px" c="dimmed">Actualización automática cada 60s</Text>
            </Box>
        </Box>
    );
}

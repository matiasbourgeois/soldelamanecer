import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container, Title, Text, Button, Card, Center, Loader, Box,
    ThemeIcon, Textarea, Collapse, Group, Table, Badge, Divider, Stack
} from '@mantine/core';
import {
    Check as IconCheck,
    AlertCircle as IconAlertCircle,
    Receipt as IconReceipt2,
    X as IconX,
    MessageSquare as IconMessageSquare,
    Truck as IconTruck,
    Route as IconRoute,
    Calendar as IconCalendar,
    CreditCard as IconCreditCard
} from 'lucide-react';
import { apiSistema } from '../../../../core/api/apiSistema';
import axios from 'axios';

const fmt = (n) => (n || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
const fmtNum = (n) => (n || 0).toLocaleString('es-AR');

const ConformidadPublica = () => {
    const { token } = useParams();
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);
    const [rechazado, setRechazado] = useState(false);
    const [anulado, setAnulado] = useState(false);
    const [mostrandoRechazo, setMostrandoRechazo] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const formatearFechaUTC = (fechaStr) => {
        if (!fechaStr) return '-';
        try {
            return new Intl.DateTimeFormat('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(fechaStr));
        } catch (e) { return '-'; }
    };

    useEffect(() => { cargarDatos(); }, [token]);

    const cargarDatos = async () => {
        try {
            const { data } = await axios.get(apiSistema(`/liquidaciones/publica/${token}`));
            setDatos(data);
            if (data.estado.includes('aceptado')) setExito(true);
            else if (data.estado.includes('rechazado')) setRechazado(true);
            else if (data.estado === 'anulado') setAnulado(true);
        } catch (err) {
            setError(err.response?.data?.error || "Enlace inválido o expirado");
        } finally {
            setCargando(false);
        }
    };

    const aceptarLiquidacion = async () => {
        setProcesando(true);
        try {
            await axios.post(apiSistema(`/liquidaciones/publica/${token}/aceptar`));
            setExito(true);
        } catch (err) {
            setError(err.response?.data?.error || "Error al procesar la aceptación. Intente nuevamente.");
        } finally { setProcesando(false); }
    };

    const rechazarLiquidacion = async () => {
        if (!motivoRechazo.trim()) { setError("Debe detallar el motivo por el cual rechaza la liquidación."); return; }
        setProcesando(true);
        setError(null);
        try {
            await axios.post(apiSistema(`/liquidaciones/publica/${token}/rechazar`), { motivo: motivoRechazo });
            setRechazado(true);
        } catch (err) {
            setError(err.response?.data?.error || "Error al procesar el rechazo. Intente nuevamente.");
        } finally { setProcesando(false); }
    };

    // ── Estados de pantalla completa ────────────────────────────────────────
    if (cargando) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Stack align="center" gap="md">
                    <Loader size="xl" color="cyan" />
                    <Text c="dimmed" size="sm">Cargando tu liquidación...</Text>
                </Stack>
            </Center>
        );
    }

    if (error && !datos) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 400 }}>
                    <ThemeIcon color="red" size={64} radius="xl" mx="auto" mb="md"><IconAlertCircle size={40} /></ThemeIcon>
                    <Title order={3} mb="sm">Enlace no válido</Title>
                    <Text c="dimmed">{error}</Text>
                </Card>
            </Center>
        );
    }

    if (exito) {
        return (
            <Center style={{ minHeight: '100vh', backgroundColor: '#f0fdf4', padding: 20 }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
                    <ThemeIcon color="teal" size={80} radius="xl" mx="auto" mb="md"><IconCheck size={50} /></ThemeIcon>
                    <Title order={3} mb="sm" c="teal">¡Conformidad Registrada!</Title>
                    <Text c="dimmed" mb="md">Has marcado tu conformidad con esta liquidación. La empresa fue notificada inmediatamente.</Text>
                    <Text size="sm" c="gray">Gracias, equipo de Sol del Amanecer SRL.</Text>
                </Card>
            </Center>
        );
    }

    if (rechazado) {
        return (
            <Center style={{ minHeight: '100vh', backgroundColor: '#fff7ed', padding: 20 }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
                    <ThemeIcon color="orange" size={80} radius="xl" mx="auto" mb="md"><IconX size={50} /></ThemeIcon>
                    <Title order={3} mb="sm" c="orange">Observaciones Registradas</Title>
                    <Text c="dimmed" mb="md">Tu reclamo fue enviado a la administración. En breve nos pondremos en contacto con una liquidación corregida.</Text>
                    <Text size="sm" c="gray">Sol del Amanecer SRL</Text>
                </Card>
            </Center>
        );
    }

    if (anulado) {
        return (
            <Center style={{ minHeight: '100vh', backgroundColor: '#fef2f2', padding: 20 }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 420, width: '100%' }}>
                    <ThemeIcon color="red" size={80} radius="xl" mx="auto" mb="md"><IconAlertCircle size={50} /></ThemeIcon>
                    <Title order={3} mb="sm" c="red">Liquidación Anulada</Title>
                    <Text c="dimmed" mb="md">Esta liquidación fue cancelada por la administración. Revisá tu correo para ver el detalle actualizado.</Text>
                </Card>
            </Center>
        );
    }

    // ── Vista Principal: Detalle completo + Acciones ──────────────────────
    const hojas = datos?.hojas || [];

    return (
        <Box style={{ backgroundColor: '#f8fafc', minHeight: '100vh', padding: '20px 0 60px' }}>
            <Container size="lg">

                {/* Header */}
                <Card shadow="sm" p="lg" radius="lg" withBorder mb="md" style={{ borderLeft: '4px solid #0891b2' }}>
                    <Group justify="space-between" wrap="wrap" gap="sm">
                        <Stack gap={4}>
                            <Group gap="xs">
                                <ThemeIcon color="cyan" size={36} radius="md"><IconReceipt2 size={20} /></ThemeIcon>
                                <div>
                                    <Title order={3} style={{ color: '#0f172a', lineHeight: 1.2 }}>Resumen de Liquidación de Viajes</Title>
                                    <Text size="xs" c="dimmed">Sol del Amanecer SRL · Confidencial</Text>
                                </div>
                            </Group>
                        </Stack>
                        <Badge color="cyan" size="lg" variant="light">
                            {formatearFechaUTC(datos?.fechaInicio)} — {formatearFechaUTC(datos?.fechaFin)}
                        </Badge>
                    </Group>
                </Card>

                {/* Datos del contratado + Resumen totales */}
                <Group grow mb="md" align="stretch" wrap="wrap" gap="md">
                    <Card shadow="sm" p="md" radius="lg" withBorder>
                        <Group gap="xs" mb="xs">
                            <IconTruck size={16} color="#0891b2" />
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Contratado</Text>
                        </Group>
                        <Text fw={700} size="lg">{datos?.choferNombre}</Text>
                        {datos?.choferDni && datos.choferDni !== '-' && (
                            <Text size="sm" c="dimmed">DNI: {datos.choferDni}</Text>
                        )}
                    </Card>

                    <Card shadow="sm" p="md" radius="lg" withBorder>
                        <Group gap="xs" mb="xs">
                            <IconCalendar size={16} color="#0891b2" />
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Resumen Operativo</Text>
                        </Group>
                        <Text size="sm">{datos?.diasTrabajados || 0} Viaje(s) realizados</Text>
                        <Text size="sm">KMs Base: <strong>{fmtNum(datos?.kmBaseTotal)}</strong></Text>
                        <Text size="sm">KMs Extra: <strong>{fmtNum(datos?.kmExtraTotal)}</strong></Text>
                    </Card>

                    <Card shadow="sm" p="md" radius="lg" withBorder style={{ backgroundColor: '#ecfeff', borderColor: '#0891b2' }}>
                        <Group gap="xs" mb="xs">
                            <IconCreditCard size={16} color="#0891b2" />
                            <Text size="xs" fw={700} tt="uppercase" c="dimmed">Total a Cobrar</Text>
                        </Group>
                        <Text fw={900} size="28px" style={{ color: '#0891b2', lineHeight: 1.1 }}>
                            {fmt(datos?.montoTotal)}
                        </Text>
                        <Text size="xs" c="dimmed" mt={4}>Período {formatearFechaUTC(datos?.fechaInicio)} al {formatearFechaUTC(datos?.fechaFin)}</Text>
                    </Card>
                </Group>

                {/* Tabla de viajes */}
                {hojas.length > 0 && (
                    <Card shadow="sm" p="lg" radius="lg" withBorder mb="md">
                        <Group gap="xs" mb="md">
                            <IconRoute size={18} color="#0891b2" />
                            <Title order={5} c="#0f172a">Detalle de Viajes Realizados</Title>
                        </Group>
                        <Box style={{ overflowX: 'auto' }}>
                            <Table striped highlightOnHover withTableBorder withColumnBorders
                                styles={{
                                    th: { backgroundColor: '#0891b2', color: 'white', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', whiteSpace: 'nowrap' },
                                    td: { fontSize: 12, color: '#334155', padding: '8px 10px' }
                                }}>
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Fecha</Table.Th>
                                        <Table.Th>Ruta</Table.Th>
                                        <Table.Th>Salida</Table.Th>
                                        <Table.Th>Descripción</Table.Th>
                                        <Table.Th>Vehículo</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>KMs Base</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>KMs Extra</Table.Th>
                                        <Table.Th>Observaciones</Table.Th>
                                        <Table.Th style={{ textAlign: 'right' }}>Subtotal</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {hojas.map((h, i) => (
                                        <Table.Tr key={i}>
                                            <Table.Td fw={600} style={{ whiteSpace: 'nowrap' }}>{h.fecha}</Table.Td>
                                            <Table.Td style={{ whiteSpace: 'nowrap' }}>
                                                <Badge variant="light" color="cyan" size="sm">{h.ruta}</Badge>
                                            </Table.Td>
                                            <Table.Td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{h.horaSalida}</Table.Td>
                                            <Table.Td style={{ fontSize: 11, maxWidth: 180 }}>{h.descripcion}</Table.Td>
                                            <Table.Td style={{ whiteSpace: 'nowrap', fontSize: 11 }}>{h.vehiculo}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{h.kmBase > 0 ? fmtNum(h.kmBase) : '-'}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right' }}>{h.kmExtra > 0 ? fmtNum(h.kmExtra) : '-'}</Table.Td>
                                            <Table.Td style={{ fontSize: 10, maxWidth: 140, color: '#64748b' }}>{h.observaciones}</Table.Td>
                                            <Table.Td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                {h.subtotal > 0 ? fmt(h.subtotal) : <Text size="xs" c="dimmed">{h.detallePago}</Text>}
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                </Table.Tbody>
                                <Table.Tfoot>
                                    <Table.Tr style={{ backgroundColor: '#f0fdf4' }}>
                                        <Table.Th colSpan={8} style={{ textAlign: 'right', fontSize: 13, color: '#0f172a' }}>
                                            TOTAL A LIQUIDAR:
                                        </Table.Th>
                                        <Table.Th style={{ textAlign: 'right', fontSize: 16, color: '#0891b2' }}>
                                            {fmt(datos?.montoTotal)}
                                        </Table.Th>
                                    </Table.Tr>
                                </Table.Tfoot>
                            </Table>
                        </Box>
                    </Card>
                )}

                {/* Área de acciones */}
                <Card shadow="md" p="xl" radius="lg" withBorder style={{ maxWidth: 560, margin: '0 auto' }}>
                    <Title order={4} ta="center" mb="xs">Tu Conformidad</Title>
                    <Text size="sm" c="dimmed" ta="center" mb="lg">
                        Revisá el detalle de viajes aquí arriba. Si estás de acuerdo con los montos, hacé clic en <strong>Aceptar</strong>. Si hay alguna diferencia, usá el botón de <strong>Observar Diferencias</strong>.
                    </Text>

                    {error && (
                        <Text c="red" size="sm" ta="center" mb="md" fw={500}>{error}</Text>
                    )}

                    <Collapse in={mostrandoRechazo}>
                        <Box mb="md" p="md" style={{ backgroundColor: '#fafafa', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                            <Textarea
                                placeholder="Ej: El viaje del 05/02 no lo realicé, o los km del 10/02 no coinciden..."
                                label="Detallá las diferencias que encontrás"
                                description="Tu reclamo será enviado a la administración para confeccionar una nueva liquidación corregida."
                                required
                                minRows={4}
                                value={motivoRechazo}
                                onChange={(e) => setMotivoRechazo(e.currentTarget.value)}
                            />
                            <Group grow mt="sm">
                                <Button variant="default" onClick={() => { setMostrandoRechazo(false); setError(null); }}>Cancelar</Button>
                                <Button color="orange" onClick={rechazarLiquidacion} loading={procesando}>Enviar Observaciones</Button>
                            </Group>
                        </Box>
                    </Collapse>

                    {!mostrandoRechazo && (
                        <Stack gap="sm">
                            <Button
                                fullWidth size="lg" color="teal"
                                onClick={aceptarLiquidacion} loading={procesando}
                                leftSection={<IconCheck size={20} />}
                                style={{ backgroundColor: '#10b981', boxShadow: '0 4px 14px 0 rgba(16,185,129,0.35)' }}
                            >
                                ACEPTAR Y CONFORMAR
                            </Button>

                            <Button
                                fullWidth variant="subtle" color="red"
                                onClick={() => setMostrandoRechazo(true)}
                                leftSection={<IconMessageSquare size={16} />}
                            >
                                Observar Diferencias (Rechazar)
                            </Button>

                            <Divider />
                            <Text size="xs" c="dimmed" ta="center">
                                Al hacer clic en "Aceptar y Conformar", usted declara estar de acuerdo con todos los viajes detallados arriba y con los montos expresados. Si no confirma en 3 días hábiles, la liquidación se considerará conformada automáticamente.
                            </Text>
                        </Stack>
                    )}
                </Card>
            </Container>
        </Box>
    );
};

export default ConformidadPublica;

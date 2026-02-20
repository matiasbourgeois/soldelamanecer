import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Title,
    Text,
    Button,
    Card,
    Center,
    Loader,
    Box,
    ThemeIcon,
    Textarea,
    Collapse,
    Group
} from '@mantine/core';
import { Check as IconCheck, AlertCircle as IconAlertCircle, Receipt as IconReceipt2, X as IconX, MessageSquare as IconMessageSquare } from 'lucide-react';
import { apiSistema } from '../../../../core/api/apiSistema';

const ConformidadPublica = () => {
    const { token } = useParams();
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(false);
    const [datos, setDatos] = useState(null);
    const [error, setError] = useState(null);
    const [exito, setExito] = useState(false);

    // Rechazo/Anulación States
    const [rechazado, setRechazado] = useState(false);
    const [anulado, setAnulado] = useState(false);
    const [mostrandoRechazo, setMostrandoRechazo] = useState(false);
    const [motivoRechazo, setMotivoRechazo] = useState('');

    const formatearFechaUTC = (fechaStr) => {
        if (!fechaStr) return '-';
        try {
            return new Intl.DateTimeFormat('es-AR', {
                timeZone: 'UTC',
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(new Date(fechaStr));
        } catch (e) {
            return '-';
        }
    };

    useEffect(() => {
        cargarDatos();
    }, [token]);

    const cargarDatos = async () => {
        try {
            const { data } = await apiSistema.get(`/liquidaciones/publica/${token}`);
            setDatos(data);
            if (data.estado.includes('aceptado')) {
                setExito(true);
            } else if (data.estado.includes('rechazado')) {
                setRechazado(true);
            } else if (data.estado === 'anulado') {
                setAnulado(true);
            }
        } catch (err) {
            setError(err.response?.data?.error || "Enlace inválido o expirado");
        } finally {
            setCargando(false);
        }
    };

    const aceptarLiquidacion = async () => {
        setProcesando(true);
        try {
            await apiSistema.post(`/liquidaciones/publica/${token}/aceptar`);
            setExito(true);
        } catch (err) {
            setError(err.response?.data?.error || "Error al procesar la aceptación. Intente nuevamente.");
        } finally {
            setProcesando(false);
        }
    };

    const rechazarLiquidacion = async () => {
        if (!motivoRechazo.trim()) {
            setError("Debe detallar el motivo por el cual rechaza la liquidación.");
            return;
        }

        setProcesando(true);
        setError(null);
        try {
            await apiSistema.post(`/liquidaciones/publica/${token}/rechazar`, { motivo: motivoRechazo });
            setRechazado(true);
        } catch (err) {
            setError(err.response?.data?.error || "Error al procesar el rechazo. Intente nuevamente.");
        } finally {
            setProcesando(false);
        }
    };

    if (cargando) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Loader size="xl" color="cyan" />
            </Center>
        );
    }

    if (error && !datos) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 400 }}>
                    <ThemeIcon color="red" size={64} radius="xl" mx="auto" mb="md">
                        <IconAlertCircle size={40} />
                    </ThemeIcon>
                    <Title order={3} mb="sm">Enlace no válido</Title>
                    <Text color="dimmed">{error}</Text>
                </Card>
            </Center>
        );
    }

    if (exito) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 400 }}>
                    <ThemeIcon color="teal" size={80} radius="xl" mx="auto" mb="md">
                        <IconCheck size={50} />
                    </ThemeIcon>
                    <Title order={3} mb="sm" color="teal">Liquidación Aceptada</Title>
                    <Text color="dimmed" mb="md">
                        Has marcado tu conformidad con la liquidación y la empresa ha sido notificada.
                    </Text>
                    <Text size="sm" color="gray">Gracias, equipo de Sol del Amanecer.</Text>
                </Card>
            </Center>
        );
    }

    if (rechazado) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 400 }}>
                    <ThemeIcon color="orange" size={80} radius="xl" mx="auto" mb="md">
                        <IconX size={50} />
                    </ThemeIcon>
                    <Title order={3} mb="sm" color="orange">Liquidación Observada</Title>
                    <Text color="dimmed" mb="md">
                        Has observado diferencias en esta liquidación. Tu reclamo ha sido enviado a la administración.
                    </Text>
                    <Text size="sm" color="gray">En breve nos pondremos en contacto con vos con una corrección.</Text>
                </Card>
            </Center>
        );
    }

    if (anulado) {
        return (
            <Center style={{ height: '100vh', backgroundColor: '#f8fafc' }}>
                <Card shadow="lg" p="xl" radius="md" style={{ textAlign: 'center', maxWidth: 400 }}>
                    <ThemeIcon color="red" size={80} radius="xl" mx="auto" mb="md">
                        <IconAlertCircle size={50} />
                    </ThemeIcon>
                    <Title order={3} mb="sm" color="red">Liquidación Anulada</Title>
                    <Text color="dimmed" mb="md">
                        Esta liquidación ha sido cancelada o modificada por la administración de la empresa.
                    </Text>
                    <Text size="sm" color="gray">Por favor, revisá tu correo, pronto recibirás el detalle actualizado.</Text>
                </Card>
            </Center>
        );
    }

    return (
        <Center style={{ height: '100vh', backgroundColor: '#f8fafc', padding: '20px' }}>
            <Card shadow="xl" p="xl" radius="lg" style={{ maxWidth: 450, width: '100%' }} withBorder>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <Box sx={(theme) => ({
                        backgroundColor: theme.colors.cyan[0],
                        padding: '15px',
                        borderRadius: '50%',
                        display: 'inline-block',
                        marginBottom: '10px'
                    })}>
                        <IconReceipt2 size={48} color="#0891b2" />
                    </Box>
                    <Title order={2} color="#0f172a">Firma de Conformidad</Title>
                    <Text color="dimmed" size="sm" mt="xs">Sist. de Transporte Sol del Amanecer SRL</Text>
                </div>

                <div style={{ backgroundColor: '#f1f5f9', padding: '15px', borderRadius: '8px', marginBottom: '25px' }}>
                    <Text weight={600} align="center" mb="xs">Hola, {datos?.choferNombre}</Text>
                    <Text size="sm" align="center" color="dimmed">
                        Este documento digital tiene validez de conformidad sobre la liquidación correspondiente al período:
                    </Text>
                    <Text weight={700} align="center" mt="sm">
                        {formatearFechaUTC(datos?.fechaInicio)} - {formatearFechaUTC(datos?.fechaFin)}
                    </Text>

                    <Box mt="lg" style={{ borderTop: '1px solid #cbd5e1', paddingTop: '15px', textAlign: 'center' }}>
                        <Text size="sm" color="dimmed" mb="xs">Total Liquidado a su favor:</Text>
                        <Text size="xl" weight={900} color="teal">
                            {datos?.montoTotal?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </Text>
                    </Box>
                </div>

                {error && (
                    <Text color="red" size="sm" align="center" mb="md" weight={500}>{error}</Text>
                )}

                <Collapse in={mostrandoRechazo}>
                    <Box mb="md" p="md" sx={(theme) => ({ backgroundColor: theme.colors.gray[0], borderRadius: theme.radius.md })}>
                        <Textarea
                            placeholder="Detalle los viajes o kilómetros que no coinciden..."
                            label="Motivo del Rechazo"
                            description="Estos comentarios serán enviados directo a la administración para confeccionar una nueva liquidación."
                            required
                            minRows={3}
                            value={motivoRechazo}
                            onChange={(event) => setMotivoRechazo(event.currentTarget.value)}
                        />
                        <Group grow mt="sm">
                            <Button variant="default" onClick={() => setMostrandoRechazo(false)}>Cancelar</Button>
                            <Button color="orange" onClick={rechazarLiquidacion} loading={procesando}>Enviar Reclamo</Button>
                        </Group>
                    </Box>
                </Collapse>

                {!mostrandoRechazo && (
                    <>
                        <Button
                            fullWidth
                            size="lg"
                            color="teal"
                            onClick={aceptarLiquidacion}
                            loading={procesando}
                            leftIcon={<IconCheck size={20} />}
                            style={{
                                backgroundColor: '#10b981',
                                boxShadow: '0 4px 14px 0 rgba(16, 185, 129, 0.39)'
                            }}
                        >
                            ACEPTAR Y CONFORMAR
                        </Button>

                        <Button
                            fullWidth
                            variant="subtle"
                            color="red"
                            mt="sm"
                            onClick={() => setMostrandoRechazo(true)}
                            leftIcon={<IconMessageSquare size={16} />}
                        >
                            Observar Diferencias (Rechazar)
                        </Button>

                        <Text size="xs" color="dimmed" align="center" mt="xl">
                            Al hacer clic en "Aceptar y Conformar", usted declara estar de acuerdo con los viajes detallados en el PDF enviado a su casilla de correo y con los montos aquí expresados.
                        </Text>
                    </>
                )}
            </Card>
        </Center>
    );
};

export default ConformidadPublica;

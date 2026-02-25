import React, { useState, useEffect, useMemo } from 'react';
import {
    Container,
    Title,
    Paper,
    Text,
    Grid,
    Select,
    Button,
    Table,
    Badge,
    Group,
    ActionIcon,
    Stack,
    Box,
    Tabs,
    Popover,
    Pagination,
    Center,
    ThemeIcon,
    ScrollArea,
    Divider,
    Tooltip
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
    Calculator as IconCalculator,
    Mail as IconMail,
    Check as IconCheck,
    FileText as IconFileText,
    AlertCircle as IconAlertCircle,
    Receipt as IconReceipt,
    RefreshCw as IconRefreshCw,
    ShieldAlert as IconShieldAlert,
    Ban as IconBan,
    Eye as IconEye,
    Download as IconDownload
} from 'lucide-react';
import { mostrarAlerta } from '../../../../core/utils/alertaGlobal';
import { confirmarAccion } from '../../../../core/utils/confirmarAccion';
import clienteAxios from '../../../../core/api/clienteAxios';

const LiquidacionesAdmin = () => {
    const [choferes, setChoferes] = useState([]);

    const formatearFechaUTC = (fechaStr) => {
        if (!fechaStr) return '-';
        try {
            // Se le suma el offset asumiendo que el backend devolvió un UTC puro medianoche
            const d = new Date(fechaStr);
            const userTimezoneOffset = d.getTimezoneOffset() * 60000;
            const dateConOffset = new Date(d.getTime() + userTimezoneOffset);

            return new Intl.DateTimeFormat('es-AR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            }).format(dateConOffset);
        } catch (e) {
            return '-';
        }
    };

    const obtenerMesYAnio = (fechaStr) => {
        if (!fechaStr) return '';
        try {
            const d = new Date(fechaStr);
            const userTimezoneOffset = d.getTimezoneOffset() * 60000;
            const dateConOffset = new Date(d.getTime() + userTimezoneOffset);

            let txt = new Intl.DateTimeFormat('es-AR', { month: 'long', year: 'numeric' }).format(dateConOffset);
            return txt.charAt(0).toUpperCase() + txt.slice(1);
        } catch (e) {
            return '';
        }
    };

    const formatearYYYYMMDDLocal = (dateOb) => {
        if (!dateOb) return '';
        const d = new Date(dateOb); // Forzamos parseo seguro por si entra como String ISO
        if (isNaN(d.getTime())) return ''; // Proteccion extra

        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const obtenerPrimerDiaMesAnterior = () => {
        const d = new Date();
        d.setMonth(d.getMonth() - 1);
        d.setDate(1);
        d.setHours(0, 0, 0, 0);
        return d;
    };

    const obtenerUltimoDiaMesAnterior = () => {
        const d = new Date();
        d.setDate(0);
        d.setHours(23, 59, 59, 999);
        return d;
    };

    // Form Simulation
    const [choferSeleccionado, setChoferSeleccionado] = useState('');
    const [fechaInicio, setFechaInicio] = useState(obtenerPrimerDiaMesAnterior());
    const [fechaFin, setFechaFin] = useState(obtenerUltimoDiaMesAnterior());

    // Results
    const [simulacion, setSimulacion] = useState(null);
    const [cargandoSimulacion, setCargandoSimulacion] = useState(false);
    const [paginaHojas, setPaginaHojas] = useState(1);
    const HOJAS_POR_PAGINA = 10;

    // History
    const [historial, setHistorial] = useState([]);
    const [cargandoHistorial, setCargandoHistorial] = useState(false);
    const [paginaHistorial, setPaginaHistorial] = useState(1);
    const ITEMS_POR_PAGINA = 15;

    useEffect(() => {
        cargarChoferes();
        cargarHistorial();
    }, []);

    const cargarChoferes = async () => {
        try {
            const { data } = await clienteAxios.get('/choferes/contratados', { params: { limite: 1000 } });
            // El backend devuelve paginación con { contratados: [...] }
            const lista = data.contratados || [];
            const choferesActivos = lista.filter(c => c.activo !== false);
            setChoferes(choferesActivos.map(c => ({
                value: c._id,
                label: `${c.usuario?.nombre || 'Sin nombre'} (${c.dni})`
            })));
        } catch (error) {
            console.error("Error al cargar choferes:", error);
            mostrarAlerta('No se pudieron cargar los choferes', 'error');
        }
    };

    const cargarHistorial = async () => {
        setCargandoHistorial(true);
        try {
            const { data } = await clienteAxios.get('/liquidaciones');
            setHistorial(data);
        } catch (error) {
            console.error("Error al cargar historial:", error);
            mostrarAlerta('No se pudo cargar el historial de liquidaciones', 'error');
        } finally {
            setCargandoHistorial(false);
        }
    };

    const simularLiquidacion = async () => {
        if (!choferSeleccionado || !fechaInicio || !fechaFin) {
            return mostrarAlerta('Seleccione un chofer y un rango de fechas', 'warning');
        }

        setCargandoSimulacion(true);
        try {
            const fI = formatearYYYYMMDDLocal(fechaInicio);
            const fF = formatearYYYYMMDDLocal(fechaFin);

            const { data } = await clienteAxios.post('/liquidaciones/simular', {
                choferId: choferSeleccionado,
                fechaInicio: fI,
                fechaFin: fF
            });

            if (!data.totales || data.hojasValidas.length === 0) {
                mostrarAlerta('El chofer no tiene viajes a liquidar en este periodo.', 'info');
                setSimulacion(null);
                return;
            }

            setSimulacion(data);
            setPaginaHojas(1); // Reset pagination on new simulation
        } catch (error) {
            console.error("Error al simular:", error);
            mostrarAlerta(error.response?.data?.error || 'Error al calcular totales', 'error');
        } finally {
            setCargandoSimulacion(false);
        }
    };

    const guardarLiquidacion = async () => {
        try {
            const fI = formatearYYYYMMDDLocal(fechaInicio);
            const fF = formatearYYYYMMDDLocal(fechaFin);

            const { data } = await clienteAxios.post('/liquidaciones', {
                choferId: choferSeleccionado,
                fechaInicio: fI,
                fechaFin: fF
            });
            mostrarAlerta('Liquidación guardada correctamente', 'success');
            setSimulacion(null);
            cargarHistorial();
        } catch (error) {
            console.error("Error al guardar:", error);
            mostrarAlerta(error.response?.data?.error || 'Error al guardar liquidación', 'error');
        }
    };

    const enviarEmail = async (id) => {
        const confirmar = await confirmarAccion('¿Enviar Notificación?', '¿Estás seguro de enviar la notificación legal por correo a este chofer?', 'info');
        if (!confirmar) return;

        try {
            mostrarAlerta('Preparando PDF y enviando correo...', 'info');
            await clienteAxios.post(`/liquidaciones/enviar/${id}`);
            mostrarAlerta('Correo enviado correctamente', 'success');
            cargarHistorial();
        } catch (error) {
            console.error("Error enviando email:", error);
            mostrarAlerta(error.response?.data?.error || 'No se pudo enviar el email', 'error');
        }
    };

    const anularLiquidacion = async (id) => {
        const confirmar = await confirmarAccion('Anular Liquidación', '🚨 ¿Estás seguro de que querés ANULAR esta liquidación? Esta acción es irreversible y liberará todas las hojas de reparto.', 'danger', { textoConfirmar: 'Sí, Anular' });
        if (!confirmar) return;

        try {
            mostrarAlerta('Anulando liquidación...', 'warning');
            await clienteAxios.post(`/liquidaciones/${id}/anular`);
            mostrarAlerta('Liquidación anulada exitosamente', 'success');
            cargarHistorial();
        } catch (error) {
            console.error("Error anulando liquidacion:", error);
            mostrarAlerta(error.response?.data?.error || 'No se pudo anular la liquidación', 'error');
        }
    };

    const descargarPDF = async (id) => {
        try {
            mostrarAlerta('Generando y descargando PDF...', 'info');
            const response = await clienteAxios.get(`/liquidaciones/${id}/pdf`, { responseType: 'blob' });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Liquidacion_${id}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            mostrarAlerta('PDF descargado con éxito', 'success');
        } catch (error) {
            console.error("Error descargando PDF:", error);
            mostrarAlerta('No se pudo descargar el PDF', 'error');
        }
    };

    const colorearEstado = (estado) => {
        const colores = {
            'borrador': 'gray',
            'enviado': 'blue',
            'rechazado': 'orange',
            'aceptado_manual': 'teal',
            'aceptado_automatico': 'green',
            'anulado': 'red.5',
            'pagado': 'grape'
        };
        return colores[estado] || 'dark';
    };

    // Paginated Data
    const historialPaginado = useMemo(() => {
        const inicio = (paginaHistorial - 1) * ITEMS_POR_PAGINA;
        return historial.slice(inicio, inicio + ITEMS_POR_PAGINA);
    }, [historial, paginaHistorial]);

    const totalPaginasHistorial = Math.ceil(historial.length / ITEMS_POR_PAGINA);

    const hojasPaginadas = useMemo(() => {
        if (!simulacion?.hojasValidas) return [];
        const inicio = (paginaHojas - 1) * HOJAS_POR_PAGINA;
        return simulacion.hojasValidas.slice(inicio, inicio + HOJAS_POR_PAGINA);
    }, [simulacion, paginaHojas]);

    const totalPaginasHojas = simulacion ? Math.ceil(simulacion.hojasValidas.length / HOJAS_POR_PAGINA) : 0;

    return (
        <Container size="xl" py="xl">
            <Group justify="space-between" mb="xl">
                <Box>
                    <Title order={2} style={{ color: '#0f172a', fontWeight: 800 }}>
                        Liquidaciones de Contratados
                    </Title>
                    <Text c="dimmed" mt={5}>Simulación, emisión y control de pagos a choferes.</Text>
                </Box>
            </Group>

            <Tabs defaultValue="simulador" variant="pills" radius="md" color="cyan">
                <Tabs.List mb="xl">
                    <Tabs.Tab value="simulador" leftSection={<IconCalculator size={16} />}>Nueva Liquidación</Tabs.Tab>
                    <Tabs.Tab value="historial" leftSection={<IconFileText size={16} />}>Historial de Liquidaciones</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="simulador">
                    <Paper shadow="sm" p="xl" radius="md" withBorder>
                        <Text fw={700} size="lg" mb="md" c="dark.4">Filtros de Simulación</Text>
                        <Grid align="flex-end" mb="md">
                            <Grid.Col span={{ base: 12, sm: 4 }}>
                                <Select
                                    label="Chofer Contratado"
                                    placeholder="Seleccione un chofer"
                                    data={choferes}
                                    value={choferSeleccionado}
                                    onChange={setChoferSeleccionado}
                                    searchable
                                    required
                                    radius="md"
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 3 }}>
                                <DatePickerInput
                                    label="Fecha de Inicio"
                                    placeholder="DD/MM/YYYY"
                                    value={fechaInicio}
                                    onChange={setFechaInicio}
                                    valueFormat="DD/MM/YYYY"
                                    clearable
                                    required
                                    radius="md"
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 3 }}>
                                <DatePickerInput
                                    label="Fecha de Fin"
                                    placeholder="DD/MM/YYYY"
                                    value={fechaFin}
                                    onChange={setFechaFin}
                                    valueFormat="DD/MM/YYYY"
                                    clearable
                                    required
                                    radius="md"
                                />
                            </Grid.Col>
                            <Grid.Col span={{ base: 12, sm: 2 }}>
                                <Button
                                    fullWidth
                                    size="sm"
                                    color="cyan"
                                    onClick={simularLiquidacion}
                                    loading={cargandoSimulacion}
                                    radius="md"
                                >
                                    SIMULAR
                                </Button>
                            </Grid.Col>
                        </Grid>
                    </Paper>

                    {simulacion && (
                        <Box mt="xl">
                            {/* Panel Total a Pagar y Guardar a la derecha */}
                            <Paper p="md" radius="md" shadow="sm" withBorder style={{ backgroundColor: '#f8f9fa' }}>
                                <Group justify="space-between" align="center">
                                    <Box>
                                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Total Estimado a Pagar</Text>
                                        <Text size="32px" fw={900} c="cyan.9" lh={1.2}>
                                            {simulacion.totales.montoTotalViajes.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                        </Text>
                                        <Text size="xs" c="dimmed" mt={4}>
                                            Chofer actual: <strong>{simulacion.choferNombre}</strong>
                                        </Text>
                                    </Box>
                                    <Button
                                        color="teal.6"
                                        size="lg"
                                        radius="md"
                                        onClick={guardarLiquidacion}
                                        leftSection={<IconCheck size={20} />}
                                    >
                                        Guardar Liquidación
                                    </Button>
                                </Group>
                            </Paper>

                            {simulacion.hojasValidas && simulacion.hojasValidas.length > 0 ? (
                                <Box mt="xl">
                                    <Grid mb="xl">
                                        <Grid.Col span={4}>
                                            <Paper p="md" radius="md" shadow="sm" align="center" withBorder style={{ borderTop: '4px solid #06b6d4' }}>
                                                <ThemeIcon size={32} radius="md" color="cyan" variant="light" mb="xs"><IconFileText size={16} /></ThemeIcon>
                                                <Text size="xs" c="dimmed" fw={600} tt="uppercase">Días Trabajados</Text>
                                                <Text size="24px" fw={800} c="#0f172a">{simulacion.totales.diasTrabajados}</Text>
                                            </Paper>
                                        </Grid.Col>
                                        <Grid.Col span={4}>
                                            <Paper p="md" radius="md" shadow="sm" align="center" withBorder style={{ borderTop: '4px solid #f59e0b' }}>
                                                <ThemeIcon size={32} radius="md" color="orange" variant="light" mb="xs"><IconReceipt size={16} /></ThemeIcon>
                                                <Text size="xs" c="dimmed" fw={600} tt="uppercase">KMs Base</Text>
                                                <Text size="24px" fw={800} c="#0f172a">{simulacion.totales.kmBaseAcumulados} <span style={{ fontSize: '14px', color: '#64748b' }}>km</span></Text>
                                            </Paper>
                                        </Grid.Col>
                                        <Grid.Col span={4}>
                                            <Paper p="md" radius="md" shadow="sm" align="center" withBorder style={{ borderTop: '4px solid #ef4444' }}>
                                                <ThemeIcon size={32} radius="md" color="red" variant="light" mb="xs"><IconAlertCircle size={16} /></ThemeIcon>
                                                <Text size="xs" c="dimmed" fw={600} tt="uppercase">KMs Extra</Text>
                                                <Text size="24px" fw={800} c="#0f172a">{simulacion.totales.kmExtraAcumulados} <span style={{ fontSize: '14px', color: '#64748b' }}>km</span></Text>
                                            </Paper>
                                        </Grid.Col>
                                    </Grid>

                                    <Paper shadow="sm" radius="md" withBorder>
                                        <Box p="md" style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <Text fw={700} size="lg">Detalle Desglosado de Viajes</Text>
                                        </Box>
                                        <ScrollArea>
                                            <Table verticalSpacing="sm" horizontalSpacing="md">
                                                <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                                                    <Table.Tr>
                                                        <Table.Th>Fecha</Table.Th>
                                                        <Table.Th>Ruta</Table.Th>
                                                        <Table.Th>Vehículo (Patente)</Table.Th>
                                                        <Table.Th>Modo de Cálculo</Table.Th>
                                                        <Table.Th ta="right">Monto Ganado</Table.Th>
                                                    </Table.Tr>
                                                </Table.Thead>
                                                <Table.Tbody>
                                                    {hojasPaginadas.map(hoja => (
                                                        <Table.Tr key={hoja._id}>
                                                            <Table.Td><Text size="sm" fw={500}>{formatearFechaUTC(hoja.fecha)}</Text></Table.Td>
                                                            <Table.Td><Text fw={600} size="sm">{hoja.ruta?.codigo || '-'}</Text></Table.Td>
                                                            <Table.Td><Badge color="blue" variant="dot">{hoja.vehiculo?.patente || '-'}</Badge></Table.Td>
                                                            <Table.Td><Text size="sm" c="dimmed">{hoja.detallePago || '-'}</Text></Table.Td>
                                                            <Table.Td ta="right">
                                                                <Text fw={700} c="teal.7">
                                                                    {hoja.subtotal ? hoja.subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' }) : '-'}
                                                                </Text>
                                                            </Table.Td>
                                                        </Table.Tr>
                                                    ))}
                                                    {simulacion.montoMesAdicional > 0 && paginaHojas === totalPaginasHojas && (
                                                        <Table.Tr style={{ backgroundColor: '#fdfdfd' }}>
                                                            <Table.Td colSpan={3}></Table.Td>
                                                            <Table.Td ta="right"><Text fw={700} c="dimmed">Adicional Tarifa Mensual Fija:</Text></Table.Td>
                                                            <Table.Td ta="right"><Text fw={800} c="green.8" size="md">{simulacion.montoMesAdicional.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</Text></Table.Td>
                                                        </Table.Tr>
                                                    )}
                                                </Table.Tbody>
                                            </Table>
                                        </ScrollArea>
                                        {totalPaginasHojas > 1 && (
                                            <>
                                                <Divider />
                                                <Group justify="center" p="md">
                                                    <Pagination
                                                        page={paginaHojas}
                                                        onChange={setPaginaHojas}
                                                        total={totalPaginasHojas}
                                                        color="cyan"
                                                        radius="md"
                                                    />
                                                </Group>
                                            </>
                                        )}
                                    </Paper>
                                </Box>
                            ) : (
                                <Center p="xl" style={{ height: '200px', backgroundColor: '#f8f9fa', borderRadius: '8px' }} mt="md">
                                    <Stack align="center" gap="xs">
                                        <IconAlertCircle size={40} color="#adb5bd" />
                                        <Text c="dimmed" fw={500}>No se encontraron viajes sin liquidar para este chofer en las fechas indicadas.</Text>
                                    </Stack>
                                </Center>
                            )}
                        </Box>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="historial">
                    <Paper shadow="sm" radius="md" withBorder>
                        <ScrollArea>
                            <Table verticalSpacing="sm" horizontalSpacing="md">
                                <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                                    <Table.Tr>
                                        <Table.Th w={100}>Emisión</Table.Th>
                                        <Table.Th>Chofer</Table.Th>
                                        <Table.Th>Período Analizado</Table.Th>
                                        <Table.Th>Totales</Table.Th>
                                        <Table.Th>Estado</Table.Th>
                                        <Table.Th ta="right">Acciones</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {historialPaginado.map(liq => (
                                        <Table.Tr key={liq._id}>
                                            <Table.Td>
                                                <Text size="sm" fw={500}>
                                                    {new Date(liq.fechas.creacion).toLocaleDateString('es-AR')}
                                                </Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text fw={700}>{liq.chofer?.usuario?.nombre}</Text>
                                                <Text size="xs" c="dimmed">DNI: {liq.chofer?.dni}</Text>
                                            </Table.Td>
                                            <Table.Td>
                                                <Stack gap={2}>
                                                    <Text size="sm" fw={700} c="dark.3">{obtenerMesYAnio(liq.periodo.inicio)}</Text>
                                                    <Badge color="cyan" variant="outline" size="sm">
                                                        {formatearFechaUTC(liq.periodo.inicio)} - {formatearFechaUTC(liq.periodo.fin)}
                                                    </Badge>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Text fw={800} c="cyan.9" size="md">
                                                    {liq.totales?.montoTotalViajes?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                                                </Text>
                                                <Group gap={12} mt={4}>
                                                    <Text size="xs" fw={500} c="dark.6">DÍAS: <span style={{ fontWeight: 700 }}>{liq.totales?.diasTrabajados}</span></Text>
                                                    <Text size="xs" fw={500} c="dark.6">KMS BASE: <span style={{ fontWeight: 700 }}>{liq.totales?.kmBaseAcumulados}</span></Text>
                                                    <Text size="xs" fw={500} c="dark.6">KMS EXTRA: <span style={{ fontWeight: 700 }}>{liq.totales?.kmExtraAcumulados}</span></Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={8} align="center">
                                                    <Badge color={colorearEstado(liq.estado)} variant="filled">
                                                        {liq.estado.replace('_', ' ').toUpperCase()}
                                                    </Badge>
                                                    {(liq.estado === 'rechazado' || liq.estado === 'anulado') && liq.motivoRechazo && (
                                                        <Popover width={300} position="bottom" withArrow shadow="md">
                                                            <Popover.Target>
                                                                <ActionIcon size="sm" color="red" variant="light" radius="xl">
                                                                    <IconShieldAlert size={14} />
                                                                </ActionIcon>
                                                            </Popover.Target>
                                                            <Popover.Dropdown>
                                                                <Group gap="xs" mb={5}>
                                                                    <IconAlertCircle size={16} color="#e11d48" />
                                                                    <Text size="sm" fw={700} c="red.7">Motivo de Anulación/Rechazo:</Text>
                                                                </Group>
                                                                <Text size="sm" c="gray.7" fs="italic">"{liq.motivoRechazo}"</Text>
                                                            </Popover.Dropdown>
                                                        </Popover>
                                                    )}
                                                </Group>

                                                <Stack gap={2} mt={6}>
                                                    {liq.fechas.envio && (
                                                        <Group gap={4}><IconMail size={12} color="#868e96" /><Text size="xs" c="dimmed">Enviado: {new Date(liq.fechas.envio).toLocaleDateString()}</Text></Group>
                                                    )}
                                                    {liq.fechas.aceptacion && (
                                                        <Group gap={4}><IconCheck size={12} color="#12b886" /><Text size="xs" c="teal.6" fw={500}>Aprobado: {new Date(liq.fechas.aceptacion).toLocaleDateString()}</Text></Group>
                                                    )}
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td ta="right">
                                                <Group gap={6} justify="flex-end" wrap="nowrap">
                                                    {liq.estado === 'borrador' && (
                                                        <Button
                                                            size="xs"
                                                            leftSection={<IconMail size={14} />}
                                                            color="blue"
                                                            radius="md"
                                                            onClick={() => enviarEmail(liq._id)}
                                                        >
                                                            Enviar PDF
                                                        </Button>
                                                    )}
                                                    {['enviado', 'rechazado'].includes(liq.estado) && (
                                                        <Tooltip label="Reenviar Correo">
                                                            <ActionIcon
                                                                variant="light"
                                                                color="blue"
                                                                radius="md"
                                                                onClick={() => enviarEmail(liq._id)}
                                                            >
                                                                <IconMail size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                    {liq.estado !== 'borrador' && liq.estado !== 'anulado' && (
                                                        <Tooltip label="Descargar PDF">
                                                            <ActionIcon
                                                                variant="light"
                                                                color="grape"
                                                                radius="md"
                                                                onClick={() => descargarPDF(liq._id)}
                                                            >
                                                                <IconDownload size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                    {liq.estado !== 'borrador' && liq.estado !== 'anulado' && (
                                                        <Tooltip label="Anular Oficialmente">
                                                            <ActionIcon
                                                                variant="light"
                                                                color="red"
                                                                radius="md"
                                                                onClick={() => anularLiquidacion(liq._id)}
                                                            >
                                                                <IconBan size={16} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    ))}
                                    {historial.length === 0 && !cargandoHistorial && (
                                        <Table.Tr>
                                            <Table.Td colSpan={6}>
                                                <Center py="xl">
                                                    <Stack align="center" gap="xs">
                                                        <IconReceipt size={32} color="#dee2e6" />
                                                        <Text c="dimmed" fw={500}>Aún no hay liquidaciones registradas en el sistema.</Text>
                                                    </Stack>
                                                </Center>
                                            </Table.Td>
                                        </Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </ScrollArea>

                        {totalPaginasHistorial > 1 && (
                            <>
                                <Divider />
                                <Group justify="center" p="md" style={{ backgroundColor: '#f8f9fa' }}>
                                    <Pagination
                                        page={paginaHistorial}
                                        onChange={setPaginaHistorial}
                                        total={totalPaginasHistorial}
                                        color="cyan"
                                        radius="md"
                                    />
                                </Group>
                            </>
                        )}
                    </Paper>
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
};

export default LiquidacionesAdmin;

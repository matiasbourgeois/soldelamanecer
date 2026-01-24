import React, { useState, useEffect } from 'react';
import { DateInput } from '@mantine/dates';
import {
    Title, Paper, Text, Group, Button, Table, Badge, ActionIcon,
    Tooltip, Modal, NumberInput, Select, Textarea, LoadingOverlay,
    Grid, Alert, Pagination, Stack, TextInput, HoverCard, Progress,
    ThemeIcon, Divider, Avatar, Box, Center, RingProgress, Autocomplete,
    Container
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconRefresh, IconSettings, IconTool, IconAlertTriangle, IconCheck,
    IconHistory, IconEdit, IconDeviceFloppy, IconPlus, IconTrash,
    IconGauge, IconCalendar, IconCurrencyDollar, IconNote, IconSearch, IconX,
    IconDatabase, IconBooks
} from '@tabler/icons-react';
import { apiSistema } from '../../../../core/api/apiSistema';
import axios from 'axios';
import { notifications } from '@mantine/notifications';

// --- SUB-COMPONENTS ---
const StatusBadge = ({ vehiculo }) => {
    let critical = 0;
    let warning = 0;
    let total = 0;

    const details = vehiculo.configuracionMantenimiento?.map(c => {
        const kmRecorrido = vehiculo.kilometrajeActual - c.ultimoKm;
        const restante = c.frecuenciaKm - kmRecorrido;
        const progress = Math.min(100, Math.max(0, (kmRecorrido / c.frecuenciaKm) * 100));

        let status = 'green';
        if (restante <= 0) { status = 'red'; critical++; }
        else if (restante <= 1000) { status = 'yellow'; warning++; }

        total++;
        return { ...c, restante, progress, status };
    }) || [];

    if (total === 0) {
        return <Badge color="gray" variant="light" style={{ width: 120, justifyContent: 'center' }}>Sin Config</Badge>;
    }

    const badgeStyle = { width: 120, justifyContent: 'center', cursor: 'pointer' };

    let MainBadge;
    if (critical > 0) {
        MainBadge = <Badge color="red" variant="filled" fullWidth style={badgeStyle} leftSection={<IconAlertTriangle size={14} />}>{critical} Vencidos</Badge>;
    } else if (warning > 0) {
        MainBadge = <Badge color="yellow" variant="light" fullWidth style={badgeStyle} leftSection={<IconAlertTriangle size={14} />}>{warning} Próximos</Badge>;
    } else {
        MainBadge = <Badge color="teal" variant="light" fullWidth style={badgeStyle} leftSection={<IconCheck size={14} />}>Operativo</Badge>;
    }

    return (
        <HoverCard width={320} shadow="md" withArrow openDelay={200} closeDelay={200}>
            <HoverCard.Target>
                <div style={{ cursor: 'pointer' }}>{MainBadge}</div>
            </HoverCard.Target>
            <HoverCard.Dropdown>
                <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb="xs">
                    Estado de Mantenimiento
                </Text>
                <Stack gap="sm">
                    {details.map((item, idx) => (
                        <div key={idx}>
                            <Group justify="space-between" mb={4}>
                                <Text size="sm" fw={500}>{item.nombre}</Text>
                                <Text size="xs" c={item.status === 'red' ? 'red' : 'dimmed'} fw={700}>
                                    {item.restante <= 0 ? `${Math.abs(item.restante)} km VENCIDO` : `Restan ${item.restante} km`}
                                </Text>
                            </Group>
                            <Progress
                                value={item.progress}
                                color={item.status}
                                size="sm"
                                radius="xl"
                                striped={item.status === 'red'}
                                animated={item.status === 'red'}
                            />
                        </div>
                    ))}
                </Stack>
            </HoverCard.Dropdown>
        </HoverCard>
    );
};

const MantenimientoAdmin = () => {
    const [vehiculos, setVehiculos] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const limite = 10;

    // Modals
    const [modalKmOpened, { open: openKm, close: closeKm }] = useDisclosure(false);
    const [modalServiceOpened, { open: openService, close: closeService }] = useDisclosure(false);
    const [modalConfigOpened, { open: openConfig, close: closeConfig }] = useDisclosure(false);

    const [selectedVehiculo, setSelectedVehiculo] = useState(null);
    const [searchText, setSearchText] = useState('');

    // Forms
    const [nuevoKm, setNuevoKm] = useState(0);
    const [tipoService, setTipoService] = useState(null);
    const [costoService, setCostoService] = useState(0);
    const [obsService, setObsService] = useState('');
    const [fechaService, setFechaService] = useState(new Date());
    const [kmService, setKmService] = useState(0);
    const [nuevoTipoNombre, setNuevoTipoNombre] = useState('');
    const [nuevoTipoFrecuencia, setNuevoTipoFrecuencia] = useState(10000);
    const [nuevoTipoUltimoKm, setNuevoTipoUltimoKm] = useState(0); // <-- Nuevo estado para baseline
    const [editandoConfig, setEditandoConfig] = useState(null);
    const [nuevaFrecuenciaEdit, setNuevaFrecuenciaEdit] = useState(0);
    const [nuevaUltimoKmEdit, setNuevaUltimoKmEdit] = useState(0);

    // Knowledge Base State
    const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
    const [openedTipos, { open: openTipos, close: closeTipos }] = useDisclosure(false);
    const [nuevoTipoBase, setNuevoTipoBase] = useState({ nombre: '', codigo: '', frecuenciaKmDefault: 10000 });
    const [editandoTipoBase, setEditandoTipoBase] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchVehiculos(paginaActual);
        fetchTiposMantenimiento();
    }, [paginaActual]);

    const fetchTiposMantenimiento = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(apiSistema('/mantenimientos-tipo'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTiposMantenimiento(res.data);
        } catch (e) {
            console.error("Error fetching types", e);
        }
    };

    const fetchVehiculos = async (pagina = paginaActual) => {
        setCargando(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(apiSistema(`/vehiculos/paginado?pagina=${pagina - 1}&limite=${limite}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.resultados) {
                setVehiculos(response.data.resultados);
                setTotalPaginas(Math.ceil(response.data.total / limite));
            } else {
                setVehiculos(response.data);
            }
        } catch (error) {
            console.error(error);
            notifications.show({ title: 'Error', message: 'No se cargaron los vehículos', color: 'red' });
        } finally {
            setCargando(false);
        }
    };

    // Actions
    const handleUpdateKm = async (force = false) => {
        if (!nuevoKm && nuevoKm !== 0) return;

        // Si el KM es menor al actual, pedir confirmación extra
        if (nuevoKm < selectedVehiculo.kilometrajeActual && !force) {
            if (!window.confirm(`¿Estás seguro de que deseas retroceder el odómetro de ${selectedVehiculo.kilometrajeActual.toLocaleString()} a ${nuevoKm.toLocaleString()}?`)) {
                return;
            }
        }

        try {
            const token = localStorage.getItem('token');
            await axios.patch(apiSistema(`/vehiculos/${selectedVehiculo._id}/km`),
                { kilometraje: nuevoKm }, { headers: { Authorization: `Bearer ${token}` } }
            );
            notifications.show({ title: 'KM Actualizado', message: 'El kilometraje ha sido registrado.', color: 'green' });
            closeKm();
            fetchVehiculos();
        } catch (error) {
            notifications.show({
                title: 'Error',
                message: error.response?.data?.error || 'Fallo al actualizar',
                color: 'red'
            });
        }
    };

    const handleRegisterService = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(apiSistema(`/vehiculos/${selectedVehiculo._id}/mantenimiento/registro`), {
                nombreTipo: tipoService, costo: costoService, observaciones: obsService,
                fecha: fechaService, kmAlMomento: kmService
            }, { headers: { Authorization: `Bearer ${token}` } });
            notifications.show({ title: 'Servicio Registrado', message: 'Mantenimiento reseteado correctamente.', color: 'green' });
            closeService();
            fetchVehiculos();
        } catch (error) {
            notifications.show({ title: 'Error', message: 'Fallo al registrar', color: 'red' });
        }
    };

    const handleAddConfig = async () => {
        // Validar que el nombre coincida exactamente con uno de la base de conocimiento
        const match = tiposMantenimiento.find(t => t.nombre === nuevoTipoNombre);
        if (!match) {
            notifications.show({ title: 'Error', message: 'Debés seleccionar un mantenimiento válido de la lista.', color: 'red' });
            return;
        }

        // Validar Duplicados Locales
        const yaExiste = selectedVehiculo.configuracionMantenimiento?.some(c => c.nombre === nuevoTipoNombre);
        if (yaExiste) {
            notifications.show({ title: 'Error', message: 'Este vehículo ya tiene configurado este mantenimiento.', color: 'red' });
            return;
        }

        if (nuevoTipoUltimoKm > selectedVehiculo.kilometrajeActual) {
            notifications.show({ title: 'Validación', message: 'El punto de partida no puede ser mayor al kilometraje actual', color: 'red' });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(apiSistema(`/vehiculos/${selectedVehiculo._id}/mantenimiento/config`), {
                nombre: nuevoTipoNombre,
                frecuenciaKm: nuevoTipoFrecuencia,
                ultimoKm: nuevoTipoUltimoKm
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notifications.show({ title: 'Éxito', message: 'Configuración agregada', color: 'green' });
            setNuevoTipoNombre('');
            setNuevoTipoFrecuencia(10000);

            if (res.data) {
                setSelectedVehiculo(res.data);
            }

            fetchVehiculos();
        } catch (e) {
            notifications.show({ title: 'Error', message: 'No se pudo agregar', color: 'red' });
        }
    };

    const handleDeleteConfig = async (nombreConfig) => {
        if (!window.confirm(`¿Seguro que querés eliminar "${nombreConfig}"?`)) return;
        try {
            const token = localStorage.getItem('token');
            const res = await axios.delete(apiSistema(`/vehiculos/${selectedVehiculo._id}/mantenimiento/config/${nombreConfig}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            notifications.show({ title: 'Éxito', message: 'Mantenimiento eliminado', color: 'blue' });

            if (res.data) {
                setSelectedVehiculo(res.data);
            }
            fetchVehiculos();
        } catch (e) {
            notifications.show({ title: 'Error', message: 'No se pudo eliminar', color: 'red' });
        }
    };

    const handleEditConfig = async () => {
        if (!editandoConfig) return;
        if (nuevaUltimoKmEdit > selectedVehiculo.kilometrajeActual) {
            notifications.show({ title: 'Validación', message: 'El punto de partida no puede ser mayor al kilometraje actual', color: 'red' });
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const res = await axios.put(apiSistema(`/vehiculos/${selectedVehiculo._id}/mantenimiento/config`), {
                nombre: editandoConfig.nombre,
                nuevaFrecuenciaKm: nuevaFrecuenciaEdit,
                ultimoKm: nuevaUltimoKmEdit
            }, { headers: { Authorization: `Bearer ${token}` } });

            notifications.show({ title: 'Actualizado', color: 'green' });
            setEditandoConfig(null);

            if (res.data) {
                setSelectedVehiculo(res.data);
            }

            fetchVehiculos();
        } catch (error) {
            notifications.show({
                title: 'Error de Validación',
                message: error.response?.data?.error || 'No se pudo actualizar la configuración',
                color: 'red'
            });
        }
    };

    // Tipos Mantenimiento Actions
    const handleAddTipoBase = async () => {
        // Validar Duplicados en la Base local antes de enviar
        const yaExisteNombre = tiposMantenimiento.some(t => t.nombre.toLowerCase() === nuevoTipoBase.nombre.toLowerCase());
        const yaExisteCodigo = tiposMantenimiento.some(t => t.codigo?.toLowerCase() === nuevoTipoBase.codigo.toLowerCase());

        if (yaExisteNombre || yaExisteCodigo) {
            notifications.show({ title: 'Duplicado', message: 'El nombre o el código ya existen en la base.', color: 'orange' });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(apiSistema('/mantenimientos-tipo'), nuevoTipoBase, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notifications.show({ title: 'Éxito', message: 'Tipo agregado a la base de conocimiento', color: 'green' });
            setNuevoTipoBase({ nombre: '', codigo: '', frecuenciaKmDefault: 10000 });
            fetchTiposMantenimiento();
        } catch (e) {
            notifications.show({ title: 'Error', message: e.response?.data?.error || 'No se pudo agregar', color: 'red' });
        }
    };

    const handleDeleteTipoBase = async (id) => {
        if (!window.confirm("¿Seguro que querés eliminar este tipo de la base de conocimiento?")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(apiSistema(`/mantenimientos-tipo/${id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            notifications.show({ title: 'Eliminado', color: 'blue' });
            fetchTiposMantenimiento();
        } catch (e) {
            notifications.show({ title: 'Error', color: 'red' });
        }
    };

    const handleUpdateTipoBase = async () => {
        if (!editandoTipoBase) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(apiSistema(`/mantenimientos-tipo/${editandoTipoBase._id}`), editandoTipoBase, {
                headers: { Authorization: `Bearer ${token}` }
            });
            notifications.show({ title: 'Actualizado', color: 'green' });
            setEditandoTipoBase(null);
            fetchTiposMantenimiento();
        } catch (e) {
            notifications.show({ title: 'Error', color: 'red' });
        }
    };

    // Open Handlers
    const openKmModalHandler = (v) => { setSelectedVehiculo(v); setNuevoKm(v.kilometrajeActual); openKm(); };
    const openServiceModalHandler = (v) => {
        setSelectedVehiculo(v); setTipoService(null); setCostoService(0);
        setObsService(''); setFechaService(new Date()); setKmService(v.kilometrajeActual);
        openService();
    };
    const openConfigModalHandler = (v) => {
        setSelectedVehiculo(v);
        setNuevoTipoUltimoKm(v.kilometrajeActual); // <-- Pre-completar con KM actual
        setNuevoTipoNombre(''); setNuevoTipoFrecuencia(10000);
        setEditandoConfig(null); openConfig();
    };

    // Filter Logic
    const filteredVehiculos = vehiculos.filter(v =>
        v.patente.toLowerCase().includes(searchText.toLowerCase()) ||
        v.modelo.toLowerCase().includes(searchText.toLowerCase())
    );

    return (
        <Container size="xl" py="md">
            <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
                {/* HEADER */}
                <Group justify="space-between" mb="md">
                    <div>
                        <Title order={2} fw={700} c="dimmed">Gestión de Flota</Title>
                        <Text c="dimmed" size="sm">Control de mantenimientos y kilometraje</Text>
                    </div>
                    <Group>
                        <TextInput
                            placeholder="Buscar patente..."
                            leftSection={<IconSearch size={16} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.currentTarget.value)}
                        />
                        <Button variant="outline" color="indigo" leftSection={<IconBooks size={18} />} onClick={openTipos}>
                            Base de Conocimiento
                        </Button>
                        <Button variant="light" color="cyan" leftSection={<IconRefresh size={16} />} onClick={() => fetchVehiculos(paginaActual)}>
                            Actualizar
                        </Button>
                    </Group>
                </Group>

                {/* TABLE */}
                <Box style={{ overflow: 'hidden' }}>
                    <Table striped highlightOnHover verticalSpacing="sm">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ width: 120 }}>Patente</Table.Th>
                                <Table.Th>Vehículo</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Kilometraje</Table.Th>
                                <Table.Th style={{ textAlign: 'center' }}>Estado General</Table.Th>
                                <Table.Th style={{ textAlign: 'right', paddingRight: 30 }}>Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {filteredVehiculos.map(v => (
                                <Table.Tr key={v._id}>
                                    <Table.Td>
                                        <Badge
                                            size="md"
                                            variant="light"
                                            color="cyan"
                                            radius="sm"
                                            style={{
                                                width: 110,
                                                display: 'flex',
                                                justifyContent: 'center',
                                                fontSize: 13,
                                                letterSpacing: '1px',
                                                fontWeight: 700
                                            }}
                                        >
                                            {v.patente}
                                        </Badge>
                                    </Table.Td>
                                    <Table.Td>
                                        <Text fw={600} size="sm" c="dimmed">{v.marca} {v.modelo}</Text>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Text
                                            size="sm"
                                            fw={600}
                                            c="dimmed"
                                        >
                                            {v.kilometrajeActual?.toLocaleString()} km
                                        </Text>
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'center' }}>
                                        <Center>
                                            <StatusBadge vehiculo={v} />
                                        </Center>
                                    </Table.Td>
                                    <Table.Td>
                                        <Group justify="flex-end" gap={4} pr="md">
                                            <Tooltip label="Actualizar KM">
                                                <ActionIcon variant="subtle" color="blue" size="md" onClick={() => openKmModalHandler(v)}>
                                                    <IconGauge size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Registrar Service">
                                                <ActionIcon variant="subtle" color="cyan" size="md" onClick={() => openServiceModalHandler(v)}>
                                                    <IconTool size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label="Configuración">
                                                <ActionIcon variant="subtle" color="gray" size="md" onClick={() => openConfigModalHandler(v)}>
                                                    <IconSettings size={18} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                    {/* Pagination (Simplified) */}
                    {totalPaginas > 1 && (
                        <Group justify="center" p="md" style={{ borderTop: '1px solid #dee2e6' }}>
                            <Pagination total={totalPaginas} value={paginaActual} onChange={setPaginaActual} color="cyan" />
                        </Group>
                    )}
                </Box>
            </Paper>

            {/* --- MODALS --- */}

            {/* 1. KM UPDATE MODAL */}
            <Modal opened={modalKmOpened} onClose={closeKm} title={<Text fw={700}>Actualizar Kilometraje</Text>} centered>
                {selectedVehiculo && (
                    <Stack>
                        {nuevoKm < selectedVehiculo.kilometrajeActual ? (
                            <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light">
                                Estás ingresando un kilometraje <b>menor</b> al actual. Esto corregirá el odómetro del vehículo.
                            </Alert>
                        ) : (
                            <Alert icon={<IconGauge size={16} />} color="blue" variant="light">
                                Ingresá el nuevo valor del odómetro.
                            </Alert>
                        )}
                        <Group grow>
                            <Paper withBorder p="xs" ta="center">
                                <Text size="xs" c="dimmed" tt="uppercase">Actual</Text>
                                <Text fw={700} size="lg">{selectedVehiculo.kilometrajeActual?.toLocaleString()}</Text>
                            </Paper>
                            <IconRefresh size={24} color="gray" style={{ alignSelf: 'center' }} />
                            <Paper withBorder p="xs" ta="center" bg="blue.0" style={{ borderColor: 'var(--mantine-color-blue-3)' }}>
                                <Text size="xs" c="blue" tt="uppercase" fw={700}>Nuevo</Text>
                                <Text fw={700} size="lg" c="blue">{nuevoKm?.toLocaleString()}</Text>
                            </Paper>
                        </Group>
                        <NumberInput
                            label="Nuevo Valor"
                            placeholder="Ej: 15500"
                            value={nuevoKm}
                            onChange={(val) => setNuevoKm(val)}
                            min={0}
                            step={100}
                            size="md"
                        />
                        <Button fullWidth mt="md" size="md" onClick={handleUpdateKm}>Guardar Cambios</Button>
                    </Stack>
                )}
            </Modal>

            {/* 2. REGISTER SERVICE MODAL */}
            <Modal opened={modalServiceOpened} onClose={closeService} title={<Text fw={700}>Registrar Mantenimiento</Text>} centered size="lg">
                {selectedVehiculo && (
                    <Grid>
                        <Grid.Col span={12}>
                            <Alert icon={<IconAlertTriangle size={16} />} color="orange" variant="light" mb="md">
                                Al guardar, el contador de kilómetros para este tipo de mantenimiento volverá a 0.
                            </Alert>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Select
                                label="Tipo de Service"
                                placeholder="Seleccionar..."
                                data={selectedVehiculo.configuracionMantenimiento?.map(c => c.nombre) || []}
                                value={tipoService}
                                onChange={setTipoService}
                                leftSection={<IconTool size={16} />}
                                required
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <DateInput
                                label="Fecha Realizado"
                                value={fechaService}
                                onChange={setFechaService}
                                maxDate={new Date()}
                                leftSection={<IconCalendar size={16} />}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Kilometraje al momento"
                                value={kmService}
                                onChange={setKmService}
                                leftSection={<IconGauge size={16} />}
                            />
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <NumberInput
                                label="Costo Total"
                                value={costoService}
                                onChange={setCostoService}
                                leftSection={<IconCurrencyDollar size={16} />}
                                prefix="$"
                            />
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <Textarea
                                label="Observaciones"
                                placeholder="Taller, repuestos cambiados, notas..."
                                value={obsService}
                                onChange={(e) => setObsService(e.target.value)}
                                minRows={3}
                            />
                        </Grid.Col>
                        <Grid.Col span={12}>
                            <Button fullWidth size="md" color="cyan" onClick={handleRegisterService} disabled={!tipoService}>
                                Registrar Service
                            </Button>
                        </Grid.Col>
                    </Grid>
                )}
            </Modal>

            {/* 3. CONFIG MODAL */}
            <Modal opened={modalConfigOpened} onClose={closeConfig} title={<Text fw={700}>Configuración de Mantenimiento</Text>} size="xl" centered>
                {selectedVehiculo && (
                    <Stack>
                        <Group justify="space-between" align="center">
                            <Text size="sm" c="dimmed">Gestioná las alertas para <b>{selectedVehiculo.patente}</b></Text>
                        </Group>

                        <Paper withBorder radius="md" style={{ overflowX: 'auto' }}>
                            <Table verticalSpacing="sm">
                                <Table.Thead>
                                    <Table.Tr>
                                        <Table.Th>Tipo</Table.Th>
                                        <Table.Th style={{ width: 150 }}>Frecuencia</Table.Th>
                                        <Table.Th style={{ width: 180 }}>Punto de Partida (KM)</Table.Th>
                                        <Table.Th style={{ width: 100, textAlign: 'right' }}>Acción</Table.Th>
                                    </Table.Tr>
                                </Table.Thead>
                                <Table.Tbody>
                                    {selectedVehiculo.configuracionMantenimiento?.length > 0 ? (
                                        selectedVehiculo.configuracionMantenimiento.map((c, i) => (
                                            <Table.Tr key={i}>
                                                <Table.Td>
                                                    <Text fw={500} size="sm">{c.nombre}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    {editandoConfig?.nombre === c.nombre ? (
                                                        <NumberInput
                                                            size="xs"
                                                            value={nuevaFrecuenciaEdit}
                                                            onChange={setNuevaFrecuenciaEdit}
                                                            step={1000}
                                                            suffix=" km"
                                                        />
                                                    ) : (
                                                        <Badge variant="light" color="indigo">{c.frecuenciaKm.toLocaleString()} km</Badge>
                                                    )}
                                                </Table.Td>
                                                <Table.Td>
                                                    {editandoConfig?.nombre === c.nombre ? (
                                                        <NumberInput
                                                            size="xs"
                                                            value={nuevaUltimoKmEdit}
                                                            onChange={setNuevaUltimoKmEdit}
                                                            step={1000}
                                                            suffix=" km"
                                                            max={selectedVehiculo.kilometrajeActual}
                                                            error={nuevaUltimoKmEdit > selectedVehiculo.kilometrajeActual ? "No puede ser mayor al actual" : null}
                                                        />
                                                    ) : (
                                                        <Text size="sm" fw={700} c="dimmed">{c.ultimoKm?.toLocaleString()} km</Text>
                                                    )}
                                                </Table.Td>
                                                <Table.Td style={{ textAlign: 'right' }}>
                                                    <Group gap={5} justify="flex-end" wrap="nowrap">
                                                        {editandoConfig?.nombre === c.nombre ? (
                                                            <>
                                                                <ActionIcon size="md" variant="filled" color="green" onClick={handleEditConfig}>
                                                                    <IconDeviceFloppy size={16} />
                                                                </ActionIcon>
                                                                <ActionIcon size="md" variant="light" color="gray" onClick={() => setEditandoConfig(null)}>
                                                                    <IconX size={16} />
                                                                </ActionIcon>
                                                            </>
                                                        ) : (
                                                            <ActionIcon
                                                                size="md"
                                                                variant="subtle"
                                                                color="blue"
                                                                onClick={() => {
                                                                    setEditandoConfig(c);
                                                                    setNuevaFrecuenciaEdit(c.frecuenciaKm);
                                                                    setNuevaUltimoKmEdit(c.ultimoKm || 0);
                                                                }}
                                                            >
                                                                <IconEdit size={18} />
                                                            </ActionIcon>
                                                        )}
                                                        <ActionIcon
                                                            size="md"
                                                            variant="subtle"
                                                            color="red"
                                                            onClick={() => handleDeleteConfig(c.nombre)}
                                                        >
                                                            <IconTrash size={18} />
                                                        </ActionIcon>
                                                    </Group>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))
                                    ) : (
                                        <Table.Tr><Table.Td colSpan={3}><Text c="dimmed" size="xs" ta="center">Sin configuración</Text></Table.Td></Table.Tr>
                                    )}
                                </Table.Tbody>
                            </Table>
                        </Paper>

                        <Paper withBorder p="md" radius="md">
                            <Text fw={700} size="xs" mb="md" c="indigo" style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                + Agregar Nuevo Mantenimiento
                            </Text>
                            <Grid align="flex-end" gutter="xs">
                                <Grid.Col span={{ base: 12, md: 4 }}>
                                    <Select
                                        label="Mantenimiento"
                                        placeholder="Buscá por nombre o código"
                                        data={tiposMantenimiento.map(t => ({
                                            value: t.nombre,
                                            label: `[${t.codigo}] ${t.nombre}`
                                        }))}
                                        searchable
                                        nothingFoundMessage="No se encontró el mantenimiento"
                                        value={nuevoTipoNombre}
                                        onChange={(val) => {
                                            setNuevoTipoNombre(val);
                                            const match = tiposMantenimiento.find(t => t.nombre === val);
                                            if (match) setNuevoTipoFrecuencia(match.frecuenciaKmDefault);
                                        }}
                                        error={selectedVehiculo.configuracionMantenimiento?.some(c => c.nombre === nuevoTipoNombre) ? "Ya está configurado" : null}
                                        styles={{ label: { fontSize: 12, fontWeight: 700 } }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 6, md: 2 }}>
                                    <NumberInput
                                        label="Frecuencia"
                                        placeholder="KM"
                                        value={nuevoTipoFrecuencia}
                                        onChange={setNuevoTipoFrecuencia}
                                        step={1000}
                                        min={1}
                                        suffix=" km"
                                        styles={{ label: { fontSize: 12, fontWeight: 700 } }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 6, md: 3 }}>
                                    <NumberInput
                                        label="Punto Partida"
                                        description={`Máx: ${selectedVehiculo.kilometrajeActual.toLocaleString()} km`}
                                        value={nuevoTipoUltimoKm}
                                        onChange={setNuevoTipoUltimoKm}
                                        step={1000}
                                        max={selectedVehiculo.kilometrajeActual}
                                        error={nuevoTipoUltimoKm > selectedVehiculo.kilometrajeActual ? "Supera el KM actual" : null}
                                        styles={{
                                            label: { fontSize: 12, fontWeight: 700 },
                                            description: { fontSize: 9, marginTop: -2 }
                                        }}
                                    />
                                </Grid.Col>
                                <Grid.Col span={{ base: 12, md: 3 }}>
                                    <Button
                                        fullWidth
                                        color="indigo"
                                        leftSection={<IconPlus size={16} />}
                                        onClick={handleAddConfig}
                                        disabled={!nuevoTipoNombre}
                                    >
                                        Agregar
                                    </Button>
                                </Grid.Col>
                            </Grid>
                        </Paper>
                    </Stack>
                )}
            </Modal>

            {/* MODAL: BASE DE CONOCIMIENTO (TIPOS) */}
            <Modal opened={openedTipos} onClose={closeTipos} title="Base de Conocimiento de Mantenimientos" size="lg">
                <Stack>
                    <Paper withBorder p="md" radius="md">
                        <Text fw={700} size="xs" mb="md" c="indigo">+ Nuevo Tipo de Mantenimiento</Text>
                        <Grid align="flex-end" gutter="xs">
                            <Grid.Col span={4}>
                                <TextInput
                                    label="Código"
                                    placeholder="Ej: MANT-01"
                                    value={nuevoTipoBase.codigo}
                                    onChange={(e) => setNuevoTipoBase({ ...nuevoTipoBase, codigo: e.currentTarget.value.toUpperCase() })}
                                    error={tiposMantenimiento.some(t => t.codigo === nuevoTipoBase.codigo) ? "Código repetido" : null}
                                />
                            </Grid.Col>
                            <Grid.Col span={4}>
                                <TextInput
                                    label="Nombre"
                                    placeholder="Ej: Correa de Distribución"
                                    value={nuevoTipoBase.nombre}
                                    onChange={(e) => setNuevoTipoBase({ ...nuevoTipoBase, nombre: e.currentTarget.value })}
                                    error={tiposMantenimiento.some(t => t.nombre.toLowerCase() === nuevoTipoBase.nombre.toLowerCase()) ? "Nombre repetido" : null}
                                />
                            </Grid.Col>
                            <Grid.Col span={3}>
                                <NumberInput
                                    label="Frecuencia Default"
                                    value={nuevoTipoBase.frecuenciaKmDefault}
                                    onChange={(val) => setNuevoTipoBase({ ...nuevoTipoBase, frecuenciaKmDefault: val })}
                                    step={1000}
                                    suffix=" km"
                                />
                            </Grid.Col>
                            <Grid.Col span={1}>
                                <Button fullWidth color="indigo" onClick={handleAddTipoBase} disabled={!nuevoTipoBase.nombre || !nuevoTipoBase.codigo}>
                                    Crear
                                </Button>
                            </Grid.Col>
                        </Grid>
                    </Paper>

                    <Table verticalSpacing="xs">
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th style={{ width: 100 }}>Código</Table.Th>
                                <Table.Th>Nombre</Table.Th>
                                <Table.Th>Frecuencia Sugerida</Table.Th>
                                <Table.Th style={{ textAlign: 'right' }}>Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {tiposMantenimiento.map(t => (
                                <Table.Tr key={t._id}>
                                    <Table.Td>
                                        {editandoTipoBase?._id === t._id ? (
                                            <TextInput
                                                size="xs"
                                                value={editandoTipoBase.codigo}
                                                onChange={(e) => setEditandoTipoBase({ ...editandoTipoBase, codigo: e.currentTarget.value.toUpperCase() })}
                                                error={tiposMantenimiento.some(item => item._id !== t._id && item.codigo === editandoTipoBase.codigo) ? "Ya existe" : null}
                                            />
                                        ) : (
                                            <Badge variant="outline" color="gray">{t.codigo}</Badge>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {editandoTipoBase?._id === t._id ? (
                                            <TextInput
                                                size="xs"
                                                value={editandoTipoBase.nombre}
                                                onChange={(e) => setEditandoTipoBase({ ...editandoTipoBase, nombre: e.currentTarget.value })}
                                                error={tiposMantenimiento.some(item => item._id !== t._id && item.nombre.toLowerCase() === editandoTipoBase.nombre.toLowerCase()) ? "Ya existe" : null}
                                            />
                                        ) : (
                                            <Text fw={600}>{t.nombre}</Text>
                                        )}
                                    </Table.Td>
                                    <Table.Td>
                                        {editandoTipoBase?._id === t._id ? (
                                            <NumberInput
                                                size="xs"
                                                value={editandoTipoBase.frecuenciaKmDefault}
                                                onChange={(val) => setEditandoTipoBase({ ...editandoTipoBase, frecuenciaKmDefault: val })}
                                                step={1000}
                                            />
                                        ) : (
                                            <Badge variant="light" color="indigo">{t.frecuenciaKmDefault?.toLocaleString()} KM</Badge>
                                        )}
                                    </Table.Td>
                                    <Table.Td style={{ textAlign: 'right' }}>
                                        <Group gap={4} justify="flex-end">
                                            {editandoTipoBase?._id === t._id ? (
                                                <>
                                                    <ActionIcon variant="filled" color="green" onClick={handleUpdateTipoBase}>
                                                        <IconDeviceFloppy size={14} />
                                                    </ActionIcon>
                                                    <ActionIcon variant="light" color="gray" onClick={() => setEditandoTipoBase(null)}>
                                                        <IconX size={14} />
                                                    </ActionIcon>
                                                </>
                                            ) : (
                                                <ActionIcon variant="subtle" color="blue" onClick={() => setEditandoTipoBase(t)}>
                                                    <IconEdit size={16} />
                                                </ActionIcon>
                                            )}
                                            <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteTipoBase(t._id)}>
                                                <IconTrash size={16} />
                                            </ActionIcon>
                                        </Group>
                                    </Table.Td>
                                </Table.Tr>
                            ))}
                        </Table.Tbody>
                    </Table>
                </Stack>
            </Modal>
        </Container>
    );
};

export default MantenimientoAdmin;

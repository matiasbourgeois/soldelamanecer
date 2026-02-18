import React, { useEffect, useState, useContext } from "react";
import clienteAxios from "../../../../core/api/clienteAxios"; // ✅ Con Token
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../../core/context/AuthProvider";
import { apiSistema } from "../../../../core/api/apiSistema";
import {
    Container,
    Title,
    Text,
    Button,
    Select,
    Grid,
    Card,
    Stack,
    Group,
    ThemeIcon,
    Badge,
    Alert,
    Table,
    ActionIcon,
    LoadingOverlay,
    Textarea,
} from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { Search, Trash2, Check, Truck, User, MapPin, Package, Settings, Info, Calendar } from "lucide-react";

const CrearHojaReparto = () => {
    // ----------------------------------------------------------------------
    // 🧩 STATE & CONTEXT (Logic Preserved)
    // ----------------------------------------------------------------------
    const [rutas, setRutas] = useState([]);
    const [rutaSeleccionada, setRutaSeleccionada] = useState("");
    const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date()); // 🆕 FASE 5
    const [chofer, setChofer] = useState(null);
    const [vehiculo, setVehiculo] = useState(null);
    const [todosLosEnvios, setTodosLosEnvios] = useState([]); // 🆕 Todos los envíos disponibles
    const [hojaCreada, setHojaCreada] = useState(null);
    const [observaciones, setObservaciones] = useState("");
    const [cargandoEnvios, setCargandoEnvios] = useState(false);
    const [listaChoferes, setListaChoferes] = useState([]);
    const [listaVehiculos, setListaVehiculos] = useState([]);

    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const usuarioId = auth?._id;

    // ----------------------------------------------------------------------
    // 🔄 EFFECTS (Logic Preserved)
    // ----------------------------------------------------------------------
    useEffect(() => {
        const obtenerRutas = async () => {
            try {
                const res = await clienteAxios.get(apiSistema("/rutas/todas"));
                setRutas(res.data.rutas || []);
            } catch (error) {
                console.error("Error al obtener rutas:", error);
            }
        };

        const obtenerChoferes = async () => {
            try {
                const res = await clienteAxios.get(apiSistema("/choferes/solo-nombres"));
                setListaChoferes(res.data || []);
            } catch (error) {
                console.error("Error al obtener choferes:", error);
            }
        };

        const obtenerVehiculos = async () => {
            try {
                const res = await clienteAxios.get(apiSistema("/vehiculos"));
                setListaVehiculos(res.data);
            } catch (error) {
                console.error("Error al obtener vehícultos:", error);
            }
        };

        obtenerRutas();
        obtenerChoferes();
        obtenerVehiculos();
    }, []);

    const manejarSeleccionRuta = (valor) => {
        setRutaSeleccionada(valor);

        const rutaData = rutas.find((r) => r._id === valor);

        // Chofer por defecto (si existe en la ruta)
        if (rutaData && rutaData.choferAsignado) {
            const choferData = listaChoferes.find((c) => c._id === rutaData.choferAsignado._id);
            if (choferData) {
                setChofer(choferData);
            }
        }

        // Vehículo por defecto (si existe en la ruta)
        if (rutaData && rutaData.vehiculoAsignado) {
            const vehiculoData = listaVehiculos.find((v) => v._id === rutaData.vehiculoAsignado._id);
            if (vehiculoData) {
                setVehiculo(vehiculoData);
            }
        }

        // Reset UI
        setTodosLosEnvios([]);
        setHojaCreada(null);
    };

    const buscarEnvios = async () => {
        setCargandoEnvios(true);
        try {
            const ruta = rutas.find((r) => r._id === rutaSeleccionada);

            if (!ruta) {
                notifications.show({
                    title: 'Validación',
                    message: 'Seleccioná una ruta válida',
                    color: 'orange'
                });
                setCargandoEnvios(false);
                return;
            }

            // 🆕 FASE 5: Llamar al nuevo endpoint
            const res = await clienteAxios.get(apiSistema("/hojas-reparto/buscar-por-ruta-fecha"), {
                params: {
                    rutaId: ruta._id,
                    fecha: fechaSeleccionada.toISOString()
                }
            });

            // Hoja existente (creada por el cron)
            setHojaCreada(res.data.hoja);

            // Combinar TODOS los envíos (ya asignados + disponibles)
            // Combinar TODOS los envíos (ya asignados + disponibles)
            const enviosAsignados = res.data.hoja.envios || [];
            const disponibles = res.data.enviosDisponibles || [];

            // 🛡️ FRONTEND FIX: Separar visualmente
            const asignadosConFlag = enviosAsignados.map(e => ({ ...e, yaEnHoja: true }));
            const disponiblesConFlag = disponibles.map(e => ({ ...e, yaEnHoja: false }));

            // 🛡️ FRONTEND DEDUPLICATION (Safety Net)
            const todosJuntosMap = new Map();
            [...asignadosConFlag, ...disponiblesConFlag].forEach(envio => {
                if (envio && envio._id) {
                    todosJuntosMap.set(envio._id.toString(), envio);
                }
            });
            const todosJuntos = Array.from(todosJuntosMap.values());

            setTodosLosEnvios(todosJuntos);

            // Setear chofer y vehículo desde la hoja
            setChofer(res.data.hoja.chofer);
            setVehiculo(res.data.hoja.vehiculo);

            const nuevosCount = todosJuntos.filter(e => !e.yaEnHoja).length;
            const asignadosCount = todosJuntos.filter(e => e.yaEnHoja).length;

            notifications.show({
                title: '✅ Hoja Encontrada',
                message: `${nuevosCount} envíos disponibles (${asignadosCount} ya en hoja)`,
                color: 'cyan'
            });

        } catch (error) {
            console.error("Error al buscar hoja:", error);

            if (error.response?.status === 404) {
                notifications.show({
                    title: 'Sin Hoja',
                    message: error.response.data.sugerencia || "No existe hoja para esta ruta y fecha",
                    color: 'orange'
                });
            } else {
                notifications.show({
                    title: 'Error',
                    message: 'Error al buscar hoja de reparto',
                    color: 'red'
                });
            }
        }
        setCargandoEnvios(false);
    };

    const confirmarHojaFinal = async () => {
        if (!hojaCreada?._id) {
            notifications.show({
                title: 'Validación',
                message: 'No hay hoja para confirmar',
                color: 'orange'
            });
            return;
        }

        try {
            const enviosSoloIds = todosLosEnvios.map(e => e?._id || e);

            const res = await clienteAxios.post(apiSistema("/hojas-reparto/confirmar"), {
                hojaId: hojaCreada._id,
                envios: enviosSoloIds,
                choferId: typeof chofer === "object" ? chofer?._id : chofer,
                vehiculoId: vehiculo?._id || vehiculo,
                usuarioId,
            });

            if (res.status === 200) {
                notifications.show({
                    title: '✅ ¡Éxito!',
                    message: 'Envíos asignados correctamente a la hoja de reparto',
                    color: 'green'
                });
                navigate("/hojas-reparto/consultar");
            }
        } catch (error) {
            console.error("❌ Error al asignar envíos:", error);
            notifications.show({
                title: 'Error',
                message: 'No se pudieron asignar los envíos',
                color: 'red'
            });
        }
    };

    // Quitar envío de la lista
    const quitarEnvio = (envioId) => {
        setTodosLosEnvios(todosLosEnvios.filter(e => e._id !== envioId));
    };

    // ----------------------------------------------------------------------
    // 🎨 UI HELPERS
    // ----------------------------------------------------------------------
    const rutaOptions = rutas.map(r => ({ value: r._id, label: `${r.codigo} - ${r.descripcion || 'Sin descripción'}` }));
    const choferOptions = listaChoferes.map(c => ({ value: c._id, label: `${c.usuario?.nombre || 'Sin Nombre'} (${c.usuario?.dni})` }));
    const vehiculoOptions = listaVehiculos.map(v => ({ value: v._id, label: `${v.patente} - ${v.marca} ${v.modelo}` }));

    // ----------------------------------------------------------------------
    // 🎨 JSX RENDER
    // ----------------------------------------------------------------------
    return (
        <Container size="100%" px="xl">
            <Group justify="space-between" mb={30}>
                <div>
                    <Title order={2} c="dark.4">Asignar Envíos a Hojas</Title>
                    <Text size="sm" c="dimmed">
                        Gestión de envíos para hojas de reparto existentes
                    </Text>
                </div>
            </Group>

            <Grid gutter={40} align="flex-start">
                {/* 📍 LEFT COLUMN: CONFIGURATION */}
                <Grid.Col span={{ base: 12, md: 4 }} style={{ display: 'flex', flexDirection: 'column' }}>
                    <Card
                        shadow="sm"
                        padding="xl"
                        radius="lg"
                        withBorder
                        h="100%"
                        style={{ borderColor: 'var(--mantine-color-blue-2)' }}
                    >
                        <Group mb="lg">
                            <ThemeIcon size={42} radius="md" color="blue" variant="light">
                                <Settings size={24} />
                            </ThemeIcon>
                            <div>
                                <Text size="lg" fw={800} c="dark.4">Parametrización</Text>
                                <Text size="sm" c="dimmed">Definir ruta y responsable</Text>
                            </div>
                        </Group>

                        <Stack gap="md" pos="relative">
                            <LoadingOverlay visible={cargandoEnvios} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

                            {/* 🆕 FASE 5: DatePicker ARRIBA */}
                            <DatePickerInput
                                label="Fecha de la Hoja"
                                placeholder="Seleccionar fecha..."
                                value={fechaSeleccionada}
                                onChange={setFechaSeleccionada}
                                leftSection={<Calendar size={16} />}
                                size="md"
                                clearable={false}
                                radius="md"
                                variant="filled"
                                valueFormat="DD/MM/YYYY"
                            />

                            <Select
                                label="Ruta de Distribución"
                                placeholder="Seleccionar ruta..."
                                data={rutaOptions}
                                value={rutaSeleccionada}
                                onChange={manejarSeleccionRuta}
                                searchable
                                nothingFoundMessage="No se encontraron rutas"
                                leftSection={<MapPin size={16} />}
                                allowDeselect={false}
                                radius="md"
                                variant="filled"
                                size="md"
                            />

                            <Select
                                label="Chofer Asignado"
                                placeholder="Seleccionar chofer"
                                data={choferOptions}
                                value={chofer?._id || ""}
                                onChange={(val) => {
                                    const seleccionado = listaChoferes.find(c => c._id === val);
                                    setChofer(seleccionado);
                                }}
                                searchable
                                leftSection={<User size={16} />}
                                disabled={!rutaSeleccionada}
                                radius="md"
                                variant="filled"
                                size="md"
                            />

                            <Select
                                label="Vehículo Asignado"
                                placeholder="Seleccionar vehículo"
                                data={vehiculoOptions}
                                value={vehiculo?._id || ""}
                                onChange={(val) => {
                                    const seleccionado = listaVehiculos.find(v => v._id === val);
                                    setVehiculo(seleccionado);
                                }}
                                searchable
                                leftSection={<Truck size={16} />}
                                disabled={!rutaSeleccionada}
                                radius="md"
                                variant="filled"
                                size="md"
                            />

                            <Textarea
                                label="Observaciones"
                                placeholder="Notas adicionales..."
                                value={observaciones}
                                onChange={(e) => setObservaciones(e.currentTarget.value)}
                                minRows={3}
                                radius="md"
                                variant="filled"
                                size="md"
                            />

                            <Button
                                fullWidth
                                size="lg"
                                color="cyan"
                                onClick={buscarEnvios}
                                disabled={!rutaSeleccionada || !chofer || !vehiculo}
                                leftSection={<Search size={20} />}
                                radius="md"
                                mt="sm"
                            >
                                Buscar Envíos
                            </Button>
                        </Stack>
                    </Card>
                </Grid.Col>

                {/* 📦 RIGHT COLUMN: RESULTS */}
                <Grid.Col span={{ base: 12, md: 8 }} style={{ display: 'flex', flexDirection: 'column' }}>

                    {!todosLosEnvios.length && !cargandoEnvios && !hojaCreada && (
                        <Alert
                            variant="light"
                            color="gray"
                            title="Esperando configuración"
                            icon={<Info size={20} />}
                            radius="md"
                        >
                            Seleccioná una fecha, ruta, chofer y vehículo, luego hacé click en "Buscar Envíos".
                        </Alert>
                    )}

                    {!todosLosEnvios.some(e => !e.yaEnHoja) && !cargandoEnvios && hojaCreada && (
                        <Alert
                            variant="light"
                            color="orange"
                            title="Sin Nuevos Envíos"
                            icon={<Info size={20} />}
                            radius="md"
                        >
                            No hay nuevos envíos pendientes. La hoja ya tiene {todosLosEnvios.filter(e => e.yaEnHoja).length} envíos asignados.
                        </Alert>
                    )}

                    {/* 🆕 TABLA ÚNICA CON TODOS LOS ENVÍOS */}
                    {todosLosEnvios.length > 0 && (
                        <Card shadow="sm" padding="xl" radius="lg" withBorder style={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Group mb="lg" justify="space-between">
                                <Group>
                                    <ThemeIcon size={42} radius="md" color="cyan" variant="light">
                                        <Package size={24} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="lg" fw={800} c="dark.4">Envíos para Asignar</Text>
                                        <Text size="sm" c="dimmed">Revisá y quitá los que no querés incluir</Text>
                                    </div>
                                </Group>
                                <Badge size="lg" variant="light" color="cyan">
                                    {todosLosEnvios.filter(e => !e.yaEnHoja).length} nuevos
                                </Badge>
                            </Group>

                            <Table.ScrollContainer minWidth={600} style={{ flex: 1 }}>
                                <Table verticalSpacing="sm" withTableBorder={false}>
                                    <Table.Thead bg="#f9fafb">
                                        <Table.Tr>
                                            <Table.Th w={60} style={{ textAlign: 'center' }} c="dimmed">#</Table.Th>
                                            <Table.Th c="dimmed">REMITO</Table.Th>
                                            <Table.Th c="dimmed">DESTINO</Table.Th>
                                            <Table.Th w={100} style={{ textAlign: 'center' }} c="dimmed">BULTOS</Table.Th>
                                            <Table.Th w={80} style={{ textAlign: 'center' }} c="dimmed">ACCIÓN</Table.Th>
                                        </Table.Tr>
                                    </Table.Thead>
                                    <Table.Tbody>
                                        {todosLosEnvios.filter(e => !e.yaEnHoja).map((envio, index) => (
                                            <Table.Tr key={envio._id || index}>
                                                <Table.Td style={{ textAlign: 'center' }}>
                                                    <Text size="xs" c="dimmed" fw={500}>{index + 1}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={600} ff="monospace" c="dark.3">
                                                        {envio.remitoNumero || envio.codigoSeguimiento || "-"}
                                                    </Text>
                                                    <Text size="xs" c="dimmed">{envio.destinatario?.nombre}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Group gap={6}>
                                                        <MapPin size={12} className="text-gray-400" />
                                                        <Text size="sm" c="dimmed" lineClamp={1}>
                                                            {envio.localidadDestino?.nombre}
                                                        </Text>
                                                    </Group>
                                                </Table.Td>
                                                <Table.Td style={{ textAlign: 'center' }}>
                                                    <Badge color="gray" variant="outline" size="sm">
                                                        {envio.encomienda?.cantidad || 1}
                                                    </Badge>
                                                </Table.Td>
                                                <Table.Td style={{ textAlign: 'center' }}>
                                                    <ActionIcon
                                                        color="red"
                                                        variant="subtle"
                                                        size="sm"
                                                        onClick={() => quitarEnvio(envio._id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </ActionIcon>
                                                </Table.Td>
                                            </Table.Tr>
                                        ))}
                                    </Table.Tbody>
                                </Table>
                            </Table.ScrollContainer>

                            {/* Botón de confirmación */}
                            <Group justify="flex-end" mt="lg">
                                <Button
                                    size="lg"
                                    color="cyan"
                                    leftSection={<Check size={20} />}
                                    onClick={confirmarHojaFinal}
                                    disabled={!todosLosEnvios.length}
                                    radius="md"
                                >
                                    Asignar Envíos a Hoja
                                </Button>
                            </Group>
                        </Card>
                    )}
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default CrearHojaReparto;

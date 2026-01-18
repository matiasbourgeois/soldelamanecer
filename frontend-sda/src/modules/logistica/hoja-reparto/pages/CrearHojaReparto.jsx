import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AuthContext from "../../../../core/context/AuthProvider";
import { apiSistema } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../../../core/utils/confirmarAccion.jsx";
import {
    Container,
    Paper,
    Title,
    Grid,
    Select,
    Button,
    Text,
    Group,
    Box,
    Table,
    ActionIcon,
    Badge,
    LoadingOverlay,
    Stepper,
    Divider,
    Card,
    ThemeIcon,
    Alert,
    Textarea,
    rem,
    Stack
} from "@mantine/core";
import { Search, Trash2, Check, Truck, User, MapPin, Package, Settings, Info } from "lucide-react";

const CrearHojaReparto = () => {
    // ----------------------------------------------------------------------
    // 🧩 STATE & CONTEXT (Logic Preserved)
    // ----------------------------------------------------------------------
    const [rutas, setRutas] = useState([]);
    const [rutaSeleccionada, setRutaSeleccionada] = useState("");
    const [chofer, setChofer] = useState(null);
    const [vehiculo, setVehiculo] = useState(null);
    const [envios, setEnvios] = useState([]);
    const [hojaCreada, setHojaCreada] = useState(null);
    const [observaciones, setObservaciones] = useState("");
    const [cargandoEnvios, setCargandoEnvios] = useState(false);
    const [listaChoferes, setListaChoferes] = useState([]);
    const [listaVehiculos, setListaVehiculos] = useState([]);

    // UI State
    const [activeStep, setActiveStep] = useState(0);

    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();
    const usuarioId = auth?._id;

    // ----------------------------------------------------------------------
    // 🔄 EFFECTS (Logic Preserved)
    // ----------------------------------------------------------------------
    useEffect(() => {
        const obtenerRutas = async () => {
            try {
                const res = await axios.get(apiSistema("/rutas/todas"));
                setRutas(res.data.rutas || []);
            } catch (error) {
                console.error("Error al obtener rutas:", error);
            }
        };

        const obtenerChoferes = async () => {
            try {
                const res = await axios.get(apiSistema("/choferes/solo-nombres"));
                setListaChoferes(res.data || []);
            } catch (error) {
                console.error("Error al obtener choferes:", error);
            }
        };

        const obtenerVehiculos = async () => {
            try {
                const res = await axios.get(apiSistema("/vehiculos"));
                setListaVehiculos(res.data);
            } catch (error) {
                console.error("Error al obtener vehículos:", error);
            }
        };

        obtenerRutas();
        obtenerChoferes();
        obtenerVehiculos();
    }, []);

    // ----------------------------------------------------------------------
    // 🎮 HANDLERS (Logic Preserved)
    // ----------------------------------------------------------------------
    const manejarSeleccionRuta = (rutaId) => {
        const ruta = rutas.find((r) => r._id === rutaId);
        setRutaSeleccionada(rutaId);

        if (ruta) {
            // Helper robusto para obtener ID
            const getId = (val) => (typeof val === 'object' && val !== null ? val._id : val);

            const choferId = getId(ruta.choferAsignado);
            const vehiculoId = getId(ruta.vehiculoAsignado);

            // Búsqueda insensible a tipos (string vs objectID)
            const choferCompleto = listaChoferes.find((c) => c._id == choferId);
            const vehiculoCompleto = listaVehiculos.find((v) => v._id == vehiculoId);

            setChofer(choferCompleto || null);
            setVehiculo(vehiculoCompleto || null);
        } else {
            setChofer(null);
            setVehiculo(null);
        }

        setEnvios([]);
        setActiveStep(0);
    };

    const buscarEnvios = async () => {
        setCargandoEnvios(true);
        try {
            const ruta = rutas.find((r) => r._id === rutaSeleccionada);
            const localidadesRuta = ruta?.localidades || [];

            const res = await axios.post(apiSistema("/hojas-reparto/preliminar"), {
                rutaId: ruta._id,
                choferId: typeof chofer === "object" ? chofer?._id : chofer,
                vehiculoId: vehiculo?._id || vehiculo,
                observaciones,
                usuarioId,
                localidadesRuta,
            });

            setEnvios(res.data.envios);
            setHojaCreada(res.data.hoja);
            setActiveStep(1); // Advance UI step
        } catch (error) {
            console.error("Error al buscar envíos:", error);
            mostrarAlerta("Error al buscar envíos preliminares", "error");
        }
        setCargandoEnvios(false);
    };

    const confirmarHojaFinal = async () => {
        if (!hojaCreada?._id) {
            mostrarAlerta("No hay hoja para confirmar.", "warning");
            return;
        }

        try {
            const enviosSoloIds = envios.map(e => e?._id || e);

            const res = await axios.post(apiSistema("/hojas-reparto/confirmar"), {
                hojaId: hojaCreada._id,
                envios: enviosSoloIds,
                choferId: typeof chofer === "object" ? chofer?._id : chofer,
                vehiculoId: vehiculo?._id || vehiculo,
                usuarioId,
            });

            if (res.status === 200) {
                mostrarAlerta("✅ Hoja de Reparto confirmada con éxito", "success");
                navigate("/hojas-reparto/consultar"); // Return to list
            }
        } catch (error) {
            console.error("❌ Error al confirmar hoja:", error);
            mostrarAlerta("Error al confirmar hoja de reparto", "danger");
        }
    };

    const quitarEnvio = async (envioId) => {
        const confirmar = await confirmarAccion(
            "¿Quitar envío de la hoja?",
            "Este envío quedará fuera de la hoja de reparto actual"
        );
        if (!confirmar) return;

        const nuevosEnvios = envios.filter((e) => e._id !== envioId);
        setEnvios(nuevosEnvios);
    };

    // ----------------------------------------------------------------------
    // 🎨 UI HELPERS
    // ----------------------------------------------------------------------
    const rutaOptions = rutas.map(r => ({ value: r._id, label: `${r.codigo} - ${r.descripcion || 'Sin descripción'}` }));
    const choferOptions = listaChoferes.map(c => ({ value: c._id, label: `${c.usuario?.nombre || 'Sin Nombre'} (${c.usuario?.dni})` }));
    const vehiculoOptions = listaVehiculos.map(v => ({ value: v._id, label: `${v.patente} - ${v.marca} ${v.modelo}` }));

    return (
        <Container size="xl" py={40} pb={100}>
            {/* Header Section */}
            <Group mb={40} justify="space-between" align="center">
                <Box>
                    <Group gap="xs" mb={5}>
                        <ThemeIcon variant="light" color="blue" size="md" radius="md">
                            <Settings size={16} />
                        </ThemeIcon>
                        <Text tt="uppercase" c="blue" fw={800} fz="xs" ls={1.5}>
                            Logística y Distribución
                        </Text>
                    </Group>
                    <Title order={1} style={{ fontSize: rem(42), fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--mantine-color-dark-8)' }}>
                        Crear Hoja de Reparto
                    </Title>
                    <Text c="dimmed" size="lg" mt={5} maw={600} lh={1.4}>
                        Siga paso a paso la configuración de la ruta para asignar paquetes y emitir la hoja de ruta.
                    </Text>
                </Box>
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

                {/* 📦 RIGHT COLUMN: RESULTS & PREVIEW */}
                <Grid.Col span={{ base: 12, md: 8 }} style={{ display: 'flex', flexDirection: 'column' }}>
                    {/* STEPPER */}
                    <Box mb="xl" px="sm">
                        <Stepper active={activeStep} size="sm" iconSize={32} color="cyan">
                            <Stepper.Step label="Configurar" description="Ruta y Chofer" allowStepSelect={false} icon={<Settings size={16} />} />
                            <Stepper.Step label="Revisar" description="Envíos asignados" allowStepSelect={false} icon={<Package size={16} />} />
                            <Stepper.Step label="Confirmar" description="Crear Hoja" allowStepSelect={false} icon={<Check size={16} />} />
                        </Stepper>
                    </Box>

                    {!envios.length && !cargandoEnvios && activeStep === 0 && (
                        <Alert
                            variant="light"
                            color="gray"
                            title="Esperando configuración"
                            icon={<Info size={20} />}
                            radius="md"
                        >
                            Seleccioná una ruta, chofer y vehículo en el panel izquierdo para comenzar.
                        </Alert>
                    )}

                    {!envios.length && !cargandoEnvios && activeStep === 1 && (
                        <Alert
                            variant="light"
                            color="orange"
                            title="Sin resultados"
                            icon={<Info size={20} />}
                            radius="md"
                        >
                            No se encontraron remitos asociados a esta ruta. Intente con otra ruta o verifique los estados.
                        </Alert>
                    )}

                    {envios.length > 0 && (
                        <Card shadow="sm" padding="xl" radius="lg" withBorder style={{ overflow: 'visible', flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <Group mb="lg" justify="space-between">
                                <Group>
                                    <ThemeIcon size={42} radius="md" color="cyan" variant="light">
                                        <Package size={24} />
                                    </ThemeIcon>
                                    <div>
                                        <Text size="lg" fw={800} c="dark.4">Resultados</Text>
                                        <Text size="sm" c="dimmed">Envíos listos para asignar</Text>
                                    </div>
                                </Group>
                                <Badge size="lg" variant="light" color="cyan">
                                    {envios.length} Remitos
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
                                        {envios.map((envio, index) => (
                                            <Table.Tr key={envio._id || index}>
                                                <Table.Td style={{ textAlign: 'center' }}>
                                                    <Text size="xs" c="dimmed" fw={500}>{index + 1}</Text>
                                                </Table.Td>
                                                <Table.Td>
                                                    <Text size="sm" fw={600} ff="monospace" c="dark.3">
                                                        {envio.remitoNumero || "-"}
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

                            <Divider my="md" />

                            <Group justify="flex-end" mt="auto">
                                <Button
                                    color="cyan"
                                    size="lg"
                                    radius="md"
                                    leftSection={<Check size={20} />}
                                    onClick={confirmarHojaFinal}
                                >
                                    Confirmar Hoja
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

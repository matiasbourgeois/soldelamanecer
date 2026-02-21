import React, { useState, useEffect, useContext } from "react";
import {
    Modal, Button, TextInput, Select, Stack, Group, Text,
    Tabs, Paper, Divider, Box, ThemeIcon, LoadingOverlay,
    Badge, Alert, SimpleGrid, Anchor, Loader, Center
} from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Dropzone, PDF_MIME_TYPE, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { apiSistema, apiEstaticos } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import AuthContext from "../../../../core/context/AuthProvider";
import {
    IconUpload, IconCheck, IconCalendar, IconBriefcase,
    IconUserCheck, IconFileText, IconInfoCircle, IconExternalLink,
    IconAlertTriangle, IconTruck, IconRoute
} from "@tabler/icons-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const FormularioContratado = ({ opened, onClose, contratado, recargar }) => {
    const { auth } = useContext(AuthContext);
    const isAdmin = auth?.rol === 'admin';
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("datos");
    const [loading, setLoading] = useState(false);
    const [loadingRuta, setLoadingRuta] = useState(false);
    const [rutasAsignadas, setRutasAsignadas] = useState([]); // Rutas operativas (puede ser más de una)

    // Datos del formulario — solo datosContratado editables (no vehículo ni ruta)
    const [formData, setFormData] = useState({
        razonSocial: "",
        cuit: "",
        email: "",
        fechaIngreso: new Date(),
        fechaEgreso: null,
        activo: true,
        montoChoferDia: 0
    });

    // Documentos del legajo
    const [documentos, setDocumentos] = useState({});

    useEffect(() => {
        if (contratado) {
            const dc = contratado.datosContratado || {};
            setFormData({
                razonSocial: dc.razonSocial || "",
                cuit: dc.cuit || "",
                email: dc.email || contratado.usuario?.email || "",
                fechaIngreso: dc.fechaIngreso ? new Date(dc.fechaIngreso) : new Date(),
                fechaEgreso: dc.fechaEgreso ? new Date(dc.fechaEgreso) : null,
                activo: contratado.activo ?? true,
                montoChoferDia: dc.montoChoferDia || 0
            });
            setDocumentos(dc.documentos || {});
            fetchRutaAsignada(contratado._id);
        }
    }, [contratado]);

    // Buscar todas las rutas donde este contratado es choferAsignado o contratistaTitular
    const fetchRutaAsignada = async (choferID) => {
        setLoadingRuta(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(apiSistema("/rutas?limite=200&pagina=0"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rutas = Array.isArray(data) ? data : (data.rutas || data.resultados || []);
            // Incluir rutas donde es el chofer directo O el titular
            const misRutas = rutas.filter(r =>
                r.choferAsignado?._id === choferID ||
                r.choferAsignado === choferID ||
                r.contratistaTitular?._id === choferID ||
                r.contratistaTitular === choferID
            );
            setRutasAsignadas(misRutas);
        } catch (error) {
            console.error("No se pudo cargar la ruta asignada:", error);
        } finally {
            setLoadingRuta(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!contratado) return;
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.patch(
                apiSistema(`/choferes/${contratado._id}/contratado`),
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            mostrarAlerta("✅ Datos del contratado actualizados", "success");
            recargar();
        } catch (error) {
            const msg = error.response?.data?.error || error.response?.data?.msg || "Error al guardar";
            mostrarAlerta(`❌ ${msg}`, "danger");
        } finally {
            setLoading(false);
        }
    };

    // Upload individual de documentos del legajo
    const handleUploadFile = async (file, tipoDoc) => {
        if (!contratado) {
            mostrarAlerta("Primero guarde los datos del contratado", "info");
            return;
        }
        const data = new FormData();
        data.append("archivo", file);
        data.append("tipoDoc", tipoDoc);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(
                apiSistema(`/choferes/${contratado._id}/documentos-contratado`),
                data,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "multipart/form-data"
                    }
                }
            );
            const nuevosDocumentos = res.data.chofer?.datosContratado?.documentos || {};
            setDocumentos(nuevosDocumentos);
            mostrarAlerta("✅ Documento subido", "success");
            recargar();
        } catch (error) {
            mostrarAlerta("❌ Error al subir documento", "danger");
        }
    };

    // ─── Slot de documento ────────────────────────────────────────────────────
    const DocSlot = ({ title, tipo, description }) => {
        const doc = documentos?.[tipo];
        // Un subdoc de Mongoose puede existir sin path — solo es "cargado" si tiene archivo real
        const cargado = !!doc?.path;
        return (
            <Paper withBorder p="md" radius="md" bg={cargado ? "teal.0" : "gray.0"} style={{ transition: "all 0.2s ease" }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={2} style={{ flex: 1, minWidth: 0 }}>
                        <Text fw={700} size="sm">{title}</Text>
                        <Text size="xs" c="dimmed">{description}</Text>
                        {cargado && (
                            <Badge variant="light" color="teal" size="xs" leftSection={<IconCheck size={10} />}>
                                Cargado el {new Date(doc.fechaSubida).toLocaleDateString("es-AR")}
                            </Badge>
                        )}
                    </Stack>

                    <Group gap={5} wrap="nowrap">
                        {cargado ? (
                            <>
                                <Button
                                    variant="subtle"
                                    size="compact-xs"
                                    component="a"
                                    href={apiEstaticos(`/${doc.path}`)}
                                    target="_blank"
                                >
                                    Ver
                                </Button>
                                <Dropzone
                                    onDrop={(files) => handleUploadFile(files[0], tipo)}
                                    maxSize={5 * 1024 ** 2}
                                    accept={[...PDF_MIME_TYPE, ...IMAGE_MIME_TYPE]}
                                    styles={{ root: { border: 0, padding: 0, background: "transparent" } }}
                                >
                                    <Button variant="subtle" color="blue" size="compact-xs">
                                        Reemplazar
                                    </Button>
                                </Dropzone>
                            </>
                        ) : (
                            <Dropzone
                                onDrop={(files) => handleUploadFile(files[0], tipo)}
                                maxSize={5 * 1024 ** 2}
                                accept={[...PDF_MIME_TYPE, ...IMAGE_MIME_TYPE]}
                                styles={{ root: { padding: "4px 8px" } }}
                            >
                                <Button variant="light" color="cyan" size="xs" leftSection={<IconUpload size={14} />}>
                                    Subir
                                </Button>
                            </Dropzone>
                        )}
                    </Group>
                </Group>
            </Paper>
        );
    };

    // ─── Panel de logística read-only ─────────────────────────────────────────
    const PanelLogistica = () => {
        if (loadingRuta) {
            return <Center py="xl"><Loader color="cyan" type="dots" /></Center>;
        }

        if (rutasAsignadas.length === 0) {
            return (
                <Stack gap="md">
                    <Alert
                        icon={<IconAlertTriangle size={18} />}
                        color="yellow"
                        variant="light"
                        title="Sin asignación operativa"
                        radius="md"
                        styles={{ title: { fontWeight: 700 } }}
                    >
                        Este contratado aún <strong>no está asignado a ninguna ruta</strong>.
                        El administrativo debe completar la asignación desde Gestión de Rutas.
                    </Alert>

                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                        {/* Crear vehículo externo */}
                        <Paper withBorder p="md" radius="md" bg="cyan.0">
                            <Stack gap="xs">
                                <Group gap="xs">
                                    <IconTruck size={20} color="var(--mantine-color-cyan-7)" />
                                    <Text fw={700} size="sm">Paso 1: Registrar vehículo</Text>
                                </Group>
                                <Text size="xs" c="dimmed">
                                    Si el contratado trae su propio vehículo, registralo en el sistema como "Externo" antes de asignarlo a la ruta.
                                </Text>
                                <Button
                                    variant="filled"
                                    color="cyan"
                                    size="sm"
                                    leftSection={<IconExternalLink size={16} />}
                                    onClick={() =>
                                        navigate("/admin/vehiculos", {
                                            state: { abrirNuevo: true, tipoPropiedad: "externo" }
                                        })
                                    }
                                >
                                    Registrar vehículo externo
                                </Button>
                            </Stack>
                        </Paper>

                        {/* Ir a rutas */}
                        <Paper withBorder p="md" radius="md" bg="indigo.0">
                            <Stack gap="xs">
                                <Group gap="xs">
                                    <IconRoute size={20} color="var(--mantine-color-indigo-7)" />
                                    <Text fw={700} size="sm">Paso 2: Asignar a una Ruta</Text>
                                </Group>
                                <Text size="xs" c="dimmed">
                                    En Gestión de Rutas, asigná este contratado como <strong>Chofer Asignado</strong> y el vehículo que va a usar.
                                </Text>
                                <Button
                                    variant="filled"
                                    color="indigo"
                                    size="sm"
                                    leftSection={<IconExternalLink size={16} />}
                                    onClick={() => navigate("/admin/rutas")}
                                >
                                    Ir a Gestión de Rutas
                                </Button>
                            </Stack>
                        </Paper>
                    </SimpleGrid>

                    <Alert
                        icon={<IconInfoCircle size={16} />}
                        color="gray"
                        variant="light"
                        radius="md"
                        size="sm"
                    >
                        Si el contratado aún no tiene vehículo propio, registralo en el sistema antes de asignarlo a la ruta.
                    </Alert>
                </Stack>
            );
        }

        // Tiene rutas asignadas → mostrar tarjetas por cada ruta
        return (
            <Stack gap="md">
                <Alert
                    icon={<IconCheck size={16} />}
                    color="teal"
                    variant="light"
                    title={rutasAsignadas.length > 1 ? `${rutasAsignadas.length} líneas activas` : "Asignación operativa activa"}
                    radius="md"
                    styles={{ title: { fontWeight: 700 } }}
                >
                    {rutasAsignadas.length > 1
                        ? `Este contratado gestiona ${rutasAsignadas.length} rutas en el sistema.`
                        : `Este contratado está asignado a la ruta `}
                    {rutasAsignadas.length === 1 && <strong>{rutasAsignadas[0].codigo}</strong>}
                    {rutasAsignadas.length > 1 && (
                        <Badge ml={6} size="xs" color="indigo" variant="filled">CONTRATISTA</Badge>
                    )}
                </Alert>

                {rutasAsignadas.map(rutaItem => {
                    const veh = rutaItem.vehiculoAsignado;
                    return (
                        <Paper key={rutaItem._id} withBorder p="md" radius="md" style={{ borderColor: 'var(--mantine-color-gray-3)' }}>
                            <Group justify="space-between" mb="xs">
                                <Group gap="xs">
                                    <ThemeIcon color="indigo" variant="light" size="sm" radius="md">
                                        <IconRoute size={14} />
                                    </ThemeIcon>
                                    <Text fw={800} size="sm" c="dark.7">{rutaItem.codigo}</Text>
                                    {rutaItem.choferAsignado && rutaItem.choferAsignado._id !== contratado?._id && (
                                        <Badge size="xs" color="gray" variant="light">
                                            Manejado por: {rutaItem.choferAsignado.usuario?.nombre} {rutaItem.choferAsignado.usuario?.apellido || ''}
                                        </Badge>
                                    )}
                                </Group>
                                {rutaItem.descripcion && (
                                    <Text size="xs" c="dimmed" fs="italic" lineClamp={1} style={{ flex: 1, textAlign: 'right' }}>
                                        {rutaItem.descripcion}
                                    </Text>
                                )}
                            </Group>

                            <Divider mb="sm" color="gray.2" />

                            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="xl">
                                {/* Horario */}
                                <Group wrap="nowrap" align="flex-start" gap="sm">
                                    <ThemeIcon variant="transparent" color="indigo" size="md">
                                        <IconCalendar size={18} />
                                    </ThemeIcon>
                                    <Stack gap={0}>
                                        <Text size="10px" c="dimmed" tt="uppercase" fw={800} ls={0.5}>Horario Salida</Text>
                                        <Text fw={700} size="sm" c="dark.6">{rutaItem.horaSalida || "A designar"}</Text>
                                        {rutaItem.kilometrosEstimados > 0 && (
                                            <Text size="xs" c="dimmed">~{rutaItem.kilometrosEstimados} km</Text>
                                        )}
                                    </Stack>
                                </Group>

                                {/* Vehículo */}
                                <Group wrap="nowrap" align="flex-start" gap="sm">
                                    <ThemeIcon variant="transparent" color={veh ? "cyan" : "gray"} size="md">
                                        <IconTruck size={18} />
                                    </ThemeIcon>
                                    <Stack gap={0}>
                                        <Text size="10px" c="dimmed" tt="uppercase" fw={800} ls={0.5}>Vehículo en Ruta</Text>
                                        {veh ? (
                                            <>
                                                <Text fw={700} size="sm" c="dark.6" ff="monospace">{veh.patente}</Text>
                                                <Text size="xs" c="dimmed" lineClamp={1}>{veh.marca} {veh.modelo}</Text>
                                                <Group gap={4} mt={2}>
                                                    <Badge variant="dot" color={veh.tipoPropiedad === "externo" ? "orange" : "blue"} size="sm" style={{ border: 'none', padding: 0, justifyContent: 'flex-start' }}>
                                                        {veh.tipoPropiedad === "externo" ? "Externo" : "Propio SDA"}
                                                    </Badge>
                                                </Group>
                                            </>
                                        ) : (
                                            <Text size="xs" c="dimmed" fs="italic" mt={2}>Sin vehículo asignado</Text>
                                        )}
                                    </Stack>
                                </Group>

                                {/* Tarifa */}
                                <Group wrap="nowrap" align="flex-start" gap="sm">
                                    <ThemeIcon variant="transparent" color="green" size="md">
                                        <IconFileText size={18} />
                                    </ThemeIcon>
                                    <Stack gap={0}>
                                        <Text size="10px" c="dimmed" tt="uppercase" fw={800} ls={0.5}>
                                            {rutaItem.tipoPago === 'por_distribucion' ? 'Tarifa Diaria' : rutaItem.tipoPago === 'por_mes' ? 'Tarifa Mensual' : 'Tarifa por KM'}
                                        </Text>
                                        <Text fw={800} size="md" c="green.7">
                                            {rutaItem.tipoPago === 'por_distribucion' && rutaItem.montoPorDistribucion > 0
                                                ? `$${rutaItem.montoPorDistribucion}`
                                                : rutaItem.tipoPago === 'por_mes' && rutaItem.montoMensual > 0
                                                    ? `$${rutaItem.montoMensual}`
                                                    : rutaItem.precioKm > 0
                                                        ? `$${rutaItem.precioKm}`
                                                        : "—"}
                                        </Text>
                                        <Text size="xs" c="dimmed">
                                            {rutaItem.tipoPago === 'por_distribucion' ? 'por vuelta' : rutaItem.tipoPago === 'por_mes' ? 'por mes' : 'por km'}
                                        </Text>
                                    </Stack>
                                </Group>
                            </SimpleGrid>
                        </Paper>
                    );
                })}
            </Stack>
        );
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <ThemeIcon color="cyan" variant="light" size="lg" radius="md">
                        <IconUserCheck size={20} />
                    </ThemeIcon>
                    <Stack gap={0}>
                        <Text fw={800} size="lg">
                            {contratado?.datosContratado?.razonSocial || contratado?.usuario?.nombre || "Contratado"}
                        </Text>
                        <Text size="xs" c="dimmed">
                            {contratado?.usuario?.email} · DNI: {contratado?.dni}
                        </Text>
                    </Stack>
                </Group>
            }
            centered
            size="xl"
            radius="lg"
            overlayProps={{ blur: 5, backgroundOpacity: 0.4 }}
        >
            <Box pos="relative">
                <LoadingOverlay visible={loading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />

                <Tabs value={activeTab} onChange={setActiveTab} color="cyan" variant="pills" radius="md">
                    <Tabs.List mb="lg" grow>
                        <Tabs.Tab value="datos" leftSection={<IconUserCheck size={16} />}>
                            Datos Fiscales
                        </Tabs.Tab>
                        <Tabs.Tab value="logistica" leftSection={<IconBriefcase size={16} />}>
                            Logística
                        </Tabs.Tab>
                        <Tabs.Tab
                            value="docs"
                            leftSection={<IconFileText size={16} />}
                            disabled={!contratado}
                        >
                            Legajo Digital
                        </Tabs.Tab>
                    </Tabs.List>

                    <form onSubmit={handleSubmit}>
                        {/* ─── TAB 1: Datos Fiscales ─────────────────────────── */}
                        <Tabs.Panel value="datos">
                            <Stack gap="md">
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <TextInput
                                        label="Razón Social / Nombre"
                                        placeholder="Ej: Logística Aranda S.A."
                                        value={formData.razonSocial}
                                        onChange={(e) => handleInputChange("razonSocial", e.target.value)}
                                        variant="filled"
                                    />
                                    <TextInput
                                        label="CUIT"
                                        placeholder="20-XXXXXXXX-X"
                                        value={formData.cuit}
                                        onChange={(e) => handleInputChange("cuit", e.target.value)}
                                        ff="monospace"
                                    />
                                    <TextInput
                                        label="Email de Facturación"
                                        placeholder="proveedor@empresa.com"
                                        description="Se usará para resúmenes y liquidaciones"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                    />
                                    <TextInput
                                        label="Tarifa Chofer (Vehículo SDA)"
                                        description="Monto por día si usa vehículo de la empresa"
                                        placeholder="Ej: 15000"
                                        type="number"
                                        value={formData.montoChoferDia}
                                        onChange={(e) => handleInputChange("montoChoferDia", e.target.value)}
                                        disabled={!isAdmin}
                                    />
                                    <Select
                                        label="Estado"
                                        data={[
                                            { value: "true", label: "Activo" },
                                            { value: "false", label: "Inactivo / Baja" }
                                        ]}
                                        value={String(formData.activo)}
                                        onChange={(val) => handleInputChange("activo", val === "true")}
                                    />
                                    <DateInput
                                        label="Fecha de Ingreso"
                                        placeholder="Seleccione fecha"
                                        value={formData.fechaIngreso}
                                        onChange={(val) => handleInputChange("fechaIngreso", val)}
                                        leftSection={<IconCalendar size={18} />}
                                        valueFormat="DD/MM/YYYY"
                                    />
                                    <DateInput
                                        label="Fecha de Egreso"
                                        placeholder="Dejar vacío si aún activo"
                                        value={formData.fechaEgreso}
                                        onChange={(val) => handleInputChange("fechaEgreso", val)}
                                        leftSection={<IconCalendar size={18} />}
                                        clearable
                                        valueFormat="DD/MM/YYYY"
                                    />
                                </SimpleGrid>
                            </Stack>
                        </Tabs.Panel>

                        {/* ─── TAB 2: Logística (read-only, derivado de Rutas) ─ */}
                        <Tabs.Panel value="logistica">
                            <PanelLogistica />
                        </Tabs.Panel>

                        {/* ─── TAB 3: Legajo Digital ──────────────────────────── */}
                        <Tabs.Panel value="docs">
                            <Stack gap="sm">
                                <DocSlot
                                    tipo="dni"
                                    title="DNI / Cédula"
                                    description="Anverso y reverso del documento de identidad."
                                />
                                <DocSlot
                                    tipo="carnetConducir"
                                    title="Carnet de Conducir"
                                    description="Licencia nacional de conducir vigente."
                                />
                                <DocSlot
                                    tipo="constanciaARCA"
                                    title="Constancia ARCA (AFIP)"
                                    description="Comprobante de inscripción fiscal actualizado."
                                />
                                <DocSlot
                                    tipo="contrato"
                                    title="Contrato SDA"
                                    description="Contrato de locación de servicios firmado."
                                />
                                <DocSlot
                                    tipo="antecedentesPenales"
                                    title="Antecedentes Penales"
                                    description="Certificado de reincidencia (Constancia policial)."
                                />
                            </Stack>
                        </Tabs.Panel>

                        <Divider mt="xl" mb="md" />

                        <Group justify="flex-end">
                            <Button variant="subtle" color="gray" onClick={onClose}>
                                Cerrar
                            </Button>
                            {activeTab === "datos" && (
                                <Button type="submit" px="xl" color="cyan" radius="md">
                                    Guardar Datos Fiscales
                                </Button>
                            )}
                        </Group>
                    </form>
                </Tabs>
            </Box>
        </Modal>
    );
};

export default FormularioContratado;

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
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("datos");
    const [loading, setLoading] = useState(false);
    const [loadingRuta, setLoadingRuta] = useState(false);
    const [rutaAsignada, setRutaAsignada] = useState(null); // Ruta operativa desde el sistema

    // Datos del formulario — solo datosContratado editables (no vehículo ni ruta)
    const [formData, setFormData] = useState({
        razonSocial: "",
        cuit: "",
        email: "",
        fechaIngreso: new Date(),
        fechaEgreso: null,
        activo: true
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
                activo: contratado.activo ?? true
            });
            setDocumentos(dc.documentos || {});
            fetchRutaAsignada(contratado._id);
        }
    }, [contratado]);

    // Buscar la ruta que tiene asignado a este contratado como choferAsignado
    const fetchRutaAsignada = async (choferID) => {
        setLoadingRuta(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(apiSistema("/rutas"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const rutas = Array.isArray(data) ? data : (data.rutas || data.resultados || []);
            const ruta = rutas.find(r =>
                r.choferAsignado?._id === choferID ||
                r.choferAsignado === choferID
            );
            setRutaAsignada(ruta || null);
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

        if (!rutaAsignada) {
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

        // Tiene ruta asignada → mostrar info
        const veh = rutaAsignada.vehiculoAsignado;
        return (
            <Stack gap="md">
                <Alert
                    icon={<IconCheck size={16} />}
                    color="teal"
                    variant="light"
                    title="Asignación operativa activa"
                    radius="md"
                    styles={{ title: { fontWeight: 700 } }}
                >
                    Este contratado está asignado a la ruta <strong>{rutaAsignada.codigo}</strong>.
                </Alert>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {/* Ruta */}
                    <Paper withBorder p="md" radius="md" ta="center" bg="indigo.0">
                        <IconRoute size={28} color="var(--mantine-color-indigo-6)" style={{ marginBottom: 4 }} />
                        <Text size="xs" c="indigo" fw={700} tt="uppercase">Ruta Asignada</Text>
                        <Text fw={800} size="lg" c="indigo.8">{rutaAsignada.codigo}</Text>
                        {rutaAsignada.descripcion && (
                            <Text size="xs" c="dimmed" mt={2}>{rutaAsignada.descripcion}</Text>
                        )}
                    </Paper>

                    {/* Vehículo */}
                    <Paper withBorder p="md" radius="md" ta="center" bg={veh ? "cyan.0" : "gray.0"}>
                        <IconTruck size={28} color={veh ? "var(--mantine-color-cyan-6)" : "#ccc"} style={{ marginBottom: 4 }} />
                        <Text size="xs" c="cyan" fw={700} tt="uppercase">Vehículo en Ruta</Text>
                        {veh ? (
                            <>
                                <Text fw={800} size="lg" c="cyan.8" ff="monospace">{veh.patente}</Text>
                                <Text size="xs" c="dimmed">{veh.marca} {veh.modelo}</Text>
                                <Badge
                                    variant="light"
                                    color={veh.tipoPropiedad === "externo" ? "orange" : "blue"}
                                    size="xs"
                                    mt={4}
                                >
                                    {veh.tipoPropiedad === "externo" ? "Externo" : "Propio SDA"}
                                </Badge>
                            </>
                        ) : (
                            <Text size="sm" c="dimmed" mt={4}>Sin vehículo asignado</Text>
                        )}
                    </Paper>

                    {/* Tarifa */}
                    <Paper withBorder p="md" radius="md" ta="center" bg="green.0">
                        <Text size="xs" c="green" fw={700} tt="uppercase">Tarifa Base</Text>
                        <Text fw={800} size="xl" c="green.8">
                            {rutaAsignada.precioKm > 0 ? `$${rutaAsignada.precioKm}` : "—"}
                        </Text>
                        {rutaAsignada.precioKm > 0 && (
                            <Text size="xs" c="dimmed">por kilómetro</Text>
                        )}
                        {rutaAsignada.kilometrosEstimados > 0 && (
                            <Text size="xs" c="dimmed" mt={2}>
                                ~{rutaAsignada.kilometrosEstimados} km estimados
                            </Text>
                        )}
                    </Paper>
                </SimpleGrid>

                {/* Acciones */}
                <Group gap="sm" mt="xs">
                    <Button
                        variant="light"
                        color="indigo"
                        size="xs"
                        leftSection={<IconExternalLink size={14} />}
                        onClick={() => navigate("/admin/rutas")}
                    >
                        Editar asignación en Rutas
                    </Button>
                    <Button
                        variant="light"
                        color="cyan"
                        size="xs"
                        leftSection={<IconExternalLink size={14} />}
                        onClick={() =>
                            navigate("/admin/vehiculos", {
                                state: { abrirNuevo: !veh, tipoPropiedad: "externo" }
                            })
                        }
                    >
                        {veh ? "Editar vehículo" : "Registrar vehículo externo"}
                    </Button>
                </Group>

                <Alert icon={<IconInfoCircle size={14} />} color="blue" variant="light" radius="md" size="sm">
                    La tarifa y el vehículo se gestionan desde <strong>Gestión de Rutas</strong>. Aquí solo se visualiza la asignación actual.
                </Alert>
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

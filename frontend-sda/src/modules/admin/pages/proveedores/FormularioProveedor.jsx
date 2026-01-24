import React, { useState, useEffect } from "react";
import { Modal, Button, TextInput, Select, Stack, Group, SimpleGrid, Text, Tabs, ActionIcon, Tooltip, Paper, Divider, Box, ThemeIcon, LoadingOverlay, Badge } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { Dropzone, PDF_MIME_TYPE, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { apiSistema, apiEstaticos } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import AuthContext from "../../../../core/context/AuthProvider";
import { useContext } from "react";
import { IconUpload, IconTrash, IconCheck, IconX, IconCalendar, IconCirclePlus, IconBriefcase } from "@tabler/icons-react";
import axios from "axios";
import FormularioVehiculo from "../../../logistica/vehiculos/pages/FormularioVehiculo";

const FormularioProveedor = ({ opened, onClose, proveedor, recargar }) => {
    const { auth } = useContext(AuthContext);
    const isAdmin = auth?.rol === 'admin';
    const [activeTab, setActiveTab] = useState('datos');
    const [loading, setLoading] = useState(false);
    const [vehiculos, setVehiculos] = useState([]);
    const [rutas, setRutas] = useState([]);
    const [mostrarModalVehiculo, setMostrarModalVehiculo] = useState(false);

    const [formData, setFormData] = useState({
        razonSocial: "",
        cuit: "",
        email: "",
        telefono: "",
        fechaIngreso: new Date(),
        fechaEgreso: null,
        vehiculoDefault: null,
        rutaDefault: null,
        activo: true,
        documentos: {}
    });

    useEffect(() => {
        fetchAuxiliares();
        if (proveedor) {
            setFormData({
                ...proveedor,
                fechaIngreso: proveedor.fechaIngreso ? new Date(proveedor.fechaIngreso) : new Date(),
                fechaEgreso: proveedor.fechaEgreso ? new Date(proveedor.fechaEgreso) : null,
                vehiculoDefault: proveedor.vehiculoDefault?._id || null,
                rutaDefault: proveedor.rutaDefault?._id || null
            });
        }
    }, [proveedor]);

    const fetchAuxiliares = async () => {
        try {
            const token = localStorage.getItem("token");
            const [resVeh, resRut] = await Promise.all([
                axios.get(apiSistema("/vehiculos"), { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(apiSistema("/rutas"), { headers: { Authorization: `Bearer ${token}` } })
            ]);

            // Si la API devuelve un objeto con la lista adentro (paginado), lo extraemos
            const listaVehiculos = Array.isArray(resVeh.data) ? resVeh.data : (resVeh.data.resultados || resVeh.data.vehiculos || []);
            const listaRutas = Array.isArray(resRut.data) ? resRut.data : (resRut.data.rutas || resRut.data.resultados || []);

            setVehiculos(listaVehiculos);
            setRutas(listaRutas);
        } catch (error) {
            console.error("Error loading helpers:", error);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const method = proveedor ? "PATCH" : "POST";
            const url = proveedor ? apiSistema(`/proveedores/${proveedor._id}`) : apiSistema("/proveedores");

            await axios({
                url,
                method,
                data: formData,
                headers: { Authorization: `Bearer ${token}` }
            });

            mostrarAlerta(proveedor ? "✅ Proveedor actualizado" : "✅ Proveedor creado", "success");
            recargar();
            onClose();
        } catch (error) {
            const msg = error.response?.data?.error || "Error al guardar";
            mostrarAlerta(`❌ ${msg}`, "danger");
        } finally {
            setLoading(false);
        }
    };

    const handleUploadFile = async (file, tipoDoc) => {
        if (!proveedor) {
            mostrarAlerta("Debe crear el proveedor antes de subir documentos", "info");
            return;
        }

        const data = new FormData();
        data.append("archivo", file);
        data.append("tipoDoc", tipoDoc);

        try {
            const token = localStorage.getItem("token");
            const res = await axios.post(apiSistema(`/proveedores/${proveedor._id}/documentos`), data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "multipart/form-data"
                }
            });
            setFormData(prev => ({ ...prev, documentos: res.data.proveedor.documentos }));
            mostrarAlerta("Documento subido", "success");
            recargar();
        } catch (error) {
            mostrarAlerta("Error al subir", "danger");
        }
    };

    const DocSlot = ({ title, tipo, description }) => {
        const doc = formData.documentos?.[tipo];
        return (
            <Paper withBorder p="md" radius="md" bg={doc ? "teal.0" : "gray.0"} style={{ transition: 'all 0.2s ease' }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <Stack gap={2}>
                        <Text fw={700} size="sm">{title}</Text>
                        <Text size="xs" c="dimmed">{description}</Text>
                        {doc && (
                            <Badge variant="light" color="teal" size="xs">
                                Cargado el {new Date(doc.fechaSubida).toLocaleDateString()}
                            </Badge>
                        )}
                    </Stack>

                    <Group gap={5}>
                        {doc ? (
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
                                    styles={{ root: { border: 0, padding: 0, background: 'transparent' } }}
                                >
                                    <Tooltip label="Reemplazar">
                                        <ActionIcon variant="subtle" color="blue"><IconUpload size={16} /></ActionIcon>
                                    </Tooltip>
                                </Dropzone>
                            </>
                        ) : (
                            <Dropzone
                                onDrop={(files) => handleUploadFile(files[0], tipo)}
                                maxSize={5 * 1024 ** 2}
                                accept={[...PDF_MIME_TYPE, ...IMAGE_MIME_TYPE]}
                                styles={{ root: { padding: '5px' } }}
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

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={
                <Group gap="xs">
                    <IconBriefcase size={24} color="var(--mantine-color-cyan-6)" />
                    <Text fw={800} size="xl">
                        {proveedor ? "Editar Proveedor" : "Nuevo Proveedor Externo"}
                    </Text>
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
                        <Tabs.Tab value="datos">Datos Personales</Tabs.Tab>
                        <Tabs.Tab value="logistica">Logística y Tarifas</Tabs.Tab>
                        <Tabs.Tab value="docs" disabled={!proveedor}>Legajo Digital</Tabs.Tab>
                    </Tabs.List>

                    <form onSubmit={handleSubmit}>
                        <Tabs.Panel value="datos">
                            <Stack gap="md">
                                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                    <TextInput
                                        label="Razón Social / Nombre"
                                        placeholder="Ej: Logística Aranda S.A."
                                        required
                                        value={formData.razonSocial}
                                        onChange={(e) => handleInputChange("razonSocial", e.target.value)}
                                        variant="filled"
                                    />
                                    <TextInput
                                        label="CUIT"
                                        placeholder="20-XXXXXXXX-X"
                                        required
                                        value={formData.cuit}
                                        onChange={(e) => handleInputChange("cuit", e.target.value)}
                                        ff="monospace"
                                    />
                                    <TextInput
                                        label="Email de Contacto"
                                        placeholder="proveedor@empresa.com"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange("email", e.target.value)}
                                    />
                                    <TextInput
                                        label="Teléfono"
                                        placeholder="+54 9..."
                                        value={formData.telefono}
                                        onChange={(e) => handleInputChange("telefono", e.target.value)}
                                    />
                                    <DateInput
                                        label="Fecha de Ingreso"
                                        placeholder="Seleccione fecha"
                                        required
                                        value={formData.fechaIngreso}
                                        onChange={(val) => handleInputChange("fechaIngreso", val)}
                                        leftSection={<IconCalendar size={18} />}
                                    />
                                    <Select
                                        label="Estado"
                                        required
                                        data={[
                                            { value: "true", label: "Activo" },
                                            { value: "false", label: "Inactivo / Baja" }
                                        ]}
                                        value={String(formData.activo)}
                                        onChange={(val) => handleInputChange("activo", val === "true")}
                                    />
                                </SimpleGrid>
                            </Stack>
                        </Tabs.Panel>

                        <Tabs.Panel value="logistica">
                            <Stack gap="md">
                                <Paper withBorder p="md" radius="md" bg="gray.0">
                                    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                        <Box>
                                            <Group justify="space-between" mb={4}>
                                                <Text size="sm" fw={700}>Vehículo Asignado</Text>
                                                <Tooltip label="Nuevo Vehículo">
                                                    <ActionIcon variant="light" size="sm" onClick={() => setMostrarModalVehiculo(true)}>
                                                        <IconCirclePlus size={16} />
                                                    </ActionIcon>
                                                </Tooltip>
                                            </Group>
                                            <Select
                                                placeholder="Seleccionar..."
                                                data={vehiculos.map(v => ({ value: v._id, label: `${v.patente} - ${v.marca} ${v.modelo}` }))}
                                                value={formData.vehiculoDefault}
                                                onChange={(val) => handleInputChange("vehiculoDefault", val)}
                                                searchable
                                                nothingFoundMessage="No hay vehículos"
                                            />
                                        </Box>

                                        <Box>
                                            <Text size="sm" fw={700} mb={4}>Ruta Predeterminada</Text>
                                            <Select
                                                placeholder="Seleccionar..."
                                                data={rutas.map(r => ({ value: r._id, label: `${r.codigo} - ${r.descripcion}` }))}
                                                value={formData.rutaDefault}
                                                onChange={(val) => handleInputChange("rutaDefault", val)}
                                                searchable
                                                nothingFoundMessage="No hay rutas"
                                            />
                                        </Box>
                                    </SimpleGrid>
                                </Paper>

                                <Box>
                                    <Text fw={700} size="sm" mb="xs" c="dimmed">Tarifa pactada heredada de la Ruta</Text>
                                    {formData.rutaDefault ? (
                                        <SimpleGrid cols={1}>
                                            <Paper withBorder p="xs" ta="center" bg="indigo.0">
                                                <Text size="xs" c="indigo" tt="uppercase" fw={700}>Precio por KM ($)</Text>
                                                <Text fw={700} size="xl" c="indigo">$ {rutas.find(r => r._id === formData.rutaDefault)?.precioKm || 0}</Text>
                                                {!isAdmin && <Text size="10px" c="dimmed" mt={4}>Solo lectura para administrativos</Text>}
                                            </Paper>
                                        </SimpleGrid>
                                    ) : (
                                        <Paper withBorder p="xs" ta="center">
                                            <Text size="sm" c="dimmed italic">Seleccione una ruta para ver la tarifa base.</Text>
                                        </Paper>
                                    )}
                                </Box>
                            </Stack>
                        </Tabs.Panel>

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
                            <Button variant="subtle" color="gray" onClick={onClose}>Cancelar</Button>
                            {(activeTab === 'datos' || activeTab === 'logistica') && (
                                <Button type="submit" px="xl" color="cyan" radius="md">
                                    {proveedor ? "Actualizar Proveedor" : "Guardar y Continuar"}
                                </Button>
                            )}
                        </Group>
                    </form>
                </Tabs>
            </Box>

            {mostrarModalVehiculo && (
                <FormularioVehiculo
                    onClose={() => setMostrarModalVehiculo(false)}
                    recargar={fetchAuxiliares}
                />
            )}
        </Modal>
    );
};

export default FormularioProveedor;

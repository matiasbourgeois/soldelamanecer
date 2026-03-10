import React, { useState, useEffect, useContext } from "react";
import {
    Container,
    Paper,
    Title,
    Text,
    Alert,
    NumberInput,
    Button,
    Group,
    Stack,
    Loader,
    Center,
    ThemeIcon,
    Card,
    Grid,
    Tabs,
    Modal,
    Box,
    TextInput
} from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';
import {
    IconSettings,
    IconCash,
    IconAlertCircle,
    IconDeviceFloppy,
    IconDatabaseImport,
    IconServerCog,
    IconHistory,
    IconShieldCheck,
    IconMail,
    IconPlus,
    IconTrash,
    IconDownload
} from "@tabler/icons-react";
import axios from "axios";
import { apiSistema } from "@core/api/apiSistema";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";
import AuthContext from "@core/context/AuthProvider";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import sistemaService from "../../../services/sistemaService";

const ConfiguracionAdmin = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();

    // Tab 1: Parámetros Generales
    const [tarifaSDA, setTarifaSDA] = useState(0);
    const [emailsDrogSud, setEmailsDrogSud] = useState([]);
    const [nuevoEmail, setNuevoEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ultimaAcutalizacion, setUltimaActualizacion] = useState(null);

    // Tab 3: Sistema y Mantenimiento (Time Machine)
    const [recoveryDates, setRecoveryDates] = useState([null, null]);
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [modalConfirmOpen, setModalConfirmOpen] = useState(false);
    const [backupLoading, setBackupLoading] = useState(false);

    useEffect(() => {
        if (auth && auth.rol !== "admin") {
            mostrarAlerta("Acceso denegado. Se requiere nivel Administrador.", "danger");
            navigate("/");
        }
    }, [auth, navigate]);

    useEffect(() => {
        fetchConfiguracion();
    }, []);

    const fetchConfiguracion = async () => {
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(apiSistema("/configuracion"), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTarifaSDA(data.tarifaGlobalSDA || 0);
            setEmailsDrogSud(data.emailsDrogSud || []);
            setUltimaActualizacion(data.ultimaActualizacion);
        } catch (error) {
            console.error("Error al obtener configuración:", error);
            mostrarAlerta("Error al cargar la configuración global.", "danger");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.put(
                apiSistema("/configuracion"),
                {
                    tarifaGlobalSDA: tarifaSDA,
                    emailsDrogSud: emailsDrogSud
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTarifaSDA(data.configuracion.tarifaGlobalSDA);
            setEmailsDrogSud(data.configuracion.emailsDrogSud);
            setUltimaActualizacion(data.configuracion.ultimaActualizacion);
            mostrarAlerta(data.msg || "Configuración actualizada correctamente.", "success");
        } catch (error) {
            console.error("Error al guardar configuración:", error);
            mostrarAlerta(error.response?.data?.error || "Error al guardar la configuración.", "danger");
        } finally {
            setSaving(false);
        }
    };

    const executeRecoveryProtocol = async () => {
        if (!recoveryDates[0] || !recoveryDates[1]) {
            mostrarAlerta("Debe seleccionar ambas fechas.", "warning");
            return;
        }

        setRecoveryLoading(true);
        setModalConfirmOpen(false);

        try {
            const fIn = dayjs(recoveryDates[0]).format("YYYY-MM-DD");
            const fOut = dayjs(recoveryDates[1]).format("YYYY-MM-DD");

            const resultado = await sistemaService.recuperarDiasCaidos({
                fechaInicio: fIn,
                fechaFin: fOut
            });

            console.log("Reporte de Sincronización:", resultado.reporte);

            let msg = `Se procesaron ${resultado.reporte.length} días. Revisa la consola para el reporte detallado.`;
            mostrarAlerta(msg, "success");

        } catch (error) {
            console.error("Error en Recovery Protocol:", error);
            mostrarAlerta(error.response?.data?.error || "Error crítico del sistema.", "danger");
        } finally {
            setRecoveryLoading(false);
            setRecoveryDates([null, null]);
        }
    };

    const handleDownloadBackup = async () => {
        setBackupLoading(true);
        try {
            const token = localStorage.getItem("token");
            const response = await axios.get(apiSistema("/sistema/backup"), {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const fecha = dayjs().format('YYYY-MM-DD');
            link.setAttribute('download', `Backup_SDA_${fecha}.json.gz`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);

            mostrarAlerta("Respaldo de base de datos generado y descargado correctamente.", "success");
        } catch (error) {
            console.error("Error al descargar backup:", error);
            mostrarAlerta("Error al generar el respaldo de seguridad.", "danger");
        } finally {
            setBackupLoading(false);
        }
    };

    if (loading) {
        return (
            <Center style={{ height: "70vh" }}>
                <Loader size="lg" color="cyan" variant="dots" />
            </Center>
        );
    }

    return (
        <Container size="xl" py="lg">
            <Group mb="xl" gap="sm">
                <ThemeIcon size="xl" radius="md" color="indigo" variant="light">
                    <IconSettings size={28} />
                </ThemeIcon>
                <div>
                    <Title order={2} fw={800} c="dark.8">
                        Configuración y Sistema
                    </Title>
                    <Text c="dimmed" size="sm">
                        Panel de control administrativo maestro.
                    </Text>
                </div>
            </Group>

            <Tabs defaultValue="parametros" color="indigo" radius="md">
                <Tabs.List>
                    <Tabs.Tab value="parametros" leftSection={<IconCash size={16} />}>
                        Parámetros Generales
                    </Tabs.Tab>
                    <Tabs.Tab value="cargas" leftSection={<IconDatabaseImport size={16} />}>
                        Cargas Masivas
                    </Tabs.Tab>
                    <Tabs.Tab value="sistema" color="red" leftSection={<IconServerCog size={16} />}>
                        Sistema y Mantenimiento
                    </Tabs.Tab>
                </Tabs.List>

                {/* Tapa 1: Parámetros Clásicos */}
                <Tabs.Panel value="parametros" pt="xl">
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Card withBorder shadow="sm" radius="md" padding="xl">
                                <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
                                    <Group gap="xs">
                                        <IconCash size={18} color="var(--mantine-color-green-7)" />
                                        <Text fw={700} c="dark.7">Tarifas Universales</Text>
                                    </Group>
                                </Card.Section>

                                <Stack gap="lg" mt="md">
                                    <Alert icon={<IconAlertCircle size={16} />} title="Piso Mínimo Garantizado" color="blue" variant="light">
                                        Si el chofer maneja un vehículo de <b>SDA</b>, se le pagará esta tarifa base automáticamente, salvo que tenga un acuerdo mayor en su legajo.
                                    </Alert>

                                    <NumberInput
                                        label="Tarifa Universal Chofer (Vehículo SDA)"
                                        description="Monto mínimo garantizado por día/viaje a pagar por el servicio de manejo al usar flota de la empresa."
                                        placeholder="Ej. 30000"
                                        value={tarifaSDA}
                                        onChange={(val) => setTarifaSDA(Number(val))}
                                        prefix="$ "
                                        thousandSeparator="."
                                        decimalSeparator=","
                                        size="md"
                                        required
                                        styles={{ input: { fontWeight: 600, color: 'var(--mantine-color-green-8)' } }}
                                    />

                                    {ultimaAcutalizacion && (
                                        <Text size="xs" c="dimmed">
                                            Última actualización: {new Date(ultimaAcutalizacion).toLocaleString("es-AR")}
                                        </Text>
                                    )}

                                    <Group justify="flex-end" mt="xl">
                                        <Button leftSection={<IconDeviceFloppy size={18} />} color="cyan" onClick={handleSave} loading={saving} size="md" radius="md">
                                            Guardar Configuración
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 6 }}>
                            <Card withBorder shadow="sm" radius="md" padding="xl">
                                <Card.Section withBorder inheritPadding py="xs" bg="gray.0">
                                    <Group gap="xs">
                                        <IconMail size={18} color="var(--mantine-color-cyan-7)" />
                                        <Text fw={700} c="dark.7">Destinatarios Droguería del Sud</Text>
                                    </Group>
                                </Card.Section>

                                <Stack gap="md" mt="md">
                                    <Text size="sm" c="dimmed">
                                        Direcciones de correo que recibirán el informe diario de rutas consolidado.
                                    </Text>

                                    <Group align="flex-end">
                                        <Box style={{ flex: 1 }}>
                                            <TextInput
                                                label="Agregar Email"
                                                placeholder="ejemplo@drogueria.com"
                                                value={nuevoEmail}
                                                onChange={(e) => setNuevoEmail(e.target.value)}
                                                radius="md"
                                            />
                                        </Box>
                                        <Button
                                            variant="light"
                                            color="cyan"
                                            radius="md"
                                            onClick={() => {
                                                if (!nuevoEmail || !nuevoEmail.includes("@")) {
                                                    mostrarAlerta("Formato de email inválido", "warning");
                                                    return;
                                                }
                                                if (emailsDrogSud.includes(nuevoEmail)) {
                                                    mostrarAlerta("El email ya está en la lista", "warning");
                                                    return;
                                                }
                                                setEmailsDrogSud([...emailsDrogSud, nuevoEmail]);
                                                setNuevoEmail("");
                                            }}
                                        >
                                            <IconPlus size={18} />
                                        </Button>
                                    </Group>

                                    <Stack gap="xs" mt="sm">
                                        {emailsDrogSud.length === 0 ? (
                                            <Text size="xs" ta="center" c="dimmed" py="md">No hay emails configurados.</Text>
                                        ) : (
                                            emailsDrogSud.map((email, idx) => (
                                                <Paper key={idx} withBorder p="xs" radius="md" bg="gray.0">
                                                    <Group justify="space-between">
                                                        <Group gap="xs">
                                                            <IconMail size={14} color="gray" />
                                                            <Text size="sm" fw={600}>{email}</Text>
                                                        </Group>
                                                        <Button
                                                            variant="subtle"
                                                            color="red"
                                                            size="compact-xs"
                                                            onClick={() => setEmailsDrogSud(emailsDrogSud.filter(e => e !== email))}
                                                        >
                                                            <IconTrash size={14} />
                                                        </Button>
                                                    </Group>
                                                </Paper>
                                            ))
                                        )}
                                    </Stack>

                                    <Group justify="flex-end" mt="xl">
                                        <Button leftSection={<IconDeviceFloppy size={18} />} color="cyan" onClick={handleSave} loading={saving} size="md" radius="md">
                                            Guardar Emails
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </Tabs.Panel>

                {/* Tapa 2: Cargas Masivas (Placeholder para organizar futuro código) */}
                <Tabs.Panel value="cargas" pt="xl">
                    <Card withBorder shadow="sm" radius="md" padding="xl">
                        <Center style={{ height: 200 }}>
                            <Stack align="center" gap="xs">
                                <IconDatabaseImport size={48} color="var(--mantine-color-gray-4)" />
                                <Text c="dimmed" fw={500}>Área reservada para importadores de Excel y migraciones masivas.</Text>
                            </Stack>
                        </Center>
                    </Card>
                </Tabs.Panel>

                {/* Tapa 3: Time Machine */}
                <Tabs.Panel value="sistema" pt="xl">
                    <Grid>
                        <Grid.Col span={{ base: 12, md: 9 }}>
                            <Card withBorder shadow="sm" radius="md" padding="xl" style={{ borderColor: "var(--mantine-color-red-4)" }}>
                                <Card.Section withBorder inheritPadding py="xs" bg="red.0">
                                    <Group gap="xs">
                                        <IconShieldCheck size={18} color="var(--mantine-color-red-7)" />
                                        <Text fw={700} c="red.9">Protocolo de Recuperación de Datos</Text>
                                    </Group>
                                </Card.Section>

                                <Stack gap="md" mt="md">
                                    <Alert icon={<IconAlertCircle size={16} />} title="Procedimiento de Sincronización" color="red" variant="filled">
                                        Esta herramienta permite re-procesar registros operativos y estados de hojas de reparto en caso de interrupciones del servicio. Se recomienda utilizar con supervisión técnica.
                                    </Alert>

                                    <Text size="sm" c="dimmed">
                                        Seleccione el rango de fechas para re-procesar los registros operativos. El sistema omitirá feriados nacionales y respetará cronogramas manuales pre-existentes.
                                    </Text>

                                    <DatePickerInput
                                        type="range"
                                        label="Rango de Fechas Caídas"
                                        placeholder="Desde - Hasta"
                                        value={recoveryDates}
                                        onChange={setRecoveryDates}
                                        size="md"
                                        required
                                        clearable
                                        disabled={recoveryLoading}
                                    />

                                    <Group justify="flex-end" mt="xl">
                                        <Button
                                            leftSection={<IconHistory size={18} />}
                                            color="red"
                                            onClick={() => setModalConfirmOpen(true)}
                                            loading={recoveryLoading}
                                            size="md"
                                            radius="md"
                                            disabled={!recoveryDates[0] || !recoveryDates[1]}
                                        >
                                            Sincronizar Datos Operativos
                                        </Button>
                                    </Group>
                                </Stack>
                            </Card>
                        </Grid.Col>

                        <Grid.Col span={{ base: 12, md: 3 }}>
                            <Card withBorder shadow="sm" radius="md" padding="xl" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                                <Card.Section withBorder inheritPadding py="xs" bg="indigo.0">
                                    <Group gap="xs">
                                        <IconDownload size={18} color="var(--mantine-color-indigo-7)" />
                                        <Text fw={700} c="indigo.9">Respaldo Total</Text>
                                    </Group>
                                </Card.Section>

                                <Stack gap="md" mt="md" style={{ flex: 1, justifyContent: 'center' }}>
                                    <Alert icon={<IconShieldCheck size={16} />} color="indigo" variant="light" size="xs">
                                        Copia de seguridad completa (Datos + Estructura).
                                    </Alert>
                                    <Text size="xs" c="dimmed" ta="center">
                                        Descarga un archivo comprimido <b>.json.gz</b> con toda la información del sistema.
                                    </Text>
                                    <Button
                                        leftSection={<IconDownload size={20} />}
                                        color="indigo"
                                        variant="filled"
                                        size="lg"
                                        radius="md"
                                        fullWidth
                                        loading={backupLoading}
                                        onClick={handleDownloadBackup}
                                    >
                                        GENERAR BACKUP
                                    </Button>
                                </Stack>
                            </Card>
                        </Grid.Col>
                    </Grid>
                </Tabs.Panel>
            </Tabs>

            {/* Modal Confirmación Roja */}
            <Modal
                opened={modalConfirmOpen}
                onClose={() => setModalConfirmOpen(false)}
                title={<Title order={4} c="red.7">⚠️ Confirmar Sincronización Operativa</Title>}
                centered
                overlayProps={{ blur: 3, opacity: 0.55 }}
            >
                <Text size="sm" mb="lg">
                    Está a punto de iniciar un re-procesamiento masivo de datos operativos para el período comprendido entre el <b>{recoveryDates[0] && dayjs(recoveryDates[0]).format('DD/MM/YYYY')}</b> y el <b>{recoveryDates[1] && dayjs(recoveryDates[1]).format('DD/MM/YYYY')}</b>.
                    <br /><br />
                    El sistema validará las rutas correspondientes y actualizará los estados de las hojas de reparto de forma automática.
                    <b>¿Confirma que desea iniciar este procedimiento técnico?</b>
                </Text>

                <Group justify="flex-end">
                    <Button variant="default" onClick={() => setModalConfirmOpen(false)}>Cancelar</Button>
                    <Button color="red" onClick={executeRecoveryProtocol}>SÍ, INICIAR SINCRONIZACIÓN</Button>
                </Group>
            </Modal>
        </Container>
    );
};

export default ConfiguracionAdmin;

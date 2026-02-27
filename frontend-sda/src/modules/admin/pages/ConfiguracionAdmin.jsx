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
    Grid
} from "@mantine/core";
import { IconSettings, IconCash, IconAlertCircle, IconDeviceFloppy } from "@tabler/icons-react";
import axios from "axios";
import { apiSistema } from "@core/api/apiSistema";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";
import AuthContext from "@core/context/AuthProvider";
import { useNavigate } from "react-router-dom";

const ConfiguracionAdmin = () => {
    const { auth } = useContext(AuthContext);
    const navigate = useNavigate();

    const [tarifaSDA, setTarifaSDA] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [ultimaAcutalizacion, setUltimaActualizacion] = useState(null);

    // Redirección de seguridad redundante
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
                { tarifaGlobalSDA: tarifaSDA },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setTarifaSDA(data.configuracion.tarifaGlobalSDA);
            setUltimaActualizacion(data.configuracion.ultimaActualizacion);
            mostrarAlerta(data.msg || "Configuración actualizada correctamente.", "success");
        } catch (error) {
            console.error("Error al guardar configuración:", error);
            mostrarAlerta(
                error.response?.data?.error || "Error al guardar la configuración.",
                "danger"
            );
        } finally {
            setSaving(false);
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
        <Container size="lg" py="xl">
            <Group mb="xl" gap="sm">
                <ThemeIcon size="xl" radius="md" color="indigo" variant="light">
                    <IconSettings size={28} />
                </ThemeIcon>
                <div>
                    <Title order={2} fw={800} style={{ color: "var(--mantine-color-dark-8)" }}>
                        Configuración General del Sistema
                    </Title>
                    <Text c="dimmed" size="sm">
                        Parámetros globales que afectan a todos los módulos y trabajadores corporativos.
                    </Text>
                </div>
            </Group>

            <Grid>
                <Grid.Col span={{ base: 12, md: 8 }}>
                    <Card withBorder shadow="sm" radius="md" padding="xl" style={{ borderColor: "var(--mantine-color-gray-3)" }}>
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
                                <Button
                                    leftSection={<IconDeviceFloppy size={18} />}
                                    color="cyan"
                                    onClick={handleSave}
                                    loading={saving}
                                    size="md"
                                    radius="md"
                                >
                                    Guardar Configuración
                                </Button>
                            </Group>
                        </Stack>
                    </Card>
                </Grid.Col>
            </Grid>
        </Container>
    );
};

export default ConfiguracionAdmin;

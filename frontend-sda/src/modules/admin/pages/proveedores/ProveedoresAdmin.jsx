import React, { useEffect, useState } from "react";
import { Container, Paper, Title, Group, Button, TextInput, Stack, Text, Badge, ActionIcon, Tooltip, Loader, Center } from "@mantine/core";
import { Plus, Search, Truck, MapPin, Phone, Mail, User, Trash2, Pencil, Calendar } from "lucide-react";
import { apiSistema } from "../../../../core/api/apiSistema";
import FormularioProveedor from "./FormularioProveedor";
import axios from "axios";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../../../core/utils/confirmarAccion.jsx";
import dayjs from "dayjs";

const ProveedoresAdmin = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [proveedorEditando, setProveedorEditando] = useState(null);

    const fetchProveedores = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const { data } = await axios.get(apiSistema(`/proveedores?busqueda=${busqueda}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProveedores(data);
        } catch (error) {
            console.error("Error fetching providers:", error);
            mostrarAlerta("Error al cargar proveedores", "danger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timeout = setTimeout(fetchProveedores, 300);
        return () => clearTimeout(timeout);
    }, [busqueda]);

    const handleEliminar = async (id) => {
        const confirmado = await confirmarAccion("¿Eliminar proveedor?", "Esta acción no se puede deshacer.");
        if (!confirmado) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(apiSistema(`/proveedores/${id}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            mostrarAlerta("Proveedor eliminado", "success");
            fetchProveedores();
        } catch (error) {
            mostrarAlerta("Error al eliminar", "danger");
        }
    };

    return (
        <Container size="xl" py="md">
            <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
                <Group justify="space-between" mb="md">
                    <Stack gap={0}>
                        <Title order={2} fw={700} c="dimmed">Administración de Proveedores</Title>
                        <Text size="sm" c="dimmed">Gestión de choferes externos y tarifas por ruta</Text>
                    </Stack>
                    <Button
                        leftSection={<Plus size={18} />}
                        color="cyan"
                        variant="filled"
                        onClick={() => { setProveedorEditando(null); setMostrarModal(true); }}
                    >
                        Nuevo Proveedor
                    </Button>
                </Group>

                <TextInput
                    placeholder="Buscar por Razón Social o CUIT..."
                    leftSection={<Search size={16} />}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    mb="xl"
                    radius="md"
                    w={{ base: "100%", sm: 400 }}
                />

                {loading ? (
                    <Center py="xl"><Loader color="cyan" type="dots" /></Center>
                ) : (
                    <Stack gap="xs">
                        {proveedores.length > 0 ? proveedores.map((p) => (
                            <Paper key={p._id} withBorder p="md" radius="md" className="hover-shadow">
                                <Group justify="space-between">
                                    <Group gap="lg">
                                        <Stack gap={2}>
                                            <Text fw={700} size="lg" c="dark.4">{p.razonSocial}</Text>
                                            <Text size="xs" c="dimmed" ff="monospace">CUIT: {p.cuit}</Text>
                                        </Stack>

                                        <Divider orientation="vertical" />

                                        <Stack gap={4}>
                                            <Group gap={6}>
                                                <Truck size={14} color="gray" />
                                                <Text size="sm" fw={500}>
                                                    {p.vehiculoDefault ? `${p.vehiculoDefault.patente} (${p.vehiculoDefault.marca})` : "Sin vehículo"}
                                                </Text>
                                            </Group>
                                            <Group gap={6}>
                                                <MapPin size={14} color="gray" />
                                                <Text size="sm" c="dimmed">
                                                    {p.rutaDefault ? `Ruta: ${p.rutaDefault.codigo}` : "Sin ruta asignada"}
                                                </Text>
                                            </Group>
                                        </Stack>

                                        <Divider orientation="vertical" />

                                        <Stack gap={4}>
                                            <Badge variant="light" color="indigo" size="sm">
                                                $ {p.rutaDefault?.precioKm || 0} / KM
                                            </Badge>
                                            <Text size="xs" c="dimmed" ta="center">Tarifa Ruta</Text>
                                        </Stack>
                                    </Group>

                                    <Group gap="xs">
                                        <Tooltip label="Editar legajo">
                                            <ActionIcon variant="subtle" color="blue" size="lg" onClick={() => { setProveedorEditando(p); setMostrarModal(true); }}>
                                                <Pencil size={20} />
                                            </ActionIcon>
                                        </Tooltip>
                                        <ActionIcon variant="subtle" color="red" size="lg" onClick={() => handleEliminar(p._id)}>
                                            <Trash2 size={20} />
                                        </ActionIcon>
                                    </Group>
                                </Group>
                            </Paper>
                        )) : (
                            <Text ta="center" py="xl" c="dimmed">No se encontraron proveedores.</Text>
                        )}
                    </Stack>
                )}
            </Paper>

            {mostrarModal && (
                <FormularioProveedor
                    opened={mostrarModal}
                    onClose={() => setMostrarModal(false)}
                    proveedor={proveedorEditando}
                    recargar={fetchProveedores}
                />
            )}
        </Container>
    );
};

export default ProveedoresAdmin;

const Divider = ({ orientation = "horizontal" }) => (
    <div style={{
        width: orientation === "vertical" ? "1px" : "100%",
        height: orientation === "vertical" ? "40px" : "1px",
        backgroundColor: "#eee"
    }} />
);

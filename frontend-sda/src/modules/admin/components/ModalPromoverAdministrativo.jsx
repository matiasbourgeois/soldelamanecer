import React, { useState, useEffect } from "react";
import {
    Modal,
    TextInput,
    Text,
    Group,
    Stack,
    ActionIcon,
    Button,
    Loader,
    Center,
    Avatar,
    Paper,
    Badge,
} from "@mantine/core";
import { Search, UserCheck, ChevronRight, XCircle } from "lucide-react";
import { apiUsuariosApi } from "@core/api/apiSistema";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";

const ModalPromoverAdministrativo = ({ abierto, onClose, token, onPromocionExitosa }) => {
    const [busqueda, setBusqueda] = useState("");
    const [resultados, setResultados] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingPromocion, setLoadingPromocion] = useState(null); // ID del usuario siendo promovido

    // Efecto de Debounce para no saturar al servidor en cada tecla
    useEffect(() => {
        const timeOutId = setTimeout(() => {
            if (busqueda.trim().length > 2) {
                buscarClientes(busqueda);
            } else {
                setResultados([]); // Limpiar si borró
            }
        }, 500);

        return () => clearTimeout(timeOutId);
    }, [busqueda]);

    const buscarClientes = async (term) => {
        setLoading(true);
        try {
            const response = await fetch(apiUsuariosApi(`/buscar-promocion?busqueda=${encodeURIComponent(term)}`), {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await response.json();
            if (response.ok) {
                setResultados(data);
            } else {
                setResultados([]);
            }
        } catch (error) {
            console.error("Error al buscar clientes:", error);
        } finally {
            setLoading(false);
        }
    };

    const promoverAAdministrativo = async (usuarioId, nombre) => {
        setLoadingPromocion(usuarioId);
        try {
            const response = await fetch(apiUsuariosApi(`/${usuarioId}/rol`), {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ rol: "administrativo" })
            });

            if (response.ok) {
                mostrarAlerta(`✅ ${nombre} promovido a Administrativo`, "success");
                onPromocionExitosa();
                handleClose();
            } else {
                const data = await response.json();
                mostrarAlerta(data.error || "❌ Error al promover usuario", "danger");
            }
        } catch (error) {
            console.error("Error en promoción:", error);
            mostrarAlerta("❌ Error de red al promover", "danger");
        } finally {
            setLoadingPromocion(null);
        }
    };

    const handleClose = () => {
        setBusqueda("");
        setResultados([]);
        onClose();
    };

    return (
        <Modal
            opened={abierto}
            onClose={handleClose}
            title={
                <Group>
                    <ActionIcon color="teal" variant="light" radius="xl">
                        <UserCheck size={18} />
                    </ActionIcon>
                    <Text fw={600}>Promover Cliente a Administrativo</Text>
                </Group>
            }
            size="lg"
            radius="md"
        >
            <Stack pb="sm">
                <Text size="sm" c="dimmed">
                    Busca al cliente por nombre, email o DNI para ascenderlo al plantel corporativo.
                </Text>

                <TextInput
                    placeholder="Ej: juan.perez@gmail.com, 35000000..."
                    leftSection={<Search size={16} />}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.currentTarget.value)}
                    data-autofocus
                    radius="md"
                    rightSection={
                        loading ? <Loader size={16} color="teal" /> : busqueda ? (
                            <ActionIcon size="sm" variant="transparent" c="dimmed" onClick={() => setBusqueda("")}>
                                <XCircle size={16} />
                            </ActionIcon>
                        ) : null
                    }
                />

                <Stack gap="xs" mt="sm">
                    {resultados.length > 0 ? (
                        resultados.map((user) => (
                            <Paper key={user._id} shadow="xs" p="md" radius="sm" withBorder style={{ transition: 'all 0.2s ease' }}>
                                <Group justify="space-between" align="center" wrap="nowrap">

                                    {/* Info del Cliente */}
                                    <Group wrap="nowrap" style={{ flex: 1, overflow: 'hidden' }}>
                                        <Avatar
                                            src={user.fotoPerfil ? `http://localhost:5000${user.fotoPerfil}` : null}
                                            color="initials"
                                            name={user.nombre}
                                            radius="xl"
                                        />
                                        <Stack gap={2} style={{ overflow: 'hidden' }}>
                                            <Text fw={600} size="sm" truncate>{user.nombre}</Text>
                                            <Group gap="xs" wrap="nowrap">
                                                <Text size="xs" c="dimmed" truncate>{user.email}</Text>
                                                <Badge size="xs" variant="light" color="gray">{user.dni || "S/D"}</Badge>
                                            </Group>
                                        </Stack>
                                    </Group>

                                    {/* Acción */}
                                    <Button
                                        variant="light"
                                        color="teal"
                                        size="xs"
                                        radius="xl"
                                        rightSection={<ChevronRight size={14} />}
                                        loading={loadingPromocion === user._id}
                                        onClick={() => promoverAAdministrativo(user._id, user.nombre)}
                                    >
                                        Ascender
                                    </Button>

                                </Group>
                            </Paper>
                        ))
                    ) : busqueda.length > 2 && !loading ? (
                        <Center py="xl">
                            <Text c="dimmed" size="sm">No se encontraron clientes activos con "{busqueda}".</Text>
                        </Center>
                    ) : busqueda.length > 0 && busqueda.length <= 2 ? (
                        <Center py="sm">
                            <Text c="dimmed" size="xs">Escribe al menos 3 caracteres...</Text>
                        </Center>
                    ) : null}
                </Stack>
            </Stack>
        </Modal>
    );
};

export default ModalPromoverAdministrativo;

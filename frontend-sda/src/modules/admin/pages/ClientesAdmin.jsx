import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiUsuariosApi } from "@core/api/apiSistema";
import {
    Table,
    ScrollArea,
    Text,
    TextInput,
    Badge,
    ActionIcon,
    Group,
    Container,
    Paper,
    Title,
    Pagination,
    Loader,
    Center,
    Tooltip
} from "@mantine/core";
import { Trash2, CheckCircle, Search, UserCheck, AlertCircle, Phone, CreditCard } from "lucide-react";
import AuthContext from "@core/context/AuthProvider";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";
import { confirmarAccion } from "@core/utils/confirmarAccion.jsx";

const ClientesAdmin = () => {
    const navigate = useNavigate();
    const { auth } = useContext(AuthContext);

    const [clientes, setClientes] = useState([]);
    const [paginaActual, setPaginaActual] = useState(1);
    const [limite] = useState(10);
    const [totalClientes, setTotalClientes] = useState(0);
    const [busqueda, setBusqueda] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!auth?._id || !["admin", "administrativo"].includes(auth.rol)) {
            navigate("/");
        } else {
            fetchClientes();
        }
    }, [auth, paginaActual, busqueda]);

    const fetchClientes = async () => {
        setLoading(true);
        setError(null);
        try {
            const query = new URLSearchParams();
            query.append("pagina", paginaActual - 1);
            query.append("limite", limite);
            if (busqueda) query.append("busqueda", busqueda);

            const response = await fetch(
                apiUsuariosApi(`/clientes?${query.toString()}`),
                {
                    headers: { Authorization: `Bearer ${auth.token}` },
                }
            );

            const data = await response.json();
            if (response.ok) {
                setClientes(data.resultados);
                setTotalClientes(data.total);
            } else {
                setError(data.error || "Error al obtener clientes");
            }
        } catch (err) {
            console.error("Error al conectar con el backend:", err);
            setError("Error de conexión");
        } finally {
            setLoading(false);
        }
    };

    const handleVerificarUsuario = async (userId) => {
        try {
            const response = await fetch(apiUsuariosApi(`/verificar/${userId}`), {
                method: "PUT",
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            if (response.ok) {
                mostrarAlerta("✅ Cliente verificado correctamente", "success");
                fetchClientes();
            } else {
                const data = await response.json();
                mostrarAlerta(data.error || "❌ Error al verificar cliente", "danger");
            }
        } catch (error) {
            console.error("Error al verificar cliente:", error);
            mostrarAlerta("❌ Error de conexión al verificar cliente", "danger");
        }
    };

    const handleEliminarCliente = async (userId) => {
        const confirmar = await confirmarAccion("¿Archivar Cliente?", "El cliente desaparecerá de las listas operativas pero se preservará para el historial logístico (Soft Delete).");
        if (!confirmar) return;

        try {
            const response = await fetch(apiUsuariosApi(`/${userId}`), {
                method: "DELETE",
                headers: { Authorization: `Bearer ${auth.token}` },
            });

            if (response.ok) {
                mostrarAlerta("✅ Cliente archivado correctamente", "success");
                setClientes((prev) => prev.filter((u) => u._id !== userId));
            } else {
                const data = await response.json();
                mostrarAlerta(data.error || "❌ Error al archivar cliente", "danger");
            }
        } catch (error) {
            console.error("Error al archivar cliente:", error);
            mostrarAlerta("❌ Error de conexión", "danger");
        }
    };

    const totalPaginas = Math.ceil(totalClientes / limite);

    return (
        <Container size="xl" py="md">
            <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
                <Group justify="space-between" mb="md">
                    <Title order={2} fw={700} c="dimmed">
                        Directorio de Clientes
                    </Title>
                    <TextInput
                        placeholder="Buscar por nombre, email o DNI..."
                        leftSection={<Search size={16} />}
                        value={busqueda}
                        onChange={(e) => {
                            setBusqueda(e.target.value);
                            setPaginaActual(1);
                        }}
                        radius="md"
                        w={{ base: '100%', sm: 300 }}
                    />
                </Group>

                {error && (
                    <Text c="red" ta="center" mb="md" fw={500}>
                        <AlertCircle size={16} style={{ display: 'inline', verticalAlign: 'middle' }} /> {error}
                    </Text>
                )}

                <ScrollArea>
                    <Table striped highlightOnHover verticalSpacing="sm" withTableBorder={false}>
                        <Table.Thead>
                            <Table.Tr>
                                <Table.Th>Cliente</Table.Th>
                                <Table.Th>Contacto</Table.Th>
                                <Table.Th>Documentación</Table.Th>
                                <Table.Th>Estado</Table.Th>
                                <Table.Th ta="center">Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {loading ? (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Center py="xl">
                                            <Loader color="cyan" type="dots" />
                                        </Center>
                                    </Table.Td>
                                </Table.Tr>
                            ) : clientes.length > 0 ? (
                                clientes.map((user) => (
                                    <Table.Tr key={user._id}>
                                        <Table.Td>
                                            <Group gap="sm">
                                                <ActionIcon variant="light" color="cyan" radius="xl" size="lg">
                                                    <UserCheck size={18} />
                                                </ActionIcon>
                                                <div>
                                                    <Text fw={600} size="sm">{user.nombre}</Text>
                                                    {user.creadoPorAdmin && (
                                                        <Badge color="blue" variant="dot" size="xs">
                                                            Alta Rápida
                                                        </Badge>
                                                    )}
                                                </div>
                                            </Group>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" c="dimmed" display="flex" style={{ alignItems: 'center', gap: 4 }}>
                                                {user.email}
                                            </Text>
                                            <Text size="xs" c="cyan.7" display="flex" mt={2} style={{ alignItems: 'center', gap: 4 }}>
                                                <Phone size={12} /> {user.telefono || "Sin Teléfono"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" display="flex" style={{ alignItems: 'center', gap: 4 }}>
                                                <CreditCard size={14} /> {user.dni || "Falta DNI"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td>
                                            {user.verificado ? (
                                                <Badge color="green" variant="light" size="sm" radius="sm">
                                                    Verificado
                                                </Badge>
                                            ) : (
                                                <Badge color="gray" variant="light" size="sm" radius="sm">
                                                    Pendiente
                                                </Badge>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Group justify="center" gap={8}>
                                                {!user.verificado && auth.rol === "admin" && (
                                                    <Tooltip label="Verificar Manualmente">
                                                        <ActionIcon
                                                            color="gray"
                                                            variant="subtle"
                                                            onClick={() => handleVerificarUsuario(user._id)}
                                                            style={{ stroke: '#495057' }}
                                                        >
                                                            <CheckCircle size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                                {auth.rol === "admin" && (
                                                    <Tooltip label="Archivar Cliente">
                                                        <ActionIcon
                                                            color="red"
                                                            variant="subtle"
                                                            onClick={() => handleEliminarCliente(user._id)}
                                                        >
                                                            <Trash2 size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                )}
                                            </Group>
                                        </Table.Td>
                                    </Table.Tr>
                                ))
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={5}>
                                        <Text ta="center" py="xl" c="dimmed">
                                            No se encontraron clientes registrados en el sistema.
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                {totalPaginas > 1 && (
                    <Group justify="flex-end" mt="md">
                        <Pagination
                            total={totalPaginas}
                            value={paginaActual}
                            onChange={setPaginaActual}
                            color="cyan"
                            radius="md"
                            withEdges
                        />
                    </Group>
                )}
            </Paper>
        </Container>
    );
};

export default ClientesAdmin;

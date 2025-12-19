import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { apiUsuariosApi } from "../../utils/api";
import {
  Table,
  ScrollArea,
  Text,
  TextInput,
  Select,
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
import { Trash2, CheckCircle, Search, User, AlertCircle } from "lucide-react";
import AuthContext from "../../context/AuthProvider";
import { mostrarAlerta } from "../../utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../utils/confirmarAccion.jsx";

const UsuariosAdmin = () => {
  const navigate = useNavigate();
  const { auth } = useContext(AuthContext);

  const [usuarios, setUsuarios] = useState([]);
  const [paginaActual, setPaginaActual] = useState(1); // Mantine pagination is 1-indexed
  const [limite] = useState(10);
  const [totalUsuarios, setTotalUsuarios] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!auth?._id || auth.rol !== "admin") {
      navigate("/");
    } else {
      fetchUsuarios();
    }
  }, [auth, paginaActual, busqueda]); // Dep: paginaActual (1-based now)

  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams();
      query.append("pagina", paginaActual - 1); // Backend expects 0-indexed
      query.append("limite", limite);
      if (busqueda) query.append("busqueda", busqueda);

      const response = await fetch(
        apiUsuariosApi(`/paginados?${query.toString()}`),
        {
          headers: { Authorization: `Bearer ${auth.token}` },
        } // apiUsuariosApi resolves to full URL? Assuming yes based on original
      );

      const data = await response.json();
      if (response.ok) {
        setUsuarios(data.resultados);
        setTotalUsuarios(data.total);
      } else {
        setError(data.error || "Error al obtener usuarios");
      }
    } catch (err) {
      console.error("Error al conectar con el backend:", err);
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleChangeRol = async (userId, nuevoRol) => {
    try {
      const response = await fetch(apiUsuariosApi(`/${userId}/rol`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ rol: nuevoRol }),
      });

      const data = await response.json();
      if (response.ok) {
        mostrarAlerta(`✅ Rol actualizado a ${nuevoRol}`, "success");
        fetchUsuarios();
      } else {
        mostrarAlerta(data.error || "❌ Error al actualizar rol", "danger");
      }
    } catch (error) {
      console.error("Error al cambiar rol:", error);
      mostrarAlerta("❌ Error de conexión", "danger");
    }
  };

  const handleVerificarUsuario = async (userId) => {
    try {
      const response = await fetch(apiUsuariosApi(`/verificar/${userId}`), {
        method: "PUT",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (response.ok) {
        mostrarAlerta("✅ Usuario verificado correctamente", "success");
        fetchUsuarios();
      } else {
        const data = await response.json();
        mostrarAlerta(data.error || "❌ Error al verificar usuario", "danger");
      }
    } catch (error) {
      console.error("Error al verificar usuario:", error);
      mostrarAlerta("❌ Error de conexión al verificar usuario", "danger");
    }
  };

  const handleEliminarUsuario = async (userId) => {
    const confirmar = await confirmarAccion("¿Eliminar usuario?", "Esta acción no se puede deshacer");
    if (!confirmar) return;

    try {
      const response = await fetch(apiUsuariosApi(`/${userId}`), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${auth.token}` },
      });

      if (response.ok) {
        mostrarAlerta("✅ Usuario eliminado correctamente", "success");
        setUsuarios((prev) => prev.filter((u) => u._id !== userId));
      } else {
        const data = await response.json();
        mostrarAlerta(data.error || "❌ Error al eliminar usuario", "danger");
      }
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      mostrarAlerta("❌ Error de conexión", "danger");
    }
  };

  const getRoleColor = (rol) => {
    switch (rol) {
      case 'admin': return 'red';
      case 'administrativo': return 'blue';
      case 'chofer': return 'orange';
      default: return 'gray';
    }
  };

  // Calculate total pages for Mantine Pagination
  const totalPaginas = Math.ceil(totalUsuarios / limite);

  return (
    <Container size="xl" py="md">
      <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} fw={700} c="dimmed">
            Gestión de Usuarios
          </Title>
          <TextInput
            placeholder="Buscar por nombre o email..."
            leftSection={<Search size={16} />}
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value);
              setPaginaActual(1);
            }}
            radius="md"
            w={300}
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
                <Table.Th>Usuario</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Rol</Table.Th>
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
              ) : usuarios.length > 0 ? (
                usuarios.map((user) => (
                  <Table.Tr key={user._id}>
                    <Table.Td>
                      <Group gap="sm">
                        {/* 2. User Icon: Gray instead of Yellow */}
                        <ActionIcon variant="light" color="gray" radius="xl" size="lg">
                          <User size={18} />
                        </ActionIcon>
                        <Text fw={500}>{user.nombre}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">{user.email}</Text>
                    </Table.Td>
                    <Table.Td>
                      {/* 3. Role Select: Cyan instead of Yellow */}
                      <Select
                        value={user.rol}
                        onChange={(val) => handleChangeRol(user._id, val)}
                        data={[
                          { value: 'cliente', label: 'Cliente' },
                          { value: 'chofer', label: 'Chofer' },
                          { value: 'administrativo', label: 'Administrativo' },
                          { value: 'admin', label: 'Admin' }
                        ]}
                        size="xs"
                        radius="md"
                        w={140}
                        variant="filled"
                        color="cyan"
                        allowDeselect={false}
                      />
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
                        {!user.verificado && (
                          <Tooltip label="Verificar Usuario">
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
                        <Tooltip label="Eliminar Usuario">
                          <ActionIcon
                            color="gray"
                            variant="subtle"
                            onClick={() => handleEliminarUsuario(user._id)}
                            style={{ stroke: '#495057' }}
                          >
                            <Trash2 size={18} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))
              ) : (
                <Table.Tr>
                  <Table.Td colSpan={5}>
                    <Text ta="center" py="md" c="dimmed">
                      No se encontraron usuarios
                    </Text>
                  </Table.Td>
                </Table.Tr>
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>

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
      </Paper>
    </Container>
  );
};

export default UsuariosAdmin;

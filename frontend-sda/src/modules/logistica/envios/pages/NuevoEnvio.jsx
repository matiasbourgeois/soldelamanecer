import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Container, Paper, Title, Grid, TextInput, NumberInput, Button,
  Text, Group, Stack, ActionIcon, Modal, Select, ThemeIcon, Box, UnstyledButton, ScrollArea, Card, Divider, Badge, Tooltip, rem
} from "@mantine/core";
import {
  Package, User, MapPin, Truck, Plus, Search, X, ArrowRight, Check
} from "lucide-react";
import { apiSistema, apiClientes } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import AuthContext from "../../../../core/context/AuthProvider";

const NuevoEnvio = () => {
  const { auth } = useContext(AuthContext);
  const [clientes, setClientes] = useState([]);
  const [clienteRemitenteId, setClienteRemitenteId] = useState("");
  const [clienteRemitenteInfo, setClienteRemitenteInfo] = useState(null);

  const [destinatarios, setDestinatarios] = useState([]);
  const [destinatarioId, setDestinatarioId] = useState("");

  const [localidades, setLocalidades] = useState([]);
  const [localidadDestino, setLocalidadDestino] = useState("");

  const [peso, setPeso] = useState("");
  const [dimensiones, setDimensiones] = useState({ largo: "", ancho: "", alto: "" });
  const [cantidad, setCantidad] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [destinatarioInfo, setDestinatarioInfo] = useState(null);
  const [nuevoDestinatario, setNuevoDestinatario] = useState({
    nombre: "",
    dni: "",
    telefono: "",
    email: "",
    direccion: "",
    localidad: "",
    provincia: "Córdoba"
  });

  const [busquedaDestinatario, setBusquedaDestinatario] = useState("");
  const [sugerencias, setSugerencias] = useState([]);
  const [cargandoBusqueda, setCargandoBusqueda] = useState(false);

  const [busquedaRemitente, setBusquedaRemitente] = useState("");
  const [remitenteSugerencias, setRemitenteSugerencias] = useState([]);
  const [remitenteInfo, setRemitenteInfo] = useState(null);


  const navigate = useNavigate();

  useEffect(() => {
    const buscar = async () => {
      if (busquedaDestinatario.length < 2) {
        setSugerencias([]);
        return;
      }

      setCargandoBusqueda(true);
      try {
        const res = await axios.get(apiSistema(`/api/destinatarios/buscar`), {
          params: {
            busqueda: busquedaDestinatario,
            pagina: 0,
            limite: 10,
          },
        });
        setSugerencias(res.data.resultados);
      } catch (error) {
        console.error("Error al buscar destinatarios:", error);
      }
      setCargandoBusqueda(false);
    };

    const delay = setTimeout(buscar, 400); // debounce
    return () => clearTimeout(delay);
  }, [busquedaDestinatario]);


  useEffect(() => {
    const buscar = async () => {
      if (busquedaRemitente.length < 2) {
        setRemitenteSugerencias([]);
        return;
      }

      try {
        const res = await axios.get(apiClientes("/buscar-clientes"), {
          params: {
            busqueda: busquedaRemitente,
            pagina: 0,
            limite: 10,
          },
        });
        setRemitenteSugerencias(res.data.resultados);
      } catch (error) {
        console.error("Error al buscar remitentes:", error);
      }
    };

    const delay = setTimeout(buscar, 400); // debounce
    return () => clearTimeout(delay);
  }, [busquedaRemitente]);


  useEffect(() => {
    const obtenerDatos = async () => {
      // 1. Obtener Clientes (Remitentes)
      try {
        const clientesRes = await axios.get(apiSistema("/clientes")); // Corregido el endpoint local
        setClientes(clientesRes.data);
      } catch (error) {
        console.error("Error al obtener clientes:", error);
      }

      // 2. Obtener Localidades (Destinatarios)
      try {
        const localidadesRes = await axios.get(apiSistema("/api/localidades"));
        console.log("📍 Localidades loaded:", localidadesRes.data?.length || 0);
        setLocalidades(localidadesRes.data);
      } catch (error) {
        console.error("Error al obtener localidades:", error);
      }
    };

    obtenerDatos();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!destinatarioId || !localidadDestino) {
      mostrarAlerta("Debes seleccionar o crear un destinatario con localidad.");
      return;
    }

    const envio = {
      clienteRemitente: clienteRemitenteId,
      destinatario: destinatarioId,
      localidadDestino: localidadDestino,
      sucursalOrigen: "Sucursal Córdoba",
      usuarioCreador: auth?._id, // Dinámico desde Context
      encomienda: {
        peso: parseFloat(peso),
        dimensiones: {
          largo: parseFloat(dimensiones.largo),
          ancho: parseFloat(dimensiones.ancho),
          alto: parseFloat(dimensiones.alto)
        },
        cantidad: parseInt(cantidad),
        tipoPaquete: "Documentación"
      }
    };

    try {
      const res = await axios.post(apiSistema("/api/envios"), envio);
      mostrarAlerta("Envío creado con éxito", "success");
      navigate("/perfil");
    } catch (error) {
      console.error("Error al crear envío:", error);
    }
  };


  const handleGuardarDestinatario = async () => {
    if (!nuevoDestinatario.localidad) {
      mostrarAlerta("Por favor selecciona una localidad para el destinatario.");
      return;
    }

    try {
      const res = await axios.post(apiSistema("/api/destinatarios"), nuevoDestinatario);

      // Hacer una segunda llamada con populate
      const resPopulado = await axios.get(apiSistema(`/api/destinatarios/${res.data._id}`));

      setDestinatarioId(resPopulado.data._id);
      setDestinatarioInfo(resPopulado.data);
      setLocalidadDestino(resPopulado.data.localidad._id || resPopulado.data.localidad);
      setShowModal(false);
    } catch (error) {
      if (error.response && error.response.data?.error) {
        mostrarAlerta(`Error: ${error.response.data.error}`);
      } else {
        mostrarAlerta("Error inesperado al crear destinatario.");
      }
    }
  };


  // Helper Styled Render Function
  // Helper Styled Render Function
  const renderInfoCard = (info, type = "client") => (
    <Card p="sm" radius="md" bg="var(--mantine-color-gray-0)" mt="sm" style={{ border: '1px solid transparent' }}>
      <Group align="center" mb="xs" wrap="nowrap">
        <ThemeIcon variant="white" color={type === 'client' ? 'cyan' : 'blue'} size="lg" radius="xl" style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
          {type === 'client' ? <User size={18} /> : <MapPin size={18} />}
        </ThemeIcon>
        <Box style={{ flex: 1 }}>
          <Text size="sm" fw={700} c="dark.4" lh={1.2}>{info.nombre}</Text>
          <Text size="xs" c="dimmed" lh={1.2}>{info.dni || 'Sin DNI'}</Text>
        </Box>
      </Group>

      <Grid gutter="xs">
        <Grid.Col span={6}>
          <Text size="10px" tt="uppercase" c="dimmed" fw={700}>Email</Text>
          <Text size="xs" fw={500} truncate>{info.email}</Text>
        </Grid.Col>
        <Grid.Col span={6}>
          <Text size="10px" tt="uppercase" c="dimmed" fw={700}>Teléfono</Text>
          <Text size="xs" fw={500}>{info.telefono || '-'}</Text>
        </Grid.Col>
        <Grid.Col span={12}>
          <Text size="10px" tt="uppercase" c="dimmed" fw={700}>Dirección</Text>
          <Text size="xs" fw={500}>
            {info.direccion}
            {info.localidad && (
              <Text span inherit c="dimmed"> • {typeof info.localidad === 'object' ? info.localidad?.nombre : info.localidad}</Text>
            )}
          </Text>
        </Grid.Col>
      </Grid>
    </Card>
  );

  return (
    <Container size="xl" py={50}>
      {/* Header Minimalista */}
      <Group justify="space-between" align="flex-end" mb={40}>
        <Box>
          <Group align="center" gap="xs" mb={5}>
            <ThemeIcon variant="light" color="cyan" size="md" radius="md">
              <Truck size={16} />
            </ThemeIcon>
            <Text tt="uppercase" c="cyan" fw={800} fz="xs" ls={1.5}>
              Logística & Distribución
            </Text>
          </Group>
          <Title order={1} style={{ fontSize: rem(42), fontWeight: 900, letterSpacing: '-1.5px', color: 'var(--mantine-color-dark-8)' }}>
            Nuevo Envío
          </Title>
          <Text c="dimmed" size="lg" mt={5} maw={600} lh={1.4}>
            Complete los datos del remitente, destinatario y paquete para generar la etiqueta de despacho.
          </Text>
        </Box>
      </Group>

      <form onSubmit={handleSubmit}>
        <Grid gutter={30}>
          {/* COLUMNA IZQUIERDA: ACTORES */}
          <Grid.Col span={{ base: 12, md: 7 }}>
            <Stack gap="lg">
              {/* CARD REMITENTE (CYAN) */}
              <Card shadow="sm" radius="lg" padding="xl" withBorder style={{ borderColor: 'var(--mantine-color-cyan-2)', overflow: 'visible' }}>
                <Group mb="lg">
                  <ThemeIcon size={42} radius="md" color="cyan" variant="light">
                    <User size={24} />
                  </ThemeIcon>
                  <div>
                    <Text size="lg" fw={800} c="dark.4">Remitente</Text>
                    <Text size="sm" c="dimmed">¿Quién envía el paquete?</Text>
                  </div>
                </Group>

                <Box pos="relative">
                  <TextInput
                    label="Buscar Cliente"
                    placeholder="Escriba nombre, email o DNI..."
                    leftSection={<Search size={16} />}
                    radius="md"
                    size="md"
                    variant="filled"
                    value={busquedaRemitente}
                    onChange={(e) => {
                      setBusquedaRemitente(e.target.value);
                      setClienteRemitenteId("");
                      setRemitenteInfo(null);
                    }}
                    rightSection={busquedaRemitente && (
                      <ActionIcon variant="transparent" onClick={() => {
                        setBusquedaRemitente('');
                        setClienteRemitenteId('');
                        setRemitenteInfo(null);
                      }}>
                        <X size={14} />
                      </ActionIcon>
                    )}
                  />

                  {remitenteSugerencias.length > 0 && (
                    <Paper withBorder shadow="xl" pos="absolute" w="100%" radius="md" style={{ zIndex: 10, marginTop: 5, overflow: 'hidden' }}>
                      <ScrollArea.Autosize mah={250}>
                        {remitenteSugerencias.map((usuario) => (
                          <UnstyledButton
                            key={usuario._id}
                            p="xs"
                            w="100%"
                            onClick={() => {
                              setClienteRemitenteId(usuario._id);
                              setRemitenteInfo(usuario);
                              setBusquedaRemitente(`${usuario.nombre} (${usuario.email})`);
                              setRemitenteSugerencias([]);
                            }}
                            className="hover-bg-gray"
                            style={{ display: 'block', borderBottom: '1px solid #f1f3f5' }}
                          >
                            <Group>
                              <ThemeIcon variant="light" color="cyan" size="sm" radius="xl"><User size={12} /></ThemeIcon>
                              <Box>
                                <Text size="sm" fw={600}>{usuario.nombre}</Text>
                                <Text size="xs" c="dimmed">{usuario.email}</Text>
                              </Box>
                            </Group>
                          </UnstyledButton>
                        ))}
                      </ScrollArea.Autosize>
                    </Paper>
                  )}
                </Box>

                {remitenteInfo && renderInfoCard(remitenteInfo, 'client')}
              </Card>

              {/* CARD DESTINATARIO (BLUE) */}
              <Card shadow="sm" radius="lg" padding="xl" withBorder style={{ borderColor: 'var(--mantine-color-blue-2)', overflow: 'visible' }}>
                <Group justify="space-between" mb="lg">
                  <Group>
                    <ThemeIcon size={42} radius="md" color="blue" variant="light">
                      <MapPin size={24} />
                    </ThemeIcon>
                    <div>
                      <Text size="lg" fw={800} c="dark.4">Destinatario</Text>
                      <Text size="sm" c="dimmed">¿Quién recibe el paquete?</Text>
                    </div>
                  </Group>
                  <Button size="xs" radius="md" variant="light" color="blue" leftSection={<Plus size={14} />} onClick={() => setShowModal(true)}>
                    Nuevo Destinatario
                  </Button>
                </Group>

                <Box pos="relative">
                  <TextInput
                    label="Buscar Destinatario"
                    placeholder="Nombre o DNI del receptor..."
                    leftSection={<Search size={16} />}
                    radius="md"
                    size="md"
                    variant="filled"
                    value={busquedaDestinatario}
                    onChange={(e) => {
                      setBusquedaDestinatario(e.target.value);
                      setDestinatarioId("");
                      setDestinatarioInfo(null);
                    }}
                    rightSection={
                      busquedaDestinatario ? (
                        <ActionIcon variant="transparent" onClick={() => {
                          setBusquedaDestinatario('');
                          setDestinatarioId('');
                          setDestinatarioInfo(null);
                          setLocalidadDestino('');
                        }}>
                          <X size={14} />
                        </ActionIcon>
                      ) : (cargandoBusqueda ? <Search size={14} className="spin" /> : null)
                    }
                  />

                  {sugerencias.length > 0 && (
                    <Paper withBorder shadow="xl" pos="absolute" w="100%" radius="md" style={{ zIndex: 10, marginTop: 5, overflow: 'hidden' }}>
                      <ScrollArea.Autosize mah={250}>
                        {sugerencias.map((dest) => (
                          <UnstyledButton
                            key={dest._id}
                            p="xs"
                            w="100%"
                            onClick={() => {
                              setDestinatarioId(dest._id);
                              setDestinatarioInfo(dest);
                              const localidadId = typeof dest.localidad === "object" ? dest.localidad._id : dest.localidad;
                              setLocalidadDestino(localidadId);
                              setBusquedaDestinatario(`${dest.nombre} (${dest.dni})`);
                              setSugerencias([]);
                            }}
                            className="hover-bg-gray"
                            style={{ display: 'block', borderBottom: '1px solid #f1f3f5' }}
                          >
                            <Group>
                              <ThemeIcon variant="light" color="blue" size="sm" radius="xl"><MapPin size={12} /></ThemeIcon>
                              <Box>
                                <Text size="sm" fw={600}>{dest.nombre}</Text>
                                <Text size="xs" c="dimmed">{dest.dni} - {dest.direccion}</Text>
                              </Box>
                            </Group>
                          </UnstyledButton>
                        ))}
                      </ScrollArea.Autosize>
                    </Paper>
                  )}
                </Box>

                {destinatarioInfo && renderInfoCard(destinatarioInfo, 'dest')}
              </Card>
            </Stack>
          </Grid.Col>

          {/* COLUMNA DERECHA: PAQUETE + ACCIONES */}
          <Grid.Col span={{ base: 12, md: 5 }}>
            <Stack gap="lg">
              <Card shadow="sm" radius="lg" padding="xl" withBorder style={{ borderColor: 'var(--mantine-color-violet-2)' }}>
                <Group mb="lg">
                  <ThemeIcon size={42} radius="md" color="violet" variant="light">
                    <Package size={24} />
                  </ThemeIcon>
                  <div>
                    <Text size="lg" fw={800} c="dark.4">Detalles del Paquete</Text>
                    <Text size="sm" c="dimmed">Características de la carga</Text>
                  </div>
                </Group>

                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <TextInput
                      label="Peso (kg)"
                      placeholder="0.00"
                      variant="filled"
                      radius="md"
                      size="md"
                      type="number"
                      value={peso}
                      onChange={(e) => setPeso(e.target.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <TextInput
                      label="Bultos"
                      placeholder="0"
                      variant="filled"
                      radius="md"
                      size="md"
                      type="number"
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={12}>
                    <Text size="sm" fw={500} mb={4}>Dimensiones (cm)</Text>
                    <Group grow gap="xs">
                      <TextInput
                        placeholder="Largo"
                        variant="filled"
                        radius="md"
                        type="number"
                        value={dimensiones.largo}
                        onChange={(e) => setDimensiones({ ...dimensiones, largo: e.target.value })}
                      />
                      <TextInput
                        placeholder="Ancho"
                        variant="filled"
                        radius="md"
                        type="number"
                        value={dimensiones.ancho}
                        onChange={(e) => setDimensiones({ ...dimensiones, ancho: e.target.value })}
                      />
                      <TextInput
                        placeholder="Alto"
                        variant="filled"
                        radius="md"
                        type="number"
                        value={dimensiones.alto}
                        onChange={(e) => setDimensiones({ ...dimensiones, alto: e.target.value })}
                      />
                    </Group>
                  </Grid.Col>
                </Grid>

                <Divider my="lg" label="Confirmación" labelPosition="center" />

                <Button
                  type="submit"
                  fullWidth
                  size="lg"
                  radius="md"
                  color="cyan"
                  rightSection={<ArrowRight size={20} />}
                  className="hover-scale"
                >
                  Procesar y Generar Etiqueta
                </Button>
                <Text size="xs" c="dimmed" ta="center" my="sm">
                  Al procesar se generará el remito automáticamente.
                </Text>
              </Card>
            </Stack>
          </Grid.Col>
        </Grid>
      </form>

      {/* MODAL NUEVO DESTINATARIO - REFACTORED STYLE */}
      <Modal
        opened={showModal}
        onClose={() => setShowModal(false)}
        title={<Text fw={700}>Nuevo Destinatario</Text>}
        centered
        radius="lg"
        padding="lg"
        overlayProps={{ blur: 3 }}
      >
        <Stack gap="md">
          <TextInput label="Nombre Completo" placeholder="Ej: Juan Perez" variant="filled" radius="md" value={nuevoDestinatario.nombre} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, nombre: e.target.value })} />
          <Grid gutter="sm">
            <Grid.Col span={6}>
              <TextInput label="DNI" placeholder="Sin puntos" variant="filled" radius="md" value={nuevoDestinatario.dni} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, dni: e.target.value })} />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput label="Teléfono" placeholder="Ej: 351..." variant="filled" radius="md" value={nuevoDestinatario.telefono} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, telefono: e.target.value })} />
            </Grid.Col>
          </Grid>
          <TextInput label="Email" placeholder="opcional" variant="filled" radius="md" value={nuevoDestinatario.email} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, email: e.target.value })} />

          <Select
            label="Localidad"
            placeholder="Seleccionar..."
            data={localidades.map(loc => ({ value: loc._id, label: loc.nombre }))}
            value={nuevoDestinatario.localidad}
            onChange={(val) => setNuevoDestinatario({ ...nuevoDestinatario, localidad: val })}
            variant="filled"
            radius="md"
            searchable
            comboboxProps={{ zIndex: 20000, withinPortal: true }} // Fix Z-Index issue in Modal
          />

          <TextInput label="Dirección" placeholder="Calle y Número" variant="filled" radius="md" value={nuevoDestinatario.direccion} onChange={(e) => setNuevoDestinatario({ ...nuevoDestinatario, direccion: e.target.value })} />

          <Group justify="flex-end" mt="lg">
            <Button variant="subtle" color="gray" onClick={() => setShowModal(false)}>Cancelar</Button>
            <Button color="blue" variant="filled" onClick={handleGuardarDestinatario}>Guardar Destinatario</Button>
          </Group>
        </Stack>
      </Modal>

      <style>{`
        .hover-scale {
            transition: transform 0.2s ease;
        }
        .hover-scale:hover {
            transform: scale(1.02);
        }
        .hover-bg-gray:hover {
            background-color: var(--mantine-color-gray-0);
        }
      `}</style>
    </Container>
  );
};
export default NuevoEnvio;

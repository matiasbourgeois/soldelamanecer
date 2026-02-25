import React, { useEffect, useState } from "react";
import {
    Container, Paper, Title, Group, Button, TextInput, Stack, Text,
    Badge, ActionIcon, Tooltip, Loader, Center, ThemeIcon, Alert, Anchor, Pagination, SimpleGrid
} from "@mantine/core";
import {
    Plus, Search, Truck, MapPin, Phone, Mail, User, Trash2, Pencil,
    Calendar, FileText, AlertTriangle, UserCheck, ArrowRight, CheckCircle2, XCircle
} from "lucide-react";
import { apiSistema } from "../../../../core/api/apiSistema";
import FormularioContratado from "./FormularioContratado";
import axios from "axios";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import { confirmarAccion } from "../../../../core/utils/confirmarAccion.jsx";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";

const getTarifaTexto = (ruta) => {
    if (!ruta) return null;
    if (ruta.tipoPago === 'por_distribucion' && ruta.montoPorDistribucion > 0) return { monto: ruta.montoPorDistribucion, sufijo: '/ vuelta' };
    if (ruta.tipoPago === 'por_mes' && ruta.montoMensual > 0) return { monto: ruta.montoMensual, sufijo: '/ mes' };
    if (ruta.precioKm > 0) return { monto: ruta.precioKm, sufijo: '/ km' };
    return null;
};

const ContratadosAdmin = () => {
    const [contratados, setContratados] = useState([]);
    const [rutasMap, setRutasMap] = useState({}); // choferID → ruta
    const [loading, setLoading] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [contratadoEditando, setContratadoEditando] = useState(null);
    const [pagina, setPagina] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const limite = 10;
    const navigate = useNavigate();

    const fetchContratados = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // Fetch paralelo: contratados + todas las rutas
            const [{ data: dataContratados }, { data: dataRutas }] = await Promise.all([
                axios.get(apiSistema(`/choferes/contratados?busqueda=${busqueda}&pagina=${pagina}&limite=${limite}`), { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(apiSistema("/rutas?limite=200&pagina=0"), { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setContratados(dataContratados.contratados || []);
            if (dataContratados.totalPaginas !== undefined) {
                setTotalPaginas(dataContratados.totalPaginas);
            }
            // Construir mapa: choferID → [ruta1, ruta2, ...]
            // Soporta tanto rutas propias (choferAsignado) como rutas de las que es titular (contratistaTitular)
            const rutas = dataRutas.rutas || dataRutas.resultados || [];
            const mapa = {};
            rutas.forEach(r => {
                const choferId = r.choferAsignado?._id || r.choferAsignado;
                const titularId = r.contratistaTitular?._id || r.contratistaTitular;

                // Agregar a la lista del chofer asignado (quien maneja)
                if (choferId) {
                    if (!mapa[choferId]) mapa[choferId] = [];
                    // Usar toString() para comparar ObjectIds de Mongoose correctamente
                    if (!mapa[choferId].some(x => x._id?.toString() === r._id?.toString())) {
                        mapa[choferId].push(r);
                    }
                }
                // Si hay un titular distinto, agregar también a su lista
                if (titularId && titularId !== choferId) {
                    if (!mapa[titularId]) mapa[titularId] = [];
                    if (!mapa[titularId].some(x => x._id?.toString() === r._id?.toString())) {
                        mapa[titularId].push(r);
                    }
                }
            });
            setRutasMap(mapa);
        } catch (error) {
            console.error("Error fetching contratados:", error);
            mostrarAlerta("Error al cargar contratados", "danger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPagina(1);
    }, [busqueda]);

    useEffect(() => {
        const timeout = setTimeout(fetchContratados, 300);
        return () => clearTimeout(timeout);
    }, [busqueda, pagina]);

    const handleEditar = (contratado) => {
        setContratadoEditando(contratado);
        setMostrarModal(true);
    };

    // Calcular el estado del legajo de documentos
    const getEstadoLegajo = (datosContratado) => {
        if (!datosContratado) return { completo: 0, total: 5, porcentaje: 0 };
        const docs = datosContratado.documentos || {};
        const campos = ["dni", "carnetConducir", "constanciaARCA", "contrato", "antecedentesPenales"];
        const completo = campos.filter(c => docs[c]?.path).length;
        return { completo, total: 5, porcentaje: Math.round((completo / 5) * 100) };
    };

    const getBadgeLegajo = (legajo) => {
        if (legajo.porcentaje === 100) return { color: "teal.6", label: "Legajo Completo", icon: <CheckCircle2 size={14} color="var(--mantine-color-teal-6)" /> };
        if (legajo.porcentaje >= 60) return { color: "orange.5", label: `Incompleto (${legajo.completo}/${legajo.total})`, icon: <AlertTriangle size={14} color="var(--mantine-color-orange-5)" /> };
        return { color: "red.5", label: `Pendiente (${legajo.completo}/${legajo.total})`, icon: <XCircle size={14} color="var(--mantine-color-red-5)" /> };
    };

    return (
        <Container size="xl" py="md">
            {/* ─── Header ─── */}
            <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
                <Group justify="space-between" mb="md" align="flex-start">
                    <Stack gap={4}>
                        <Group gap="xs" align="center">
                            <ThemeIcon color="cyan" variant="light" size="lg" radius="md">
                                <UserCheck size={20} />
                            </ThemeIcon>
                            <Title order={2} fw={700}>Choferes Contratados</Title>
                        </Group>
                        <Text size="sm" c="dimmed" pl={4}>
                            Gestión de legajos, datos fiscales y documentación de contratados externos
                        </Text>
                    </Stack>

                    <Tooltip
                        label="Para crear un contratado, primero créalo como Chofer con tipo 'Contratado'"
                        withArrow
                        position="bottom-end"
                        multiline
                        w={280}
                    >
                        <Button
                            leftSection={<Plus size={18} />}
                            rightSection={<ArrowRight size={14} />}
                            color="cyan"
                            variant="light"
                            onClick={() => navigate("/admin/choferes")}
                        >
                            Nuevo Contratado
                        </Button>
                    </Tooltip>
                </Group>

                {/* Aviso informativo */}
                <Alert
                    icon={<AlertTriangle size={16} />}
                    color="gray"
                    variant="light"
                    mb="xl"
                    radius="md"
                    title="¿Cómo agregar un contratado?"
                    styles={{ title: { fontWeight: 700 } }}
                >
                    (1) El chofer contratado crea su usuario de forma personal desde el sitio.
                    Luego (2) el administrativo va a{" "}
                    <Anchor size="sm" fw={600} onClick={() => navigate("/admin/choferes")} style={{ cursor: "pointer" }}>
                        Choferes
                    </Anchor>
                    , ubica ese usuario y le asigna el rol chofer con tipo <strong>Contratado</strong>.
                    Después aparecerá aquí para completar su legajo.
                </Alert>

                <TextInput
                    placeholder="Buscar por nombre, razón social o CUIT..."
                    leftSection={<Search size={16} />}
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    mb="xl"
                    radius="md"
                    w={{ base: "100%", sm: 420 }}
                />

                {/* ─── Lista ─── */}
                {loading ? (
                    <Center py="xl"><Loader color="cyan" type="dots" /></Center>
                ) : (
                    <Stack gap="xs">
                        {contratados.length > 0 ? contratados.map((c) => {
                            const legajo = getEstadoLegajo(c.datosContratado);
                            const badge = getBadgeLegajo(legajo);
                            const nombre = c.usuario?.nombre || "Sin nombre";
                            const razonSocial = c.datosContratado?.razonSocial;
                            const cuit = c.datosContratado?.cuit;
                            const email = c.datosContratado?.email || c.usuario?.email;
                            // En este ERP, la configuración base de un contratado (vehículo titular y tarifa)
                            // reside en sus Rutas Maestras asignadas.
                            const rutasDelChofer = rutasMap[c._id] || [];
                            // Para rétulos de tarjeta simple, usar la primera con vehículo o la primera disponible
                            const rutaPrincipal = rutasDelChofer.find(r => r.vehiculoAsignado) || rutasDelChofer[0] || null;
                            const vehiculo = rutaPrincipal?.vehiculoAsignado || null;
                            const esContratista = rutasDelChofer.length > 1;

                            return (
                                <Paper key={c._id} withBorder p="md" radius="md" className="hover-shadow" style={{ transition: "box-shadow 0.2s" }}>
                                    <SimpleGrid cols={{ base: 1, lg: 5 }} spacing="xl" verticalSpacing="sm" align="center">

                                        {/* Columna 1: Nombre / Razón Social y Roles */}
                                        <Stack gap={2}>
                                            <Group gap="xs" mb={0} wrap="nowrap">
                                                <Text fw={800} size="md" c={c.activo ? "dark.6" : "gray.5"} lineClamp={1} style={{ flex: 1, wordBreak: 'break-word' }}>
                                                    {razonSocial || nombre}
                                                </Text>
                                                {!c.activo && <Badge size="9px" color="gray" variant="filled" style={{ flexShrink: 0 }}>INACTIVO</Badge>}
                                            </Group>
                                            {razonSocial && (
                                                <Text size="xs" c="dimmed" lineClamp={1}>
                                                    {nombre}
                                                </Text>
                                            )}
                                            <Text size="xs" c="dimmed" ff="monospace" mt={2} mb={4}>
                                                {cuit ? `CUIT: ${cuit}` : "Sin CUIT"}
                                            </Text>

                                            {esContratista && (
                                                <Group gap={6} mt={2}>
                                                    <Badge size="xs" color="cyan" variant="filled" radius="sm">CONTRATISTA</Badge>
                                                    <Text size="10px" fw={700} c="cyan.7">{rutasDelChofer.length} líneas asig.</Text>
                                                </Group>
                                            )}
                                            {rutaPrincipal?.contratistaTitular && rutaPrincipal.contratistaTitular._id !== c._id && (
                                                <Group gap={4} mt={2}>
                                                    <Badge size="xs" color="gray" variant="light" radius="sm">SUBCONTRATADO</Badge>
                                                    <Text size="10px" c="dimmed">
                                                        de {rutaPrincipal.contratistaTitular.usuario?.nombre} {rutaPrincipal.contratistaTitular.usuario?.apellido || ''}
                                                    </Text>
                                                </Group>
                                            )}
                                        </Stack>

                                        {/* Columna 2 y 3: Rutas y Tarifas Unificadas */}
                                        <div style={{ gridColumn: 'span 2' }}>
                                            <Stack gap={6}>
                                                <Text size="10px" c="dimmed" tt="uppercase" fw={800} ls={0.5}>Líneas y Tarifas</Text>
                                                {esContratista ? (
                                                    <Stack gap={4}>
                                                        {rutasDelChofer.map(r => {
                                                            const tarifaInfo = getTarifaTexto(r);
                                                            return (
                                                                <Group justify="space-between" key={r._id} gap="sm" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 4 }}>
                                                                    <Group gap={5} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                                        <Truck size={12} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
                                                                        <Text size="xs" c="dark.5" lineClamp={1}>
                                                                            <span style={{ fontWeight: 700 }}>{r.codigo}</span>
                                                                            {r.vehiculoAsignado && ` · ${r.vehiculoAsignado.patente}`}
                                                                        </Text>
                                                                    </Group>
                                                                    <Text size="xs" fw={700} c="dark.6" style={{ whiteSpace: 'nowrap' }}>
                                                                        {tarifaInfo
                                                                            ? <span>${tarifaInfo.monto} <span style={{ fontWeight: 400, color: 'var(--mantine-color-gray-5)' }}>{tarifaInfo.sufijo}</span></span>
                                                                            : <span style={{ fontWeight: 400, color: 'var(--mantine-color-gray-5)' }}>—</span>
                                                                        }
                                                                    </Text>
                                                                </Group>
                                                            );
                                                        })}
                                                    </Stack>
                                                ) : (
                                                    <Stack gap={4}>
                                                        {rutaPrincipal ? (
                                                            <Group justify="space-between" gap="sm" wrap="nowrap" style={{ borderBottom: '1px solid var(--mantine-color-gray-2)', paddingBottom: 4 }}>
                                                                <Group gap={5} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                                    <Truck size={12} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
                                                                    <Text size="xs" c="dark.5" lineClamp={1}>
                                                                        <span style={{ fontWeight: 700 }}>{rutaPrincipal.codigo}</span>
                                                                        {vehiculo && ` · ${vehiculo.patente}`}
                                                                    </Text>
                                                                </Group>
                                                                {(() => {
                                                                    const tarifaInfo = getTarifaTexto(rutaPrincipal);
                                                                    return tarifaInfo ? (
                                                                        <Text size="xs" fw={800} c="dark.6" style={{ whiteSpace: 'nowrap' }}>
                                                                            ${tarifaInfo.monto} <span style={{ fontWeight: 500, color: 'var(--mantine-color-gray-5)' }}>{tarifaInfo.sufijo}</span>
                                                                        </Text>
                                                                    ) : (
                                                                        <Text size="xs" fw={500} c="dimmed">Sin tarifa</Text>
                                                                    );
                                                                })()}
                                                            </Group>
                                                        ) : (
                                                            <Text size="xs" c="dimmed">Sin ruta asignada</Text>
                                                        )}
                                                    </Stack>
                                                )}
                                            </Stack>
                                        </div>

                                        {/* Columna 4: Documentación */}
                                        <Stack gap={4} justify="center">
                                            <Text size="10px" c="dimmed" tt="uppercase" fw={800} ls={0.5} mb={2}>Documentación</Text>
                                            <Group gap={6}>
                                                {badge.icon}
                                                <Text size="xs" fw={600} c={badge.color}>
                                                    {badge.label}
                                                </Text>
                                            </Group>
                                        </Stack>

                                        {/* Columna 5: Contacto y Acción */}
                                        <Group justify="space-between" align="center" wrap="nowrap" h="100%" style={{ width: '100%' }}>
                                            <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
                                                {email && (
                                                    <Group gap={5} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                        <Mail size={13} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
                                                        <Text size="xs" c="dark.4" fw={500} lineClamp={1} ta="left" style={{ flex: 1, minWidth: 0 }}>{email}</Text>
                                                    </Group>
                                                )}
                                                {c.datosContratado?.fechaIngreso && (
                                                    <Group gap={5} wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>
                                                        <Calendar size={13} color="var(--mantine-color-gray-5)" style={{ flexShrink: 0 }} />
                                                        <Text size="xs" c="dark.4" fw={500} lineClamp={1} ta="left" style={{ flex: 1, minWidth: 0 }}>
                                                            Desde {dayjs(c.datosContratado.fechaIngreso).format("DD/MM/YYYY")}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Stack>

                                            {/* Acción principal (Editar) alineada a la derecha y centrada */}
                                            <ActionIcon
                                                variant="light"
                                                color="gray"
                                                size="lg"
                                                radius="md"
                                                onClick={() => handleEditar(c)}
                                                style={{ flexShrink: 0 }}
                                            >
                                                <ArrowRight size={18} />
                                            </ActionIcon>
                                        </Group>
                                    </SimpleGrid>
                                </Paper>
                            );
                        }) : (
                            <Center py="xl">
                                <Stack align="center" gap="sm">
                                    <UserCheck size={40} color="var(--mantine-color-gray-4)" />
                                    <Text ta="center" c="dimmed">
                                        {busqueda
                                            ? "No se encontraron contratados con esa búsqueda."
                                            : "No hay choferes contratados registrados aún."}
                                    </Text>
                                    {!busqueda && (
                                        <Button
                                            variant="light"
                                            color="cyan"
                                            size="xs"
                                            leftSection={<ArrowRight size={14} />}
                                            onClick={() => navigate("/admin/choferes")}
                                        >
                                            Ir a Choferes para crear uno
                                        </Button>
                                    )}
                                </Stack>
                            </Center>
                        )}
                    </Stack>
                )}

                {totalPaginas > 1 && !loading && (
                    <>
                        <Divider />
                        <Group justify="center" p="md" style={{ backgroundColor: '#f8f9fa' }}>
                            <Pagination
                                value={pagina}
                                onChange={setPagina}
                                total={totalPaginas}
                                color="cyan"
                                radius="md"
                            />
                        </Group>
                    </>
                )}
            </Paper>

            {/* Modal de edición de legajo */}
            {mostrarModal && (
                <FormularioContratado
                    opened={mostrarModal}
                    onClose={() => { setMostrarModal(false); setContratadoEditando(null); }}
                    contratado={contratadoEditando}
                    recargar={fetchContratados}
                />
            )}
        </Container>
    );
};

export default ContratadosAdmin;

// Componente interno de divisor visual
const Divider = ({ orientation = "horizontal" }) => (
    <div style={{
        width: orientation === "vertical" ? "1px" : "100%",
        height: orientation === "vertical" ? "40px" : "1px",
        backgroundColor: "#eee",
        flexShrink: 0
    }} />
);

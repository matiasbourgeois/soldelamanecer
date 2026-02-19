import React, { useEffect, useState } from "react";
import {
    Container, Paper, Title, Group, Button, TextInput, Stack, Text,
    Badge, ActionIcon, Tooltip, Loader, Center, ThemeIcon, Alert, Anchor
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

const ContratadosAdmin = () => {
    const [contratados, setContratados] = useState([]);
    const [rutasMap, setRutasMap] = useState({}); // choferID → ruta
    const [loading, setLoading] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [mostrarModal, setMostrarModal] = useState(false);
    const [contratadoEditando, setContratadoEditando] = useState(null);
    const navigate = useNavigate();

    const fetchContratados = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            // Fetch paralelo: contratados + todas las rutas
            const [{ data: dataContratados }, { data: dataRutas }] = await Promise.all([
                axios.get(apiSistema(`/choferes/contratados?busqueda=${busqueda}`), { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(apiSistema("/rutas?limite=200&pagina=0"), { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setContratados(dataContratados);
            // Construir mapa: choferID → ruta
            const rutas = dataRutas.rutas || dataRutas.resultados || [];
            const mapa = {};
            rutas.forEach(r => {
                const choferId = r.choferAsignado?._id || r.choferAsignado;
                if (choferId) mapa[choferId] = r;
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
        const timeout = setTimeout(fetchContratados, 300);
        return () => clearTimeout(timeout);
    }, [busqueda]);

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
        if (legajo.porcentaje === 100) return { color: "teal", label: "Legajo Completo", icon: <CheckCircle2 size={12} /> };
        if (legajo.porcentaje >= 60) return { color: "yellow", label: `${legajo.completo}/${legajo.total} docs`, icon: <AlertTriangle size={12} /> };
        return { color: "red", label: `${legajo.completo}/${legajo.total} docs`, icon: <XCircle size={12} /> };
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
                    color="blue"
                    variant="light"
                    mb="md"
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
                            // Datos desde la ruta asignada (fuente de verdad operativa)
                            const ruta = rutasMap[c._id];
                            const vehiculo = ruta?.vehiculoAsignado;

                            return (
                                <Paper key={c._id} withBorder p="md" radius="md" className="hover-shadow"
                                    style={{ transition: "box-shadow 0.2s", borderLeft: `3px solid ${c.activo ? "var(--mantine-color-cyan-5)" : "var(--mantine-color-gray-4)"}` }}>
                                    <Group justify="space-between" wrap="nowrap">
                                        <Group gap="lg" wrap="nowrap" style={{ flex: 1, minWidth: 0 }}>

                                            {/* Nombre / Razón Social */}
                                            <Stack gap={2} style={{ minWidth: 180 }}>
                                                <Text fw={700} size="md" c="dark.4" lineClamp={1}>
                                                    {razonSocial || nombre}
                                                </Text>
                                                {razonSocial && (
                                                    <Text size="xs" c="dimmed" lineClamp={1}>
                                                        <User size={10} style={{ marginRight: 4, verticalAlign: "middle" }} />
                                                        {nombre}
                                                    </Text>
                                                )}
                                                {cuit && (
                                                    <Text size="xs" c="dimmed" ff="monospace">
                                                        CUIT: {cuit}
                                                    </Text>
                                                )}
                                            </Stack>

                                            <Divider orientation="vertical" />

                                            {/* Vehículo y Ruta — desde asignación en Rutas */}
                                            <Stack gap={4} style={{ minWidth: 160 }}>
                                                <Group gap={6}>
                                                    <Truck size={14} color="gray" />
                                                    <Text size="sm" fw={500} lineClamp={1}>
                                                        {vehiculo
                                                            ? `${vehiculo.patente} (${vehiculo.marca})`
                                                            : "Sin vehículo"}
                                                    </Text>
                                                    {vehiculo && (
                                                        <Badge size="xs" variant="dot"
                                                            color={vehiculo.tipoPropiedad === "externo" ? "orange" : "blue"}
                                                        >
                                                            {vehiculo.tipoPropiedad === "externo" ? "Ext" : "SDA"}
                                                        </Badge>
                                                    )}
                                                </Group>
                                                <Group gap={6}>
                                                    <MapPin size={14} color="gray" />
                                                    <Text size="sm" c="dimmed" lineClamp={1}>
                                                        {ruta ? `Ruta: ${ruta.codigo}` : "Sin ruta"}
                                                    </Text>
                                                </Group>
                                            </Stack>

                                            <Divider orientation="vertical" />

                                            {/* Tarifa y Legajo — tarifa desde la ruta */}
                                            <Stack gap={4} align="center">
                                                {ruta?.precioKm > 0 ? (
                                                    <Badge variant="light" color="indigo" size="sm">
                                                        $ {ruta.precioKm} / km
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="dot" color="gray" size="sm">Sin tarifa</Badge>
                                                )}
                                                <Badge
                                                    variant="light"
                                                    color={badge.color}
                                                    size="xs"
                                                    leftSection={badge.icon}
                                                >
                                                    {badge.label}
                                                </Badge>
                                            </Stack>

                                            <Divider orientation="vertical" />

                                            {/* Contacto */}
                                            <Stack gap={4} style={{ minWidth: 140 }} visibleFrom="lg">
                                                {email && (
                                                    <Group gap={5}>
                                                        <Mail size={13} color="gray" />
                                                        <Text size="xs" c="dimmed" lineClamp={1}>{email}</Text>
                                                    </Group>
                                                )}
                                                {c.datosContratado?.fechaIngreso && (
                                                    <Group gap={5}>
                                                        <Calendar size={13} color="gray" />
                                                        <Text size="xs" c="dimmed">
                                                            Desde {dayjs(c.datosContratado.fechaIngreso).format("DD/MM/YYYY")}
                                                        </Text>
                                                    </Group>
                                                )}
                                            </Stack>
                                        </Group>

                                        {/* Acciones */}
                                        <Group gap="xs" wrap="nowrap">
                                            {!c.activo && (
                                                <Badge color="red" variant="light" size="xs">INACTIVO</Badge>
                                            )}
                                            <Tooltip label="Editar legajo">
                                                <ActionIcon
                                                    variant="subtle"
                                                    color="blue"
                                                    size="lg"
                                                    onClick={() => handleEditar(c)}
                                                >
                                                    <Pencil size={20} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </Group>
                                    </Group>
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

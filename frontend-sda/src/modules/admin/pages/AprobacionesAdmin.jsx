import React, { useEffect, useState } from "react";
import {
    Box, Title, Text, Card, Group, Badge, Button,
    ActionIcon, Stack, Grid, LoadingOverlay, Divider, Paper, ScrollArea
} from "@mantine/core";
import { Check, X, ShieldAlert, ArrowRight, Clock, MapPin } from "lucide-react";
import clienteAxios from "../../../core/api/clienteAxios";
import { mostrarAlerta } from "../../../core/utils/alertaGlobal.jsx";

const AprobacionesAdmin = () => {
    const [aprobaciones, setAprobaciones] = useState([]);
    const [loading, setLoading] = useState(true);

    const [localidades, setLocalidades] = useState([]);
    const [choferes, setChoferes] = useState([]);
    const [vehiculos, setVehiculos] = useState([]);

    const cargarDatosRelacionales = async () => {
        try {
            const [locRes, choRes, vehRes] = await Promise.all([
                clienteAxios.get('/localidades'),
                clienteAxios.get('/choferes/solo-nombres'),
                clienteAxios.get('/vehiculos')
            ]);
            setLocalidades(locRes.data);
            setChoferes(choRes.data);
            setVehiculos(vehRes.data);
        } catch (error) {
            console.error("Error al cargar datos relacionales:", error);
        }
    };

    const cargarPendientes = async () => {
        try {
            setLoading(true);
            const { data } = await clienteAxios.get('/aprobaciones/pendientes');
            setAprobaciones(data);
        } catch (error) {
            console.error("Error al cargar aprobaciones:", error);
            mostrarAlerta("Error al cargar aprobaciones pendientes", "danger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        cargarPendientes();
        cargarDatosRelacionales();
    }, []);

    const resolverSolicitud = async (id, resolucion, motivoRechazo = "") => {
        try {
            if (resolucion === "RECHAZAR" && !motivoRechazo) {
                // En un entorno de producción real, abriríamos un Modal para pedir el motivo. 
                // Para simplificar ahora, pre-definimos un motivo o lo pedimos por prompt.
                motivoRechazo = window.prompt("Ingresa el motivo del rechazo:", "Cambios no autorizados");
                if (motivoRechazo === null) return; // Canceló el prompt
            }

            setLoading(true);
            await clienteAxios.post(`/aprobaciones/${id}/resolver`, { resolucion, motivoRechazo });
            mostrarAlerta(`Solicitud ${resolucion === "APROBAR" ? "Aprobada" : "Rechazada"}`, "success");
            cargarPendientes();
        } catch (error) {
            console.error("Error al resolver:", error);
            mostrarAlerta(error.response?.data?.error || "Error al resolver la solicitud", "danger");
            setLoading(false);
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString("es-AR", {
            day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    const renderBadgeAccion = (accion) => {
        switch (accion) {
            case 'CREACION': return <Badge color="blue" size="lg" radius="sm">NUEVA CREACIÓN</Badge>;
            case 'EDICION': return <Badge color="yellow" size="lg" radius="sm">MODIFICACIÓN</Badge>;
            case 'ELIMINACION': return <Badge color="red" size="lg" radius="sm">ELIMINACIÓN</Badge>;
            default: return <Badge color="gray" size="lg" radius="sm">{accion}</Badge>;
        }
    };

    const getLocalidadName = (id) => localidades.find(l => l._id === id)?.nombre || 'Desconocida';
    const getChoferName = (id) => {
        const c = choferes.find(ch => ch._id === id);
        return c?.usuario?.nombre ? `${c.usuario.nombre} ${c.usuario.apellido || ""}`.trim() : 'Sin Asignar';
    };
    const getVehiculoName = (id) => {
        const v = vehiculos.find(ve => ve._id === id);
        return v ? `${v.patente} - ${v.modelo}` : 'Sin Asignar';
    };

    const DiffField = ({ label, oldVal, newVal, isEdit }) => {
        const oV = oldVal || '';
        const nV = newVal || '';
        const tieneCambios = isEdit && oV !== nV;

        if (!tieneCambios) {
            return (
                <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
                    <Text fw={500}>{nV || '-'}</Text>
                </Box>
            );
        }

        return (
            <Box>
                <Group gap="xs">
                    <Text size="xs" c="dimmed" tt="uppercase" fw={700}>{label}</Text>
                    <Badge color="orange" size="xs" variant="dot" fw={700}>Modificado</Badge>
                </Group>
                <Group gap="xs" align="center" mt={2} wrap="nowrap">
                    <Text td="line-through" c="red" size="sm" style={{ wordBreak: 'break-word', maxWidth: '40%' }}>{oV || '-'}</Text>
                    <ArrowRight size={14} color="#adb5bd" style={{ flexShrink: 0 }} />
                    <Text fw={600} c="teal" style={{ wordBreak: 'break-word', maxWidth: '50%' }}>{nV || '-'}</Text>
                </Group>
            </Box>
        );
    };

    const renderDetallesPropuestos = (solicitud) => {
        const original = solicitud.entidadId || {};
        const isEdit = solicitud.accion === 'EDICION';
        const isDelete = solicitud.accion === 'ELIMINACION';

        if (isDelete) {
            const locsOrig = (original.localidades || []).map(id => {
                const parsedId = typeof id === 'object' && id !== null ? id._id || id.value || id : id;
                return getLocalidadName(parsedId);
            }).join(', ');

            return (
                <Stack gap="xs" mt="sm">
                    <Text size="sm" c="red" fw={600} mb="xs">
                        ⚠️ ATENCIÓN: El usuario solicita eliminar permanentemente la siguiente ruta:
                    </Text>
                    <Grid>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Código de Ruta</Text>
                            <Text fw={600} size="lg">{original.codigo || '-'}</Text>
                        </Grid.Col>
                        <Grid.Col span={6}>
                            <Text size="xs" c="dimmed" tt="uppercase" fw={700}>Localidades Abarcadas</Text>
                            <Text fw={500}>{locsOrig || '-'}</Text>
                        </Grid.Col>
                    </Grid>
                </Stack>
            );
        }

        const { datosPropuestos } = solicitud;
        if (!datosPropuestos) return <Text size="sm" c="dimmed">No hay datos propuestos.</Text>;

        const tarifaProp = datosPropuestos.tipoPago === 'por_km' ? `$${datosPropuestos.precioKm} / KM` : `$${datosPropuestos.montoMensual || datosPropuestos.montoPorDistribucion || 0} / Fijo`;
        const tarifaOrig = isEdit ? (original.tipoPago === 'por_km' ? `$${original.precioKm} / KM` : `$${original.montoMensual || original.montoPorDistribucion || 0} / Fijo`) : '';

        const frecProp = datosPropuestos.frecuencia?.textoLegible || 'No definida';
        const frecOrig = isEdit ? (original.frecuencia?.textoLegible || 'No definida') : '';

        const locsProp = (datosPropuestos.localidades || []).map(id => getLocalidadName(id)).join(', ');
        const locsOrig = isEdit ? (original.localidades || []).map(id => {
            const parsedId = typeof id === 'object' && id !== null ? id._id || id.value || id : id;
            return getLocalidadName(parsedId);
        }).join(', ') : '';

        const getSafeChoferId = (ch) => typeof ch === 'object' && ch !== null ? ch._id : ch;
        const getSafeVehiculoId = (v) => typeof v === 'object' && v !== null ? v._id : v;

        return (
            <Stack gap="xs" mt="sm">
                <Grid>
                    <Grid.Col span={4}>
                        <DiffField
                            label="Código Propuesto"
                            oldVal={original.codigo}
                            newVal={datosPropuestos.codigo}
                            isEdit={isEdit}
                        />
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <DiffField
                            label="Horario"
                            oldVal={original.horaSalida}
                            newVal={datosPropuestos.horaSalida}
                            isEdit={isEdit}
                        />
                    </Grid.Col>
                    <Grid.Col span={4}>
                        <DiffField
                            label="Tarifa"
                            oldVal={tarifaOrig}
                            newVal={tarifaProp}
                            isEdit={isEdit}
                        />
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <DiffField
                            label="Frecuencia"
                            oldVal={frecOrig}
                            newVal={frecProp}
                            isEdit={isEdit}
                        />
                    </Grid.Col>

                    <Grid.Col span={6}>
                        <DiffField
                            label="Chofer Asignado"
                            oldVal={original.choferAsignado ? getChoferName(getSafeChoferId(original.choferAsignado)) : 'Sin Asignar'}
                            newVal={datosPropuestos.choferAsignado ? getChoferName(datosPropuestos.choferAsignado) : 'Sin Asignar'}
                            isEdit={isEdit}
                        />
                    </Grid.Col>
                    <Grid.Col span={6}>
                        <DiffField
                            label="Vehículo Asignado"
                            oldVal={original.vehiculoAsignado ? getVehiculoName(getSafeVehiculoId(original.vehiculoAsignado)) : 'Sin Asignar'}
                            newVal={datosPropuestos.vehiculoAsignado ? getVehiculoName(datosPropuestos.vehiculoAsignado) : 'Sin Asignar'}
                            isEdit={isEdit}
                        />
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <DiffField
                            label="Localidades"
                            oldVal={locsOrig}
                            newVal={locsProp}
                            isEdit={isEdit}
                        />
                    </Grid.Col>

                    <Grid.Col span={12}>
                        <DiffField
                            label="Descripción"
                            oldVal={original.descripcion}
                            newVal={datosPropuestos.descripcion}
                            isEdit={isEdit}
                        />
                    </Grid.Col>
                </Grid>
            </Stack>
        );
    };

    return (
        <Box p="md" pos="relative">
            <LoadingOverlay visible={loading} overlayProps={{ radius: "sm", blur: 2 }} zIndex={100} />

            <Group justify="space-between" mb="xl">
                <div>
                    <Title order={2} style={{ color: "#1f2937", display: 'flex', alignItems: 'center', gap: 10 }}>
                        <ShieldAlert size={28} color="#f59f00" /> Aprobaciones Pendientes
                    </Title>
                    <Text c="dimmed" size="sm" mt={4}>
                        Centro de control para auditar y autorizar cambios sugeridos por el personal administrativo.
                    </Text>
                </div>
            </Group>

            {aprobaciones.length === 0 ? (
                <Paper withBorder p="xl" radius="md" ta="center" bg="gray.0">
                    <Check size={48} strokeWidth={1} color="#adb5bd" style={{ margin: '0 auto', display: 'block' }} />
                    <Text fw={600} size="lg" mt="md" c="dimmed">Tu bandeja está al día</Text>
                    <Text size="sm" c="dimmed">No hay solicitudes pendientes de aprobación.</Text>
                </Paper>
            ) : (
                <ScrollArea h="calc(100vh - 200px)" type="auto">
                    <Stack gap="lg">
                        {aprobaciones.map((sol) => (
                            <Card key={sol._id} shadow="sm" radius="md" withBorder p="lg">
                                <Grid>
                                    <Grid.Col span={8}>
                                        <Group gap="xs" mb="xs">
                                            {renderBadgeAccion(sol.accion)}
                                            <Badge color="dark" size="lg" variant="light" radius="sm">
                                                Entidad: {sol.entidad}
                                            </Badge>
                                        </Group>

                                        <Group gap="sm" mb="md" align="center">
                                            <Clock size={16} color="#868e96" />
                                            <Text size="sm" c="dimmed">
                                                Solicitado el {formatearFecha(sol.createdAt)}
                                            </Text>
                                        </Group>

                                        <Paper withBorder p="md" bg="gray.0" radius="md">
                                            <Text fw={600} size="sm" mb="xs">Resumen del Cambio Solicitado</Text>
                                            <Divider mb="sm" />
                                            {renderDetallesPropuestos(sol)}
                                        </Paper>
                                    </Grid.Col>

                                    <Grid.Col span={4}>
                                        <Stack justify="space-between" h="100%">
                                            <Box>
                                                <Text size="xs" c="dimmed" tt="uppercase" fw={700} mb={4}>Solicitante</Text>
                                                <Group gap="xs">
                                                    <Avatar radius="xl" color="cyan" size="sm">
                                                        {(sol.solicitante?.nombre || "U")?.charAt(0)}
                                                    </Avatar>
                                                    <Text fw={500} size="sm">
                                                        {sol.solicitante?.nombre} {sol.solicitante?.apellido}
                                                    </Text>
                                                </Group>
                                            </Box>

                                            <Stack gap="xs" mt="auto">
                                                <Button
                                                    fullWidth
                                                    color="teal"
                                                    leftSection={<Check size={18} />}
                                                    onClick={() => resolverSolicitud(sol._id, "APROBAR")}
                                                    style={{ transition: 'all 0.2s' }}
                                                >
                                                    Aprobar Cambios
                                                </Button>
                                                <Button
                                                    fullWidth
                                                    variant="light"
                                                    color="red"
                                                    leftSection={<X size={18} />}
                                                    onClick={() => resolverSolicitud(sol._id, "RECHAZAR")}
                                                >
                                                    Rechazar
                                                </Button>
                                            </Stack>
                                        </Stack>
                                    </Grid.Col>
                                </Grid>
                            </Card>
                        ))}
                    </Stack>
                </ScrollArea>
            )}
        </Box>
    );
};

// Necesitamos importar Avatar arriba.
import { Avatar } from "@mantine/core";
export default AprobacionesAdmin;

import React, { useState, useEffect } from "react";
import {
    Modal,
    Table,
    Select,
    NumberInput,
    Button,
    Group,
    Text,
    Badge,
    ScrollArea,
    ActionIcon,
    Tooltip,
} from "@mantine/core";
import { RefreshCw, Save } from "lucide-react";
import { apiSistema } from "../../../../core/api/apiSistema";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal";
import { confirmarAccion } from "../../../../core/utils/confirmarAccion";

const ModalTarifasMasivas = ({ abierto, onClose, recargarRutas }) => {
    const [rutas, setRutas] = useState([]);
    const [cambios, setCambios] = useState({});
    const [loading, setLoading] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Opciones permitidas en Backend
    const opcionesPago = [
        { value: "por_km", label: "Por Km" },
        { value: "por_distribucion", label: "Por Distribución (Vuelta)" },
        { value: "por_mes", label: "Mensual Fijo" },
    ];

    const cargarTodasLasRutas = async () => {
        setLoading(true);
        try {
            const res = await fetch(apiSistema("/rutas/todas"));
            const data = await res.json();
            if (res.ok) {
                setRutas(data.rutas || []);
                setCambios({});
            } else {
                mostrarAlerta("Error al cargar rutas", "danger");
            }
        } catch (error) {
            console.error(error);
            mostrarAlerta("Error de conexión al cargar rutas", "danger");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (abierto) {
            cargarTodasLasRutas();
        }
    }, [abierto]);

    const manejarCambio = (id, campo, valor) => {
        setCambios((prev) => ({
            ...prev,
            [id]: {
                ...(prev[id] || {}),
                [campo]: valor,
            },
        }));
    };

    const getValorActual = (r, campo) => {
        if (cambios[r._id] && cambios[r._id][campo] !== undefined) {
            return cambios[r._id][campo];
        }
        return r[campo];
    };

    const guardarCambios = async () => {
        const rutasCambiadas = Object.keys(cambios);
        if (rutasCambiadas.length === 0) {
            mostrarAlerta("No hay cambios para guardar.", "info");
            return;
        }

        const confirmar = await confirmarAccion(
            "¿Guardar Cambios Masivos?",
            `Estás a punto de modificar las tarifas de ${rutasCambiadas.length} ruta(s). ¿Continuar?`
        );

        if (!confirmar) return;

        setGuardando(true);
        try {
            // Mapear los cambios al formato que espera el Backend
            const payload = rutasCambiadas.map((idRuta) => {
                const rutaCambiada = cambios[idRuta];
                const rutaOriginal = rutas.find((r) => r._id === idRuta);

                return {
                    id: idRuta,
                    tipoPago: rutaCambiada.tipoPago || rutaOriginal.tipoPago,
                    montoPorDistribucion: rutaCambiada.montoPorDistribucion !== undefined
                        ? rutaCambiada.montoPorDistribucion
                        : rutaOriginal.montoPorDistribucion,
                    precioKm: rutaCambiada.precioKm !== undefined
                        ? rutaCambiada.precioKm
                        : rutaOriginal.precioKm,
                    montoMensual: rutaCambiada.montoMensual !== undefined
                        ? rutaCambiada.montoMensual
                        : rutaOriginal.montoMensual,
                };
            });

            const res = await fetch(apiSistema("/rutas/tarifas-masivas"), {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rutas: payload }),
            });

            if (res.ok) {
                mostrarAlerta("✅ Tarifas actualizadas con éxito.", "success");
                setCambios({});
                recargarRutas(); // Refrescar la tabla de fondo
                onClose(); // Cerrar modal al guardar exitosamente
            } else {
                const errorData = await res.json();
                mostrarAlerta(errorData.error || "Error al guardar tarifas", "danger");
            }
        } catch (error) {
            console.error(error);
            mostrarAlerta("❌ Error de comunicación con el servidor.", "danger");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            opened={abierto}
            onClose={onClose}
            title={
                <Group>
                    <Text fw={700} size="lg">Tarifario Maestro de Rutas</Text>
                    <Badge color="cyan" variant="light">Edición Masiva</Badge>
                </Group>
            }
            size="90%"    // Modal muy grande para tabla cómoda
            centered
            closeOnClickOutside={false}
        >
            <Group justify="space-between" mb="sm">
                <Text size="sm" c="dimmed">
                    Modifique los valores de pago. Sólo se guardarán las rutas que usted haya alterado.
                </Text>
                <Tooltip label="Recargar datos originales">
                    <ActionIcon variant="light" color="gray" onClick={cargarTodasLasRutas} loading={loading}>
                        <RefreshCw size={18} />
                    </ActionIcon>
                </Tooltip>
            </Group>

            <ScrollArea h={500}>
                <Table striped highlightOnHover stickyHeader>
                    <Table.Thead>
                        <Table.Tr>
                            <Table.Th>Código</Table.Th>
                            <Table.Th>Desc/Destino</Table.Th>
                            <Table.Th ta="center">Salida</Table.Th>
                            <Table.Th>Chofer (Modo Info)</Table.Th>
                            <Table.Th>Método de Pago</Table.Th>
                            <Table.Th ta="right">Monto ($)</Table.Th>
                        </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                        {loading ? (
                            <Table.Tr>
                                <Table.Td colSpan={6} ta="center" py="xl">
                                    Cargando rutas...
                                </Table.Td>
                            </Table.Tr>
                        ) : rutas.length === 0 ? (
                            <Table.Tr>
                                <Table.Td colSpan={6} ta="center" py="xl">
                                    No hay rutas registradas.
                                </Table.Td>
                            </Table.Tr>
                        ) : (
                            rutas.map((r) => {
                                const tipoPagoForm = getValorActual(r, "tipoPago");

                                // Determinar qué campo numérico mostrar basado en el tipoPago seleccionado
                                let propMonto = "precioKm";
                                if (tipoPagoForm === "por_distribucion") propMonto = "montoPorDistribucion";
                                if (tipoPagoForm === "por_mes") propMonto = "montoMensual";

                                const valorMontoForm = getValorActual(r, propMonto);
                                const isCambiado = !!cambios[r._id];

                                return (
                                    <Table.Tr key={r._id} style={{ backgroundColor: isCambiado ? 'rgba(56, 217, 169, 0.1)' : undefined }}>
                                        <Table.Td>
                                            <Badge color="dark" variant="outline">{r.codigo}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            <Text size="sm" lineClamp={1} w={150} title={r.descripcion}>
                                                {r.descripcion || "-"}
                                            </Text>
                                        </Table.Td>
                                        <Table.Td ta="center">
                                            <Badge color="violet" variant="light">{r.horaSalida}</Badge>
                                        </Table.Td>
                                        <Table.Td>
                                            {r.choferAsignado ? (
                                                <Text size="sm" fw={500} c="blue.7">
                                                    {r.choferAsignado.usuario?.nombre || "Sin Asignar"}
                                                </Text>
                                            ) : (
                                                <Text size="xs" c="dimmed">Libre / Pool</Text>
                                            )}
                                        </Table.Td>
                                        <Table.Td>
                                            <Select
                                                data={opcionesPago}
                                                value={tipoPagoForm}
                                                allowDeselect={false}
                                                onChange={(val) => manejarCambio(r._id, "tipoPago", val)}
                                                size="xs"
                                                w={150}
                                            />
                                        </Table.Td>
                                        <Table.Td ta="right">
                                            <NumberInput
                                                value={valorMontoForm}
                                                onChange={(val) => manejarCambio(r._id, propMonto, val)}
                                                prefix="$ "
                                                thousandSeparator="."
                                                decimalSeparator=","
                                                size="xs"
                                                w={110}
                                                hideControls
                                                styles={{ input: { textAlign: 'right' } }}
                                            />
                                        </Table.Td>
                                    </Table.Tr>
                                );
                            })
                        )}
                    </Table.Tbody>
                </Table>
            </ScrollArea>

            <Group justify="flex-end" mt="md" pt="md" style={{ borderTop: "1px solid #eaeaea" }}>
                <Button variant="default" onClick={onClose} disabled={guardando}>
                    Cancelar
                </Button>
                <Button
                    color="green"
                    leftSection={<Save size={18} />}
                    onClick={guardarCambios}
                    loading={guardando}
                    disabled={Object.keys(cambios).length === 0}
                >
                    Guardar {Object.keys(cambios).length > 0 ? `(${Object.keys(cambios).length}) ` : ""}Cambios
                </Button>
            </Group>
        </Modal>
    );
};

export default ModalTarifasMasivas;

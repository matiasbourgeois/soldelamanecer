import React, { useState, useEffect } from "react";
import {
    Stack, Group, TextInput, NumberInput, Textarea, Button,
    Text, Paper, SimpleGrid, Badge, ActionIcon, Divider, rem
} from "@mantine/core";
import { Plus, Trash2 } from "lucide-react";
import clienteAxios from "../../../../core/api/clienteAxios";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";

/**
 * TabDrogueria — Datos operativos diarios para Droguería del Sud S.A.
 * Diseño compacto: todo el formulario en un viewport sin scroll.
 */
const TabDrogueria = ({ hoja, onSaved }) => {
    const kmBase = hoja?.ruta?.kilometrosEstimados ?? 0;
    const horaPlanificada = hoja?.ruta?.horaSalida ?? '';

    const buildInitialState = () => ({
        horaSalidaReal: hoja?.datosDrogueria?.horaSalidaReal ?? '',
        horaEnlaces: (hoja?.datosDrogueria?.horaEnlaces?.length > 0)
            ? hoja.datosDrogueria.horaEnlaces
            : [''],
        horaInicioDistribucion: hoja?.datosDrogueria?.horaInicioDistribucion ?? '',
        horaFinDistribucion: hoja?.datosDrogueria?.horaFinDistribucion ?? '',
        cubetasSalida: hoja?.datosDrogueria?.cubetasSalida ?? 0,
        cubetasRetorno: hoja?.datosDrogueria?.cubetasRetorno ?? 0,
        kmExtra: hoja?.datosDrogueria?.kmExtra ?? 0,
        observaciones: hoja?.observaciones ?? '',
    });

    const [form, setForm] = useState(buildInitialState);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        setForm(buildInitialState());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hoja?._id]);

    const kmTotal = kmBase + (Number(form.kmExtra) || 0);
    const diferenciaCubetas = (form.cubetasSalida || 0) - (form.cubetasRetorno || 0);

    // ── Lógica de Pago Estimado Contratados ───────────────────────────
    const esContratado = hoja?.chofer?.tipoVinculo === 'contratado';
    const vehiculo = hoja?.vehiculo;
    const ruta = hoja?.ruta;

    let calculoPago = null;
    let tituloPago = "Pago estimado:";

    // Solo calculamos si es contratado (en dependencia no cobran por ruta)
    if (esContratado && ruta) {
        // Vehículo SDA (no externo) = Excepción de tarifa solo-chofer
        if (vehiculo && vehiculo.tipoPropiedad !== 'externo') {
            const montoChofer = hoja.chofer?.datosContratado?.montoChoferDia || 0;
            if (montoChofer > 0) {
                tituloPago = "Tarifa Chofer (Usa auto SDA):";
                calculoPago = (
                    <Text fw={800} size="sm" c="cyan.8">
                        ${montoChofer.toLocaleString('es-AR')} <Text component="span" size="xs" fw={500} c="dimmed">/ día</Text>
                    </Text>
                );
            }
        } else {
            // Vehículo propio (Normal) - Se calcula según tipo de pago de la ruta
            const tipoPago = ruta.tipoPago || 'por_km';

            if (tipoPago === 'por_km' && ruta.precioKm > 0) {
                calculoPago = (
                    <Text fw={800} size="sm" c="cyan.8">
                        ${(kmTotal * ruta.precioKm).toLocaleString('es-AR')}
                    </Text>
                );
            } else if (tipoPago === 'por_distribucion' && ruta.montoPorDistribucion > 0) {
                tituloPago = "Tarifa por Distribución:";
                calculoPago = (
                    <Text fw={800} size="sm" c="cyan.8">
                        ${ruta.montoPorDistribucion.toLocaleString('es-AR')} <Text component="span" size="xs" fw={500} c="dimmed">por hoja</Text>
                    </Text>
                );
            } else if (tipoPago === 'por_mes' && ruta.montoMensual > 0) {
                tituloPago = "Tarifa Fija Mensual:";
                calculoPago = (
                    <Text fw={800} size="sm" c="cyan.8">
                        ${ruta.montoMensual.toLocaleString('es-AR')} <Text component="span" size="xs" fw={500} c="dimmed">mes compl.</Text>
                    </Text>
                );
            }
        }
    }

    // ── Enlace handlers ──────────────────────────────────────────────
    const agregarEnlace = () =>
        setForm(prev => ({ ...prev, horaEnlaces: [...prev.horaEnlaces, ''] }));

    const eliminarEnlace = (idx) =>
        setForm(prev => ({ ...prev, horaEnlaces: prev.horaEnlaces.filter((_, i) => i !== idx) }));

    const actualizarEnlace = (idx, valor) =>
        setForm(prev => {
            const nuevos = [...prev.horaEnlaces];
            nuevos[idx] = valor;
            return { ...prev, horaEnlaces: nuevos };
        });

    // ── Guardar ──────────────────────────────────────────────────────
    const handleGuardar = async () => {
        setGuardando(true);
        try {
            const enlacesLimpios = form.horaEnlaces.filter(h => h.trim() !== '');
            await clienteAxios.put(`/hojas-reparto/${hoja._id}`, {
                datosDrogueria: {
                    horaSalidaReal: form.horaSalidaReal,
                    horaEnlaces: enlacesLimpios,
                    horaInicioDistribucion: form.horaInicioDistribucion,
                    horaFinDistribucion: form.horaFinDistribucion,
                    cubetasSalida: Number(form.cubetasSalida) || 0,
                    cubetasRetorno: Number(form.cubetasRetorno) || 0,
                    kmExtra: Number(form.kmExtra) || 0,
                },
                observaciones: form.observaciones,
            });
            mostrarAlerta("✅ Datos guardados", "success");
            if (onSaved) onSaved();
        } catch (error) {
            console.error("Error al guardar datos droguería:", error);
            mostrarAlerta("❌ Error al guardar", "error");
        } finally {
            setGuardando(false);
        }
    };

    const inputStyle = { size: "sm" };

    return (
        <Stack gap="sm">

            {/* ── FILA 1: HORARIOS ───────────────────────────────── */}
            <Paper p="sm" radius="md" withBorder>
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" ls={0.5}>
                    Horarios
                </Text>
                <SimpleGrid cols={4} spacing="sm">
                    <TextInput
                        {...inputStyle}
                        label="Salida planificada"
                        value={horaPlanificada}
                        readOnly
                        disabled
                        description="De la ruta"
                    />
                    <TextInput
                        {...inputStyle}
                        label="Salida real"
                        placeholder="05:45"
                        value={form.horaSalidaReal}
                        onChange={(e) => setForm(prev => ({ ...prev, horaSalidaReal: e.target.value }))}
                        description="Hora real de salida"
                    />
                    <TextInput
                        {...inputStyle}
                        label="1ª Farmacia"
                        placeholder="09:40"
                        value={form.horaInicioDistribucion}
                        onChange={(e) => setForm(prev => ({ ...prev, horaInicioDistribucion: e.target.value }))}
                        description="Primera entrega"
                    />
                    <TextInput
                        {...inputStyle}
                        label="Última Farmacia"
                        placeholder="12:00"
                        value={form.horaFinDistribucion}
                        onChange={(e) => setForm(prev => ({ ...prev, horaFinDistribucion: e.target.value }))}
                        description="Última entrega"
                    />
                </SimpleGrid>
            </Paper>

            {/* ── FILA 2: ENLACES + KM + CUBETAS ─────────────────── */}
            <SimpleGrid cols={3} spacing="sm">

                {/* ENLACES */}
                <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" ls={0.5}>
                        Enlace(s)
                    </Text>
                    <Stack gap={6}>
                        {form.horaEnlaces.map((hora, idx) => (
                            <Group key={idx} gap={4}>
                                <TextInput
                                    size="sm"
                                    placeholder="08:30"
                                    value={hora}
                                    onChange={(e) => actualizarEnlace(idx, e.target.value)}
                                    style={{ flex: 1 }}
                                />
                                {form.horaEnlaces.length > 1 && (
                                    <ActionIcon
                                        color="red"
                                        variant="subtle"
                                        size="sm"
                                        onClick={() => eliminarEnlace(idx)}
                                    >
                                        <Trash2 size={12} />
                                    </ActionIcon>
                                )}
                            </Group>
                        ))}
                        <Button
                            variant="subtle"
                            color="cyan"
                            size="xs"
                            leftSection={<Plus size={12} />}
                            onClick={agregarEnlace}
                            px={4}
                        >
                            Agregar
                        </Button>
                    </Stack>
                </Paper>

                {/* KILÓMETROS */}
                <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" ls={0.5}>
                        Kilómetros
                    </Text>
                    <Stack gap={6}>
                        <Group grow>
                            <TextInput
                                size="sm"
                                label="Base"
                                value={kmBase}
                                readOnly
                                disabled
                            />
                            <NumberInput
                                size="sm"
                                label="Extra"
                                placeholder="0"
                                value={form.kmExtra}
                                onChange={(val) => setForm(prev => ({ ...prev, kmExtra: val ?? 0 }))}
                                allowNegative
                                styles={{
                                    input: {
                                        color: form.kmExtra < 0
                                            ? 'var(--mantine-color-red-7)'
                                            : form.kmExtra > 0
                                                ? 'var(--mantine-color-teal-7)'
                                                : undefined,
                                        fontWeight: form.kmExtra !== 0 ? 700 : undefined,
                                    }
                                }}
                            />
                        </Group>
                        <TextInput
                            size="sm"
                            label="Total del día"
                            value={kmTotal}
                            readOnly
                            disabled
                            styles={{
                                input: {
                                    fontWeight: 700,
                                    color: kmTotal >= 0
                                        ? 'var(--mantine-color-cyan-8)'
                                        : 'var(--mantine-color-red-7)',
                                }
                            }}
                        />
                        {calculoPago && (
                            <Paper p={6} radius="sm" bg="cyan.0">
                                <Text size="xs" c="cyan.9" fw={600}>{tituloPago}</Text>
                                {calculoPago}
                            </Paper>
                        )}
                    </Stack>
                </Paper>

                {/* CUBETAS */}
                <Paper p="sm" radius="md" withBorder>
                    <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="xs" ls={0.5}>
                        Cubetas
                    </Text>
                    <Stack gap={6}>
                        <Group grow>
                            <NumberInput
                                size="sm"
                                label="Salida"
                                min={0}
                                value={form.cubetasSalida}
                                onChange={(val) => setForm(prev => ({ ...prev, cubetasSalida: val ?? 0 }))}
                            />
                            <NumberInput
                                size="sm"
                                label="Retorno"
                                min={0}
                                value={form.cubetasRetorno}
                                onChange={(val) => setForm(prev => ({ ...prev, cubetasRetorno: val ?? 0 }))}
                            />
                        </Group>
                        {(form.cubetasSalida > 0 || form.cubetasRetorno > 0) && (
                            <Group gap={4}>
                                <Text size="xs" c="dimmed">Diferencia:</Text>
                                <Badge
                                    size="sm"
                                    color={diferenciaCubetas === 0 ? 'green' : 'orange'}
                                    variant="light"
                                >
                                    {diferenciaCubetas >= 0 ? '+' : ''}{diferenciaCubetas}
                                </Badge>
                            </Group>
                        )}
                    </Stack>
                </Paper>

            </SimpleGrid>

            {/* ── FILA 3: OBSERVACIONES + GUARDAR ────────────────── */}
            <Group align="flex-end" gap="sm">
                <Textarea
                    size="sm"
                    label="Observaciones"
                    placeholder="Ej: ESPECIAL DROGUERÍA LIDER, corte de ruta..."
                    value={form.observaciones}
                    onChange={(e) => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    rows={2}
                    style={{ flex: 1 }}
                />
                <Button
                    color="cyan"
                    size="sm"
                    loading={guardando}
                    onClick={handleGuardar}
                    mb={1}
                >
                    Guardar
                </Button>
            </Group>

        </Stack>
    );
};

export default TabDrogueria;

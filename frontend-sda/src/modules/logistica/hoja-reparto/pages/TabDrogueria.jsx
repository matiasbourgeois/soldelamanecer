import React, { useState, useEffect } from "react";
import {
    Stack, Group, TextInput, NumberInput, Textarea, Button,
    Text, Paper, SimpleGrid, Badge, Divider, ActionIcon, ThemeIcon, rem
} from "@mantine/core";
import {
    Clock, Plus, Trash2, Truck, Package, MessageSquare, Activity
} from "lucide-react";
import clienteAxios from "../../../../core/api/clienteAxios";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";

/**
 * TabDrogueria — Datos operativos diarios para Droguería del Sud S.A.
 * Cargados por el administrativo al día siguiente con info de los contratados.
 *
 * Props:
 *   hoja     — objeto completo de la hoja de reparto (incluye ruta populada)
 *   onSaved  — callback para refrescar el estado padre tras guardar
 */
const TabDrogueria = ({ hoja, onSaved }) => {
    const kmBase = hoja?.ruta?.kilometrosEstimados ?? 0;

    const buildInitialState = () => ({
        horaEnlaces: (hoja?.datosDrogueria?.horaEnlaces?.length > 0)
            ? hoja.datosDrogueria.horaEnlaces
            : [''],                       // al menos 1 campo por defecto
        horaInicioDistribucion: hoja?.datosDrogueria?.horaInicioDistribucion ?? '',
        horaFinDistribucion: hoja?.datosDrogueria?.horaFinDistribucion ?? '',
        cubetasSalida: hoja?.datosDrogueria?.cubetasSalida ?? 0,
        cubetasRetorno: hoja?.datosDrogueria?.cubetasRetorno ?? 0,
        kmExtra: hoja?.datosDrogueria?.kmExtra ?? 0,
        observaciones: hoja?.observaciones ?? '',
    });

    const [form, setForm] = useState(buildInitialState);
    const [guardando, setGuardando] = useState(false);

    // Si cambia la hoja desde el padre (refresco), sincronizar
    useEffect(() => {
        setForm(buildInitialState());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [hoja?._id]);

    const kmTotal = kmBase + (Number(form.kmExtra) || 0);

    // ── Enlace handlers ──────────────────────────────────────────────
    const agregarEnlace = () => {
        setForm(prev => ({ ...prev, horaEnlaces: [...prev.horaEnlaces, ''] }));
    };

    const eliminarEnlace = (idx) => {
        setForm(prev => ({
            ...prev,
            horaEnlaces: prev.horaEnlaces.filter((_, i) => i !== idx)
        }));
    };

    const actualizarEnlace = (idx, valor) => {
        setForm(prev => {
            const nuevos = [...prev.horaEnlaces];
            nuevos[idx] = valor;
            return { ...prev, horaEnlaces: nuevos };
        });
    };

    // ── Guardar ──────────────────────────────────────────────────────
    const handleGuardar = async () => {
        setGuardando(true);
        try {
            // Limpiar horas de enlace vacías antes de guardar
            const enlacesLimpios = form.horaEnlaces.filter(h => h.trim() !== '');

            await clienteAxios.put(`/hojas-reparto/${hoja._id}`, {
                datosDrogueria: {
                    horaEnlaces: enlacesLimpios,
                    horaInicioDistribucion: form.horaInicioDistribucion,
                    horaFinDistribucion: form.horaFinDistribucion,
                    cubetasSalida: Number(form.cubetasSalida) || 0,
                    cubetasRetorno: Number(form.cubetasRetorno) || 0,
                    kmExtra: Number(form.kmExtra) || 0,
                },
                observaciones: form.observaciones,
            });

            mostrarAlerta("✅ Datos de droguería guardados", "success");
            if (onSaved) onSaved();
        } catch (error) {
            console.error("Error al guardar datos droguería:", error);
            mostrarAlerta("❌ Error al guardar", "error");
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Stack gap="xl">

            {/* ── ENCABEZADO INFO ──────────────────────────────────── */}
            <Paper p="md" radius="md" withBorder
                style={{ borderLeft: `4px solid var(--mantine-color-cyan-5)` }}
            >
                <Group>
                    <ThemeIcon color="cyan" variant="light" size={38} radius="md">
                        <Truck size={18} />
                    </ThemeIcon>
                    <div>
                        <Text fw={700} size="sm">Datos operativos del día</Text>
                        <Text size="xs" c="dimmed">
                            Completar al día siguiente con la info que mandan los contratados por WhatsApp
                        </Text>
                    </div>
                    <Badge variant="light" color="gray" ml="auto">
                        Hoja {hoja?.numeroHoja}
                    </Badge>
                </Group>
            </Paper>

            {/* ── HORARIOS ─────────────────────────────────────────── */}
            <Paper p="lg" radius="md" withBorder>
                <Group mb="md">
                    <ThemeIcon color="blue" variant="light" size={30} radius="md">
                        <Clock size={15} />
                    </ThemeIcon>
                    <Text fw={700} size="sm" tt="uppercase" c="dimmed" ls={0.5}>Horarios</Text>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="md">
                    {/* Hora salida — readonly */}
                    <TextInput
                        label="Hora de Salida"
                        value={hoja?.ruta?.horaSalida ?? '-'}
                        readOnly
                        disabled
                        description="Configurada en la ruta"
                    />

                    {/* 1ra farmacia */}
                    <TextInput
                        label="1ª Farmacia"
                        placeholder="09:40"
                        value={form.horaInicioDistribucion}
                        onChange={(e) => setForm(prev => ({ ...prev, horaInicioDistribucion: e.target.value }))}
                        description="Hora primera entrega"
                    />

                    {/* Última farmacia */}
                    <TextInput
                        label="Última Farmacia"
                        placeholder="12:00"
                        value={form.horaFinDistribucion}
                        onChange={(e) => setForm(prev => ({ ...prev, horaFinDistribucion: e.target.value }))}
                        description="Hora última entrega"
                    />
                </SimpleGrid>

                <Divider my="md" label="Enlace(s)" labelPosition="left" />

                {/* Enlace dinámico */}
                <Stack gap="xs">
                    {form.horaEnlaces.map((hora, idx) => (
                        <Group key={idx} gap="xs">
                            <TextInput
                                placeholder="08:30"
                                value={hora}
                                onChange={(e) => actualizarEnlace(idx, e.target.value)}
                                style={{ flex: 1 }}
                                leftSection={<Clock size={14} />}
                                description={idx === 0 ? "Hora en que se hizo el enlace con otro chofer" : undefined}
                            />
                            {form.horaEnlaces.length > 1 && (
                                <ActionIcon
                                    color="red"
                                    variant="light"
                                    size="lg"
                                    mt={idx === 0 ? 18 : 0}
                                    onClick={() => eliminarEnlace(idx)}
                                >
                                    <Trash2 size={14} />
                                </ActionIcon>
                            )}
                        </Group>
                    ))}
                    <Button
                        variant="subtle"
                        color="cyan"
                        size="xs"
                        leftSection={<Plus size={14} />}
                        onClick={agregarEnlace}
                        w="fit-content"
                    >
                        Agregar enlace
                    </Button>
                </Stack>
            </Paper>

            {/* ── KILÓMETROS ───────────────────────────────────────── */}
            <Paper p="lg" radius="md" withBorder>
                <Group mb="md">
                    <ThemeIcon color="indigo" variant="light" size={30} radius="md">
                        <Activity size={15} />
                    </ThemeIcon>
                    <Text fw={700} size="sm" tt="uppercase" c="dimmed" ls={0.5}>Kilómetros</Text>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                    {/* KM Base — readonly */}
                    <TextInput
                        label="KM Base (ruta)"
                        value={kmBase}
                        readOnly
                        disabled
                        description="Configurado en la ruta"
                    />

                    {/* KM Extra — editable, acepta negativos */}
                    <NumberInput
                        label="KM Extra"
                        placeholder="0"
                        value={form.kmExtra}
                        onChange={(val) => setForm(prev => ({ ...prev, kmExtra: val ?? 0 }))}
                        allowNegative
                        description="Positivo si hizo más km, negativo si fue reemplazado"
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

                    {/* KM Total — calculado */}
                    <TextInput
                        label="KM Total del día"
                        value={kmTotal}
                        readOnly
                        disabled
                        description="Base + Extra (para liquidación)"
                        styles={{
                            input: {
                                fontWeight: 700,
                                fontSize: rem(16),
                                color: kmTotal > 0
                                    ? 'var(--mantine-color-cyan-7)'
                                    : 'var(--mantine-color-red-7)',
                            }
                        }}
                    />
                </SimpleGrid>

                {hoja?.ruta?.precioKm > 0 && (
                    <Paper p="sm" radius="sm" bg="cyan.0" mt="md">
                        <Group justify="space-between">
                            <Text size="sm" c="dimmed">Pago estimado al contratado:</Text>
                            <Text fw={800} size="lg" c="cyan.8">
                                ${(kmTotal * hoja.ruta.precioKm).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </Text>
                        </Group>
                        <Text size="xs" c="dimmed">
                            {kmTotal} km × ${hoja.ruta.precioKm}/km
                        </Text>
                    </Paper>
                )}
            </Paper>

            {/* ── CUBETAS ──────────────────────────────────────────── */}
            <Paper p="lg" radius="md" withBorder>
                <Group mb="md">
                    <ThemeIcon color="teal" variant="light" size={30} radius="md">
                        <Package size={15} />
                    </ThemeIcon>
                    <Text fw={700} size="sm" tt="uppercase" c="dimmed" ls={0.5}>Cubetas Térmicas</Text>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                    <NumberInput
                        label="Cubetas Salida"
                        placeholder="0"
                        min={0}
                        value={form.cubetasSalida}
                        onChange={(val) => setForm(prev => ({ ...prev, cubetasSalida: val ?? 0 }))}
                        description="Cubetas que salieron con el chofer"
                    />
                    <NumberInput
                        label="Cubetas Retorno"
                        placeholder="0"
                        min={0}
                        value={form.cubetasRetorno}
                        onChange={(val) => setForm(prev => ({ ...prev, cubetasRetorno: val ?? 0 }))}
                        description="Cubetas que volvieron de las farmacias"
                    />
                </SimpleGrid>

                {(form.cubetasSalida > 0 || form.cubetasRetorno > 0) && (
                    <Paper p="sm" radius="sm" bg="gray.0" mt="md">
                        <Group>
                            <Text size="sm" c="dimmed">Diferencia:</Text>
                            <Badge
                                color={form.cubetasSalida - form.cubetasRetorno === 0 ? 'green' : 'orange'}
                                variant="light"
                            >
                                {form.cubetasSalida - form.cubetasRetorno >= 0 ? '+' : ''}
                                {form.cubetasSalida - form.cubetasRetorno} cubetas
                            </Badge>
                        </Group>
                    </Paper>
                )}
            </Paper>

            {/* ── OBSERVACIONES ────────────────────────────────────── */}
            <Paper p="lg" radius="md" withBorder>
                <Group mb="md">
                    <ThemeIcon color="orange" variant="light" size={30} radius="md">
                        <MessageSquare size={15} />
                    </ThemeIcon>
                    <Text fw={700} size="sm" tt="uppercase" c="dimmed" ls={0.5}>Observaciones</Text>
                </Group>
                <Textarea
                    placeholder="Ej: ESPECIAL DROGUERÍA LIDER, corte de ruta en ..."
                    value={form.observaciones}
                    onChange={(e) => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                    minRows={3}
                    autosize
                />
            </Paper>

            {/* ── BOTÓN GUARDAR ────────────────────────────────────── */}
            <Group justify="flex-end">
                <Button
                    color="cyan"
                    size="md"
                    radius="md"
                    loading={guardando}
                    onClick={handleGuardar}
                    leftSection={<Activity size={18} />}
                >
                    Guardar datos droguería
                </Button>
            </Group>

        </Stack>
    );
};

export default TabDrogueria;

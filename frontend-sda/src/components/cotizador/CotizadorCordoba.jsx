import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Container,
  Title,
  Text,
  Paper,
  Stack,
  Group,
  Grid,
  Select,
  Button,
  NumberInput,
  Badge,
  rem,
  Divider,
  Box,
  Alert,
  ThemeIcon,
  Tooltip,
  ActionIcon,
  Transition
} from "@mantine/core";
import {
  IconCalculator,
  IconRefresh,
  IconCopy,
  IconCheck,
  IconClipboard,
  IconAlertCircle,
  IconTruckDelivery,
  IconPackage,
  IconMapPin,
  IconClock,
  IconArrowRightLeft,
  IconUser,
  IconBuildingCommunity,
  IconMap
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import {
  PRICING_CAPITAL,
  PRICING_INTERIOR,
  PRICING_PALLET,
  PROTECCION,
} from "@core/config/preciosCordoba";
import { LOCALITIES } from "../../data/localidadesCordoba";

/**
 * Cotizador Córdoba (Refactorizado a Mantine)
 * Permite calcular tarifas de envío basadas en origen, destino, tamaño y protección.
 */
const CotizadorCordoba = () => {
  // Estados
  const [origenIdx, setOrigenIdx] = useState(null);
  const [destinoIdx, setDestinoIdx] = useState(null);
  const [servicio, setServicio] = useState("Paquetería");
  const [categoria, setCategoria] = useState("Chico");
  const [modalidad, setModalidad] = useState("A sucursal");
  const [valorDeclarado, setValorDeclarado] = useState(3000);
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Helpers
  const fmtMoney = (n) => new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 2,
  }).format(n);

  const isCordobaCapital = (loc) => {
    if (!loc) return false;
    const name = (loc.name || "").toLowerCase();
    const cp = (loc.cp || "").trim();
    return name.includes("córdoba capital") || name.includes("cordoba capital") || cp === "5000";
  };

  const BRANCH_CPS = new Set(["5000", "5800", "5900"]);
  const hasBranch = (loc) => !!loc && BRANCH_CPS.has(String(loc.cp || "").trim());

  const FRIENDLY_LIMITS = {
    Chico: "Hasta 90 cm lineales (L + A + H).",
    Mediano: "De 91 a 150 cm lineales (L + A + H).",
    Grande: "De 151 a 220 cm lineales (L + A + H).",
    Pallet: "Pallet ARLOG 120×100 cm (hasta 160 cm de alto y hasta 1000 kg). Consultar frecuencia y disponibilidad.",
  };

  // Computeds
  const origen = useMemo(() => (origenIdx !== null ? LOCALITIES[origenIdx] : null), [origenIdx]);
  const destino = useMemo(() => (destinoIdx !== null ? LOCALITIES[destinoIdx] : null), [destinoIdx]);

  const hasOrigen = origenIdx !== null;
  const hasDestino = destinoIdx !== null;
  const invalidSamePlace = hasOrigen && hasDestino && origenIdx === destinoIdx;
  const canQuote = hasOrigen && hasDestino && !invalidSamePlace;

  const isInteriorInterior = useMemo(
    () => canQuote && !isCordobaCapital(origen) && !isCordobaCapital(destino),
    [canQuote, origen, destino]
  );

  const tarifaLabel = canQuote ? (isInteriorInterior ? "INTERIOR – INTERIOR" : "CAPITAL – INTERIOR") : "—";

  const modalidadOptions = useMemo(() => {
    if (servicio === "Pallet") return ["A domicilio"];
    if (hasOrigen && hasDestino && hasBranch(origen) && hasBranch(destino)) {
      return ["A sucursal", "A domicilio"];
    }
    return ["A domicilio"];
  }, [servicio, hasOrigen, hasDestino, origen, destino]);

  // Side Effects
  useEffect(() => {
    if (!modalidadOptions.includes(modalidad)) {
      setModalidad("A domicilio");
    }
  }, [modalidadOptions, modalidad]);

  // Calculos de precio
  const basePrice = useMemo(() => {
    if (!canQuote) return 0;
    if (servicio === "Paquetería") {
      const key = modalidad === "A sucursal" ? "sucursal" : "domicilio";
      const table = isInteriorInterior ? PRICING_INTERIOR : PRICING_CAPITAL;
      return table[categoria][key];
    }
    return PRICING_PALLET.ARLOG_120x100.domicilio;
  }, [canQuote, servicio, categoria, modalidad, isInteriorInterior]);

  const protegidoSobre = Math.max(PROTECCION.minimo, valorDeclarado || 0);
  const proteccion = useMemo(
    () => (canQuote ? (protegidoSobre > 0 ? protegidoSobre * PROTECCION.percent : 0) : 0),
    [canQuote, protegidoSobre]
  );
  const subtotal = useMemo(() => (canQuote ? basePrice + proteccion : 0), [canQuote, basePrice, proteccion]);
  const iva = useMemo(() => subtotal * 0.21, [subtotal]);
  const total = useMemo(() => subtotal + iva, [subtotal, iva]);

  const freqText = useMemo(() => {
    if (!hasDestino) return "—";
    const f = (destino?.frecuencia || "").trim();
    const h = (destino?.horarios || "").trim();
    if (!f && !h) return "Sin datos";
    return f && h ? `${f} · ${h}` : f || h;
  }, [hasDestino, destino]);

  // Handlers
  const resetCotizacion = () => {
    setResetting(true);
    setOrigenIdx(null);
    setDestinoIdx(null);
    setServicio("Paquetería");
    setCategoria("Chico");
    setModalidad("A sucursal");
    setValorDeclarado(3000);
    setTimeout(() => setResetting(false), 300);
    notifications.show({
      title: "Cotización Reiniciada",
      message: "Se han limpiado todos los campos.",
      color: "gray",
      icon: <IconRefresh size={16} />
    });
  };

  const copiarResumen = async () => {
    if (!canQuote) return;
    const partes = [
      `Cotización Sol del Amanecer`,
      `De: ${origen.cp} ${origen.name} → Para: ${destino.cp} ${destino.name}`,
      `${servicio}${servicio === "Paquetería" ? ` · ${categoria}` : " · ARLOG 120×100"} · ${modalidad}`,
      `Tarifa: ${tarifaLabel}`,
      `Total con IVA: ${fmtMoney(total)}`
    ];
    try {
      await navigator.clipboard.writeText(partes.join("\n"));
      setCopiedMsg(true);
      setTimeout(() => setCopiedMsg(false), 2000);
      notifications.show({
        title: "Resumen Copiado",
        message: "La cotización está en tu portapapeles.",
        color: "teal",
        icon: <IconClipboard size={16} />
      });
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  const selectData = LOCALITIES.map((loc, index) => ({
    value: index.toString(),
    label: `${loc.cp} — ${loc.name}`,
    group: loc.provincia || "Córdoba"
  }));

  return (
    <Container size="lg" py={rem(60)}>
      {/* Header Section */}
      <Group justify="space-between" align="flex-end" mb={rem(40)}>
        <Stack gap={4}>
          <Badge variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }} size="lg" radius="sm">
            SERVICIOS DE LOGÍSTICA
          </Badge>
          <Title order={1} fw={900} style={{ letterSpacing: '-1.5px', fontSize: rem(42) }}>
            Cotizador de <Text span inherit variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }}>Envíos</Text>
          </Title>
          <Text c="dimmed" size="lg" fw={500}>
            Calculá el costo exacto de tu envío en la red de Córdoba.
          </Text>
        </Stack>

        {canQuote && (
          <Button
            variant="subtle"
            color="red"
            leftSection={<IconRefresh size={18} />}
            onClick={resetCotizacion}
            radius="md"
          >
            REINICIAR
          </Button>
        )}
      </Group>

      <Grid gutter="xl">
        {/* CONFIGURATION PANEL */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <Stack gap="xl">
            {/* 📍 Origen y Destino */}
            <Paper p="xl" radius="lg" withBorder shadow="sm">
              <Stack gap="lg">
                <Group grow gap="xl">
                  <Select
                    label="Origen"
                    placeholder="Buscá por localidad o CP"
                    data={selectData}
                    value={origenIdx?.toString()}
                    onChange={(val) => setOrigenIdx(val ? parseInt(val) : null)}
                    searchable
                    nothingFoundMessage="No se encontró la localidad"
                    leftSection={<ThemeIcon variant="light" color="cyan" size="sm"><IconMapPin size={14} /></ThemeIcon>}
                    radius="md"
                    size="md"
                    styles={{ label: { fontWeight: 700, marginBottom: 5 } }}
                  />
                  <Select
                    label="Destino"
                    placeholder="Buscá por localidad o CP"
                    data={selectData}
                    value={destinoIdx?.toString()}
                    onChange={(val) => setDestinoIdx(val ? parseInt(val) : null)}
                    searchable
                    nothingFoundMessage="No se encontró la localidad"
                    leftSection={<ThemeIcon variant="light" color="indigo" size="sm"><IconMapPin size={14} /></ThemeIcon>}
                    radius="md"
                    size="md"
                    styles={{ label: { fontWeight: 700, marginBottom: 5 } }}
                  />
                </Group>

                <Group justify="space-between" align="center">
                  <Group gap="xs">
                    <Badge color="gray.2" c="dark.3" radius="md">Tarifa: {tarifaLabel}</Badge>
                    <Badge color="gray.2" c="dark.3" radius="md">Frecuencia: {freqText}</Badge>
                  </Group>

                  <Tooltip label="Invertir trayecto">
                    <ActionIcon
                      variant="light"
                      color="cyan"
                      size="lg"
                      radius="md"
                      onClick={() => {
                        const temp = origenIdx;
                        setOrigenIdx(destinoIdx);
                        setDestinoIdx(temp);
                      }}
                    >
                      <IconArrowRightLeft size={20} />
                    </ActionIcon>
                  </Tooltip>
                </Group>

                {invalidSamePlace && (
                  <Alert icon={<IconAlertCircle size={16} />} color="red" radius="md" variant="light">
                    Origen y destino son iguales. Por favor, seleccioná ubicaciones distintas.
                  </Alert>
                )}
              </Stack>
            </Paper>

            {/* 📦 Detalles del Envío */}
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
              <Paper p="xl" radius="lg" withBorder shadow="sm">
                <Stack gap="lg">
                  <Select
                    label="Servicio"
                    data={["Paquetería", "Pallet"]}
                    value={servicio}
                    onChange={setServicio}
                    radius="md"
                    size="md"
                    styles={{ label: { fontWeight: 700, marginBottom: 5 } }}
                  />
                  {servicio === "Paquetería" ? (
                    <Select
                      label="Tamaño del Bulto"
                      data={["Chico", "Mediano", "Grande"]}
                      value={categoria}
                      onChange={setCategoria}
                      radius="md"
                      size="md"
                      description={FRIENDLY_LIMITS[categoria]}
                      styles={{ label: { fontWeight: 700, marginBottom: 5 } }}
                    />
                  ) : (
                    <Box p="md" radius="md" bg="gray.0" style={{ border: '1px dashed var(--mantine-color-gray-3)' }}>
                      <Text size="xs" fw={700} c="dimmed" mb={4}>INFORMACIÓN DEL PALLET</Text>
                      <Text size="sm">{FRIENDLY_LIMITS.Pallet}</Text>
                    </Box>
                  )}
                </Stack>
              </Paper>

              <Paper p="xl" radius="lg" withBorder shadow="sm">
                <Stack gap="lg">
                  <Select
                    label="Tipo de Entrega"
                    data={modalidadOptions}
                    value={modalidad}
                    onChange={setModalidad}
                    radius="md"
                    size="md"
                    styles={{ label: { fontWeight: 700, marginBottom: 5 } }}
                  />
                  <NumberInput
                    label="Valor Declarado (ARS)"
                    description={`Protección del ${Math.round(PROTECCION.percent * 100)}%`}
                    placeholder="Mínimo 3000"
                    value={valorDeclarado}
                    onChange={setValorDeclarado}
                    prefix="$ "
                    thousandSeparator="."
                    decimalSeparator=","
                    radius="md"
                    size="md"
                    styles={{ label: { fontWeight: 700, marginBottom: 5 } }}
                  />
                </Stack>
              </Paper>
            </SimpleGrid>

            <Paper
              p="md"
              radius="md"
              bg="cyan.0"
              style={{ border: '1px solid var(--mantine-color-cyan-1)' }}
            >
              <Group gap="xs" wrap="nowrap">
                <ThemeIcon variant="transparent" color="cyan.9"><IconAlertCircle size={20} /></ThemeIcon>
                <Text size="sm" c="cyan.9" fw={500}>
                  Si enviás varios bultos al mismo destino en un único despacho, la tarifa por unidad es menor que cotizando por separado.
                </Text>
              </Group>
            </Paper>
          </Stack>
        </Grid.Col>

        {/* RESULT PANEL */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <Paper
            p={rem(35)}
            radius="24px"
            withBorder
            shadow="xl"
            style={{
              position: 'sticky',
              top: rem(100),
              backgroundColor: 'white',
              borderColor: 'var(--mantine-color-cyan-1)',
              borderWidth: 2
            }}
          >
            <Stack gap="xl">
              <Group justify="space-between">
                <Title order={3} fw={900} style={{ letterSpacing: '-1px' }}>RESUMEN</Title>
                <ThemeIcon size="lg" radius="md" color="cyan" variant="light">
                  <IconCalculator size={22} />
                </ThemeIcon>
              </Group>

              {!canQuote ? (
                <Stack align="center" py="xl" gap="md">
                  <Box style={{ opacity: 0.1 }}>
                    <IconTruckDelivery size={80} stroke={1} />
                  </Box>
                  <Text ta="center" c="dimmed" size="sm" px="xl">
                    Seleccioná un origen y destino para ver la cotización detallada.
                  </Text>
                </Stack>
              ) : (
                <Stack gap="md">
                  <Box>
                    <Text size="xs" fw={700} c="dimmed" tt="uppercase" mb={4}>TRAYECTO</Text>
                    <Text fw={700} size="sm">{origen?.name} ({origen?.cp})</Text>
                    <Box my={4} style={{ borderLeft: '2px dashed var(--mantine-color-gray-3)', height: 20, marginLeft: 8 }} />
                    <Text fw={700} size="sm">{destino?.name} ({destino?.cp})</Text>
                  </Box>

                  <Divider variant="dashed" />

                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Precio Base</Text>
                      <Text size="sm" fw={700}>{fmtMoney(basePrice)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Protección</Text>
                      <Text size="sm" fw={700}>{fmtMoney(proteccion)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">Subtotal (sin IVA)</Text>
                      <Text size="sm" fw={700}>{fmtMoney(subtotal)}</Text>
                    </Group>
                    <Group justify="space-between">
                      <Text size="sm" c="dimmed">IVA (21%)</Text>
                      <Text size="sm" fw={700}>{fmtMoney(iva)}</Text>
                    </Group>
                  </Stack>

                  <Box
                    p="lg"
                    radius="xl"
                    bg="cyan.0"
                    style={{ border: '2px solid var(--mantine-color-cyan-2)' }}
                    mt="md"
                  >
                    <Stack gap={2} align="center">
                      <Text size="xs" fw={800} c="cyan.9" tt="uppercase">TOTAL A PAGAR</Text>
                      <Text
                        fw={900}
                        size={rem(32)}
                        variant="gradient"
                        gradient={{ from: 'cyan.9', to: 'indigo.9' }}
                        style={{ letterSpacing: '-1px' }}
                      >
                        {fmtMoney(total)}
                      </Text>
                    </Stack>
                  </Box>

                  <Button
                    fullWidth
                    size="lg"
                    radius="md"
                    color="cyan"
                    variant="filled"
                    leftSection={copiedMsg ? <IconCheck size={18} /> : <IconCopy size={18} />}
                    onClick={copiarResumen}
                    style={{ boxShadow: '0 8px 20px rgba(34, 184, 209, 0.25)' }}
                  >
                    {copiedMsg ? "COPIADO" : "COPIAR RESUMEN"}
                  </Button>
                </Stack>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Container>
  );
};

export default CotizadorCordoba;

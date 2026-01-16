import React, { useState, useMemo, useEffect } from "react";
import {
  Container,
  Grid,
  SimpleGrid,
  Text,
  Title,
  Card,
  Stack,
  Group,
  ThemeIcon,
  Box,
  rem,
  Badge,
  Autocomplete,
  SegmentedControl,
  NumberInput,
  Button,
  Divider,
  Paper,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import {
  Calculator,
  Package,
  Truck,
  MapPin,
  ClipboardCheck,
  RotateCcw,
  Info,
  Zap,
  ShieldCheck,
  ArrowLeftRight,
  TrendingUp,
  Map
} from 'lucide-react';

// Importación de datos y lógica original
import {
  PRICING_CAPITAL,
  PRICING_INTERIOR,
  PRICING_PALLET,
  PROTECCION,
} from "@core/config/preciosCordoba";
import { LOCALITIES } from "../../../data/localidadesCordoba";

const BRANCH_CPS = new Set(["5000", "5800", "5900"]);
const hasBranch = (cp) => cp && BRANCH_CPS.has(String(cp).trim());

function fmtMoney(n) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(n);
}

function isCordobaCapital(locName) {
  if (!locName) return false;
  const name = locName.toLowerCase();
  return name.includes("córdoba capital") || name.includes("cordoba capital");
}

const CATEGORY_LIMITS = {
  Chico: "Hasta 90 cm lineales (L + A + H)",
  Mediano: "De 91 a 150 cm lineales (L + A + H)",
  Grande: "De 151 a 220 cm lineales (L + A + H)",
};

const normalizeText = (text) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const CotizadorCordobaPage = () => {
  const [origen, setOrigen] = useState("");
  const [destino, setDestino] = useState("");
  const [tipoServicio, setTipoServicio] = useState("paqueteria");
  const [categoria, setCategoria] = useState("Chico");
  const [modalidad, setModalidad] = useState("domicilio");
  const [valorDeclarado, setValorDeclarado] = useState(3000);
  const [copied, setCopied] = useState(false);

  const localityData = useMemo(() => LOCALITIES.map(l => `${l.cp} - ${l.name}`), []);
  const originLoc = useMemo(() => LOCALITIES.find(l => `${l.cp} - ${l.name}` === origen), [origen]);
  const destLoc = useMemo(() => LOCALITIES.find(l => `${l.cp} - ${l.name}` === destino), [destino]);

  const canQuote = originLoc && destLoc && origen !== destino;

  // Habilitar sucursal solo si ambos CP están en BRANCH_CPS
  const sucursalHabilitada = useMemo(() => {
    return originLoc && destLoc && hasBranch(originLoc.cp) && hasBranch(destLoc.cp) && tipoServicio !== "pallet";
  }, [originLoc, destLoc, tipoServicio]);

  useEffect(() => {
    if (!sucursalHabilitada && modalidad === "sucursal") {
      setModalidad("domicilio");
    }
  }, [sucursalHabilitada, modalidad]);

  const calculation = useMemo(() => {
    if (!canQuote) return null;
    const isInteriorInterior = !isCordobaCapital(originLoc.name) && !isCordobaCapital(destLoc.name);
    let basePrice = 0;
    if (tipoServicio === "paqueteria") {
      const table = isInteriorInterior ? PRICING_INTERIOR : PRICING_CAPITAL;
      basePrice = table[categoria][modalidad];
    } else {
      basePrice = PRICING_PALLET.ARLOG_120x100.domicilio;
    }
    const protegidoSobre = Math.max(PROTECCION.minimo, valorDeclarado);
    const costoproteccion = protegidoSobre * PROTECCION.percent;
    const subtotal = basePrice + costoproteccion;
    const iva = subtotal * 0.21;
    const total = subtotal + iva;

    return {
      basePrice,
      proteccion: costoproteccion,
      subtotal,
      iva,
      total,
      tarifaType: isInteriorInterior ? "INTERIOR - INTERIOR" : "CAPITAL - INTERIOR",
      frecuencia: destLoc.frecuencia || "Consultar"
    };
  }, [canQuote, originLoc, destLoc, tipoServicio, categoria, modalidad, valorDeclarado]);

  const handleInvert = () => {
    const temp = origen;
    setOrigen(destino);
    setDestino(temp);
  };

  const handleReset = () => {
    setOrigen("");
    setDestino("");
    setTipoServicio("paqueteria");
    setCategoria("Chico");
    setModalidad("domicilio");
    setValorDeclarado(3000);
  };

  const handleCopy = () => {
    if (!calculation) return;
    const summary = `Cotización Sol del Amanecer\nOrigen: ${origen}\nDestino: ${destino}\nServicio: ${tipoServicio.toUpperCase()}\nTotal con IVA: ${fmtMoney(calculation.total)}`;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Box style={{ flex: 1, backgroundColor: '#fcfcfd', overflowY: 'auto' }}>
      <Container size="xl" py={rem(20)}>
        <Stack gap="md">
          {/* HEADER */}
          <Group justify="space-between" align="center">
            <Title order={1} fw={900} size={rem(32)} style={{ letterSpacing: '-1.5px' }}>
              Cotizador de Envíos
            </Title>
            <Button
              variant="light"
              color="gray"
              size="xs"
              leftSection={<RotateCcw size={14} />}
              onClick={handleReset}
              radius="md"
            >
              Reiniciar cotización
            </Button>
          </Group>

          {/* ROW 1: ORIGEN Y DESTINO */}
          <Paper p="lg" radius="lg" withBorder shadow="0 2px 8px rgba(0,0,0,0.02)">
            <Grid gutter="lg">
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Autocomplete
                  label="Origen"
                  placeholder="Buscar por localidad o CP..."
                  data={localityData}
                  value={origen}
                  onChange={setOrigen}
                  filter={({ options, search }) => {
                    const normalizedSearch = normalizeText(search);
                    return options.filter((option) =>
                      normalizeText(option.label).includes(normalizedSearch)
                    );
                  }}
                  size="sm"
                  radius="md"
                  leftSection={<MapPin size={16} color="var(--mantine-color-cyan-6)" />}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Autocomplete
                  label="Destino"
                  placeholder="Buscar por localidad o CP..."
                  data={localityData}
                  value={destino}
                  onChange={setDestino}
                  filter={({ options, search }) => {
                    const normalizedSearch = normalizeText(search);
                    return options.filter((option) =>
                      normalizeText(option.label).includes(normalizedSearch)
                    );
                  }}
                  size="sm"
                  radius="md"
                  leftSection={<Truck size={16} color="var(--mantine-color-indigo-6)" />}
                />
              </Grid.Col>
            </Grid>

            <Group justify="space-between" mt="sm">
              <Group gap="xs">
                <Badge variant="light" color="gray" size="sm" radius="xs" fw={700}>Tarifa: {calculation?.tarifaType || "—"}</Badge>
                <Badge variant="light" color="gray" size="sm" radius="xs" fw={700}>Frecuencia: {calculation?.frecuencia || "—"}</Badge>
              </Group>
              <Button
                variant="subtle"
                color="indigo"
                size="xs"
                radius="xl"
                leftSection={<ArrowLeftRight size={14} />}
                onClick={handleInvert}
              >
                Invertir ruta
              </Button>
            </Group>
          </Paper>

          {/* ROW 2: PARÁMETROS */}
          <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} gap="xs">
            <Paper p="sm" radius="md" withBorder>
              <Text fw={700} size="xs" c="dimmed" mb={4} tt="uppercase">Servicio</Text>
              <SegmentedControl
                fullWidth
                value={tipoServicio}
                onChange={setTipoServicio}
                data={[
                  { label: 'Paquetería', value: 'paqueteria' },
                  { label: 'Pallet', value: 'pallet' },
                ]}
                radius="md"
                size="xs"
                color="cyan"
              />
            </Paper>

            <Paper p="sm" radius="md" withBorder>
              <Text fw={700} size="xs" c="dimmed" mb={4} tt="uppercase">Categoría</Text>
              <Stack gap={2}>
                <SegmentedControl
                  fullWidth
                  disabled={tipoServicio === 'pallet'}
                  value={categoria}
                  onChange={setCategoria}
                  data={['Chico', 'Mediano', 'Grande']}
                  radius="md"
                  size="xs"
                  color="indigo"
                />
                <Text size="10px" c="dimmed" ta="center" lh={1}>
                  {tipoServicio === 'paqueteria' ? CATEGORY_LIMITS[categoria] : "Carga industrial"}
                </Text>
              </Stack>
            </Paper>

            <Paper p="sm" radius="md" withBorder>
              <Text fw={700} size="xs" c="dimmed" mb={4} tt="uppercase">Tipo de Entrega</Text>
              <Stack gap={2}>
                <SegmentedControl
                  fullWidth
                  value={modalidad}
                  onChange={setModalidad}
                  data={[
                    { label: 'A Domicilio', value: 'domicilio' },
                    { label: 'A Sucursal', value: 'sucursal' },
                  ]}
                  disabled={!sucursalHabilitada}
                  radius="md"
                  size="xs"
                  color="indigo"
                />
                {!sucursalHabilitada && tipoServicio === 'paqueteria' && (
                  <Text size="9px" c="red.6" ta="center" lh={1}>
                    Solo en CBA, Río IV o V. María
                  </Text>
                )}
              </Stack>
            </Paper>

            <Paper p="sm" radius="md" withBorder>
              <Text fw={700} size="xs" c="dimmed" mb={4} tt="uppercase">Valor Declarado (ARS)</Text>
              <NumberInput
                value={valorDeclarado}
                onChange={setValorDeclarado}
                min={3000}
                step={1000}
                radius="md"
                size="xs"
                prefix="$ "
                thousandSeparator="."
                decimalSeparator=","
              />
            </Paper>
          </SimpleGrid>

          {/* INFO BANNER */}
          <Paper p={rem(6)} radius="sm" style={{ backgroundColor: 'rgba(242,182,50,0.05)', border: '1px solid rgba(242,182,50,0.15)' }}>
            <Text size="xs" ta="center" fw={600} c="orange.9">
              Tarifa unitaria reducida para múltiples bultos en un único despacho.
            </Text>
          </Paper>

          {/* RESULT SECTION */}
          {calculation ? (
            <Card p="lg" radius="lg" withBorder shadow="sm" style={{
              background: 'white',
              borderTop: `${rem(4)} solid var(--mantine-color-cyan-6)`
            }}>
              <Grid align="center" gutter="xl">
                <Grid.Col span={{ base: 12, md: 7 }}>
                  <Stack gap="lg">
                    <Group gap="xs">
                      <ThemeIcon variant="light" color="cyan" size="lg" radius="md">
                        <ClipboardCheck size={20} />
                      </ThemeIcon>
                      <Title order={2} fw={900} size="h3">Resumen de Cotización</Title>
                    </Group>

                    <SimpleGrid cols={3} gap="sm">
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">Precio Base</Text>
                        <Text fw={700} size="md">{fmtMoney(calculation.basePrice)}</Text>
                      </Stack>
                      <Stack gap={0}>
                        <Group gap={4}>
                          <Text size="xs" c="dimmed" fw={700} tt="uppercase">Protección</Text>
                          <Tooltip label="1% del valor declarado">
                            <Info size={12} color="gray" />
                          </Tooltip>
                        </Group>
                        <Text fw={700} size="md">{fmtMoney(calculation.proteccion)}</Text>
                      </Stack>
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700} tt="uppercase">IVA (21%)</Text>
                        <Text fw={700} size="md">{fmtMoney(calculation.iva)}</Text>
                      </Stack>
                    </SimpleGrid>

                    <Paper p="xs" radius="md" bg="gray.0" withBorder>
                      <Group gap="xs" wrap="nowrap">
                        <Map size={14} color="gray" />
                        <Text size="xs" c="gray.7">
                          Envío {modalidad} desde <b>{originLoc?.name}</b> hacia <b>{destLoc?.name}</b>.
                        </Text>
                      </Group>
                    </Paper>
                  </Stack>
                </Grid.Col>

                <Grid.Col span={{ base: 12, md: 5 }}>
                  <Paper
                    p="xl"
                    radius="lg"
                    ta="center"
                    style={{
                      background: 'linear-gradient(135deg, var(--mantine-color-cyan-0) 0%, #ffffff 100%)',
                      border: '1px solid var(--mantine-color-cyan-1)',
                    }}
                  >
                    <Text size="xs" fw={800} tt="uppercase" c="cyan.9" mb={2}>Total Final con IVA</Text>
                    <Title order={1} style={{ fontSize: rem(42), letterSpacing: '-2px' }} variant="gradient" gradient={{ from: 'cyan.7', to: 'indigo.8' }}>
                      {fmtMoney(calculation.total)}
                    </Title>
                    <Text size="xs" c="dimmed" mb="lg">Pesos Argentinos</Text>

                    <Button
                      fullWidth
                      size="md"
                      radius="md"
                      color="cyan"
                      variant="filled"
                      shadow="xs"
                      leftSection={copied ? <ShieldCheck size={18} /> : <ClipboardCheck size={18} />}
                      onClick={handleCopy}
                    >
                      {copied ? '¡Copiado!' : 'Copiar resumen cotización'}
                    </Button>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Card>
          ) : (
            <Paper p={rem(40)} radius="lg" withBorder style={{ borderStyle: 'dashed', backgroundColor: '#fafbfc' }}>
              <Stack align="center" gap="xs">
                <ThemeIcon size={48} radius="xl" color="gray.2" variant="light">
                  <Calculator size={24} color="gray" />
                </ThemeIcon>
                <Text fw={700} size="sm" c="gray.6">Complete origen y destino para cotizar</Text>
              </Stack>
            </Paper>
          )}

          {/* SECURITY TRUST */}
          <Group justify="center" gap="xl">
            <Group gap="xs">
              <ShieldCheck size={14} color="var(--mantine-color-teal-6)" />
              <Text size="10px" fw={600} c="dimmed">Seguro Integrado</Text>
            </Group>
            <Group gap="xs">
              <TrendingUp size={14} color="var(--mantine-color-indigo-6)" />
              <Text size="10px" fw={600} c="dimmed">Seguimiento Real-Time</Text>
            </Group>
            <Group gap="xs">
              <Zap size={14} color="var(--mantine-color-orange-6)" />
              <Text size="10px" fw={600} c="dimmed">Envíos Prioritarios</Text>
            </Group>
          </Group>
        </Stack>
      </Container>
    </Box>
  );
};

export default CotizadorCordobaPage;

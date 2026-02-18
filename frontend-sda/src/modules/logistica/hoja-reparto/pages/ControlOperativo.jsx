import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Container, Paper, Title, Table, Group, TextInput, Pagination,
    Text, ActionIcon, Tooltip, Badge, ScrollArea, LoadingOverlay,
    ActionIcon as MantineActionIcon, Select, Button, Stack, Divider,
    SimpleGrid, Card, RingProgress, Center, ThemeIcon, Tabs, Box
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
    Search, FileText, Eye, Truck, User, Calendar, RefreshCcw,
    CheckCircle2, AlertCircle, XCircle, Plus, FilterX, Play, Zap, Clock, ListTodo,
    Smartphone, BookOpen, FileDown
} from "lucide-react";
import clienteAxios from "../../../../core/api/clienteAxios";
import { mostrarAlerta } from "../../../../core/utils/alertaGlobal.jsx";
import '@mantine/dates/styles.css';
import 'dayjs/locale/es';

const ControlOperativo = () => {
    const [hojas, setHojas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [proveedores, setProveedores] = useState([]);
    const navigate = useNavigate();

    // Filtros
    const [filtroNumero, setFiltroNumero] = useState("");
    const [filtroProveedor, setFiltroProveedor] = useState(null);

    // Sistema de Tabs "Nivel Dios"
    const [tabTemporal, setTabTemporal] = useState('hoy'); // 'ayer' | 'hoy' | 'custom'

    // Lógica Nivel Dios: Ayer y Hoy por defecto para facilitar auditoría
    const getAyerHoy = () => {
        const hoy = new Date();
        const ayer = new Date();
        ayer.setDate(hoy.getDate() - 1);
        ayer.setHours(0, 0, 0, 0);
        hoy.setHours(23, 59, 59, 999);
        return { ayer, hoy };
    };

    const { ayer, hoy } = getAyerHoy();
    const [filtroDesde, setFiltroDesde] = useState(() => {
        const h = new Date();
        h.setHours(0, 0, 0, 0);
        return h;
    });
    const [filtroHasta, setFiltroHasta] = useState(() => {
        const h = new Date();
        h.setHours(23, 59, 59, 999);
        return h;
    });

    // Pagination
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [limite] = useState(15);
    const [totalItems, setTotalItems] = useState(0);

    // Helper: Verificar si el usuario es admin/administrativo
    const esAdmin = () => {
        const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');
        return usuario.rol === 'admin' || usuario.rol === 'administrativo';
    };

    // Recursos para Quick Edit
    const [choferesList, setChoferesList] = useState([]);
    const [vehiculosList, setVehiculosList] = useState([]);

    // Métricas
    const [stats, setStats] = useState({
        total: 0,
        pendientes: 0,
        discrepancias: 0,
        verdes: 0
    });

    const obtenerRecursos = async () => {
        try {
            const [resChoferes, resVehiculos, resProveedores] = await Promise.all([
                clienteAxios.get("/choferes/solo-nombres"),
                clienteAxios.get("/vehiculos"),
                clienteAxios.get("/proveedores")
            ]);

            setChoferesList((resChoferes.data || []).map(c => ({
                value: c._id,
                label: c.usuario?.nombre || `DNI: ${c.dni || '?'}`
            })));

            setVehiculosList((resVehiculos.data || []).map(v => ({
                value: v._id,
                label: `${v.patente} (${v.marca} ${v.modelo})`
            })));

            setProveedores(resProveedores.data.map(p => ({ value: p._id, label: p.razonSocial })));
        } catch (error) {
            console.error("Error al obtener recursos:", error);
        }
    };

    const calcularStats = (items) => {
        const pendientes = items.filter(h => h.estado === 'pendiente').length;
        const total = items.length;
        let discrepancias = 0;
        let verdes = 0;

        items.forEach(h => {
            // Normalizar IDs a strings para comparación confiable
            const planChoferId = (h.ruta?.choferAsignado?._id || h.ruta?.choferAsignado)?.toString();
            const planVehiculoId = (h.ruta?.vehiculoAsignado?._id || h.ruta?.vehiculoAsignado)?.toString();
            const realChoferId = (h.chofer?._id || h.chofer)?.toString();
            const realVehiculoId = (h.vehiculo?._id || h.vehiculo)?.toString();

            const choferCambio = planChoferId && realChoferId && planChoferId !== realChoferId;
            const vehiculoCambio = planVehiculoId && realVehiculoId && planVehiculoId !== realVehiculoId;

            // Solo contar hojas que NO estén pendientes
            if (h.estado !== 'pendiente') {
                if (choferCambio || vehiculoCambio) {
                    discrepancias++;
                } else {
                    verdes++;
                }
            }
        });

        setStats({ total, pendientes, discrepancias, verdes });
    };

    const obtenerHojas = async () => {
        setCargando(true);
        try {
            const params = new URLSearchParams();
            params.append("pagina", paginaActual - 1);
            params.append("limite", limite);
            params.append("estado", "all");

            if (filtroDesde) {
                const d = new Date(filtroDesde);
                d.setHours(0, 0, 0, 0);
                params.append("desde", d.toISOString());
            }
            if (filtroHasta) {
                const h = new Date(filtroHasta);
                h.setHours(23, 59, 59, 999);
                params.append("hasta", h.toISOString());
            }

            if (filtroNumero) params.append("busqueda", filtroNumero);
            if (filtroProveedor) params.append("proveedorId", filtroProveedor);

            const res = await clienteAxios.get(`/hojas-reparto/paginado?${params.toString()}`);

            // Filtrar también por código de ruta en cliente
            let hojasFiltradas = res.data.hojas || [];
            if (filtroNumero && filtroNumero.trim()) {
                const busqueda = filtroNumero.toLowerCase().trim();
                hojasFiltradas = hojasFiltradas.filter(h => {
                    const numeroMatch = h.numeroHoja?.toLowerCase().includes(busqueda);
                    const rutaMatch = h.ruta?.codigo?.toLowerCase().includes(busqueda);
                    return numeroMatch || rutaMatch;
                });
            }

            setHojas(hojasFiltradas);
            setTotalPaginas(Math.ceil(res.data.total / limite)); // Usar total del servidor
            setTotalItems(res.data.total); // Total del servidor
            calcularStats(hojasFiltradas);
        } catch (error) {
            console.error("Error al obtener control operativo:", error);
            mostrarAlerta("Error al cargar control operativo", "error");
        } finally {
            setCargando(false);
        }
    };

    const actualizarRecurso = async (hojaId, campo, valor) => {
        try {
            await clienteAxios.put(`/hojas-reparto/${hojaId}`, { [campo]: valor });
            mostrarAlerta("✅ Datos actualizados correctamente", "success");
            await obtenerHojas(); // Await para asegurar que se recarguen las métricas
        } catch (error) {
            console.error("Error al actualizar recurso:", error);
            const mensaje = error.response?.status === 403
                ? "No tienes permisos para editar hojas cerradas"
                : "Error al actualizar";
            mostrarAlerta(mensaje, "error");
        }
    };

    // Función para cambiar tabs y ajustar fechas automáticamente
    const cambiarTab = (tab) => {
        setTabTemporal(tab);
        if (tab === 'ayer') {
            const ayer = new Date();
            ayer.setDate(ayer.getDate() - 1);
            ayer.setHours(0, 0, 0, 0);
            const ayerFin = new Date(ayer);
            ayerFin.setHours(23, 59, 59, 999);
            setFiltroDesde(ayer);
            setFiltroHasta(ayerFin);
        } else if (tab === 'hoy') {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const hoyFin = new Date();
            hoyFin.setHours(23, 59, 59, 999);
            setFiltroDesde(hoy);
            setFiltroHasta(hoyFin);
        }
        // Si es 'custom', no hacer nada (el usuario manejará los DatePicker)
    };

    const descargarPDF = async (hojaId, numeroHoja) => {
        try {
            const res = await clienteAxios.get(`/hojas-reparto/exportar/${hojaId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `HR-${numeroHoja || 'sin-numero'}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error("Error al descargar PDF:", error);
            mostrarAlerta("Error al generar el PDF", "error");
        }
    };

    const limpiarFiltros = () => {
        setFiltroNumero("");
        setFiltroProveedor(null);
        setFiltroDesde(null);
        setFiltroHasta(null);
        setAuditMode(false);
        setPaginaActual(1);
    };

    const cerrarHoja = async (hojaId) => {
        try {
            const confirm = window.confirm("¿Está seguro de forzar el cierre de esta hoja? Los envíos no entregados quedarán como reagendados.");
            if (!confirm) return;

            await clienteAxios.post('/hojas-reparto/forzar-cierre', { hojaId });
            mostrarAlerta("Hoja cerrada correctamente", "success");
            obtenerHojas();
        } catch (error) {
            console.error("Error al cerrar hoja:", error);
            mostrarAlerta("Error al cerrar la hoja", "error");
        }
    };

    // FASE 7: Descargar reporte mensual de discrepancias
    const descargarReporteMensual = async () => {
        try {
            const hoy = new Date();
            const mes = hoy.getMonth() + 1; // 1-12
            const anio = hoy.getFullYear();

            const response = await clienteAxios.get(`/hojas-reparto/reporte-discrepancias`, {
                params: { mes, anio }
            });

            const { discrepancias } = response.data;

            if (discrepancias.length === 0) {
                mostrarAlerta("No hay discrepancias este mes", "info");
                return;
            }

            // Generar CSV
            const headers = ['Fecha', 'Nº Hoja', 'Ruta', 'Chofer Plan', 'Chofer Real', 'Vehículo Plan', 'Vehículo Real'];
            const rows = discrepancias.map(d => [
                new Date(d.fecha).toLocaleDateString('es-AR'),
                d.numeroHoja,
                d.ruta || 'N/A',
                d.choferPlan || 'N/A',
                d.choferReal || 'N/A',
                d.vehiculoPlan || 'N/A',
                d.vehiculoReal || 'N/A'
            ]);

            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Descargar archivo
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `reporte_discrepancias_${mes}_${anio}.csv`;
            link.click();

            mostrarAlerta(`Reporte descargado: ${discrepancias.length} discrepancias`, "success");
        } catch (error) {
            console.error("Error al descargar reporte:", error);
            mostrarAlerta("Error al generar el reporte", "error");
        }
    };

    useEffect(() => {
        obtenerHojas();
        obtenerRecursos();
    }, [paginaActual, filtroNumero, filtroProveedor, filtroDesde, filtroHasta]);

    const renderAuditStatus = (hoja) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaHoja = new Date(hoja.fecha);
        fechaHoja.setHours(0, 0, 0, 0);

        if (hoja.estado === "pendiente" && fechaHoja < hoy) {
            return (
                <Tooltip label="Viaje vencido y no iniciado" withArrow>
                    <Badge color="red.7" variant="filled" leftSection={<XCircle size={14} />}>
                        VENCIDO
                    </Badge>
                </Tooltip>
            );
        }

        if (hoja.estado === "pendiente") {
            return (
                <Tooltip label="Esperando inicio de viaje" withArrow>
                    <Badge color="gray.5" variant="light" leftSection={<Clock size={14} />}>
                        PLANIFICADO
                    </Badge>
                </Tooltip>
            );
        }

        const planChoferId = hoja.ruta?.choferAsignado?._id || hoja.ruta?.choferAsignado;
        const planVehiculoId = hoja.ruta?.vehiculoAsignado?._id || hoja.ruta?.vehiculoAsignado;

        const choferCambio = (hoja.chofer?._id || hoja.chofer) !== planChoferId;
        const vehiculoCambio = (hoja.vehiculo?._id || hoja.vehiculo) !== planVehiculoId;

        if (choferCambio || vehiculoCambio) {
            const motivo = choferCambio && vehiculoCambio ? "Chofer y Vehículo cambiados" : (choferCambio ? "Chofer cambiado" : "Vehículo cambiado");
            return (
                <Tooltip label={motivo} withArrow color="orange">
                    <Badge color="orange.8" variant="filled" leftSection={<AlertCircle size={14} />}>
                        DISCREPANCIA
                    </Badge>
                </Tooltip>
            );
        }

        const esMobile = !!hoja.chofer?.usuario;

        return (
            <Tooltip label={esMobile ? "Operación Mobile verificada" : "Operación Manual (Revisar datos)"} withArrow>
                <Badge color={esMobile ? "green.7" : "cyan.6"} variant={esMobile ? "filled" : "outline"} leftSection={esMobile ? <CheckCircle2 size={14} /> : <Eye size={14} />}>
                    {esMobile ? "OK" : "AUDITAR"}
                </Badge>
            </Tooltip>
        );
    };


    return (
        <Container size="xl" py="xl">
            {/* God Level Header */}
            <Paper p="xl" radius="lg" shadow="md" withBorder mb="xl" style={{
                background: 'linear-gradient(135deg, #0b7285 0%, #0c8599 100%)',
                color: 'white',
                border: 'none'
            }}>
                <Group justify="space-between">
                    <Stack gap={0}>
                        <Group gap="xs">
                            <Zap size={28} fill="white" />
                            <Title order={1} fw={900} style={{ letterSpacing: '-1px' }}>
                                CONTROL OPERATIVO DIARIO
                            </Title>
                        </Group>
                        <Text fw={500} opacity={0.9}>Consola de Auditoría y Generación Automática "God Level"</Text>
                    </Stack>
                    <Group>
                        <Button
                            variant="filled"
                            color="orange.6"
                            leftSection={<Plus size={18} />}
                            radius="md"
                            onClick={() => navigate('/hojas-reparto/crear')}
                        >
                            Hoja Especial
                        </Button>
                    </Group>
                </Group>
            </Paper>

            {/* Metrics Dashboard */}
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
                <Card shadow="sm" radius="md" withBorder padding="lg">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">Total Rutas</Text>
                            <Text size="xl" fw={900}>{totalItems}</Text>
                        </div>
                        <ThemeIcon color="cyan" variant="light" size="xl" radius="md">
                            <ListTodo size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>

                <Card shadow="sm" radius="md" withBorder padding="lg">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">En Planificación</Text>
                            <Text size="xl" fw={900} c="blue.6">{stats.pendientes}</Text>
                        </div>
                        <ThemeIcon color="blue" variant="light" size="xl" radius="md">
                            <Clock size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>

                <Card shadow="sm" radius="md" withBorder padding="lg">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">Discrepancias</Text>
                            <Text size="xl" fw={900} c="orange.7">{stats.discrepancias}</Text>
                        </div>
                        <ThemeIcon color="orange" variant="light" size="xl" radius="md">
                            <AlertCircle size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>

                <Card shadow="sm" radius="md" withBorder padding="lg">
                    <Group justify="space-between">
                        <div>
                            <Text size="xs" color="dimmed" fw={700} tt="uppercase">Operación OK</Text>
                            <Text size="xl" fw={900} c="green.7">{stats.verdes}</Text>
                        </div>
                        <ThemeIcon color="green" variant="light" size="xl" radius="md">
                            <CheckCircle2 size={24} />
                        </ThemeIcon>
                    </Group>
                </Card>
            </SimpleGrid>

            {/* Main Table Paper */}
            <Paper p="md" radius="md" shadow="sm" withBorder>
                {/* Sistema de Tabs */}
                <Tabs value={tabTemporal} onChange={cambiarTab} mb="lg" variant="pills" radius="md">
                    <Tabs.List grow>
                        <Tabs.Tab value="ayer" leftSection={<Calendar size={16} />}>
                            Ayer
                        </Tabs.Tab>
                        <Tabs.Tab value="hoy" leftSection={<Calendar size={16} />}>
                            Hoy
                        </Tabs.Tab>
                        <Tabs.Tab value="custom" leftSection={<FilterX size={16} />}>
                            Rango Personalizado
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs>

                <Group mb="xl" align="flex-end" justify="space-between">
                    <Group align="flex-end">
                        <TextInput
                            placeholder="N° Hoja o Ruta..."
                            label="Buscar"
                            leftSection={<Search size={16} />}
                            value={filtroNumero}
                            onChange={(e) => setFiltroNumero(e.target.value)}
                            radius="md"
                            w={180}
                        />
                        <Select
                            label="Proveedor"
                            placeholder="Seleccionar..."
                            data={proveedores}
                            value={filtroProveedor}
                            onChange={setFiltroProveedor}
                            clearable
                            w={220}
                            radius="md"
                            searchable
                        />
                        {tabTemporal === 'custom' && (
                            <>
                                <DatePickerInput
                                    label="Desde"
                                    placeholder="Elegir fecha"
                                    value={filtroDesde}
                                    onChange={setFiltroDesde}
                                    clearable
                                    radius="md"
                                    w={150}
                                    locale="es"
                                    valueFormat="DD/MM/YYYY"
                                />
                                <DatePickerInput
                                    label="Hasta"
                                    placeholder="Elegir fecha"
                                    value={filtroHasta}
                                    onChange={setFiltroHasta}
                                    clearable
                                    radius="md"
                                    w={150}
                                    locale="es"
                                    valueFormat="DD/MM/YYYY"
                                />
                            </>
                        )}
                        {(filtroNumero || filtroProveedor) && (
                            <ActionIcon variant="light" color="red" onClick={limpiarFiltros} size="lg" radius="md">
                                <FilterX size={20} />
                            </ActionIcon>
                        )}
                    </Group>
                    <Group>
                        <Tooltip label="Descargar Reporte Mensual (CSV)">
                            <MantineActionIcon
                                variant="light"
                                color="green"
                                size="xl"
                                radius="md"
                                onClick={descargarReporteMensual}
                            >
                                <FileDown size={20} />
                            </MantineActionIcon>
                        </Tooltip>
                        <Tooltip label="Refrescar Datos">
                            <MantineActionIcon variant="light" color="cyan" size="xl" radius="md" onClick={obtenerHojas}>
                                <RefreshCcw size={20} />
                            </MantineActionIcon>
                        </Tooltip>
                    </Group>
                </Group>

                <ScrollArea h={600} onScrollPositionChange={({ y }) => { }}>
                    <LoadingOverlay visible={cargando} overlayProps={{ blur: 2 }} />
                    <Table verticalSpacing="sm" horizontalSpacing="md" stickyHeader>
                        <Table.Thead style={{ backgroundColor: '#f8f9fa' }}>
                            <Table.Tr>
                                <Table.Th w={30}></Table.Th>
                                <Table.Th>Hoja / Ruta</Table.Th>
                                <Table.Th>Fecha</Table.Th>
                                <Table.Th>Chofer</Table.Th>
                                <Table.Th>Vehículo</Table.Th>
                                <Table.Th>Envíos</Table.Th>
                                <Table.Th ta="center">Estado</Table.Th>
                                <Table.Th ta="right">Acciones</Table.Th>
                            </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                            {hojas.length > 0 ? (
                                hojas.map((hoja) => {
                                    const planChofer = hoja.ruta?.choferAsignado?.usuario?.nombre || hoja.ruta?.choferAsignado?.dni || "S/P";
                                    const planVehiculo = hoja.ruta?.vehiculoAsignado?.patente || "S/P";

                                    // Normalizar IDs a strings (igual que en calcularStats)
                                    const planChoferId = (hoja.ruta?.choferAsignado?._id || hoja.ruta?.choferAsignado)?.toString();
                                    const planVehiculoId = (hoja.ruta?.vehiculoAsignado?._id || hoja.ruta?.vehiculoAsignado)?.toString();
                                    const realChoferId = (hoja.chofer?._id || hoja.chofer)?.toString();
                                    const realVehiculoId = (hoja.vehiculo?._id || hoja.vehiculo)?.toString();

                                    const choferCambio = planChoferId && realChoferId && planChoferId !== realChoferId;
                                    const vehiculoCambio = planVehiculoId && realVehiculoId && planVehiculoId !== realVehiculoId;
                                    const tieneDiscrepancia = hoja.estado !== 'pendiente' && (choferCambio || vehiculoCambio);

                                    // Colores Semánticos de Fila
                                    let rowBg = 'transparent';
                                    if (hoja.estado === 'en reparto' || hoja.estado === 'cerrada') {
                                        rowBg = tieneDiscrepancia ? '#fff9db' : '#ebfbee'; // Naranja suave vs Verde suave
                                    }

                                    return (
                                        <Table.Tr
                                            key={hoja._id}
                                            style={{
                                                transition: 'background 0.2s',
                                                backgroundColor: rowBg,
                                                '&:hover': { background: tieneDiscrepancia ? '#fff3bf' : '#d3f9d8' }
                                            }}
                                        >
                                            <Table.Td>
                                                <Center>
                                                    <Box
                                                        w={12}
                                                        h={12}
                                                        style={{
                                                            borderRadius: '50%',
                                                            backgroundColor:
                                                                hoja.estado === 'pendiente' ? '#e0e0e0' :
                                                                    tieneDiscrepancia ? '#ff9800' :
                                                                        '#4caf50',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                    />
                                                </Center>
                                            </Table.Td>
                                            <Table.Td>
                                                <Stack gap={2}>
                                                    <Text size="xs" c="cyan.9" fw={800} tt="uppercase">{hoja.ruta?.codigo || "ESPECIAL"}</Text>
                                                    <Group gap={6} align="center">
                                                        {hoja.ruta?.horaSalida && (
                                                            <Text size="10px" c="dimmed" fw={500}>
                                                                {hoja.ruta.horaSalida}
                                                            </Text>
                                                        )}
                                                        {hoja.chofer?.usuario ? (
                                                            <Tooltip label="App Mobile (Empleado)" withArrow color="indigo">
                                                                <ThemeIcon size="xs" color="indigo" variant="light" radius="xl">
                                                                    <Smartphone size={10} />
                                                                </ThemeIcon>
                                                            </Tooltip>
                                                        ) : (
                                                            <Tooltip label="Registro Manual (Externo)" withArrow color="gray">
                                                                <ThemeIcon size="xs" color="gray" variant="outline" radius="xl">
                                                                    <BookOpen size={10} />
                                                                </ThemeIcon>
                                                            </Tooltip>
                                                        )}
                                                    </Group>
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap="xs">
                                                    <Calendar size={14} color="gray" />
                                                    <Text size="sm" fw={500}>{new Date(hoja.fecha).toLocaleDateString()}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td>
                                                <Stack gap={0}>
                                                    <Select
                                                        data={choferesList}
                                                        value={hoja.chofer?._id || hoja.chofer || null}
                                                        onChange={(val) => actualizarRecurso(hoja._id, "chofer", val)}
                                                        size="xs"
                                                        variant="filled"
                                                        radius="sm"
                                                        searchable
                                                        placeholder="S/ Chofer"
                                                        styles={{ input: { fontWeight: 600, fontSize: '11px', backgroundColor: choferCambio ? 'rgba(255, 146, 0, 0.1)' : 'transparent' } }}
                                                        disabled={hoja.estado === 'cerrada' && !esAdmin()}
                                                    />
                                                    {choferCambio && (
                                                        <Text size="10px" c="orange.9" fw={700} style={{ marginTop: 2 }}>
                                                            PLAN: {planChofer}
                                                        </Text>
                                                    )}
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Stack gap={0}>
                                                    <Select
                                                        data={vehiculosList}
                                                        value={hoja.vehiculo?._id || hoja.vehiculo || null}
                                                        onChange={(val) => actualizarRecurso(hoja._id, "vehiculo", val)}
                                                        size="xs"
                                                        variant="filled"
                                                        radius="sm"
                                                        ff="monospace"
                                                        searchable
                                                        placeholder="S/ Vehículo"
                                                        styles={{ input: { fontWeight: 600, fontSize: '11px', backgroundColor: vehiculoCambio ? 'rgba(255, 146, 0, 0.1)' : 'transparent' } }}
                                                        disabled={hoja.estado === 'cerrada' && !esAdmin()}
                                                    />
                                                    {vehiculoCambio && (
                                                        <Text size="10px" c="orange.9" fw={700} style={{ marginTop: 2 }}>
                                                            PLAN: {planVehiculo}
                                                        </Text>
                                                    )}
                                                </Stack>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group gap={4} align="center">
                                                    <ListTodo size={14} color="gray" />
                                                    <Text size="sm" fw={600}>{hoja.envios?.length || 0}</Text>
                                                </Group>
                                            </Table.Td>
                                            <Table.Td ta="center">
                                                <Badge
                                                    variant="dot"
                                                    color={hoja.estado === 'cerrada' ? 'green' : hoja.estado === 'en reparto' ? 'blue' : 'gray'}
                                                    size="sm"
                                                    styles={{ root: { backgroundColor: 'white' } }}
                                                >
                                                    {hoja.estado?.toUpperCase()}
                                                </Badge>
                                            </Table.Td>
                                            <Table.Td>
                                                <Group justify="flex-end" gap={4}>
                                                    <Tooltip label="Ver Detalle">
                                                        <ActionIcon variant="light" color="cyan" onClick={() => navigate(`/hojas-reparto/${hoja._id}`)}>
                                                            <Eye size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    <Tooltip label="Exportar PDF">
                                                        <ActionIcon variant="light" color="red" onClick={() => descargarPDF(hoja._id, hoja.numeroHoja)}>
                                                            <FileText size={18} />
                                                        </ActionIcon>
                                                    </Tooltip>
                                                    {hoja.estado === 'en reparto' && (
                                                        <Tooltip label="Cierre Forzado">
                                                            <ActionIcon variant="light" color="orange" onClick={() => cerrarHoja(hoja._id)}>
                                                                <XCircle size={18} />
                                                            </ActionIcon>
                                                        </Tooltip>
                                                    )}
                                                </Group>
                                            </Table.Td>
                                        </Table.Tr>
                                    );
                                })
                            ) : (
                                <Table.Tr>
                                    <Table.Td colSpan={7}>
                                        <Text ta="center" py="50px" c="dimmed" fw={500}>
                                            No se encontró actividad para los criterios seleccionados. <br />
                                            <Text size="xs" component="span">Probá disparando el motor manual si no hay rutas hoy.</Text>
                                        </Text>
                                    </Table.Td>
                                </Table.Tr>
                            )}
                        </Table.Tbody>
                    </Table>
                </ScrollArea>

                <Divider my="md" />

                <Group justify="space-between">
                    <Text size="xs" c="dimmed">Mostrando {hojas.length} de {totalItems} registros</Text>
                    {totalPaginas > 1 && (
                        <Pagination total={totalPaginas} value={paginaActual} onChange={setPaginaActual} color="cyan" radius="md" size="sm" />
                    )}
                </Group>
            </Paper>
        </Container>
    );
};

export default ControlOperativo;

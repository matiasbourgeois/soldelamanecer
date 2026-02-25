import React, { useState } from 'react';
import {
    Container,
    Paper,
    Title,
    Text,
    Grid,
    Card,
    Group,
    Button,
    ThemeIcon,
    Badge,
    Box,
} from '@mantine/core';
import { FileSpreadsheet, Users, GitMerge } from 'lucide-react';
import { apiSistema } from '../../../../core/api/apiSistema';
import { mostrarAlerta } from '../../../../core/utils/alertaGlobal.jsx';

const ReportesLogistica = () => {
    const [loadingExcel, setLoadingExcel] = useState(false);
    const [loadingExcelChoferes, setLoadingExcelChoferes] = useState(false);
    const [loadingConsolidado, setLoadingConsolidado] = useState(false);

    const exportarExcelRutas = async () => {
        setLoadingExcel(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiSistema('/rutas/excel'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Error al descargar");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Reporte_Rutas_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            mostrarAlerta("✅ Excel exportado exitosamente", "success");
        } catch (error) {
            console.error("Error al exportar:", error);
            mostrarAlerta("❌ No se pudo exportar el Excel", "danger");
        } finally {
            setLoadingExcel(false);
        }
    };

    const exportarExcelChoferes = async () => {
        setLoadingExcelChoferes(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiSistema('/choferes/excel'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Error al descargar");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Padron_Choferes_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            mostrarAlerta("✅ Excel de choferes exportado exitosamente", "success");
        } catch (error) {
            console.error("Error al exportar choferes:", error);
            mostrarAlerta("❌ No se pudo exportar el Excel de choferes", "danger");
        } finally {
            setLoadingExcelChoferes(false);
        }
    };

    const exportarConsolidado = async () => {
        setLoadingConsolidado(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(apiSistema('/rutas/excel-consolidado'), {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Error al descargar");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Padron_Operativo_Consolidado_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            mostrarAlerta("✅ Padrón Consolidado exportado", "success");
        } catch (error) {
            console.error("Error al exportar consolidado:", error);
            mostrarAlerta("❌ No se pudo exportar el Consolidado", "danger");
        } finally {
            setLoadingConsolidado(false);
        }
    };

    return (
        <Container size="xl" py="md">
            <Paper p="md" radius="md" shadow="sm" withBorder mb="lg">
                <Group justify="space-between" mb="sm">
                    <Title order={2} fw={700} c="dimmed">
                        Reportes de Logística y Rutas
                    </Title>
                </Group>
                <Text c="dimmed" size="sm" mb="xl">
                    Centro de descargas y métricas operativas. Desde aquí podés extraer los padrones y resúmenes de distribución del sistema.
                </Text>

                <Grid gutter="lg">
                    {/* Card: Exportar Padrón de Rutas */}
                    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                            <Card.Section withBorder inheritPadding py="xs">
                                <Group justify="space-between">
                                    <Text fw={600} size="md">Padrón Maestro de Rutas</Text>
                                    <ThemeIcon color="green" variant="light" size="lg" radius="md">
                                        <FileSpreadsheet size={20} />
                                    </ThemeIcon>
                                </Group>
                            </Card.Section>

                            <Text size="sm" c="dimmed" mt="sm">
                                Descarga un archivo Excel detallado con todas las Rutas del sistema. Incluye código, horarios, frecuencias asignadas, descripción y los vehículos/choferes vinculados.
                            </Text>

                            <Box mt="auto">
                                <Group mt="md" gap="xs">
                                    <Badge color="blue" variant="dot">Operativo</Badge>
                                    <Badge color="gray" variant="outline">XLSX</Badge>
                                </Group>

                                <Button
                                    fullWidth
                                    color="green"
                                    mt="lg"
                                    variant="filled"
                                    leftSection={<FileSpreadsheet size={16} />}
                                    onClick={exportarExcelRutas}
                                    loading={loadingExcel}
                                >
                                    Generar Reporte Excel
                                </Button>
                            </Box>
                        </Card>
                    </Grid.Col>

                    {/* Card: Exportar Padrón de Choferes */}
                    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                            <Card.Section withBorder inheritPadding py="xs">
                                <Group justify="space-between">
                                    <Text fw={600} size="md">Padrón de Choferes</Text>
                                    <ThemeIcon color="cyan" variant="light" size="lg" radius="md">
                                        <Users size={20} />
                                    </ThemeIcon>
                                </Group>
                            </Card.Section>

                            <Text size="sm" c="dimmed" mt="sm">
                                Base de datos completa del plantel de Choferes. Incluye DNI, CUIT, teléfonos de contacto, tipo de vínculo comercial y su estado de actividad actual.
                            </Text>

                            <Box mt="auto">
                                <Group mt="md" gap="xs">
                                    <Badge color="blue" variant="dot">RRHH</Badge>
                                    <Badge color="gray" variant="outline">XLSX</Badge>
                                </Group>

                                <Button
                                    fullWidth
                                    color="cyan"
                                    mt="lg"
                                    variant="filled"
                                    leftSection={<FileSpreadsheet size={16} />}
                                    onClick={exportarExcelChoferes}
                                    loading={loadingExcelChoferes}
                                >
                                    Generar Padrón
                                </Button>
                            </Box>
                        </Card>
                    </Grid.Col>

                    {/* Card: Exportar Padrón Consolidado */}
                    <Grid.Col span={{ base: 12, md: 6, lg: 4 }}>
                        <Card shadow="sm" padding="lg" radius="md" bg="var(--mantine-color-grape-0)" withBorder h="100%" style={{ display: 'flex', flexDirection: 'column' }}>
                            <Card.Section withBorder inheritPadding py="xs">
                                <Group justify="space-between">
                                    <Text fw={600} size="md" c="grape.9">Operativo Consolidado</Text>
                                    <ThemeIcon color="grape" variant="filled" size="lg" radius="md">
                                        <GitMerge size={20} />
                                    </ThemeIcon>
                                </Group>
                            </Card.Section>

                            <Text size="sm" c="dimmed" mt="sm">
                                El reporte definitivo. Cruza todas las Rutas Operativas con los Legajos de los Choferes asignados incluyendo su identidad y situación fiscal (CUIT/DNI).
                            </Text>

                            <Box mt="auto">
                                <Group mt="md" gap="xs">
                                    <Badge color="grape" variant="dot">Gerencia</Badge>
                                    <Badge color="gray" variant="outline">XLSX</Badge>
                                </Group>

                                <Button
                                    fullWidth
                                    color="grape"
                                    mt="lg"
                                    variant="filled"
                                    leftSection={<FileSpreadsheet size={16} />}
                                    onClick={exportarConsolidado}
                                    loading={loadingConsolidado}
                                >
                                    Descargar Consolidado
                                </Button>
                            </Box>
                        </Card>
                    </Grid.Col>

                </Grid>
            </Paper>
        </Container>
    );
};

export default ReportesLogistica;

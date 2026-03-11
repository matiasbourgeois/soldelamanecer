import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { IconButton } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { calcularAlertasMantenimiento } from '../components/home/MantenimientoAlertBanner';

const COLOR_RED = '#ef4444';
const COLOR_YELLOW = '#eab308';
const COLOR_GREEN = '#10b981';

const statusConfig = {
    red:    { color: COLOR_RED,    icon: 'alert-octagon',    label: 'VENCIDO' },
    yellow: { color: COLOR_YELLOW, icon: 'alert',            label: 'PRÓXIMO' },
    green:  { color: COLOR_GREEN,  icon: 'check-circle',     label: 'OK' },
};

const MantenimientoAlertScreen: React.FC = () => {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const { vehiculo } = route.params as { vehiculo: any };
    const kmActual = vehiculo?.kilometrajeActual || 0;
    const patente = vehiculo?.patente?.toUpperCase() || '—';

    // Todos los items (incluyendo OK) — la pantalla muestra el panorama completo
    const todosLosItems = useMemo(() => {
        if (!vehiculo?.configuracionMantenimiento?.length) return [];
        return vehiculo.configuracionMantenimiento.map((c: any) => {
            const kmRecorrido = kmActual - (c.ultimoKm || 0);
            const restante = c.frecuenciaKm - kmRecorrido;
            const progress = Math.min(100, Math.max(0, (kmRecorrido / (c.frecuenciaKm || 1)) * 100));
            let status: 'red' | 'yellow' | 'green' = 'green';
            if (restante <= 0) status = 'red';
            else if (restante <= 1000) status = 'yellow';
            return { nombre: c.nombre, restante, progress, status };
        });
    }, [vehiculo]);

    const alertasActivas = calcularAlertasMantenimiento(vehiculo);
    const tieneVencidos = alertasActivas.some(a => a.status === 'red');

    const headerGradient: [string, string] = tieneVencidos
        ? ['#7f1d1d', '#1c1917']
        : alertasActivas.length > 0
            ? ['#713f12', '#1c1917']
            : ['#064e3b', '#1c1917'];

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            {/* Header */}
            <LinearGradient
                colors={headerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.header}
            >
                <View style={styles.headerRow}>
                    <IconButton
                        icon="arrow-left"
                        iconColor="white"
                        size={22}
                        onPress={() => navigation.goBack()}
                        style={styles.icon0}
                    />
                    <View style={styles.headerTextBlock}>
                        <Text style={styles.headerTitle}>Estado del Vehículo</Text>
                        <Text style={styles.headerSub}>{patente} · {kmActual.toLocaleString('es-AR')} km</Text>
                    </View>
                    <View style={styles.headerBadge}>
                        <Text style={[
                            styles.headerBadgeText,
                            { color: tieneVencidos ? COLOR_RED : alertasActivas.length > 0 ? COLOR_YELLOW : COLOR_GREEN }
                        ]}>
                            {tieneVencidos
                                ? `${alertasActivas.filter(a => a.status === 'red').length} VENC.`
                                : alertasActivas.length > 0
                                    ? `${alertasActivas.length} PRÓX.`
                                    : 'OPERATIVO'}
                        </Text>
                    </View>
                </View>
            </LinearGradient>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>

                {todosLosItems.length === 0 ? (
                    <View style={styles.emptyBox}>
                        <IconButton icon="cog-off" iconColor="rgba(255,255,255,0.3)" size={40} />
                        <Text style={styles.emptyText}>Este vehículo no tiene mantenimientos configurados.</Text>
                    </View>
                ) : (
                    todosLosItems.map((item: any, idx: number) => {
                        const cfg = statusConfig[item.status as 'red' | 'yellow' | 'green'];
                        return (
                            <View key={idx} style={[styles.itemCard, { borderLeftColor: cfg.color }]}>
                                <View style={styles.itemHeader}>
                                    <IconButton icon={cfg.icon} iconColor={cfg.color} size={18} style={styles.icon0} />
                                    <Text style={styles.itemNombre}>{item.nombre}</Text>
                                    <View style={[styles.statusBadge, { backgroundColor: `${cfg.color}22`, borderColor: `${cfg.color}55` }]}>
                                        <Text style={[styles.statusBadgeText, { color: cfg.color }]}>{cfg.label}</Text>
                                    </View>
                                </View>

                                {/* Progress bar */}
                                <View style={styles.progressTrack}>
                                    <View style={[
                                        styles.progressFill,
                                        {
                                            width: `${item.progress}%` as any,
                                            backgroundColor: cfg.color,
                                        }
                                    ]} />
                                </View>

                                <Text style={styles.itemDetail}>
                                    {item.restante <= 0
                                        ? `Vencido hace ${Math.abs(item.restante).toLocaleString('es-AR')} km`
                                        : `Restan ${item.restante.toLocaleString('es-AR')} km`}
                                </Text>
                            </View>
                        );
                    })
                )}

                {/* Footer aviso */}
                {alertasActivas.length > 0 && (
                    <View style={styles.footerInfo}>
                        <IconButton icon="information-outline" iconColor="rgba(255,255,255,0.4)" size={18} style={styles.icon0} />
                        <Text style={styles.footerText}>
                            Informá al administrador sobre los mantenimientos pendientes antes de salir a ruta.
                        </Text>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0f172a',
    },
    header: {
        paddingBottom: 18,
        paddingTop: 4,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    headerTextBlock: {
        flex: 1,
        marginLeft: 4,
    },
    headerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: '900',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.55)',
        fontSize: 12,
        fontWeight: '600',
        marginTop: 2,
    },
    headerBadge: {
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 4,
        marginRight: 8,
    },
    headerBadgeText: {
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    scroll: { flex: 1 },
    scrollContent: {
        padding: 16,
        paddingTop: 12,
    },
    itemCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    itemHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    itemNombre: {
        flex: 1,
        color: 'rgba(255,255,255,0.9)',
        fontSize: 15,
        fontWeight: '700',
        marginLeft: 4,
    },
    statusBadge: {
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    statusBadgeText: {
        fontSize: 9,
        fontWeight: '900',
        letterSpacing: 1,
    },
    progressTrack: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    itemDetail: {
        color: 'rgba(255,255,255,0.45)',
        fontSize: 11,
        fontWeight: '600',
    },
    emptyBox: {
        alignItems: 'center',
        marginTop: 60,
        padding: 24,
    },
    emptyText: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
        textAlign: 'center',
        marginTop: 8,
    },
    footerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 12,
        marginTop: 8,
    },
    footerText: {
        flex: 1,
        color: 'rgba(255,255,255,0.4)',
        fontSize: 12,
        lineHeight: 18,
    },
    icon0: { margin: 0, padding: 0 },
});

export default MantenimientoAlertScreen;

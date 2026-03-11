import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
    RefreshControl, Dimensions, TextInput, Animated, AppState, AppStateStatus, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme, IconButton, Avatar, Modal, Portal, Switch, Surface } from 'react-native-paper';
import CustomAlert from '../components/common/CustomAlert';
import { useAuth } from '../hooks/useAuth';
import { usePreferences } from '../context/PreferencesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { AppTheme } from '../theme/theme';
import ConfirmarJornadaModal from '../components/home/ConfirmarJornadaModal';

const PROD_URL = 'https://api.soldelamanecer.ar';
const DEV_URL = 'http://192.168.0.132:5000';
const BASE_MEDIA = __DEV__ ? DEV_URL : PROD_URL;

const { width } = Dimensions.get('window');

// ── Helpers ─────────────────────────────────────────────────────────────────
const esFinDeSemana = () => { const d = new Date().getDay(); return d === 0 || d === 6; };

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const getDateString = () => {
    const n = new Date();
    return `${DIAS[n.getDay()]} ${n.getDate()} de ${MESES[n.getMonth()]}`;
};
const getTimeString = () => {
    const n = new Date();
    return n.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
};

const HomeScreen = ({ navigation }: any) => {
    const theme = useTheme<AppTheme>();
    const { user, logout, updateUser } = useAuth();
    const { toggleTheme, isThemeDark } = usePreferences();
    const isDark = isThemeDark;

    // ── State ──────────────────────────────────────────────────────────────
    const [config, setConfig] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);
    const [confirmarVisible, setConfirmarVisible] = useState(false);
    const [currentTime, setCurrentTime] = useState(getTimeString());
    const [profilePhoto, setProfilePhoto] = useState<string | null>(user?.fotoPerfil || null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    // Selectores
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any>(null);
    const [rutaSeleccionada, setRutaSeleccionada] = useState<any>(null);
    const [listaVehiculos, setListaVehiculos] = useState<any[]>([]);
    const [listaRutas, setListaRutas] = useState<any[]>([]);
    const [modalSelectorVisible, setModalSelectorVisible] = useState(false);
    const [tipoSelector, setTipoSelector] = useState<'vehiculo' | 'ruta'>('vehiculo');
    const [searchQuery, setSearchQuery] = useState('');

    // Alert
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean; title: string; message: string; type: 'success' | 'error' | 'warning' | 'info';
    }>({ visible: false, title: '', message: '', type: 'info' });

    // Animaciones
    const pulseValue = useRef(new Animated.Value(1)).current;
    const appStateRef = useRef<AppStateStatus>(AppState.currentState);
    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
    // Protege la selección manual del chofer contra resets por fetchConfig/AppState
    const hasManualChange = useRef(false);
    // Detecta cuando un chofer multi-ruta cambia a una ruta diferente (override)
    // useState para poder re-renderizar el aviso en la UI
    const [multiRouteOverride, setMultiRouteOverride] = useState(false);

    // ── Photo picker ──────────────────────────────────────────────────────────────
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            setAlertConfig({ visible: true, title: 'Permiso requerido', message: 'Necesitás otorgar acceso a la galería para cambiar tu foto de perfil.', type: 'warning' });
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.75,
        });
        if (result.canceled || !result.assets?.[0]) return;
        const asset = result.assets[0];
        setUploadingPhoto(true);
        try {
            const formData = new FormData();
            formData.append('foto', {
                uri: asset.uri,
                type: asset.mimeType || 'image/jpeg',
                name: `perfil.jpg`,
            } as any);
            const res = await api.post('/usuarios/subir-foto', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const fotoUrl = res.data.fotoPerfil;
            setProfilePhoto(`${BASE_MEDIA}${fotoUrl}?t=${Date.now()}`);
            await updateUser({ fotoPerfil: fotoUrl });
            setAlertConfig({ visible: true, title: '¡Foto actualizada!', message: 'Tu foto de perfil se actualizó correctamente.', type: 'success' });
        } catch (e: any) {
            console.error('Error subiendo foto:', e?.response?.data || e?.message);
            setAlertConfig({ visible: true, title: 'Error', message: 'No se pudo subir la foto. Intentá nuevamente.', type: 'error' });
        } finally {
            setUploadingPhoto(false);
        }
    };

    // ── Theme tokens ───────────────────────────────────────────────────────
    const tp = theme.colors.textPrimary;
    const ts = theme.colors.textSecondary;

    // ── Pulse animation para el botón de confirmar ─────────────────────────
    useEffect(() => {
        // Clock update every minute
        const clockTimer = setInterval(() => setCurrentTime(getTimeString()), 60000);
        // Pulse
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseValue, { toValue: 1.03, duration: 900, useNativeDriver: true }),
                Animated.timing(pulseValue, { toValue: 1, duration: 900, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => { pulse.stop(); clearInterval(clockTimer); };
    }, []);

    // ── Fetch data ─────────────────────────────────────────────────────────
    const fetchConfig = useCallback(async () => {
        try {
            const res = await api.get('/choferes/configuracion');
            setConfig(res.data);
            // Solo actualiza los selectores si el chofer NO hizo cambios manuales
            // (evita resetear la selección al volver del fondo)
            if (!hasManualChange.current) {
                setVehiculoSeleccionado(res.data.vehiculo);
                setRutaSeleccionada(res.data.ruta);
            }
        } catch (e) {
            console.log('Error fetchConfig:', e);
        } finally {
            setRefreshing(false);
        }
    }, []);

    const fetchSelectores = useCallback(async () => {
        try {
            const res = await api.get('/choferes/selectores-reporte');
            setListaVehiculos(res.data.vehiculos || []);
            setListaRutas(res.data.rutas || []);
        } catch (e) { console.log('Error selectores:', e); }
    }, []);

    // ── Polling (60s, solo AppState active) ───────────────────────────────
    const startPolling = useCallback(() => {
        if (pollingRef.current) clearInterval(pollingRef.current);
        pollingRef.current = setInterval(() => {
            if (appStateRef.current === 'active') fetchConfig();
        }, 60000);
    }, [fetchConfig]);

    useEffect(() => {
        const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
            if (appStateRef.current.match(/inactive|background/) && next === 'active') fetchConfig();
            appStateRef.current = next;
        });
        startPolling();
        return () => { sub.remove(); if (pollingRef.current) clearInterval(pollingRef.current); };
    }, [startPolling, fetchConfig]);

    useFocusEffect(useCallback(() => {
        fetchConfig();
        fetchSelectores();
        startPolling();
    }, [fetchConfig, fetchSelectores, startPolling]));

    // ── Selectores ─────────────────────────────────────────────────────────
    const abrirSelector = (tipo: 'vehiculo' | 'ruta') => {
        setTipoSelector(tipo); setSearchQuery(''); setModalSelectorVisible(true);
    };
    const seleccionarItem = (item: any) => {
        if (tipoSelector === 'vehiculo') setVehiculoSeleccionado(item);
        else {
            setRutaSeleccionada(item);
            // Si es chofer multi-ruta y elige UNA ruta diferente, activar el override
            if ((config?.hojasActivas?.length || 0) > 1) {
                setMultiRouteOverride(true);
            }
        }
        hasManualChange.current = true;  // ← protege contra resets de fetchConfig
        setModalSelectorVisible(false);
    };

    // ── Datos derivados ────────────────────────────────────────────────────
    const tieneHojaActiva = config?.hojasActivas?.length > 0 || config?.hojaRepartoId;
    const jornadaConfirmada = config?.reporteKmHoy === true;
    const resumen = config?.resumenReporteHoy;
    const initial = user?.nombre?.charAt(0).toUpperCase() || 'C';
    const esLibre = !tieneHojaActiva && esFinDeSemana();

    // Menú de acciones rápidas (solo entrega, km se hace desde el modal)
    const menuItems = [
        {
            title: 'Mis entregas del día',
            subtitle: 'Ver listado y gestionar envíos',
            icon: 'clipboard-text-play-outline',
            colors: ['#059669', '#10b981'] as [string, string],
            route: 'HojaReparto',
        }
    ];

    // ── Render helpers ─────────────────────────────────────────────────────

    /** Card central según estado de jornada */
    const renderJornadaCard = () => {
        // ✅ Jornada confirmada
        if (tieneHojaActiva && jornadaConfirmada) {
            return (
                <LinearGradient colors={isDark ? ['#064e3b', '#022c22'] : ['#d1fae5', '#a7f3d0']}
                    style={styles.jornadaCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.jornadaBadge}>
                        <IconButton icon="check-circle" size={14} iconColor="#10b981" style={styles.icon0} />
                        <Text style={[styles.jornadaBadgeText, { color: '#10b981' }]}>JORNADA CONFIRMADA</Text>
                    </View>
                    <View style={styles.jornadaInfoRow}>
                        <IconButton icon="truck-outline" size={18} iconColor={isDark ? '#6ee7b7' : '#047857'} style={styles.icon0} />
                        <Text style={[styles.jornadaMainText, { color: isDark ? '#ecfdf5' : '#064e3b' }]}>
                            {vehiculoSeleccionado?.patente?.toUpperCase() || '—'}
                        </Text>
                    </View>
                    <View style={styles.jornadaInfoRow}>
                        <IconButton icon="map-marker-distance" size={18} iconColor={isDark ? '#6ee7b7' : '#047857'} style={styles.icon0} />
                        <Text style={[styles.jornadaSubText, { color: isDark ? '#a7f3d0' : '#065f46' }]}>
                            {rutaSeleccionada?.codigo?.toUpperCase() || '—'}
                        </Text>
                    </View>
                    {resumen && (
                        <View style={styles.resumenRow}>
                            <Text style={[styles.resumenItem, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                                📟 {resumen.km?.toLocaleString('es-AR')} km registrados
                            </Text>
                            {resumen.litros > 0 && (
                                <Text style={[styles.resumenItem, { color: isDark ? '#6ee7b7' : '#047857' }]}>
                                    ⛽ {resumen.litros} L
                                </Text>
                            )}
                            {resumen.observaciones && resumen.observaciones !== 'Reporte diario desde App Móvil.' && (
                                <Text style={[styles.resumenObs, { color: isDark ? '#a7f3d0' : '#065f46' }]}
                                    numberOfLines={2}>
                                    💬 {resumen.observaciones}
                                </Text>
                            )}
                        </View>
                    )}
                </LinearGradient>
            );
        }

        // 🟡 Hoja activa, sin confirmar
        if (tieneHojaActiva && !jornadaConfirmada) {
            return (
                <LinearGradient colors={isDark ? ['#0c4a6e', '#082f49'] : ['#e0f2fe', '#bae6fd']}
                    style={styles.jornadaCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <View style={styles.jornadaBadge}>
                        <View style={styles.pulseDot} />
                        <Text style={[styles.jornadaBadgeText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>JORNADA ACTIVA</Text>
                    </View>
                    <View style={styles.jornadaInfoRow}>
                        <IconButton icon="truck-outline" size={18} iconColor={isDark ? '#38bdf8' : '#0284c7'} style={styles.icon0} />
                        <Text style={[styles.jornadaMainText, { color: isDark ? '#f0f9ff' : '#0c4a6e' }]}>
                            {vehiculoSeleccionado?.patente?.toUpperCase() || 'Sin vehículo'}
                        </Text>
                    </View>
                    <View style={styles.jornadaInfoRow}>
                        <IconButton icon="map-marker-distance" size={18} iconColor={isDark ? '#38bdf8' : '#0284c7'} style={styles.icon0} />
                        <Text style={[styles.jornadaSubText, { color: isDark ? '#bae6fd' : '#075985' }]}>
                            {rutaSeleccionada?.codigo?.toUpperCase() || 'Sin ruta'}{rutaSeleccionada?.horaSalida ? ` · Salida: ${rutaSeleccionada.horaSalida}` : ''}
                        </Text>
                    </View>
                    <Text style={[styles.jornadaHint, { color: isDark ? 'rgba(186,230,253,0.7)' : 'rgba(7,89,133,0.7)' }]}>
                        Al finalizar tu recorrido, confirmá los datos de tu jornada.
                    </Text>
                </LinearGradient>
            );
        }

        // 😊 Fin de semana / día libre
        if (esLibre) {
            return (
                <LinearGradient colors={isDark ? ['#1c1917', '#0c0a09'] : ['#fef3c7', '#fde68a']}
                    style={styles.jornadaCard}>
                    <Text style={{ fontSize: 36, textAlign: 'center', marginBottom: 8 }}>😊</Text>
                    <Text style={[styles.jornadaMainText, { color: isDark ? '#fde68a' : '#78350f', textAlign: 'center' }]}>
                        ¡Día libre!
                    </Text>
                    <Text style={[styles.jornadaSubText, { color: isDark ? '#fde68a' : '#92400e', textAlign: 'center' }]}>
                        No tenés actividad programada hoy.
                    </Text>
                </LinearGradient>
            );
        }

        // ⏳ Sin hoja (día laboral)
        return (
            <LinearGradient colors={isDark ? ['#0f172a', '#020617'] : ['#f1f5f9', '#e2e8f0']}
                style={styles.jornadaCard}>
                <View style={styles.jornadaBadge}>
                    <IconButton icon="clock-outline" size={14} iconColor={ts} style={styles.icon0} />
                    <Text style={[styles.jornadaBadgeText, { color: ts }]}>SIN ACTIVIDAD ASIGNADA</Text>
                </View>
                <Text style={[styles.jornadaMainText, { color: tp }]}>Aún no tenés una hoja activa</Text>
                <Text style={[styles.jornadaSubText, { color: ts }]}>
                    Consultá con tu supervisor o esperá la asignación automática.
                </Text>
                {config?.removidoPorAdmin && (
                    <View style={styles.adminBanner}>
                        <IconButton icon="shield-account" size={14} iconColor="#f59e0b" style={styles.icon0} />
                        <Text style={styles.adminBannerText}>Tu ruta fue reasignada por el administrador.</Text>
                    </View>
                )}
            </LinearGradient>
        );
    };

    /** God-Tier Header Card */
    const renderHeader = () => {
        const initials = user?.nombre
            ? user.nombre.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
            : 'C';
        const firstName = user?.nombre?.split(' ')[0] || 'Chofer';
        const tipoLabel = user?.tipoContrato === 'relacionDependencia' ? 'Empleado' : 'Contratado';
        const photoUri = profilePhoto
            ? profilePhoto.startsWith('http') ? profilePhoto : `${BASE_MEDIA}${profilePhoto}`
            : null;

        return (
            <View style={styles.headerCard}>
                <LinearGradient
                    colors={isDark
                        ? ['#0c4a6e', '#0f172a'] as [string, string]
                        : ['#0891b2', '#0e7490'] as [string, string]}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                    style={styles.headerGradient}
                >
                    {/* Botones top-right */}
                    <View style={styles.headerTopRow}>
                        <View style={styles.headerDateBox}>
                            <Text style={styles.headerDate}>{getDateString()}</Text>
                        </View>
                        <View style={styles.headerButtons}>
                            <TouchableOpacity
                                onPress={() => setLogoutModalVisible(true)}
                                style={styles.headerIconBtn}
                                activeOpacity={0.75}
                            >
                                <IconButton icon="logout-variant" size={20} iconColor="rgba(255,255,255,0.8)" style={styles.icon0} />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setProfileModalVisible(true)}
                                style={[styles.headerIconBtn, { marginLeft: 8 }]}
                                activeOpacity={0.75}
                            >
                                <IconButton icon="cog-outline" size={20} iconColor="rgba(255,255,255,0.8)" style={styles.icon0} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Avatar + Nombre */}
                    <View style={styles.headerMain}>
                        <TouchableOpacity onPress={pickImage} activeOpacity={0.85} disabled={uploadingPhoto}>
                            <View style={styles.avatarRingOuter}>
                                <View style={styles.avatarRingInner}>
                                    {photoUri ? (
                                        <Image source={{ uri: photoUri }} style={styles.headerAvatarPhoto} />
                                    ) : (
                                        <Avatar.Text
                                            size={64}
                                            label={initials}
                                            style={styles.headerAvatar}
                                            labelStyle={styles.headerAvatarLabel}
                                        />
                                    )}
                                </View>
                                <View style={styles.cameraOverlay}>
                                    <IconButton icon={uploadingPhoto ? 'loading' : 'camera'} size={12} iconColor="white" style={styles.icon0} />
                                </View>
                            </View>
                        </TouchableOpacity>
                        <View style={styles.headerTextBlock}>
                            <Text style={styles.headerGreeting}>Bienvenido,</Text>
                            <Text style={styles.headerName}>{firstName}</Text>
                            <View style={styles.headerBadgeRow}>
                                <View style={styles.headerRoleBadge}>
                                    <IconButton icon="account-hard-hat" size={12} iconColor="rgba(255,255,255,0.9)" style={styles.icon0} />
                                    <Text style={styles.headerRoleBadgeText}>CHOFER · {tipoLabel.toUpperCase()}</Text>
                                </View>
                            </View>
                        </View>
                    </View>
                </LinearGradient>
            </View>
        );
    };

    // ── JSX ────────────────────────────────────────────────────────────────
    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
            <LinearGradient colors={[theme.colors.gradientStart, theme.colors.gradientEnd]}
                style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent}
                    refreshControl={<RefreshControl refreshing={refreshing}
                        onRefresh={() => { setRefreshing(true); fetchConfig(); }}
                        tintColor={theme.colors.primary} colors={[theme.colors.primary]} />}>

                    {/* ── GOD-TIER HEADER ── */}
                    {renderHeader()}

                    {/* ── CARD JORNADA ── */}
                    <View style={{ paddingHorizontal: 20 }}>
                        {renderJornadaCard()}
                    </View>
                    {tieneHojaActiva && !jornadaConfirmada && (
                        <View style={[styles.statusCard, {
                            backgroundColor: isDark ? theme.colors.surfaceVariant : theme.colors.surface,
                            borderColor: isDark ? theme.colors.outline : '#f1f5f9',
                            marginHorizontal: 20,
                            ...(!isDark && { elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 })
                        }]}>
                            <Text style={[styles.statusCardTitle, { color: ts }]}>ASIGNACIÓN DEL DÍA</Text>

                            {/* Vehículo */}
                            <TouchableOpacity style={styles.statusItem} onPress={() => abrirSelector('vehiculo')} activeOpacity={0.7}>
                                <View style={[styles.statusIconBase, { backgroundColor: isDark ? 'rgba(56,189,248,0.08)' : 'rgba(0,188,212,0.08)' }]}>
                                    <IconButton icon="truck-delivery" iconColor={theme.colors.primary} size={22} style={styles.icon0} />
                                </View>
                                <View style={styles.statusTextContainer}>
                                    <Text style={styles.statusLabel}>VEHÍCULO</Text>
                                    <Text style={[styles.statusMainValue, { color: tp }]}>
                                        {vehiculoSeleccionado?.patente?.toUpperCase() || 'NO ASIGNADO'}
                                    </Text>
                                    {vehiculoSeleccionado && (
                                        <Text style={[styles.statusSubDetail, { color: ts }]}>
                                            {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                                        </Text>
                                    )}
                                </View>
                                <IconButton icon="chevron-down" iconColor={theme.colors.outline} size={18} style={styles.icon0} />
                            </TouchableOpacity>

                            <View style={[styles.statusDivider, { backgroundColor: theme.colors.outline }]} />

                            {/* Ruta */}
                            <TouchableOpacity style={styles.statusItem}
                                onPress={() => abrirSelector('ruta')}
                                activeOpacity={0.7}>
                                <View style={[styles.statusIconBase, { backgroundColor: config?.hojasActivas?.length > 1 ? 'rgba(234,179,8,0.12)' : (isDark ? 'rgba(56,189,248,0.08)' : 'rgba(0,188,212,0.08)') }]}>
                                    <IconButton
                                        icon={config?.hojasActivas?.length > 1 ? 'map-marker-multiple-outline' : 'map-marker-distance'}
                                        iconColor={config?.hojasActivas?.length > 1 ? '#eab308' : theme.colors.primary}
                                        size={22} style={styles.icon0} />
                                </View>
                                <View style={styles.statusTextContainer}>
                                    <Text style={[styles.statusLabel, config?.hojasActivas?.length > 1 && { color: '#eab308' }]}>
                                        {config?.hojasActivas?.length > 1 ? 'RUTAS DEL DÍA' : 'RUTA'}
                                    </Text>
                                    {config?.hojasActivas?.length > 1 && !multiRouteOverride ? (
                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                                            {config.hojasActivas.map((h: any, i: number) => (
                                                <View key={i} style={{
                                                    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                                                    backgroundColor: isDark ? 'rgba(234,179,8,0.15)' : '#fef9c3',
                                                    borderWidth: 1, borderColor: '#eab308'
                                                }}>
                                                    <Text style={{ color: '#b45309', fontWeight: '800', fontSize: 12 }}>
                                                        {h.ruta?.codigo?.toUpperCase() || '?'}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    ) : (
                                        <>
                                            <Text style={[styles.statusMainValue, { color: tp }]}>
                                                {rutaSeleccionada?.codigo?.toUpperCase() || 'SIN RUTA'}
                                            </Text>
                                            {rutaSeleccionada?.horaSalida && (
                                                <Text style={[styles.statusSubDetail, { color: ts }]}>
                                                    Salida: {rutaSeleccionada.horaSalida}
                                                </Text>
                                            )}
                                        </>
                                    )}
                                </View>
                                {(!config?.hojasActivas || config.hojasActivas.length <= 1) && (
                                    <IconButton icon="chevron-down" iconColor={theme.colors.outline} size={18} style={styles.icon0} />
                                )}
                            </TouchableOpacity>
                            {/* Hint / aviso cambio de ruta */}
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(100,116,139,0.15)' }}>
                                <IconButton icon={multiRouteOverride ? 'alert-circle-outline' : 'information-outline'} size={14}
                                    iconColor={multiRouteOverride ? '#eab308' : ts} style={styles.icon0} />
                                <Text style={[styles.statusSubDetail, { color: multiRouteOverride ? '#b45309' : ts, flex: 1, marginLeft: 4 }]}>
                                    {multiRouteOverride
                                        ? 'Cambiaste tu ruta asignada. Las rutas originales quedarán pendientes para otro chofer.'
                                        : 'Los cambios se aplican al confirmar la jornada.'}
                                </Text>
                            </View>
                        </View>
                    )}

                    {/* ── BOTÓN CONFIRMAR MI JORNADA ── */}
                    {tieneHojaActiva && !jornadaConfirmada && (
                        <Animated.View style={[styles.confirmWrap, { transform: [{ scale: pulseValue }], marginHorizontal: 20 }]}>
                            <TouchableOpacity onPress={() => setConfirmarVisible(true)} activeOpacity={0.9}>
                                <LinearGradient colors={['#10b981', '#059669']}
                                    style={styles.confirmBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                                    <IconButton icon="clipboard-check-multiple-outline" iconColor="white" size={26} style={styles.icon0} />
                                    <View>
                                        <Text style={styles.confirmBtnTitle}>CONFIRMAR MI JORNADA</Text>
                                        <Text style={styles.confirmBtnSub}>Registrá km, combustible y novedades</Text>
                                    </View>
                                    <IconButton icon="chevron-right" iconColor="rgba(255,255,255,0.6)" size={22} style={styles.icon0} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </Animated.View>
                    )}

                    {/* ── ACCIONES RÁPIDAS ── */}
                    {tieneHojaActiva && (
                        <View style={{ paddingHorizontal: 20 }}>
                            <View style={styles.sectionHeader}>
                                <Text style={[styles.sectionTitle, { color: tp }]}>Acciones Rápidas</Text>
                                <View style={[styles.accentLine, { backgroundColor: theme.colors.outline }]} />
                            </View>
                            {menuItems.map((item, i) => (
                                <TouchableOpacity key={i} activeOpacity={0.85}
                                    onPress={() => navigation.navigate(item.route)}
                                    style={styles.actionCardWrapper}>
                                    <LinearGradient colors={item.colors}
                                        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.5 }}
                                        style={styles.actionGradient}>
                                        <View style={styles.actionContent}>
                                            <View style={styles.actionIconContainer}>
                                                <IconButton icon={item.icon} iconColor="white" size={30} />
                                            </View>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.actionItemTitle}>{item.title}</Text>
                                                <Text style={styles.actionItemSubtitle}>{item.subtitle}</Text>
                                            </View>
                                            <IconButton icon="chevron-right" iconColor="rgba(255,255,255,0.7)" size={22} />
                                        </View>
                                    </LinearGradient>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>

            {/* ── MODAL CONFIRMAR JORNADA ── */}
            <ConfirmarJornadaModal
                visible={confirmarVisible}
                onClose={() => setConfirmarVisible(false)}
                onSuccess={() => {
                    hasManualChange.current = false;
                    setMultiRouteOverride(false);
                    setConfirmarVisible(false);
                    fetchConfig();
                }}
                vehiculo={vehiculoSeleccionado}
                ruta={rutaSeleccionada}
                hojaRepartoId={config?.hojaRepartoId}
                hojasActivas={multiRouteOverride ? undefined : config?.hojasActivas}
                isDark={isDark}
                textPrimary={tp}
                textSecondary={ts}
                userId={user?.id}
            />

            {/* ── MODAL PERFIL ── */}
            <Portal>
                <Modal visible={profileModalVisible} onDismiss={() => setProfileModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
                            <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]}
                                style={styles.modalHeaderGradient} />
                            <View style={[styles.modalAvatarContainer, { backgroundColor: theme.colors.surface }]}>
                                <TouchableOpacity onPress={pickImage} disabled={uploadingPhoto} activeOpacity={0.85}>
                                    {(profilePhoto) ? (
                                        <Image
                                            source={{ uri: profilePhoto.startsWith('http') ? profilePhoto : `${BASE_MEDIA}${profilePhoto}` }}
                                            style={styles.largeAvatarPhoto}
                                        />
                                    ) : (
                                        <Avatar.Text size={80} label={user?.nombre?.charAt(0).toUpperCase() || 'C'} style={styles.largeAvatar} labelStyle={styles.largeAvatarLabel} />
                                    )}
                                    <View style={styles.cameraOverlayLarge}>
                                        <IconButton icon={uploadingPhoto ? 'loading' : 'camera-plus'} size={16} iconColor="white" style={styles.icon0} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                            <TouchableOpacity style={styles.closeModalButton} onPress={() => setProfileModalVisible(false)}>
                                <IconButton icon="close" iconColor="white" size={20} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <Text style={[styles.modalName, { color: tp }]}>{user?.nombre}</Text>
                            <Text style={[styles.modalRole, { color: theme.colors.primary }]}>{user?.rol?.toUpperCase()}</Text>
                            <View style={[styles.infoDivider, { backgroundColor: theme.colors.outline }]} />
                            {[
                                { icon: 'email-outline', label: 'EMAIL', value: user?.email },
                                { icon: 'file-document-outline', label: 'CONTRATO', value: user?.tipoContrato === 'relacionDependencia' ? 'Relación Dependencia' : 'Externo / Monotributo' },
                                { icon: 'shield-check-outline', label: 'ID EMPLEADO', value: `#${user?.id?.substring(0, 8).toUpperCase()}` }
                            ].map((row, i) => (
                                <View key={i} style={styles.infoRow}>
                                    <View style={[styles.infoIconBox, { backgroundColor: isDark ? 'rgba(8,145,178,0.1)' : '#ecfeff' }]}>
                                        <IconButton icon={row.icon} iconColor={theme.colors.primary} size={20} />
                                    </View>
                                    <View>
                                        <Text style={[styles.infoLabel, { color: ts }]}>{row.label}</Text>
                                        <Text style={[styles.infoValue, { color: tp }]}>{row.value}</Text>
                                    </View>
                                </View>
                            ))}
                            <View style={[styles.infoDivider, { backgroundColor: theme.colors.outline }]} />
                            <View style={[styles.infoRow, { justifyContent: 'space-between' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.infoIconBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                                        <IconButton icon="theme-light-dark" iconColor={theme.colors.tertiary} size={20} />
                                    </View>
                                    <View>
                                        <Text style={[styles.infoLabel, { color: ts }]}>TEMA</Text>
                                        <Text style={[styles.infoValue, { color: tp }]}>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</Text>
                                    </View>
                                </View>
                                <Switch value={isDark} onValueChange={toggleTheme} color={theme.colors.primary} />
                            </View>
                        </View>
                        <TouchableOpacity style={[styles.modalCloseFooter, { borderTopColor: theme.colors.outline }]}
                            onPress={() => setProfileModalVisible(false)}>
                            <Text style={[styles.modalCloseText, { color: ts }]}>Cerrar Perfil</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </Portal>

            {/* ── MODAL LOGOUT ── */}
            <Portal>
                <Modal visible={logoutModalVisible} onDismiss={() => setLogoutModalVisible(false)}
                    contentContainerStyle={styles.logoutModalContainer}
                    theme={{ colors: { backdrop: theme.colors.backdrop } }}>
                    <View style={[styles.logoutModalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={[styles.logoutIconRing, { borderColor: 'rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.05)' }]}>
                            <IconButton icon="logout-variant" size={30} iconColor="#ef4444" />
                        </View>
                        <Text style={[styles.confirmTitle, { color: tp }]}>¿Cerrar Sesión?</Text>
                        <Text style={[styles.confirmSubtitle, { color: ts }]}>
                            Tu jornada se guardará, pero tendrás que volver a ingresar tus credenciales.
                        </Text>
                        <View style={styles.logoutActionRow}>
                            <TouchableOpacity onPress={() => setLogoutModalVisible(false)}
                                style={[styles.logoutBtn, styles.logoutBtnCancel, { borderColor: theme.colors.outline }]}>
                                <Text style={[styles.logoutBtnTextCancel, { color: ts }]}>CANCELAR</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.9}>
                                <LinearGradient colors={['#ef4444', '#b91c1c']}
                                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.logoutBtnGradient}>
                                    <Text style={styles.logoutBtnTextConfirm}>SALIR</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Portal>

            {/* ── MODAL SELECTOR (vehículo/ruta) ── */}
            <Portal>
                <Modal visible={modalSelectorVisible} onDismiss={() => setModalSelectorVisible(false)}
                    contentContainerStyle={styles.modalContainer}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
                            <LinearGradient colors={[theme.colors.primary, theme.colors.secondary]} style={styles.modalHeaderGradient} />
                            <Text style={[styles.modalName, { color: tp, position: 'absolute', bottom: 12 }]}>
                                {tipoSelector === 'vehiculo' ? 'Seleccionar Vehículo' : 'Seleccionar Ruta'}
                            </Text>
                            <TouchableOpacity style={styles.closeModalButton} onPress={() => setModalSelectorVisible(false)}>
                                <IconButton icon="close" iconColor="white" size={20} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.modalBody}>
                            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
                                <IconButton icon="magnify" iconColor={ts} size={20} style={styles.icon0} />
                                <TextInput style={{ flex: 1, padding: 8, color: tp, fontSize: 14 }}
                                    value={searchQuery} onChangeText={setSearchQuery}
                                    placeholder={`Buscar ${tipoSelector === 'vehiculo' ? 'vehículo' : 'ruta'}...`}
                                    placeholderTextColor={ts} />
                            </View>
                            <ScrollView style={{ maxHeight: 350 }}>
                                {(tipoSelector === 'vehiculo' ? listaVehiculos : listaRutas)
                                    .filter((item: any) => {
                                        const q = searchQuery.toLowerCase();
                                        return tipoSelector === 'vehiculo'
                                            ? (item.patente?.toLowerCase().includes(q) || item.marca?.toLowerCase().includes(q) || item.modelo?.toLowerCase().includes(q))
                                            : (item.codigo?.toLowerCase().includes(q) || item.descripcion?.toLowerCase().includes(q));
                                    })
                                    .map((item: any) => (
                                        <TouchableOpacity key={item._id}
                                            style={[styles.selectorItem, { borderBottomColor: theme.colors.outline }]}
                                            onPress={() => seleccionarItem(item)}>
                                            <View>
                                                <Text style={[styles.selectorItemTitle, { color: tp }]}>
                                                    {tipoSelector === 'vehiculo' ? item.patente : item.codigo}
                                                </Text>
                                                <Text style={[styles.selectorItemSubtitle, { color: ts }]}>
                                                    {tipoSelector === 'vehiculo'
                                                        ? `${item.marca} ${item.modelo}`
                                                        : (item.descripcion || `Salida: ${item.horaSalida}`)}
                                                </Text>
                                            </View>
                                            <IconButton icon="chevron-right" iconColor={ts} size={18} style={styles.icon0} />
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </Portal>

            {/* ── ALERTS ── */}
            <CustomAlert visible={alertConfig.visible} title={alertConfig.title}
                message={alertConfig.message} type={alertConfig.type}
                onClose={() => setAlertConfig({ ...alertConfig, visible: false })} />
        </View>
    );
};

// ── STYLES ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingTop: 0, paddingBottom: 40, paddingHorizontal: 0 },
    icon0: { margin: 0, padding: 0 },

    // Header
    headerCard: { marginBottom: 20, borderRadius: 0, overflow: 'hidden' },
    headerGradient: { paddingTop: 6, paddingBottom: 14, paddingHorizontal: 20 },
    headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
    headerDateBox: { flex: 1 },
    headerDate: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
    headerButtons: { flexDirection: 'row', alignItems: 'center' },
    headerIconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' },
    headerMain: { flexDirection: 'row', alignItems: 'center' },
    avatarRingOuter: { width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    avatarRingInner: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
    headerAvatar: { backgroundColor: 'rgba(255,255,255,0.25)' },
    headerAvatarLabel: { color: 'white', fontWeight: '900', fontSize: 26 },
    headerAvatarPhoto: { width: 64, height: 64, borderRadius: 32 },
    cameraOverlay: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: '#0891b2', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    cameraOverlayLarge: { position: 'absolute', bottom: 2, right: 2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#0891b2', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'white' },
    headerTextBlock: { flex: 1 },
    headerGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600' },
    headerName: { color: 'white', fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
    headerBadgeRow: { flexDirection: 'row', marginTop: 6 },
    headerRoleBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    headerRoleBadgeText: { color: 'rgba(255,255,255,0.9)', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },

    // Old header (can remove)
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingTop: 10 },
    greetingTitle: { fontSize: 32, fontWeight: '900', letterSpacing: -0.8 },
    headerSubtitle: { fontSize: 12, color: '#22d3ee', fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
    headerActions: { flexDirection: 'row', alignItems: 'center' },
    logoutIcon: { marginRight: 10, borderRadius: 100 },
    avatar: { backgroundColor: '#0891b2', borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
    avatarLabel: { fontWeight: '900', color: 'white', fontSize: 18 },

    // Jornada Card
    jornadaCard: { borderRadius: 24, padding: 22, marginBottom: 20, marginHorizontal: 0 },
    jornadaBadge: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
    jornadaBadgeText: { fontSize: 10, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
    jornadaInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    jornadaMainText: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
    jornadaSubText: { fontSize: 15, fontWeight: '600' },
    jornadaHint: { fontSize: 12, marginTop: 10, lineHeight: 18 },
    pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#38bdf8', marginRight: 8 },
    resumenRow: { marginTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingTop: 12 },
    resumenItem: { fontSize: 13, fontWeight: '700', marginBottom: 4 },
    resumenObs: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
    adminBanner: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 10, padding: 8 },
    adminBannerText: { color: '#f59e0b', fontSize: 12, fontWeight: '700', flex: 1 },

    // Status Card (selectores)
    statusCard: { borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1 },
    statusCardTitle: { fontSize: 9, fontWeight: '900', letterSpacing: 2, marginBottom: 16, textTransform: 'uppercase' },
    statusItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
    statusIconBase: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    statusTextContainer: { flex: 1 },
    statusLabel: { fontSize: 9, fontWeight: '900', color: '#38bdf8', letterSpacing: 1.5, marginBottom: 2 },
    statusMainValue: { fontSize: 17, fontWeight: '800', letterSpacing: 0.3 },
    statusSubDetail: { fontSize: 12, marginTop: 1 },
    statusDivider: { height: 1, marginVertical: 16 },
    saveBtn: { borderRadius: 14, overflow: 'hidden' },
    saveBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 20 },
    saveBtnText: { color: 'white', fontWeight: '900', fontSize: 14, letterSpacing: 1, marginLeft: 6 },

    // Botón CONFIRMAR MI JORNADA
    confirmWrap: { borderRadius: 20, overflow: 'hidden', marginBottom: 24, elevation: 8, shadowColor: '#10b981', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, marginTop: 4 },
    confirmBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 18, paddingHorizontal: 20 },
    confirmBtnTitle: { color: 'white', fontWeight: '900', fontSize: 15, letterSpacing: 1 },
    confirmBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 2 },

    // Acciones rápidas
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, paddingLeft: 4, paddingHorizontal: 20 },
    sectionTitle: { fontSize: 18, fontWeight: '800', marginRight: 12 },
    accentLine: { flex: 1, height: 1 },
    actionCardWrapper: { marginBottom: 16, borderRadius: 22, overflow: 'hidden', elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 12 },
    actionGradient: { padding: 22 },
    actionContent: { flexDirection: 'row', alignItems: 'center' },
    actionIconContainer: { width: 56, height: 56, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 18 },
    actionItemTitle: { fontSize: 20, fontWeight: '900', color: 'white' },
    actionItemSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

    // Profile Modal
    modalContainer: { backgroundColor: 'transparent', padding: 20 },
    modalContent: { borderRadius: 28, overflow: 'hidden', elevation: 20 },
    modalHeader: { height: 90, alignItems: 'center', justifyContent: 'center' },
    modalHeaderGradient: { ...StyleSheet.absoluteFillObject },
    modalAvatarContainer: { position: 'absolute', bottom: -38, padding: 5, borderRadius: 50, elevation: 5 },
    largeAvatar: { backgroundColor: '#0891b2', borderWidth: 2, borderColor: 'white' },
    largeAvatarLabel: { fontSize: 30, fontWeight: '900' },
    largeAvatarPhoto: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: 'white' },
    closeModalButton: { position: 'absolute', top: 10, right: 10, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20 },
    modalBody: { paddingTop: 50, paddingHorizontal: 24, paddingBottom: 20, alignItems: 'center' },
    modalName: { fontSize: 22, fontWeight: '900', textAlign: 'center' },
    modalRole: { fontSize: 11, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4, marginBottom: 20 },
    infoDivider: { height: 1, width: '100%', marginVertical: 14 },
    infoRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16 },
    infoIconBox: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    infoLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
    infoValue: { fontSize: 14, fontWeight: '700' },
    modalCloseFooter: { paddingVertical: 18, alignItems: 'center', borderTopWidth: 1 },
    modalCloseText: { fontWeight: '800', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 },

    // Logout Modal
    logoutModalContainer: { backgroundColor: 'transparent', padding: 24 },
    logoutModalContent: { borderRadius: 28, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    logoutIconRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginBottom: 18 },
    logoutActionRow: { flexDirection: 'row', width: '100%', marginTop: 24, gap: 12 },
    logoutBtn: { flex: 1, height: 52, borderRadius: 15, overflow: 'hidden' },
    logoutBtnCancel: { backgroundColor: 'rgba(255,255,255,0.05)', justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    logoutBtnGradient: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
    logoutBtnTextCancel: { fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    logoutBtnTextConfirm: { color: 'white', fontWeight: '900', fontSize: 13, letterSpacing: 1 },
    confirmTitle: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5, marginBottom: 8 },
    confirmSubtitle: { fontSize: 14, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8 },

    // Selector Modal
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, marginBottom: 12, borderWidth: 1, paddingHorizontal: 4 },
    selectorItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, borderBottomWidth: 1 },
    selectorItemTitle: { fontSize: 15, fontWeight: '700' },
    selectorItemSubtitle: { fontSize: 12, marginTop: 2 },
});

export default HomeScreen;

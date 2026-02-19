import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl, Dimensions, TextInput } from 'react-native';
import { Text, useTheme, IconButton, Avatar, Modal, Portal, Switch } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { usePreferences } from '../context/PreferencesContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';
import { AppTheme } from '../theme/theme';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
    const theme = useTheme<AppTheme>();
    const { user, logout } = useAuth();
    const { toggleTheme, isThemeDark } = usePreferences();
    const [config, setConfig] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [profileModalVisible, setProfileModalVisible] = useState(false);
    const [logoutModalVisible, setLogoutModalVisible] = useState(false);

    // FASE 7: Selectores de ruta/vehículo
    const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState<any>(null);
    const [rutaSeleccionada, setRutaSeleccionada] = useState<any>(null);
    const [listaVehiculos, setListaVehiculos] = useState<any[]>([]);
    const [listaRutas, setListaRutas] = useState<any[]>([]);
    const [modalSelectorVisible, setModalSelectorVisible] = useState(false);
    const [tipoSelector, setTipoSelector] = useState<'vehiculo' | 'ruta'>('vehiculo');
    const [searchQuery, setSearchQuery] = useState('');
    const [cambiosPendientes, setCambiosPendientes] = useState(false);

    const fetchConfig = async () => {
        try {
            const res = await api.get('/choferes/configuracion');
            setConfig(res.data);
            // Inicializar seleccionados con los valores actuales
            setVehiculoSeleccionado(res.data.vehiculo);
            setRutaSeleccionada(res.data.ruta);
        } catch (error) {
            console.log('Error fetching config', error);
        } finally {
            setRefreshing(false);
        }
    };

    const fetchSelectores = async () => {
        try {
            const res = await api.get('/choferes/selectores-reporte');
            setListaVehiculos(res.data.vehiculos || []);
            setListaRutas(res.data.rutas || []);
        } catch (error) {
            console.log('Error fetching selectores', error);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchConfig();
            fetchSelectores();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchConfig();
    };

    // FASE 7: Funciones de cambio de ruta/vehículo
    const abrirSelector = (tipo: 'vehiculo' | 'ruta') => {
        setTipoSelector(tipo);
        setSearchQuery('');
        setModalSelectorVisible(true);
    };

    const seleccionarItem = (item: any) => {
        if (tipoSelector === 'vehiculo') {
            setVehiculoSeleccionado(item);
        } else {
            setRutaSeleccionada(item);
        }
        setCambiosPendientes(true);
        setModalSelectorVisible(false);
    };

    const guardarCambios = async () => {
        try {
            await api.post('/choferes/actualizar-asignacion', {
                hojaRepartoId: config.hojaRepartoId,
                rutaId: rutaSeleccionada?._id,
                vehiculoId: vehiculoSeleccionado?._id
            });
            setCambiosPendientes(false);
            fetchConfig(); // Refrescar
            alert('Cambios guardados exitosamente');
        } catch (error: any) {
            alert(error.response?.data?.error || 'Error al guardar cambios');
            console.log('Error guardando cambios:', error);
        }
    };

    const menuItems: {
        title: string;
        subtitle: string;
        icon: string;
        colors: [string, string, ...string[]];
        route: string;
        requiresDependency: boolean;
    }[] = [
            {
                title: "Cargar Kilometraje",
                subtitle: "Registro diario y control",
                icon: "speedometer",
                colors: ['#00d2ff', '#3a7bd5'], // Deep Blue / Cyan gradient
                route: "CargaKilometraje",
                requiresDependency: true
            },
            {
                title: "Mis entregas del día",
                subtitle: "Ver listado y gestionar",
                icon: "clipboard-text-play-outline",
                colors: ['#059669', '#10b981'], // Emerald / Green gradient
                route: "HojaReparto",
                requiresDependency: false
            }
        ];

    const filteredItems = menuItems.filter(item => {
        if (item.requiresDependency) {
            return user?.tipoContrato === 'relacionDependencia' || (!user?.tipoContrato);
        }
        return true;
    });

    const vehiculo = config?.vehiculo;
    const ruta = config?.ruta;
    const initial = user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'C';

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <StatusBar
                barStyle={isThemeDark ? "light-content" : "dark-content"}
                translucent
                backgroundColor="transparent"
            />

            <LinearGradient
                colors={[theme.colors.gradientStart, theme.colors.gradientEnd]} // Dynamic Gradient
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* NO MORE DECORATIVE CIRCLES AS REQUESTED */}

            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.colors.primary}
                        colors={[theme.colors.primary]}
                    />
                }
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={[styles.greetingTitle, { color: theme.colors.textPrimary }]}>
                            Hola, {user?.nombre?.split(' ')[0] || 'chofer'}
                        </Text>
                        <Text style={styles.headerSubtitle}>Panel de Operaciones</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity
                            onPress={() => setLogoutModalVisible(true)}
                            style={[styles.logoutIcon, { backgroundColor: isThemeDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
                        >
                            <IconButton icon="logout-variant" iconColor={theme.colors.error} size={24} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setProfileModalVisible(true)} activeOpacity={0.7}>
                            <Avatar.Text
                                size={44}
                                label={initial}
                                style={styles.avatar}
                                labelStyle={styles.avatarLabel}
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* STATUS CARDS (Clickeable - FASE 7) */}
                <View style={[styles.statusCard, {
                    backgroundColor: theme.colors.surfaceVariant,
                    borderColor: theme.colors.outline
                }]}>
                    <TouchableOpacity
                        style={styles.statusItem}
                        onPress={() => abrirSelector('vehiculo')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.statusIconBase, { backgroundColor: isThemeDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(8, 145, 178, 0.1)' }]}>
                            <IconButton icon="truck-delivery" iconColor={theme.colors.primary} size={24} style={{ margin: 0 }} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusLabel}>VEHÍCULO ASIGNADO</Text>
                            <Text style={[styles.statusMainValue, { color: theme.colors.textPrimary }]}>
                                {vehiculoSeleccionado ? vehiculoSeleccionado.patente?.toUpperCase() : 'NO ASIGNADO'}
                            </Text>
                            {vehiculoSeleccionado && (
                                <Text style={[styles.statusSubDetail, { color: theme.colors.textSecondary }]}>
                                    {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                                </Text>
                            )}
                        </View>
                        <IconButton icon="chevron-down" iconColor={theme.colors.outline} size={20} />
                    </TouchableOpacity>

                    <View style={[styles.statusDivider, { backgroundColor: theme.colors.outline }]} />

                    <TouchableOpacity
                        style={styles.statusItem}
                        onPress={() => abrirSelector('ruta')}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.statusIconBase, { backgroundColor: isThemeDark ? 'rgba(56, 189, 248, 0.05)' : 'rgba(8, 145, 178, 0.1)' }]}>
                            <IconButton icon="map-marker-distance" iconColor={theme.colors.primary} size={24} style={{ margin: 0 }} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusLabel}>RUTA ACTIVA</Text>
                            <Text style={[styles.statusMainValue, { color: theme.colors.textPrimary }]}>
                                {rutaSeleccionada ? rutaSeleccionada.codigo?.toUpperCase() : 'SIN RUTA'}
                            </Text>
                            {rutaSeleccionada && (
                                <View>
                                    <Text style={[styles.statusSubDetail, { color: theme.colors.tertiary, fontWeight: 'bold' }]}>
                                        {config?.hojaRepartoCodigo || 'H. PENDIENTE'}
                                    </Text>
                                    <Text style={[styles.statusSubDetail, { fontSize: 11, opacity: 0.7, color: theme.colors.textSecondary }]}>
                                        {rutaSeleccionada.horaSalida ? `Salida: ${rutaSeleccionada.horaSalida}` : ''}
                                    </Text>
                                </View>
                            )}
                        </View>
                        <IconButton icon="chevron-down" iconColor={theme.colors.outline} size={20} />
                    </TouchableOpacity>
                </View>

                {/* BOTÓN CONFIRMAR CAMBIOS (Solo visible si hay cambios) */}
                {cambiosPendientes && (
                    <TouchableOpacity style={styles.confirmButton} onPress={guardarCambios} activeOpacity={0.9}>
                        <LinearGradient
                            colors={['#10b981', '#059669']}
                            style={styles.confirmGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                        >
                            <IconButton icon="check-circle" iconColor="white" size={24} />
                            <Text style={styles.confirmButtonText}>Confirmar Cambios</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                )}

                <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: theme.colors.textPrimary }]}>Acciones Rápidas</Text>
                    <View style={[styles.accentLine, { backgroundColor: theme.colors.outline }]} />
                </View>

                {/* ACTION CARDS */}
                {filteredItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.85}
                        onPress={() => navigation.navigate(item.route)}
                        style={styles.actionCardWrapper}
                    >
                        <LinearGradient
                            colors={item.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.actionGradient}
                        >
                            <View style={styles.actionContent}>
                                <View style={styles.actionIconContainer}>
                                    <IconButton icon={item.icon} iconColor="white" size={32} />
                                </View>
                                <View style={styles.actionTextContent}>
                                    <Text style={styles.actionItemTitle}>{item.title}</Text>
                                    <Text style={styles.actionItemSubtitle}>{item.subtitle}</Text>
                                </View>
                                <IconButton icon="chevron-right" iconColor="rgba(255,255,255,0.7)" size={24} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* PROFILE MODAL (GOD TIER) */}
            <Portal>
                <Modal
                    visible={profileModalVisible}
                    onDismiss={() => setProfileModalVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        {/* Header with Background Accent */}
                        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
                            <LinearGradient
                                colors={[theme.colors.primary, theme.colors.secondary]} // Dynamic Gradient
                                style={styles.modalHeaderGradient}
                            />
                            <View style={[styles.modalAvatarContainer, { backgroundColor: theme.colors.surface }]}>
                                <Avatar.Text
                                    size={80}
                                    label={initial}
                                    style={styles.largeAvatar}
                                    labelStyle={styles.largeAvatarLabel}
                                />
                            </View>
                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setProfileModalVisible(false)}
                            >
                                <IconButton icon="close" iconColor="white" size={20} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            <Text style={[styles.modalName, { color: theme.colors.textPrimary }]}>{user?.nombre || 'Usuario'}</Text>
                            <Text style={[styles.modalRole, { color: theme.colors.primary }]}>
                                {user?.rol?.toUpperCase() || 'CHOFER'}
                            </Text>

                            <View style={[styles.infoDivider, { backgroundColor: theme.colors.outline }]} />

                            {/* Info Rows */}
                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconBox, { backgroundColor: isThemeDark ? 'rgba(8, 145, 178, 0.1)' : '#ecfeff' }]}>
                                    <IconButton icon="email-outline" iconColor={theme.colors.primary} size={20} />
                                </View>
                                <View>
                                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>EMAIL</Text>
                                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>{user?.email || 'N/A'}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconBox, { backgroundColor: isThemeDark ? 'rgba(8, 145, 178, 0.1)' : '#ecfeff' }]}>
                                    <IconButton icon="file-document-outline" iconColor={theme.colors.primary} size={20} />
                                </View>
                                <View>
                                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>CONTRATO</Text>
                                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                                        {user?.tipoContrato === 'relacionDependencia' ? 'Relación Dependencia' : 'Externo / Monotributo'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={[styles.infoIconBox, { backgroundColor: isThemeDark ? 'rgba(8, 145, 178, 0.1)' : '#ecfeff' }]}>
                                    <IconButton icon="shield-check-outline" iconColor={theme.colors.primary} size={20} />
                                </View>
                                <View>
                                    <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>ID DE EMPLEADO</Text>
                                    <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>#{user?.id?.substring(0, 8).toUpperCase() || '---'}</Text>
                                </View>
                            </View>

                            {/* THEME SWITCHER (GOD TIER ADDITION) */}
                            <View style={[styles.infoDivider, { backgroundColor: theme.colors.outline }]} />
                            <View style={[styles.infoRow, { justifyContent: 'space-between', paddingRight: 10 }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <View style={[styles.infoIconBox, { backgroundColor: isThemeDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' }]}>
                                        <IconButton icon="theme-light-dark" iconColor={theme.colors.tertiary} size={20} />
                                    </View>
                                    <View>
                                        <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>TEMA</Text>
                                        <Text style={[styles.infoValue, { color: theme.colors.textPrimary }]}>
                                            {isThemeDark ? 'Modo Oscuro' : 'Modo Claro'}
                                        </Text>
                                    </View>
                                </View>
                                <Switch value={isThemeDark} onValueChange={toggleTheme} color={theme.colors.primary} />
                            </View>

                        </View>

                        <TouchableOpacity
                            style={styles.modalCloseFooter}
                            onPress={() => setProfileModalVisible(false)}
                        >
                            <Text style={[styles.modalCloseText, { color: theme.colors.textSecondary }]}>Cerrar Perfil</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            </Portal>

            {/* LOGOUT CONFIRMATION MODAL (GOD TIER) */}
            <Portal>
                <Modal
                    visible={logoutModalVisible}
                    onDismiss={() => setLogoutModalVisible(false)}
                    contentContainerStyle={styles.logoutModalContainer}
                    theme={{ colors: { backdrop: theme.colors.backdrop } }}
                >
                    <View style={[styles.logoutModalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={[styles.logoutIconRing, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                            <IconButton icon="logout-variant" size={32} iconColor="#ef4444" />
                        </View>
                        <Text style={[styles.confirmTitle, { color: theme.colors.textPrimary }]}>¿Cerrar Sesión?</Text>
                        <Text style={[styles.confirmSubtitle, { color: theme.colors.textSecondary }]}>
                            Tu jornada se guardará, pero tendrás que volver a ingresar tus credenciales.
                        </Text>

                        <View style={styles.logoutActionRow}>
                            <TouchableOpacity
                                onPress={() => setLogoutModalVisible(false)}
                                style={[styles.logoutBtn, styles.logoutBtnCancel, { borderColor: theme.colors.outline }]}
                            >
                                <Text style={[styles.logoutBtnTextCancel, { color: theme.colors.textSecondary }]}>CANCELAR</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={logout}
                                activeOpacity={0.9}
                                style={styles.logoutBtn}
                            >
                                <LinearGradient
                                    colors={['#ef4444', '#b91c1c']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.logoutBtnGradient}
                                >
                                    <Text style={styles.logoutBtnTextConfirm}>SALIR</Text>
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </Portal>

            {/* MODAL SELECTOR (Vehículo / Ruta) - FASE 7 */}
            <Portal>
                <Modal
                    visible={modalSelectorVisible}
                    onDismiss={() => setModalSelectorVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                    theme={{ colors: { backdrop: isThemeDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' } }}
                >
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
                        <View style={[styles.modalHeader, { backgroundColor: theme.colors.surface }]}>
                            <LinearGradient
                                colors={[theme.colors.primary, theme.colors.secondary]}
                                style={styles.modalHeaderGradient}
                            />
                            <Text style={[styles.modalName, { color: theme.colors.textPrimary }]}>
                                {tipoSelector === 'vehiculo' ? 'Seleccionar Vehículo' : 'Seleccionar Ruta'}
                            </Text>
                            <TouchableOpacity
                                style={[styles.closeModalButton, { backgroundColor: theme.colors.surfaceVariant }]}
                                onPress={() => setModalSelectorVisible(false)}
                            >
                                <IconButton icon="close" iconColor={theme.colors.onSurfaceVariant} size={20} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Search Input */}
                            <View style={[styles.searchContainer, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
                                <IconButton icon="magnify" iconColor={theme.colors.textSecondary} size={20} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        padding: 8,
                                        color: theme.colors.textPrimary,
                                        fontSize: 14,
                                    }}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder={`Buscar ${tipoSelector === 'vehiculo' ? 'vehículo' : 'ruta'}...`}
                                    placeholderTextColor={theme.colors.textSecondary}
                                />
                            </View>

                            {/* Lista */}
                            <ScrollView style={{ maxHeight: 400 }}>
                                {(tipoSelector === 'vehiculo' ? listaVehiculos : listaRutas)
                                    .filter((item: any) => {
                                        const query = searchQuery.toLowerCase();
                                        if (tipoSelector === 'vehiculo') {
                                            return item.patente?.toLowerCase().includes(query) ||
                                                item.marca?.toLowerCase().includes(query) ||
                                                item.modelo?.toLowerCase().includes(query);
                                        } else {
                                            return item.codigo?.toLowerCase().includes(query) ||
                                                item.descripcion?.toLowerCase().includes(query);
                                        }
                                    })
                                    .map((item: any) => (
                                        <TouchableOpacity
                                            key={item._id}
                                            style={[styles.selectorItem, { borderBottomColor: theme.colors.outline }]}
                                            onPress={() => seleccionarItem(item)}
                                        >
                                            <View>
                                                <Text style={[styles.selectorItemTitle, { color: theme.colors.textPrimary }]}>
                                                    {tipoSelector === 'vehiculo' ? item.patente : item.codigo}
                                                </Text>
                                                <Text style={[styles.selectorItemSubtitle, { color: theme.colors.textSecondary }]}>
                                                    {tipoSelector === 'vehiculo'
                                                        ? `${item.marca} ${item.modelo}`
                                                        : item.descripcion || `Salida: ${item.horaSalida}`
                                                    }
                                                </Text>
                                            </View>
                                            <IconButton icon="chevron-right" iconColor={theme.colors.textSecondary} size={20} />
                                        </TouchableOpacity>
                                    ))}
                            </ScrollView>
                        </View>
                    </View>
                </Modal>
            </Portal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#020617',
    },
    scrollContent: {
        paddingTop: 60, // Space for translucent status bar
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    // HEADER
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingTop: 10,
    },
    headerInfo: {
        flex: 1,
    },
    greetingTitle: {
        fontSize: 34,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.8,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#22d3ee',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        marginTop: -2,
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    logoutIcon: {
        marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: 100,
    },
    avatar: {
        backgroundColor: '#0891b2',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarLabel: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: 18,
    },
    // NEW STATUS CARD (STABLE)
    statusCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 24,
        padding: 24,
        marginBottom: 35,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIconBase: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: 'rgba(56, 189, 248, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 9,
        fontWeight: '900',
        color: '#38bdf8',
        letterSpacing: 1.5,
        marginBottom: 2,
        opacity: 0.8,
    },
    statusMainValue: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
        letterSpacing: 0.5,
    },
    statusSubDetail: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.5)',
        marginTop: 1,
    },
    statusDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginVertical: 18,
    },
    // SECTION HEADER
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        paddingLeft: 4,
    },
    sectionTitle: {
        fontSize: 19,
        fontWeight: '800',
        color: 'white',
        marginRight: 12,
    },
    accentLine: {
        flex: 1,
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    // ACTION CARDS
    actionCardWrapper: {
        marginBottom: 20,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
    },
    actionGradient: {
        padding: 24,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 20,
    },
    actionTextContent: {
        flex: 1,
    },
    actionItemTitle: {
        fontSize: 22,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 0.5,
    },
    actionItemSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        marginTop: 1,
    },
    // PROFILE MODAL STYLES
    modalContainer: {
        backgroundColor: 'transparent',
        padding: 20,
        justifyContent: 'center',
    },
    modalContent: {
        backgroundColor: '#1e293b', // Fondo oscuro
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 20,
    },
    modalHeader: {
        height: 100,
        backgroundColor: '#0f172a', // Más oscuro para contraste
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalHeaderGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    modalAvatarContainer: {
        position: 'absolute',
        bottom: -40,
        backgroundColor: '#1e293b', // Match modal background
        padding: 5,
        borderRadius: 50,
        elevation: 5,
    },
    largeAvatar: {
        backgroundColor: '#0891b2',
        borderWidth: 2,
        borderColor: 'white',
    },
    largeAvatarLabel: {
        fontSize: 32,
        fontWeight: '900',
    },
    closeModalButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 20,
    },
    modalBody: {
        paddingTop: 50,
        paddingHorizontal: 24,
        paddingBottom: 24,
        alignItems: 'center',
    },
    modalName: {
        fontSize: 24,
        fontWeight: '900',
        color: '#ffffff', // Blanco para fondo oscuro
        textAlign: 'center',
    },
    modalRole: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0891b2',
        letterSpacing: 2,
        textTransform: 'uppercase',
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 24,
    },
    modalDivider: {
        width: '100%',
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)', // Más claro para fondo oscuro
        marginVertical: 20,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginBottom: 18,
    },
    infoIconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: '#f0f9ff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    infoLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: '#94a3b8',
        letterSpacing: 1,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#334155',
    },
    modalCloseFooter: {
        backgroundColor: '#f8fafc',
        paddingVertical: 20,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    modalCloseText: {
        color: '#64748b',
        fontWeight: '800',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    // LOGOUT MODAL SPECIFIC
    logoutModalContainer: {
        backgroundColor: 'transparent',
        padding: 24,
        justifyContent: 'center',
    },
    logoutModalContent: {
        borderRadius: 32,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    logoutIconRing: {
        width: 70,
        height: 70,
        borderRadius: 35,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoutActionRow: {
        flexDirection: 'row',
        width: '100%',
        marginTop: 25,
        gap: 12,
    },
    logoutBtn: {
        flex: 1,
        height: 54,
        borderRadius: 16,
        overflow: 'hidden',
    },
    logoutBtnCancel: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    logoutBtnGradient: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoutBtnTextCancel: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    logoutBtnTextConfirm: {
        color: 'white',
        fontWeight: '900',
        fontSize: 14,
        letterSpacing: 1,
    },
    confirmTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        letterSpacing: -0.5,
        marginBottom: 10,
    },
    confirmSubtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 22,
        paddingHorizontal: 10,
    },
    // FASE 7: Estilos para confirmación de cambios
    confirmButton: {
        marginTop: 20,
        marginBottom: 10,
        borderRadius: 12,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    confirmGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
    },
    confirmButtonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 10,
        fontSize: 15,
        letterSpacing: 0.5,
    },
    infoDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        width: '100%',
        marginVertical: 15,
    },
    // FIXED: Eliminar duplicado, mantener solo este
    // (Espacio reservado para modalContainer definido arriba)
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 5
    },
    selectorItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    selectorItemTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    selectorItemSubtitle: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 13,
        marginTop: 2,
    },
});

export default HomeScreen;

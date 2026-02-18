import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl, Dimensions, TextInput } from 'react-native';
import { Text, useTheme, IconButton, Avatar, Modal, Portal } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { user, logout } = useAuth();
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
                title: "Hoja de Reparto",
                subtitle: "Mis entregas del día",
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
        <View style={styles.container}>
            <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

            <LinearGradient
                colors={['#020617', '#0f172a']} // Deep Navy / Pure Black
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
                        tintColor="white"
                        colors={['#22d3ee']}
                    />
                }
            >
                {/* HEADER */}
                <View style={styles.header}>
                    <View style={styles.headerInfo}>
                        <Text style={styles.greetingTitle}>Hola, {user?.nombre?.split(' ')[0] || 'chofer'}</Text>
                        <Text style={styles.headerSubtitle}>Panel de Operaciones</Text>
                    </View>
                    <View style={styles.headerActions}>
                        <TouchableOpacity onPress={() => setLogoutModalVisible(true)} style={styles.logoutIcon}>
                            <IconButton icon="logout-variant" iconColor="#ef4444" size={24} />
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
                <View style={styles.statusCard}>
                    <TouchableOpacity
                        style={styles.statusItem}
                        onPress={() => abrirSelector('vehiculo')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.statusIconBase}>
                            <IconButton icon="truck-delivery" iconColor="#38bdf8" size={24} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusLabel}>VEHÍCULO ASIGNADO</Text>
                            <Text style={styles.statusMainValue}>
                                {vehiculoSeleccionado ? vehiculoSeleccionado.patente?.toUpperCase() : 'NO ASIGNADO'}
                            </Text>
                            {vehiculoSeleccionado && (
                                <Text style={styles.statusSubDetail}>
                                    {vehiculoSeleccionado.marca} {vehiculoSeleccionado.modelo}
                                </Text>
                            )}
                        </View>
                        <IconButton icon="chevron-down" iconColor="rgba(255,255,255,0.5)" size={20} />
                    </TouchableOpacity>

                    <View style={styles.statusDivider} />

                    <TouchableOpacity
                        style={styles.statusItem}
                        onPress={() => abrirSelector('ruta')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.statusIconBase}>
                            <IconButton icon="map-marker-distance" iconColor="#38bdf8" size={24} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusLabel}>RUTA ACTIVA</Text>
                            <Text style={styles.statusMainValue}>
                                {rutaSeleccionada ? rutaSeleccionada.codigo?.toUpperCase() : 'SIN RUTA'}
                            </Text>
                            {rutaSeleccionada && (
                                <Text style={styles.statusSubDetail}>
                                    {rutaSeleccionada.horaSalida ? `Salida estimada: ${rutaSeleccionada.horaSalida}` : 'Horario no definido'}
                                </Text>
                            )}
                        </View>
                        <IconButton icon="chevron-down" iconColor="rgba(255,255,255,0.5)" size={20} />
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
                    <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
                    <View style={styles.accentLine} />
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
                    <View style={styles.modalContent}>
                        {/* Header with Background Accent */}
                        <View style={styles.modalHeader}>
                            <LinearGradient
                                colors={['#0891b2', '#164e63']}
                                style={styles.modalHeaderGradient}
                            />
                            <View style={styles.modalAvatarContainer}>
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
                            <Text style={styles.modalName}>{user?.nombre || 'Usuario'}</Text>
                            <Text style={styles.modalRole}>
                                {user?.rol?.toUpperCase() || 'CHOFER'}
                            </Text>

                            <View style={styles.infoDivider} />

                            {/* Info Rows */}
                            <View style={styles.infoRow}>
                                <View style={styles.infoIconBox}>
                                    <IconButton icon="email-outline" iconColor="#0891b2" size={20} />
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>EMAIL</Text>
                                    <Text style={styles.infoValue}>{user?.email || 'N/A'}</Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoIconBox}>
                                    <IconButton icon="file-document-outline" iconColor="#0891b2" size={20} />
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>CONTRATO</Text>
                                    <Text style={styles.infoValue}>
                                        {user?.tipoContrato === 'relacionDependencia' ? 'Relación Dependencia' : 'Externo / Monotributo'}
                                    </Text>
                                </View>
                            </View>

                            <View style={styles.infoRow}>
                                <View style={styles.infoIconBox}>
                                    <IconButton icon="shield-check-outline" iconColor="#0891b2" size={20} />
                                </View>
                                <View>
                                    <Text style={styles.infoLabel}>ID DE EMPLEADO</Text>
                                    <Text style={styles.infoValue}>#{user?.id?.substring(0, 8).toUpperCase() || '---'}</Text>
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={styles.modalCloseFooter}
                            onPress={() => setProfileModalVisible(false)}
                        >
                            <Text style={styles.modalCloseText}>Cerrar Perfil</Text>
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
                >
                    <LinearGradient
                        colors={['#1e1b4b', '#020617']}
                        style={styles.logoutModalContent}
                    >
                        <View style={[styles.logoutIconRing, { borderColor: 'rgba(239, 68, 68, 0.3)', backgroundColor: 'rgba(239, 68, 68, 0.05)' }]}>
                            <IconButton icon="logout-variant" size={32} iconColor="#ef4444" />
                        </View>
                        <Text style={styles.confirmTitle}>¿Cerrar Sesión?</Text>
                        <Text style={styles.confirmSubtitle}>Tu jornada se guardará, pero tendrás que volver a ingresar tus credenciales.</Text>

                        <View style={styles.logoutActionRow}>
                            <TouchableOpacity
                                onPress={() => setLogoutModalVisible(false)}
                                style={[styles.logoutBtn, styles.logoutBtnCancel]}
                            >
                                <Text style={styles.logoutBtnTextCancel}>CANCELAR</Text>
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
                    </LinearGradient>
                </Modal>
            </Portal>

            {/* MODAL SELECTOR (Vehículo / Ruta) - FASE 7 */}
            <Portal>
                <Modal
                    visible={modalSelectorVisible}
                    onDismiss={() => setModalSelectorVisible(false)}
                    contentContainerStyle={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <LinearGradient
                                colors={['#0891b2', '#164e63']}
                                style={styles.modalHeaderGradient}
                            />
                            <Text style={styles.modalName}>
                                {tipoSelector === 'vehiculo' ? 'Seleccionar Vehículo' : 'Seleccionar Ruta'}
                            </Text>
                            <TouchableOpacity
                                style={styles.closeModalButton}
                                onPress={() => setModalSelectorVisible(false)}
                            >
                                <IconButton icon="close" iconColor="white" size={20} />
                            </TouchableOpacity>
                        </View>

                        <View style={styles.modalBody}>
                            {/* Search Input */}
                            <View style={styles.searchContainer}>
                                <IconButton icon="magnify" iconColor="#94a3b8" size={20} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        padding: 8,
                                        color: '#fff',
                                        fontSize: 14,
                                    }}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    placeholder={`Buscar ${tipoSelector === 'vehiculo' ? 'vehículo' : 'ruta'}...`}
                                    placeholderTextColor="#64748b"
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
                                            style={styles.selectorItem}
                                            onPress={() => seleccionarItem(item)}
                                        >
                                            <View>
                                                <Text style={styles.selectorItemTitle}>
                                                    {tipoSelector === 'vehiculo' ? item.patente : item.codigo}
                                                </Text>
                                                <Text style={styles.selectorItemSubtitle}>
                                                    {tipoSelector === 'vehiculo'
                                                        ? `${item.marca} ${item.modelo}`
                                                        : item.descripcion || `Salida: ${item.horaSalida}`
                                                    }
                                                </Text>
                                            </View>
                                            <IconButton icon="chevron-right" iconColor="#64748b" size={20} />
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
        marginBottom: 20,
        marginHorizontal: 20,
        borderRadius: 12,
        overflow: 'hidden',
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
        fontSize: 16,
        fontWeight: '700',
        marginLeft: 8,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
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

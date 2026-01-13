import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl, Dimensions } from 'react-native';
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

    const fetchConfig = async () => {
        try {
            const res = await api.get('/choferes/configuracion');
            setConfig(res.data);
        } catch (error) {
            console.log('Error fetching config', error);
        } finally {
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            fetchConfig();
        }, [])
    );

    const onRefresh = () => {
        setRefreshing(true);
        fetchConfig();
    };

    const menuItems: {
        title: string;
        subtitle: string;
        icon: string;
        colors: string[];
        route: string;
        requiresDependency: boolean;
    }[] = [
            {
                title: "Cargar Kilometraje",
                subtitle: "Registro diario y control",
                icon: "speedometer",
                colors: ['#06b6d4', '#0891b2'], // Cyan / Teal
                route: "CargaKilometraje",
                requiresDependency: true
            },
            {
                title: "Hoja de Reparto",
                subtitle: "Mis entregas del día",
                icon: "clipboard-text-play-outline",
                colors: ['#22d3ee', '#06b6d4'], // Brighter Cyan
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
                colors={['#083344', '#164e63']} // Deep Cyan / Dark Teal background
                style={StyleSheet.absoluteFill}
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
                        <TouchableOpacity onPress={logout} style={styles.logoutIcon}>
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

                {/* REDESIGNED STATUS CARD - STABLE & CLEAN */}
                <View style={styles.statusCard}>
                    <View style={styles.statusItem}>
                        <View style={[styles.statusIconBase, { backgroundColor: '#22d3ee15' }]}>
                            <IconButton icon="truck-delivery" iconColor="#22d3ee" size={24} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusLabel}>VEHÍCULO ASIGNADO</Text>
                            <Text style={styles.statusMainValue}>
                                {vehiculo ? vehiculo.patente?.toUpperCase() : 'NO ASIGNADO'}
                            </Text>
                            {vehiculo && (
                                <Text style={styles.statusSubDetail}>
                                    {vehiculo.marca} {vehiculo.modelo}
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={styles.statusDivider} />

                    <View style={styles.statusItem}>
                        <View style={[styles.statusIconBase, { backgroundColor: '#06b6d415' }]}>
                            <IconButton icon="map-marker-distance" iconColor="#22d3ee" size={24} />
                        </View>
                        <View style={styles.statusTextContainer}>
                            <Text style={styles.statusLabel}>RUTA ACTIVA</Text>
                            <Text style={styles.statusMainValue}>
                                {ruta ? ruta.codigo?.toUpperCase() : 'SIN RUTA'}
                            </Text>
                            {ruta && (
                                <Text style={styles.statusSubDetail}>
                                    {ruta.horaSalida ? `Salida estimada: ${ruta.horaSalida}` : 'Horario no definido'}
                                </Text>
                            )}
                        </View>
                    </View>
                </View>

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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#083344',
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
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderRadius: 28,
        padding: 24,
        marginBottom: 35,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    statusItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIconBase: {
        width: 52,
        height: 52,
        borderRadius: 26,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    statusTextContainer: {
        flex: 1,
    },
    statusLabel: {
        fontSize: 10,
        fontWeight: '900',
        color: 'rgba(34, 211, 238, 0.6)',
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    statusMainValue: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
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
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    // ACTION CARDS
    actionCardWrapper: {
        marginBottom: 16,
        borderRadius: 28,
        overflow: 'hidden',
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    actionGradient: {
        padding: 24,
    },
    actionContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionIconContainer: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: 'rgba(255,255,255,0.18)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 18,
    },
    actionTextContent: {
        flex: 1,
    },
    actionItemTitle: {
        fontSize: 21,
        fontWeight: 'bold',
        color: 'white',
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
        backgroundColor: 'white',
        borderRadius: 32,
        overflow: 'hidden',
        elevation: 20,
    },
    modalHeader: {
        height: 100,
        backgroundColor: '#0891b2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalHeaderGradient: {
        ...StyleSheet.absoluteFillObject,
    },
    modalAvatarContainer: {
        position: 'absolute',
        bottom: -40,
        backgroundColor: 'white',
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
        color: '#1e293b',
        textAlign: 'center',
    },
    modalRole: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0891b2',
        letterSpacing: 2,
        marginTop: 4,
        marginBottom: 20,
    },
    infoDivider: {
        width: '100%',
        height: 1,
        backgroundColor: '#f1f5f9',
        marginBottom: 20,
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
});

export default HomeScreen;

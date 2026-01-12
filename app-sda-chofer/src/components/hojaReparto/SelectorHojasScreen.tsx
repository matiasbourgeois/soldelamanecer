
import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useTheme, Avatar, IconButton, Modal, Portal, Button, Divider, Surface } from 'react-native-paper';
import { useAuth } from '../../hooks/useAuth';

interface SelectorHojasScreenProps {
    hojas: any[];
    onSeleccionarHoja: (hojaSeleccionada: any) => void;
}

const SelectorHojasScreen: React.FC<SelectorHojasScreenProps> = ({ hojas, onSeleccionarHoja }) => {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const [profileVisible, setProfileVisible] = useState(false);

    // Sort hojas: Newest first (Descending)
    const hojasOrdenadas = useMemo(() => {
        return [...hojas].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    }, [hojas]);

    // Profile Modal Handlers
    const showProfile = () => setProfileVisible(true);
    const hideProfile = () => setProfileVisible(false);
    const handleLogout = () => {
        hideProfile();
        setTimeout(logout, 200);
    };

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={styles.headerTopRow}>
                <View>
                    <Text style={styles.greetingLabel}>Bienvenido,</Text>
                    <Text style={styles.greetingName}>{user?.nombre?.split(' ')[0] || 'Chofer'}</Text>
                </View>

                <TouchableOpacity style={styles.profileButton} activeOpacity={0.7} onPress={showProfile}>
                    <Avatar.Text
                        size={48}
                        label={user?.nombre?.substring(0, 2).toUpperCase() || 'CH'}
                        style={{ backgroundColor: theme.colors.primaryContainer }}
                        color={theme.colors.onPrimaryContainer}
                    />
                </TouchableOpacity>
            </View>
            <Text style={styles.dateText}>
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
        </View>
    );

    const renderProfileModal = () => (
        <Portal>
            <Modal visible={profileVisible} onDismiss={hideProfile} contentContainerStyle={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Avatar.Text
                        size={80}
                        label={user?.nombre?.substring(0, 2).toUpperCase() || 'CH'}
                        style={{ backgroundColor: theme.colors.primaryContainer, marginBottom: 16 }}
                        color={theme.colors.onPrimaryContainer}
                    />
                    <Text style={styles.modalName}>{user?.nombre || 'Usuario'}</Text>
                    <Text style={styles.modalRole}>Chofer / Repartidor</Text>

                    <Divider style={{ width: '100%', marginVertical: 20 }} />

                    <Button
                        mode="contained"
                        onPress={handleLogout}
                        buttonColor={theme.colors.error}
                        icon="logout"
                        style={styles.logoutButton}
                        contentStyle={{ height: 48 }}
                    >
                        Cerrar Sesión
                    </Button>

                    <Button
                        mode="text"
                        onPress={hideProfile}
                        textColor="#868e96"
                        style={{ marginTop: 10 }}
                    >
                        Cancelar
                    </Button>
                </View>
            </Modal>
        </Portal>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyStateContainer}>
            <Surface style={styles.emptyIconCircle} elevation={0}>
                <IconButton icon="truck-fast-outline" size={48} iconColor="#adb5bd" />
            </Surface>
            <Text style={styles.emptyStateTitle}>Todo listo por hoy</Text>
            <Text style={styles.emptyStateText}>
                No tenés hojas de reparto activas.{'\n'}¡Buen descanso! ☕
            </Text>
        </View>
    );

    const renderItem = ({ item }: { item: any }) => {
        const fecha = new Date(item.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        const isPending = item.estado === 'pendiente';
        const isCompleted = item.estado === 'completado';

        // Dynamic Accent Color
        let accentColor = theme.colors.primary;
        if (isPending) accentColor = '#fcc419';
        if (isCompleted) accentColor = '#0ca678';

        return (
            <View style={styles.cardOuterShadow}>
                <View style={styles.cardInnerClip}>
                    <TouchableOpacity
                        style={styles.cardBtn}
                        onPress={() => onSeleccionarHoja(item)}
                        activeOpacity={0.9}
                    >
                        {/* Standard Strip - Clipped by cardInnerClip */}
                        <View style={[styles.cardStrip, { backgroundColor: accentColor }]} />

                        <View style={styles.cardBody}>
                            <View style={styles.cardRow}>
                                <View style={[styles.statusBadge, { backgroundColor: `${accentColor}15` }]}>
                                    <Text style={[styles.statusText, { color: accentColor }]}>
                                        {item.estado?.toUpperCase().replace('_', ' ') || 'EN PROCESO'}
                                    </Text>
                                </View>
                                <Text style={styles.dateLabel}>{fecha}</Text>
                            </View>

                            <Text style={styles.sheetTitle}>
                                Hoja #{item.numeroHoja || item._id.slice(-6).toUpperCase()}
                            </Text>

                            <View style={styles.metaRow}>
                                <View style={styles.metaItem}>
                                    <IconButton icon="map-marker-path" size={20} iconColor="#868e96" style={styles.metaIcon} />
                                    <Text style={styles.metaText}>{item.ruta?.codigo || "Ruta General"}</Text>
                                </View>
                                <View style={styles.metaDivider} />
                                <View style={styles.metaItem}>
                                    <IconButton icon="package-variant-closed" size={20} iconColor="#868e96" style={styles.metaIcon} />
                                    <Text style={styles.metaText}>{item.envios?.length || 0} Envíos</Text>
                                </View>
                            </View>
                        </View>

                        <View style={styles.arrowContainer}>
                            <IconButton icon="chevron-right" iconColor={theme.colors.onSurfaceDisabled} size={32} />
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            <View style={styles.headerBackground}>
                {renderHeader()}
            </View>

            <View style={styles.contentContainer}>
                <Text style={styles.sectionTitle}>TUS TAREAS</Text>

                <FlatList
                    data={hojasOrdenadas}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    showsVerticalScrollIndicator={false}
                />
            </View>

            {/* Profile Modal */}
            {renderProfileModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    headerBackground: {
        backgroundColor: '#ffffff',
        paddingHorizontal: 24,
        paddingTop: 60,
        paddingBottom: 24,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        elevation: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f3f5'
    },
    headerContainer: {
        width: '100%',
    },
    headerTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greetingLabel: {
        fontSize: 15,
        color: '#868e96',
        fontWeight: '500',
    },
    greetingName: {
        fontSize: 28,
        fontWeight: '900',
        color: '#212529',
        letterSpacing: -0.5,
    },
    dateText: {
        fontSize: 15,
        color: '#adb5bd',
        fontWeight: '500',
        textTransform: 'capitalize',
        marginTop: 6,
    },
    profileButton: {},

    // Profile Modal
    modalContainer: {
        backgroundColor: 'white',
        margin: 40,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },
    modalContent: {
        width: '100%',
        alignItems: 'center',
    },
    modalName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#212529',
    },
    modalRole: {
        fontSize: 16,
        color: '#868e96',
        marginTop: 4,
    },
    logoutButton: {
        width: '100%',
        borderRadius: 14,
    },

    // Content
    contentContainer: {
        flex: 1,
        paddingHorizontal: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#adb5bd',
        marginTop: 28,
        marginBottom: 16,
        letterSpacing: 1.2,
    },
    listContent: {
        paddingBottom: 40,
    },

    // --- CARD MAGIC START ---
    // Layer 1: The Shadow Caster
    // Responsibility: Shadow + Background (so shadow works) + Radius
    // NO overflow hidden here, or shadow dies on Android.
    cardOuterShadow: {
        marginBottom: 20,
        borderRadius: 24,
        backgroundColor: 'white',
        elevation: 6, // Refined shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginHorizontal: 4,
    },
    // Layer 2: The Content Clipper
    // Responsibility: Clip the inner content (the Strip) to the border radius.
    // MUST match border radius of Layer 1.
    cardInnerClip: {
        flex: 1,
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'white',
    },
    // Layer 3: Interaction
    cardBtn: {
        flexDirection: 'row',
        height: 140,
    },
    // The Strip: Pure Rectangle, clipped by Layer 2
    cardStrip: {
        width: 8,
        height: '100%',
    },
    // --- CARD MAGIC END ---

    cardBody: {
        flex: 1,
        paddingVertical: 20,
        paddingHorizontal: 18,
        justifyContent: 'center',
    },
    cardRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    dateLabel: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '700',
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#212529',
        marginBottom: 14,
        letterSpacing: -0.5,
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaDivider: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#dee2e6',
        marginHorizontal: 10,
    },
    metaIcon: {
        margin: 0,
        padding: 0,
        width: 20,
        height: 20,
        marginRight: 6
    },
    metaText: {
        fontSize: 14,
        color: '#495057',
        fontWeight: '600',
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingRight: 10,
    },

    // Empty State
    emptyStateContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 80,
    },
    emptyIconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#f1f3f5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyStateTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#868e96',
        textAlign: 'center',
        lineHeight: 24,
    },
});

export default SelectorHojasScreen;

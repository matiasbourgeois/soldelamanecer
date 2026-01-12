import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, StatusBar, RefreshControl } from 'react-native';
import { Text, Surface, useTheme, IconButton } from 'react-native-paper';
import { useAuth } from '../hooks/useAuth';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { api } from '../api/client';

const HomeScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { user, logout } = useAuth();
    const [config, setConfig] = useState<any>(null);
    const [refreshing, setRefreshing] = useState(false);

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
        colors: any;
        route: string;
        requiresDependency: boolean;
    }[] = [
            {
                title: "Cargar Kilometraje",
                subtitle: "Registro diario y control",
                icon: "speedometer",
                colors: ['#1098ad', '#0b7285'],
                route: "CargaKilometraje",
                requiresDependency: true
            },
            {
                title: "Hoja de Reparto",
                subtitle: "Mis entregas del día",
                icon: "clipboard-list-outline",
                colors: ['#40c057', '#2f9e44'],
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

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

            {/* HEADER */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.greeting}>Hola, {user?.nombre?.split(' ')[0] || 'Chofer'}!</Text>
                    <Text style={styles.headerSubtitle}>Panel de Logística</Text>
                </View>
                <TouchableOpacity onPress={logout} style={styles.logoutButton}>
                    <IconButton icon="logout" iconColor={theme.colors.error} size={24} />
                </TouchableOpacity>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />}
            >
                {/* VEHICLE STATUS CARD */}
                <Surface style={styles.statusCard} elevation={1}>
                    <View style={styles.statusRow}>
                        <View style={styles.statusIconContainer}>
                            <IconButton icon="truck" iconColor={theme.colors.primary} size={28} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusLabel}>VEHÍCULO ACTUAL</Text>
                            <Text style={styles.statusValue}>
                                {vehiculo ? vehiculo.patente?.toUpperCase() : 'SIN ASIGNAR'}
                            </Text>
                            {vehiculo && (
                                <Text style={styles.statusDetail}>
                                    {vehiculo.marca} {vehiculo.modelo}
                                </Text>
                            )}
                        </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.statusRow}>
                        <View style={[styles.statusIconContainer, { backgroundColor: '#e6fcf5' }]}>
                            <IconButton icon="map-marker-path" iconColor="#0ca678" size={28} />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.statusLabel}>RUTA ASIGNADA</Text>
                            <Text style={styles.statusValue}>
                                {ruta ? ruta.codigo?.toUpperCase() : 'SIN RUTA'}
                            </Text>
                            {ruta && (
                                <Text style={styles.statusDetail}>
                                    {ruta.horaSalida ? `Salida: ${ruta.horaSalida}` : 'Sin horario'}
                                </Text>
                            )}
                        </View>
                    </View>
                </Surface>

                <Text style={styles.sectionTitle}>Acciones Rápidas</Text>

                {/* ACTION CARDS */}
                {filteredItems.map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        activeOpacity={0.9}
                        onPress={() => navigation.navigate(item.route)}
                        style={styles.actionCardContainer}
                    >
                        <LinearGradient
                            colors={item.colors}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.gradientCard}
                        >
                            <View style={styles.cardContent}>
                                <View style={styles.cardIconCircle}>
                                    <IconButton icon={item.icon} iconColor={item.colors[0]} size={32} />
                                </View>
                                <View style={styles.cardTextContent}>
                                    <Text style={styles.actionTitle}>{item.title}</Text>
                                    <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
                                </View>
                                <IconButton icon="chevron-right" iconColor="white" size={28} />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20, // Status bar spacing if needed
        paddingBottom: 20,
        backgroundColor: '#f8f9fa',
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#212529',
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#868e96',
        marginTop: 4,
    },
    logoutButton: {
        backgroundColor: '#fff0f0',
        borderRadius: 50,
    },
    content: {
        padding: 24,
        paddingTop: 0,
    },
    // STATUS CARD
    statusCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        // Soft Shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#f1f3f5'
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 16,
        backgroundColor: '#e3fafc',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    statusLabel: {
        fontSize: 11,
        color: '#adb5bd',
        fontWeight: 'bold',
        letterSpacing: 0.5,
        marginBottom: 2
    },
    statusValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
    },
    statusDetail: {
        fontSize: 13,
        color: '#868e96',
    },
    divider: {
        height: 1,
        backgroundColor: '#f1f3f5',
        marginVertical: 16,
    },

    // ACTIONS
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#212529',
        marginBottom: 16,
        marginLeft: 4,
    },
    actionCardContainer: {
        marginBottom: 20,
        borderRadius: 24,
        // Shadow for the gradient card
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    gradientCard: {
        borderRadius: 24,
        padding: 20,
        minHeight: 110,
        justifyContent: 'center',
    },
    cardContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cardIconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    cardTextContent: {
        flex: 1,
    },
    actionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: 'white',
        marginBottom: 4,
    },
    actionSubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
    },
});

export default HomeScreen;


import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Alert, StatusBar } from 'react-native';
import {
    Text,
    Appbar,
    useTheme,
    Surface,
    Button,
    IconButton,
    Divider
} from 'react-native-paper';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import EnvioCard from '../components/hojaReparto/EnvioCard';
import ModalAccionesEnvio from '../components/hojaReparto/ModalAccionesEnvio';
import SelectorHojasScreen from '../components/hojaReparto/SelectorHojasScreen';

const HojaRepartoScreen = ({ navigation }: any) => {
    const theme = useTheme();
    const { user } = useAuth();

    const [hojaSeleccionada, setHojaSeleccionada] = useState<any>(null);
    const [hojasDisponibles, setHojasDisponibles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Acciones
    const [envioSeleccionado, setEnvioSeleccionado] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Animación simple
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, []);

    const fetchHojaReparto = async () => {
        if (!user) return;
        try {
            const response = await api.get(`/hojas-reparto/por-chofer/${user.id}`);
            const hojas = response.data.hojas || [];

            if (hojas.length === 1) {
                setHojaSeleccionada(hojas[0]);
            } else {
                setHojasDisponibles(hojas);
                if (hojaSeleccionada) {
                    const hojaActualizada = hojas.find((h: any) => h._id === hojaSeleccionada._id);
                    if (hojaActualizada) {
                        setHojaSeleccionada(hojaActualizada);
                    }
                }
            }
        } catch (error: any) {
            console.log('Error fetchHojaReparto:', error?.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) fetchHojaReparto();
    }, [user]);

    const handleEntregar = async (nombreReceptor: string, dniReceptor: string, ubicacionEntrega: any) => {
        if (!envioSeleccionado) return;
        try {
            await api.put(`/envios/marcar-entregado/${envioSeleccionado._id}`, {
                nombreReceptor,
                dniReceptor,
                ubicacionEntrega
            });
            Alert.alert('¡Excelente!', 'Entrega registrada correctamente.');
            await fetchHojaReparto();
        } catch (error: any) {
            Alert.alert('Error', 'No se pudo registrar la entrega.');
        } finally {
            setModalVisible(false);
            setEnvioSeleccionado(null);
        }
    };

    const handleDevolver = async (motivo: string) => {
        if (!envioSeleccionado) return;
        try {
            await api.patch(`/envios/fallo-entrega/${envioSeleccionado._id}`, { motivo });
            Alert.alert('Registrado', 'Se guardó el motivo de no entrega.');
            await fetchHojaReparto();
        } catch (error: any) {
            Alert.alert('Error', 'No se pudo registrar el fallo.');
        } finally {
            setModalVisible(false);
            setEnvioSeleccionado(null);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

            {/* Header Limpio */}
            <Appbar.Header style={styles.appbar}>
                {/* Lógica de Back: Si hay selección múltiple activa, vuelve a lista. Si no, vuelve al Home */}
                <Appbar.BackAction
                    color={theme.colors.onSurface}
                    onPress={() => {
                        if (hojasDisponibles.length > 1 && hojaSeleccionada) {
                            setHojaSeleccionada(null); // Volver a lista interna
                        } else {
                            navigation.goBack(); // Volver al Home
                        }
                    }}
                />
                <Appbar.Content title="Hoja de Reparto" titleStyle={styles.appbarTitle} />
                <Appbar.Action icon="reload" color={theme.colors.onSurface} onPress={fetchHojaReparto} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim }}>

                    {hojaSeleccionada ? (
                        <>
                            {/* 📄 RESUMEN SIMPLE Y VISIBLE */}
                            <Surface style={styles.summaryCard} elevation={2}>
                                <View style={styles.summaryRow}>
                                    <View>
                                        <Text style={styles.sheetTitle}>
                                            Hoja #{hojaSeleccionada.numeroHoja?.split('-').pop()}
                                        </Text>
                                        <Text style={styles.dateLabel}>
                                            {new Date(hojaSeleccionada.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </Text>
                                    </View>
                                    <View style={styles.countBadge}>
                                        <Text style={styles.countText}>{hojaSeleccionada.envios?.length}</Text>
                                        <Text style={styles.countLabel}>Envíos</Text>
                                    </View>
                                </View>

                                <Divider style={styles.divider} />

                                <View style={styles.detailsRow}>
                                    <View style={styles.detailItem}>
                                        <IconButton icon="map-marker-path" size={20} iconColor="#868e96" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{hojaSeleccionada.ruta?.codigo || 'Ruta General'}</Text>
                                    </View>
                                    <View style={styles.detailItem}>
                                        <IconButton icon="truck-outline" size={20} iconColor="#868e96" style={styles.detailIcon} />
                                        <Text style={styles.detailText}>{hojaSeleccionada.vehiculo?.patente || '---'}</Text>
                                    </View>
                                </View>
                            </Surface>

                            <Text style={styles.sectionTitle}>LISTADO DE ENVÍOS</Text>

                            {/* 📦 LISTA DE ENVÍOS */}
                            {hojaSeleccionada.envios?.map((envio: any, index: number) => (
                                <EnvioCard
                                    key={envio._id || index}
                                    envio={envio}
                                    onPress={(e) => {
                                        setEnvioSeleccionado(e);
                                        setModalVisible(true);
                                    }}
                                />
                            ))}

                            <View style={{ height: 40 }} />
                        </>
                    ) : (
                        <View style={styles.emptyStateContainer}>
                            <Text style={styles.emptyTitle}>Sin Ruta Asignada</Text>
                            <Button mode="contained" onPress={fetchHojaReparto} style={{ marginTop: 20 }}>
                                Actualizar
                            </Button>
                        </View>
                    )}

                </Animated.View>
            </ScrollView>

            {/* 🛠 MODAL */}
            {modalVisible && envioSeleccionado && (
                <ModalAccionesEnvio
                    visible={modalVisible}
                    envio={envioSeleccionado}
                    onClose={() => {
                        setModalVisible(false);
                        setEnvioSeleccionado(null);
                    }}
                    onEntregar={handleEntregar}
                    onDevolver={handleDevolver}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f9fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSurface: {
        borderRadius: 50,
        padding: 30,
        backgroundColor: '#fff'
    },
    appbar: {
        backgroundColor: '#f8f9fa',
        elevation: 0,
    },
    appbarTitle: {
        fontWeight: 'bold',
        color: '#212529',
        fontSize: 20,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },

    // --- SUMMARY CARD SIMPLE ---
    summaryCard: {
        borderRadius: 16,
        backgroundColor: 'white',
        padding: 20,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    sheetTitle: {
        fontSize: 26,
        fontWeight: '800',
        color: '#212529',
        letterSpacing: -1,
        marginBottom: 4,
    },
    dateLabel: {
        fontSize: 14,
        color: '#868e96',
        textTransform: 'capitalize',
        fontWeight: '500',
    },
    countBadge: {
        alignItems: 'center',
        backgroundColor: '#f1f3f5',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    countText: {
        fontSize: 20,
        fontWeight: '900',
        color: '#212529',
    },
    countLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#adb5bd',
        textTransform: 'uppercase',
    },
    divider: {
        marginVertical: 16,
        backgroundColor: '#f1f3f5'
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-start', // Align left
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 24,
    },
    detailIcon: {
        margin: 0,
        padding: 0,
        width: 20,
        height: 20,
        marginRight: 6,
    },
    detailText: {
        color: '#495057',
        fontSize: 14,
        fontWeight: '600',
    },

    // HEADERS
    sectionTitle: {
        fontSize: 13,
        fontWeight: '800',
        color: '#adb5bd',
        marginBottom: 16,
        marginLeft: 4,
        letterSpacing: 1,
    },

    // Empty
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        color: '#adb5bd',
        fontWeight: 'bold',
    },
});

export default HojaRepartoScreen;


import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, Animated, Alert, StatusBar } from 'react-native';
import {
    Text,
    Appbar,
    useTheme,
    Surface,
    Button,
    IconButton,
    Divider,
    Portal,
    Modal
} from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import EnvioCard from '../components/hojaReparto/EnvioCard';
import ModalAccionesEnvio from '../components/hojaReparto/ModalAccionesEnvio';
import SelectorHojasScreen from '../components/hojaReparto/SelectorHojasScreen';
import { AppTheme } from '../theme/theme';

const HojaRepartoScreen = ({ navigation }: any) => {
    const theme = useTheme<AppTheme>();
    const isDark = theme.dark;
    const { user } = useAuth();

    const [hojaSeleccionada, setHojaSeleccionada] = useState<any>(null);
    const [hojasDisponibles, setHojasDisponibles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Acciones
    const [envioSeleccionado, setEnvioSeleccionado] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    // Animación simple
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Estilos dinámicos
    const bgGradient = isDark ? ['#020617', '#0f172a'] : ['#f8fafc', '#f1f5f9'];
    const textPrimary = theme.colors.textPrimary;
    const textSecondary = theme.colors.textSecondary;
    const accentColor = isDark ? '#38bdf8' : '#0284c7'; // Sky 400 vs 600

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
            } else if (hojas.length > 1) {
                setHojasDisponibles(hojas);

                // Priorizar hoja con envíos
                const hojaConEnvios = hojas.find((h: any) => h.envios && h.envios.length > 0);

                if (hojaSeleccionada) {
                    const hojaActualizada = hojas.find((h: any) => h._id === hojaSeleccionada._id);
                    if (hojaActualizada) {
                        setHojaSeleccionada(hojaActualizada);
                    } else {
                        // Si la hoja seleccionada ya no está disponible, elegir la mejor
                        setHojaSeleccionada(hojaConEnvios || hojas[0]);
                    }
                } else {
                    setHojaSeleccionada(hojaConEnvios || hojas[0]);
                }
            } else {
                setHojaSeleccionada(null); // No hay hojas
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

    if (hojasDisponibles.length > 1 && !hojaSeleccionada) {
        return <SelectorHojasScreen hojas={hojasDisponibles} onSeleccionarHoja={setHojaSeleccionada} />;
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />

            <LinearGradient
                colors={bgGradient as [string, string]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Header Limpio */}
            <Appbar.Header style={styles.appbar} elevated={false}>
                <Appbar.BackAction
                    color={textPrimary}
                    onPress={() => {
                        if (hojasDisponibles.length > 1 && hojaSeleccionada) {
                            setHojaSeleccionada(null); // Volver a lista interna
                        } else {
                            navigation.goBack(); // Volver al Home
                        }
                    }}
                />
                <Appbar.Content title="Mis entregas del día" titleStyle={[styles.appbarTitle, { color: textPrimary }]} />
                <Appbar.Action icon="reload" color={textPrimary} onPress={fetchHojaReparto} />
            </Appbar.Header>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fadeAnim }}>

                    {hojaSeleccionada ? (
                        <>
                            {/* 📄 RESUMEN SIMPLE Y VISIBLE */}
                            <View style={[
                                styles.summaryCard,
                                {
                                    borderColor: theme.colors.outline,
                                    backgroundColor: isDark ? 'transparent' : 'white',
                                    elevation: isDark ? 0 : 2,
                                    shadowColor: '#64748b',
                                    shadowOffset: { width: 0, height: 2 },
                                    shadowOpacity: 0.1,
                                    shadowRadius: 4
                                }
                            ]}>
                                <LinearGradient
                                    colors={isDark
                                        ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']
                                        : ['#ffffff', '#f8fafc']}
                                    style={styles.summaryGradient}
                                >
                                    <View style={styles.summaryRow}>
                                        <View>
                                            <Text style={[styles.sheetTitle, { color: textPrimary }]}>
                                                Hoja #{hojaSeleccionada.numeroHoja?.split('-').pop()}
                                            </Text>
                                            <Text style={[styles.dateLabel, { color: textSecondary }]}>
                                                {new Date(hojaSeleccionada.fecha).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </Text>
                                        </View>
                                        <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9' }]}>
                                            <Text style={[styles.countText, { color: textPrimary }]}>{hojaSeleccionada.envios?.length}</Text>
                                            <Text style={[styles.countLabel, { color: accentColor }]}>Envíos</Text>
                                        </View>
                                    </View>

                                    <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />

                                    <View style={styles.detailsRow}>
                                        <View style={styles.detailItem}>
                                            <IconButton icon="map-marker-path" size={18} iconColor={accentColor} style={styles.detailIcon} />
                                            <Text style={[styles.detailText, { color: textSecondary }]}>{hojaSeleccionada.ruta?.codigo || 'Ruta General'}</Text>
                                        </View>
                                        <View style={styles.detailItem}>
                                            <IconButton icon="truck-outline" size={18} iconColor={accentColor} style={styles.detailIcon} />
                                            <Text style={[styles.detailText, { color: textSecondary }]}>{hojaSeleccionada.vehiculo?.patente || '---'}</Text>
                                        </View>
                                    </View>
                                </LinearGradient>
                            </View>

                            <Text style={[styles.sectionTitle, { color: accentColor }]}>LISTADO DE ENVÍOS</Text>

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
                            <Text style={[styles.emptyTitle, { color: textSecondary }]}>Sin Ruta Asignada</Text>
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
        backgroundColor: 'transparent',
        elevation: 0,
    },
    appbarTitle: {
        fontWeight: '900',
        fontSize: 20,
        letterSpacing: 0.5,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
    },

    // --- SUMMARY CARD SIMPLE ---
    summaryCard: {
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
        borderWidth: 1,
    },
    summaryGradient: {
        padding: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    sheetTitle: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -1,
        marginBottom: 4,
    },
    dateLabel: {
        fontSize: 14,
        textTransform: 'capitalize',
        fontWeight: '600',
    },
    countBadge: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 16,
    },
    countText: {
        fontSize: 20,
        fontWeight: '900',
    },
    countLabel: {
        fontSize: 9,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    divider: {
        marginVertical: 20,
        height: 1,
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
        fontSize: 14,
        fontWeight: '700',
    },

    // HEADERS
    sectionTitle: {
        fontSize: 11,
        fontWeight: '900',
        marginBottom: 16,
        marginLeft: 4,
        letterSpacing: 2,
        opacity: 0.8,
    },

    // Empty
    emptyStateContainer: {
        alignItems: 'center',
        marginTop: 60,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
});

export default HojaRepartoScreen;

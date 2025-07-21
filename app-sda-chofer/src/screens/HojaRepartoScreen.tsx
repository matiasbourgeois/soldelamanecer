import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ScrollView, ActivityIndicator, Alert, useColorScheme } from 'react-native';
import axios from 'axios';
import { RouteProp, useRoute } from '@react-navigation/native';
import { crearHojaRepartoStyles } from '../styles/hojaRepartoStyles';
import EnvioCard from '../components/hojaReparto/EnvioCard';
import ModalAccionesEnvio from '../components/hojaReparto/ModalAccionesEnvio';
import SelectorHojasScreen from '../components/hojaReparto/SelectorHojasScreen';
import { Animated } from 'react-native';






interface Usuario {
    id: string;
    nombre: string;
    email: string;
    rol: string;
}

interface HojaRepartoScreenRouteParams {
    token: string;
    usuario: Usuario;
}

const HojaRepartoScreen = () => {
    const route = useRoute<RouteProp<Record<string, HojaRepartoScreenRouteParams>, string>>();
    const { token, usuario } = route.params;

    const [hojaReparto, setHojaReparto] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const colorScheme = useColorScheme();
    const hojaRepartoStyles = crearHojaRepartoStyles(colorScheme === 'dark');

    const [envioSeleccionado, setEnvioSeleccionado] = useState<any>(null);
    const [modalVisible, setModalVisible] = useState(false);

    const [hojasDisponibles, setHojasDisponibles] = useState<any[]>([]);
    const [hojaSeleccionada, setHojaSeleccionada] = useState<any>(null);


    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800, // 🔥 duración en ms (0.8 segundos)
            useNativeDriver: true,
        }).start();
    }, []);


    const marcarComoEntregado = async (envioId: string) => {
        try {
            const response = await axios.put(`http://192.168.0.132:5003/api/envios/marcar-entregado/${envioId}`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('✅ Envío marcado como entregado correctamente:', response.data.mensaje);
            fetchHojaReparto();
            Alert.alert('Entrega confirmada', 'El estado del envío fue actualizado correctamente.');

        } catch (error: any) {
            console.error('❌ Error al marcar como entregado:', error?.response?.data || error.message);
        }
    };

    const fetchHojaReparto = async () => {
        try {
            const response = await axios.get(`http://192.168.0.132:5003/api/hojas-reparto/por-chofer/${usuario.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const hojas = response.data.hojas || [];

            if (hojas.length === 1) {
                setHojaSeleccionada(hojas[0]);
            } else {
                setHojasDisponibles(hojas);
            }

            return hojas; // 🔥🔥🔥 Devolvemos las hojas actualizadas
        } catch (error: any) {
            const errorMsg = error?.response?.data?.msg || error.message;

            if (errorMsg === "No hay hojas de reparto asignadas para hoy.") {
                console.log('ℹ️ No hay hojas de reparto asignadas para hoy.');
            } else {
                console.error('❌ Error al obtener la(s) hoja(s) de reparto:', errorMsg);
            }

            return [];


        } finally {
            setLoading(false);
        }
    };



    useEffect(() => {
        fetchHojaReparto();
    }, [usuario.id, token]);

    if (loading) {
        return (
            <View style={hojaRepartoStyles.container}>
                <ActivityIndicator size="large" color="#f4c430" />
                <Text>Cargando hoja de reparto...</Text>
            </View>
        );
    }

    if (hojasDisponibles.length > 1 && !hojaSeleccionada) {
        return (
            <SelectorHojasScreen
                hojas={hojasDisponibles}
                onSeleccionarHoja={(hoja) => setHojaSeleccionada(hoja)}
            />
        );
    }


    if (!hojaSeleccionada) {
        return (
            <View style={hojaRepartoStyles.container}>
                <Animated.View style={[hojaRepartoStyles.sinHojasCard, { opacity: fadeAnim }]}>
                    <Text style={hojaRepartoStyles.sinHojasTitulo}> No tenés hoja de reparto asignada para hoy</Text>
                    <Text style={hojaRepartoStyles.sinHojasTexto}>Si tenés alguna duda, contactá al administrador.</Text>
                </Animated.View>
            </View>
        );
    }



    return (
        <View style={hojaRepartoStyles.container}>
            <View style={hojaRepartoStyles.cardHojaRepartoUnificado}>
                <View style={hojaRepartoStyles.cardLine} />

                <View style={hojaRepartoStyles.cardContent}>
                    <Text style={hojaRepartoStyles.cardTitle}>
                        Hoja de Reparto N° {hojaSeleccionada.numeroHoja}
                    </Text>

                    <View style={hojaRepartoStyles.cardInfoBlock}>
                        <Text style={hojaRepartoStyles.cardInfoText}>
                            Chofer Asignado: {usuario.nombre?.toUpperCase() || "-"}
                        </Text>

                        <Text style={hojaRepartoStyles.cardInfoText}>
                            Fecha: {new Date(hojaSeleccionada.fecha).toLocaleDateString()}
                        </Text>

                        <Text style={hojaRepartoStyles.cardInfoText}>
                            Envíos total: {hojaSeleccionada.envios.length}
                        </Text>

                        <Text style={hojaRepartoStyles.cardInfoText}>
                            Ruta Codigo: {hojaSeleccionada.ruta?.codigo || "-"}
                        </Text>

                        <Text style={hojaRepartoStyles.cardInfoText}>
                            Vehículo Asignado: {hojaSeleccionada.vehiculo?.patente || "-"}
                        </Text>

                        <Text style={hojaRepartoStyles.cardInfoText}>
                            Estado de Hoja de Reparto: {hojaSeleccionada.estado || "-"}
                        </Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={hojaRepartoStyles.scrollContainer}>
                <View style={hojaRepartoStyles.enviosContainer}>
                    {hojaSeleccionada.envios.length > 0 ? (
                        hojaSeleccionada.envios.map((envio: any) => (
                            <EnvioCard
                                key={envio._id}
                                envio={envio}
                                onPress={(envio) => {
                                    console.log("➡️ Envío seleccionado:", envio);
                                    setEnvioSeleccionado(envio);
                                    setModalVisible(true);
                                }}
                            />
                        ))
                    ) : (
                        <Text>No hay envíos asignados.</Text>
                    )}
                </View>
            </ScrollView>

            {/* MODAL */}
            {modalVisible && envioSeleccionado && (
                <ModalAccionesEnvio
                    visible={modalVisible}
                    envio={envioSeleccionado}
                    onClose={() => {
                        setModalVisible(false);
                        setEnvioSeleccionado(null);
                    }}
                    onEntregar={async (nombreReceptor, dniReceptor, ubicacionEntrega) => {
                        if (!envioSeleccionado) return;

                        try {
                            const response = await axios.put(
                                `http://192.168.0.132:5003/api/envios/marcar-entregado/${envioSeleccionado._id}`,
                                { nombreReceptor, dniReceptor, ubicacionEntrega },
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );

                            console.log("✅ Entrega confirmada:", response.data);
                            Alert.alert('Entrega confirmada', 'El estado del envío fue actualizado correctamente.');

                            const hojasActualizadas = await fetchHojaReparto();
                            const hojaActualizada = hojasActualizadas.find((h: any) => h._id === hojaSeleccionada._id);
                            if (hojaActualizada) {
                                setHojaSeleccionada(hojaActualizada);
                            }

                        } catch (error: any) {
                            console.error("❌ Error al confirmar entrega:", error?.response?.data || error.message);
                            Alert.alert('Error', 'No se pudo confirmar la entrega. Por favor intentá de nuevo.');
                        } finally {
                            setModalVisible(false);
                            setEnvioSeleccionado(null);
                        }
                    }}
                    onDevolver={async (motivo) => {
                        if (!envioSeleccionado) return;

                        try {
                            const response = await axios.patch(
                                `http://192.168.0.132:5003/api/envios/fallo-entrega/${envioSeleccionado._id}`,
                                { motivo },
                                {
                                    headers: {
                                        Authorization: `Bearer ${token}`,
                                    },
                                }
                            );

                            console.log("✅ Entrega fallida registrada:", response.data);
                            Alert.alert("Motivo registrado", "Se actualizó el estado del envío.");

                            const hojasActualizadas = await fetchHojaReparto();
                            const hojaActualizada = hojasActualizadas.find((h: any) => h._id === hojaSeleccionada._id);
                            if (hojaActualizada) {
                                setHojaSeleccionada(hojaActualizada);
                            }

                        } catch (error: any) {
                            console.error("❌ Error al registrar motivo:", error?.response?.data || error.message);
                            Alert.alert("Error", "No se pudo registrar el motivo. Intentalo de nuevo.");
                        } finally {
                            setModalVisible(false);
                            setEnvioSeleccionado(null);
                        }
                    }}
                />
            )}

        </View>
    );

};

export default HojaRepartoScreen;
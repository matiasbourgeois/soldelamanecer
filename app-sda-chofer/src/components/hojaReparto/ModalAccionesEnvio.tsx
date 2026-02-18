
// components/hojaReparto/ModalAccionesEnvio.tsx

import React, { useState } from 'react';
import { View, Platform, ScrollView, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, IconButton, Avatar, Divider, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import CustomAlert from '../common/CustomAlert';

const { width, height } = Dimensions.get('window');

interface ModalAccionesEnvioProps {
    visible: boolean;
    envio: any;
    onClose: () => void;
    onEntregar: (nombreReceptor: string, dniReceptor: string, ubicacionEntrega: any) => void;
    onDevolver: (motivoDevolucion: string) => void;
}

const ModalAccionesEnvio: React.FC<ModalAccionesEnvioProps> = ({
    visible,
    envio,
    onClose,
    onEntregar,
    onDevolver
}) => {
    const theme = useTheme();
    const [modoEntrega, setModoEntrega] = useState(false);
    const [nombreReceptor, setNombreReceptor] = useState('');
    const [dniReceptor, setDniReceptor] = useState('');

    const [modoDevolucion, setModoDevolucion] = useState(false);
    const [motivoDevolucion, setMotivoDevolucion] = useState('');
    const [otrosCheck, setOtrosCheck] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState({
        visible: false,
        title: '',
        message: '',
        type: 'info' as 'success' | 'error' | 'warning' | 'info',
        onConfirm: undefined as undefined | (() => void),
        confirmText: 'ACEPTAR',
        cancelText: 'CANCELAR'
    });

    const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', onConfirm?: () => void) => {
        setAlertConfig({
            visible: true,
            title,
            message,
            type,
            onConfirm,
            confirmText: onConfirm ? 'SÍ, CONFIRMAR' : 'ENTENDIDO',
            cancelText: 'CANCELAR'
        });
    };

    if (!envio) return null;

    const handleConfirmarEntrega = async () => {
        if (!nombreReceptor.trim() || !dniReceptor.trim()) {
            showAlert('Faltan datos', 'Por favor completá el nombre y DNI de quien recibe.', 'warning');
            return;
        }
        if (!/^[0-9]+$/.test(dniReceptor)) {
            showAlert('DNI Inválido', 'El DNI debe contener solo números.', 'error');
            return;
        }

        const executeEntrega = async () => {
            try {
                if (Platform.OS === 'web') throw new Error("Skipping Location on Web");
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') throw new Error("Permission denied");
                const location = await Location.getCurrentPositionAsync({});
                const ubicacionEntrega = {
                    type: "Point",
                    coordinates: [location.coords.longitude, location.coords.latitude],
                };
                onEntregar(nombreReceptor.trim(), dniReceptor.trim(), ubicacionEntrega);
                resetState();
            } catch (error) {
                console.warn("⚠️ Usando ubicación fallback");
                const ubicacionFallback = { type: "Point", coordinates: [-64.1887, -31.4201] };
                onEntregar(nombreReceptor.trim(), dniReceptor.trim(), ubicacionFallback);
                resetState();
            }
        };

        showAlert('Confirmar Entrega', `¿Confirma que entrega a ${nombreReceptor}?`, 'success', executeEntrega);
    };

    const handleConfirmarDevolucion = () => {
        if (!motivoDevolucion) {
            showAlert("Seleccioná un motivo", "Debés elegir o escribir un motivo para continuar.", 'warning');
            return;
        }
        showAlert("Confirmar Fallo", `¿Marcar como NO entregado por: "${motivoDevolucion}"?`, 'error', () => {
            onDevolver(motivoDevolucion);
            resetState();
        });
    };

    const resetState = () => {
        setModoEntrega(false);
        setNombreReceptor('');
        setDniReceptor('');
        setModoDevolucion(false);
        setMotivoDevolucion('');
        setOtrosCheck(false);
        onClose();
    };

    const MOTIVOS_COMMON = [
        'Domicilio Cerrado / Nadie atiende',
        'Dirección Incorrecta / Inexistente',
        'Rechazado por Destinatario',
        'Zona Peligrosa / Inaccesible'
    ];

    // --- UI RENDERERS ---

    const renderHeader = () => (
        <View style={styles.headerContainer}>
            <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>Gestionar Envío</Text>
                <Text style={styles.headerSubtitle}>#{envio.remitoNumero?.slice(-8) || '---'}</Text>

                {/* Contexto del Envío para el Chofer */}
                <View style={styles.shipmentContext}>
                    <View style={styles.contextRow}>
                        <IconButton icon="account" size={16} iconColor="#94a3b8" style={{ margin: 0, width: 20, height: 20 }} />
                        <Text style={styles.contextText}>{envio.destinatario?.nombre || 'Sin Nombre'}</Text>
                    </View>
                    <View style={styles.contextRow}>
                        <IconButton icon="map-marker" size={16} iconColor="#94a3b8" style={{ margin: 0, width: 20, height: 20 }} />
                        <Text style={styles.contextText} numberOfLines={2}>
                            {envio.destinatario?.direccion}, {envio.localidadDestino?.nombre}
                        </Text>
                    </View>
                    <View style={styles.contextRow}>
                        <IconButton icon="package-variant" size={16} iconColor="#94a3b8" style={{ margin: 0, width: 20, height: 20 }} />
                        <Text style={styles.contextText}>{envio.encomienda?.bultos || envio.encomienda?.cantidad || 1} Bulto(s)</Text>
                    </View>
                </View>

            </View>
            <TouchableOpacity onPress={resetState} style={styles.closeButton}>
                <IconButton icon="close" iconColor="white" size={24} />
            </TouchableOpacity>
        </View>
    );

    const renderActionButtons = () => (
        <View style={styles.actionGrid}>
            <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.9}
                onPress={() => setModoEntrega(true)}
            >
                <LinearGradient
                    colors={['#059669', '#047857']}
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={styles.iconCircle}>
                        <IconButton icon="package-variant" iconColor="#10b981" size={32} />
                    </View>
                    <Text style={styles.actionTitle}>ENTREGAR</Text>
                    <Text style={styles.actionDesc}>Registrar entrega exitosa</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.9}
                onPress={() => setModoDevolucion(true)}
            >
                <LinearGradient
                    colors={['#be123c', '#9f1239']} // Rose 700 -> 800
                    style={styles.actionGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <View style={[styles.iconCircle, { backgroundColor: 'rgba(251, 113, 133, 0.2)' }]}>
                        <IconButton icon="alert-octagon" iconColor="#fb7185" size={32} />
                    </View>
                    <Text style={styles.actionTitle}>NO ENTREGADO</Text>
                    <Text style={styles.actionDesc}>Reportar un problema</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );

    const renderDeliveryForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.sectionTitle}>Datos del Receptor</Text>
            <Text style={styles.sectionSubtitle}>¿Quién recibe el paquete?</Text>

            <View style={styles.inputWrapper}>
                <TextInput
                    mode="flat"
                    label="Nombre y Apellido"
                    value={nombreReceptor}
                    onChangeText={setNombreReceptor}
                    style={styles.inputDark}
                    textColor="white"
                    placeholderTextColor="#94a3b8"
                    theme={{ colors: { primary: '#34d399', onSurfaceVariant: '#94a3b8' } }}
                    left={<TextInput.Icon icon="account" color="#34d399" />}
                />
            </View>

            <View style={styles.inputWrapper}>
                <TextInput
                    mode="flat"
                    label="DNI / Documento"
                    value={dniReceptor}
                    onChangeText={setDniReceptor}
                    keyboardType="numeric"
                    style={styles.inputDark}
                    textColor="white"
                    theme={{ colors: { primary: '#34d399', onSurfaceVariant: '#94a3b8' } }}
                    left={<TextInput.Icon icon="card-account-details" color="#34d399" />}
                />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleConfirmarEntrega} activeOpacity={0.8}>
                <LinearGradient
                    colors={['#10b981', '#059669']}
                    style={styles.buttonGradient}
                >
                    <Text style={styles.buttonText}>CONFIRMAR ENTREGA</Text>
                    <IconButton icon="check-bold" iconColor="white" size={20} />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModoEntrega(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>VOLVER ATRÁS</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRejectionForm = () => (
        <View style={styles.formContainer}>
            <Text style={[styles.sectionTitle, { color: '#fca5a5' }]}>Reportar Incidente</Text>
            <Text style={styles.sectionSubtitle}>Seleccioná el motivo del fallo</Text>

            <View style={styles.optionsList}>
                {MOTIVOS_COMMON.map((motivo) => {
                    const isSelected = motivoDevolucion === motivo && !otrosCheck;
                    return (
                        <TouchableOpacity
                            key={motivo}
                            onPress={() => { setMotivoDevolucion(motivo); setOtrosCheck(false); }}
                            style={[
                                styles.optionRow,
                                isSelected && { backgroundColor: 'rgba(244, 63, 94, 0.2)', borderColor: '#f43f5e' }
                            ]}
                        >
                            <Text style={[styles.optionText, isSelected && { color: '#fecdd3', fontWeight: 'bold' }]}>
                                {motivo}
                            </Text>
                            {isSelected && <IconButton icon="check" iconColor="#fecdd3" size={20} />}
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity
                    onPress={() => { setOtrosCheck(true); setMotivoDevolucion(''); }}
                    style={[
                        styles.optionRow,
                        otrosCheck && { backgroundColor: 'rgba(244, 63, 94, 0.2)', borderColor: '#f43f5e' }
                    ]}
                >
                    <Text style={[styles.optionText, otrosCheck && { color: '#fecdd3', fontWeight: 'bold' }]}>
                        Otro motivo...
                    </Text>
                    {otrosCheck && <IconButton icon="check" iconColor="#fecdd3" size={20} />}
                </TouchableOpacity>
            </View>

            {otrosCheck && (
                <TextInput
                    mode="flat"
                    label="Describí el problema"
                    value={motivoDevolucion}
                    onChangeText={setMotivoDevolucion}
                    style={[styles.inputDark, { marginTop: 10 }]}
                    textColor="white"
                    theme={{ colors: { primary: '#f43f5e', onSurfaceVariant: '#94a3b8' } }}
                    autoFocus
                />
            )}

            <TouchableOpacity style={[styles.primaryButton, { marginTop: 20 }]} onPress={handleConfirmarDevolucion} activeOpacity={0.8}>
                <LinearGradient
                    colors={['#e11d48', '#be123c']}
                    style={styles.buttonGradient}
                >
                    <Text style={styles.buttonText}>REGISTRAR NO ENTREGADO</Text>
                    <IconButton icon="alert-octagon" iconColor="white" size={20} />
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModoDevolucion(false)} style={styles.cancelButton}>
                <Text style={styles.cancelText}>VOLVER ATRÁS</Text>
            </TouchableOpacity>
        </View>
    );

    const renderDetalleTerminado = () => {
        const isEntregado = envio.estado?.toLowerCase() === 'entregado';
        return (
            <View style={styles.finishedContainer}>
                <LinearGradient
                    colors={isEntregado ? ['rgba(16, 185, 129, 0.2)', 'transparent'] : ['rgba(225, 29, 72, 0.2)', 'transparent']}
                    style={styles.glowBackground}
                />

                <Avatar.Icon
                    size={80}
                    icon={isEntregado ? "check-bold" : "close-octagon"}
                    style={{ backgroundColor: isEntregado ? '#10b981' : '#e11d48', marginBottom: 20 }}
                    color="white"
                />

                <Text style={[styles.finishedTitle, { color: isEntregado ? '#34d399' : '#fb7185' }]}>
                    {isEntregado ? '¡ENTREGADO!' : 'NO ENTREGADO'}
                </Text>

                <View style={styles.finishedCard}>
                    {isEntregado ? (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={styles.labelDark}>Recibió:</Text>
                                <Text style={styles.valueDark}>{envio.nombreReceptor || envio.receptorNombre || '---'}</Text>
                            </View>
                            <Divider style={styles.dividerDark} />
                            <View style={styles.detailRow}>
                                <Text style={styles.labelDark}>DNI:</Text>
                                <Text style={styles.valueDark}>{envio.dniReceptor || envio.receptorDni || '---'}</Text>
                            </View>
                        </>
                    ) : (
                        <View>
                            <Text style={[styles.labelDark, { color: '#fca5a5', marginBottom: 5 }]}>Motivo del rechazo:</Text>
                            <Text style={[styles.valueDark, { fontSize: 16 }]}>{envio.motivoNoEntrega || '---'}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Portal>
            <Modal visible={visible} onDismiss={resetState} contentContainerStyle={styles.modalOverlay}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={styles.modalContent}>
                        <LinearGradient
                            colors={['#1e293b', '#0f172a']} // Slate 800 -> 900 base
                            style={styles.mainGradient}
                        >
                            {renderHeader()}

                            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, flexGrow: 1 }}>
                                {envio.estado !== 'en reparto' && envio.estado !== 'pendiente'
                                    ? renderDetalleTerminado()
                                    : (!modoEntrega && !modoDevolucion)
                                        ? renderActionButtons()
                                        : modoEntrega ? renderDeliveryForm() : renderRejectionForm()
                                }
                            </ScrollView>
                        </LinearGradient>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            <CustomAlert
                visible={alertConfig.visible}
                title={alertConfig.title}
                message={alertConfig.message}
                type={alertConfig.type}
                onClose={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
                onConfirm={alertConfig.onConfirm}
                confirmText={alertConfig.confirmText}
                cancelText={alertConfig.cancelText}
            />
        </Portal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-end', // Bottom sheet style or center
        margin: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // Strong dimming
    },
    modalContent: {
        height: '90%', // Fixed height to ensure layout
        width: '100%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        backgroundColor: '#0f172a',
    },
    mainGradient: {
        flex: 1, // Full height of modalContent
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align top items
        padding: 20,
        paddingTop: 25, // More top padding
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#f8fafc',
        width: '90%', // Prevent overlap with close button
    },
    headerSubtitle: {
        color: '#94a3b8',
        fontSize: 14,
        letterSpacing: 1,
        marginBottom: 10,
    },
    shipmentContext: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 10,
        borderRadius: 12,
        gap: 4,
        marginTop: 5,
        marginRight: 10, // Avoid overlap
    },
    contextRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    contextText: {
        color: '#e2e8f0', // Slate 200
        fontSize: 13,
        flex: 1,
    },
    closeButton: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 20,
        marginTop: 0, // Ensure it's at the top
    },

    // Actions Grid
    actionGrid: {
        flexDirection: 'row',
        gap: 15,
        marginTop: 20,
    },
    actionCard: {
        flex: 1,
        height: 200,
        borderRadius: 24,
        overflow: 'hidden',
        elevation: 8,
    },
    actionGradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
    },
    iconCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },
    actionTitle: {
        fontSize: 18,
        fontWeight: '900',
        color: 'white',
        letterSpacing: 0.5,
        marginBottom: 5,
    },
    actionDesc: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
    },

    // Forms
    formContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#34d399',
        textAlign: 'center',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 15,
        color: '#94a3b8',
        textAlign: 'center',
        marginBottom: 30,
    },
    inputWrapper: {
        marginBottom: 15,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: 'rgba(30, 41, 59, 0.5)', // Slate 800 transparent
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    inputDark: {
        backgroundColor: 'transparent',
    },
    primaryButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 10,
        elevation: 4,
        shadowColor: '#34d399',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    buttonGradient: {
        paddingVertical: 16,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 8,
    },
    cancelButton: {
        padding: 15,
        alignItems: 'center',
        marginTop: 10,
    },
    cancelText: {
        color: '#64748b',
        fontWeight: '600',
    },

    // Rejection Options
    optionsList: {
        gap: 10,
    },
    optionRow: {
        padding: 16,
        backgroundColor: 'rgba(30, 41, 59, 1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        color: '#cbd5e1',
        fontSize: 15,
    },

    // Finished State
    finishedContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 40,
        position: 'relative',
    },
    glowBackground: {
        position: 'absolute',
        width: 300,
        height: 300,
        borderRadius: 150,
        top: 0,
    },
    finishedTitle: {
        fontSize: 28,
        fontWeight: '900',
        marginBottom: 30,
        letterSpacing: 1,
    },
    finishedCard: {
        width: '100%',
        backgroundColor: 'rgba(30, 41, 59, 0.6)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    labelDark: {
        color: '#94a3b8',
        fontSize: 15,
    },
    valueDark: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    dividerDark: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 8,
    }
});

export default ModalAccionesEnvio;

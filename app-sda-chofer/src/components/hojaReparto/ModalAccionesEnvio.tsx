// components/hojaReparto/ModalAccionesEnvio.tsx

import React, { useState } from 'react';
import { View, Platform, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, Surface, Divider, useTheme, IconButton, Chip, Avatar } from 'react-native-paper';
import * as Location from 'expo-location';
import CustomAlert from '../common/CustomAlert';

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
    const [otrosCheck, setOtrosCheck] = useState(false); // Para mostrar input manual

    // State for Custom Alert
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

        // Logic to execute after confirmation
        const executeEntrega = async () => {
            try {
                // ⚠️ Bypass de Location en Web
                if (Platform.OS === 'web') {
                    throw new Error("Skipping Location on Web");
                }
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    throw new Error("Permission denied");
                }

                const location = await Location.getCurrentPositionAsync({});
                const ubicacionEntrega = {
                    type: "Point",
                    coordinates: [location.coords.longitude, location.coords.latitude],
                };

                onEntregar(nombreReceptor.trim(), dniReceptor.trim(), ubicacionEntrega);
                resetState();
            } catch (error) {
                console.warn("⚠️ Usando ubicación fallback (Web/Dev/Error)");
                const ubicacionFallback = {
                    type: "Point",
                    coordinates: [-64.1887, -31.4201], // Córdoba, Argentina
                };
                onEntregar(nombreReceptor.trim(), dniReceptor.trim(), ubicacionFallback);
                resetState();
            }
        };

        // Show Confirmation Alert
        showAlert(
            'Confirmar Entrega',
            `¿Confirma que entrega a ${nombreReceptor}?`,
            'success',
            executeEntrega
        );
    };

    const handleConfirmarDevolucion = () => {
        if (!motivoDevolucion) {
            showAlert("Seleccioná un motivo", "Debés elegir o escribir un motivo para continuar.", 'warning');
            return;
        }

        showAlert(
            "Confirmar Fallo",
            `¿Marcar como NO entregado por: "${motivoDevolucion}"?`,
            'error',
            () => {
                onDevolver(motivoDevolucion);
                resetState();
            }
        );
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

    const renderActionButtons = () => (
        <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
                style={[styles.bigButton, { backgroundColor: theme.colors.primaryContainer, borderColor: theme.colors.primary }]}
                onPress={() => setModoEntrega(true)}
                activeOpacity={0.8}
            >
                <IconButton icon="check-bold" iconColor={theme.colors.primary} size={32} />
                <Text style={[styles.bigButtonText, { color: theme.colors.primary }]}>ENTREGAR PEDIDO</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.bigButton, { backgroundColor: '#fff5f5', borderColor: theme.colors.error }]} // Red light bg
                onPress={() => setModoDevolucion(true)}
                activeOpacity={0.8}
            >
                <IconButton icon="alert-octagon" iconColor={theme.colors.error} size={32} />
                <Text style={[styles.bigButtonText, { color: theme.colors.error }]}>NO ENTREGADO</Text>
            </TouchableOpacity>
        </View>
    );

    const renderDeliveryForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Datos de Recepción</Text>
            <Text style={styles.formSubtitle}>¿Quién recibe el paquete?</Text>

            <TextInput
                mode="outlined"
                label="Nombre y Apellido"
                value={nombreReceptor}
                onChangeText={setNombreReceptor}
                style={styles.input}
                left={<TextInput.Icon icon="account" />}
            />
            <TextInput
                mode="outlined"
                label="DNI / Documento"
                value={dniReceptor}
                onChangeText={setDniReceptor}
                keyboardType="numeric"
                style={styles.input}
                left={<TextInput.Icon icon="card-account-details" />}
            />

            <Button
                mode="contained"
                onPress={handleConfirmarEntrega}
                style={styles.confirmButton}
                contentStyle={{ height: 48 }}
            >
                CONFIRMAR ENTREGA
            </Button>
            <Button mode="text" onPress={() => setModoEntrega(false)} style={{ marginTop: 8 }}>
                Cancelar
            </Button>
        </View>
    );

    const renderRejectionForm = () => (
        <View style={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.colors.error }]}>Reportar Incidente</Text>
            <Text style={styles.formSubtitle}>¿Cuál fue el motivo?</Text>

            <View style={{ gap: 10 }}>
                {MOTIVOS_COMMON.map((motivo) => {
                    const isSelected = motivoDevolucion === motivo && !otrosCheck;
                    return (
                        <TouchableOpacity
                            key={motivo}
                            onPress={() => {
                                setMotivoDevolucion(motivo);
                                setOtrosCheck(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                                styles.optionCard,
                                isSelected && { borderColor: theme.colors.error, backgroundColor: '#fff5f5' }
                            ]}
                        >
                            <Text style={[
                                styles.optionText,
                                isSelected && { color: theme.colors.error, fontWeight: 'bold' }
                            ]}>
                                {motivo}
                            </Text>
                            <IconButton
                                icon={isSelected ? "radiobox-marked" : "radiobox-blank"}
                                iconColor={isSelected ? theme.colors.error : '#adb5bd'}
                                size={20}
                            />
                        </TouchableOpacity>
                    );
                })}

                {/* Other Motivo Option */}
                <TouchableOpacity
                    onPress={() => {
                        setOtrosCheck(true);
                        setMotivoDevolucion('');
                    }}
                    activeOpacity={0.7}
                    style={[
                        styles.optionCard,
                        otrosCheck && { borderColor: theme.colors.error, backgroundColor: '#fff5f5' }
                    ]}
                >
                    <Text style={[
                        styles.optionText,
                        otrosCheck && { color: theme.colors.error, fontWeight: 'bold' }
                    ]}>
                        Otro motivo...
                    </Text>
                    <IconButton
                        icon={otrosCheck ? "radiobox-marked" : "radiobox-blank"}
                        iconColor={otrosCheck ? theme.colors.error : '#adb5bd'}
                        size={20}
                    />
                </TouchableOpacity>
            </View>

            {otrosCheck && (
                <TextInput
                    mode="outlined"
                    label="Describí el problema..."
                    placeholder="Ej: El cliente no tenía efectivo..."
                    value={motivoDevolucion}
                    onChangeText={setMotivoDevolucion}
                    style={[styles.input, { marginTop: 15 }]}
                    multiline
                    autoFocus
                />
            )}

            <Button
                mode="contained"
                onPress={handleConfirmarDevolucion}
                buttonColor={theme.colors.error}
                style={[styles.confirmButton, { marginTop: 20 }]}
                contentStyle={{ height: 48 }}
            >
                REGISTRAR NO ENTREGADO
            </Button>

            <Button
                mode="text"
                onPress={() => setModoDevolucion(false)}
                textColor="#868e96"
                style={{ marginTop: 8 }}
            >
                Cancelar
            </Button>
        </View>
    );

    return (
        <>
            <Portal>
                <Modal visible={visible} onDismiss={resetState} contentContainerStyle={styles.modalContainer}>
                    <Surface style={styles.surface} elevation={5}>

                        {/* Header Compacto */}
                        <View style={styles.header}>
                            <View>
                                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>Gestionar Envío</Text>
                                <Text variant="bodySmall" style={{ color: '#868e96' }}>#{envio.remitoNumero?.slice(-8) || '---'}</Text>
                            </View>
                            <IconButton icon="close" onPress={resetState} />
                        </View>
                        <Divider />

                        {/* Contenido Dinámico */}
                        <ScrollView contentContainerStyle={{ padding: 20 }}>
                            {envio.estado !== 'en reparto' && envio.estado !== 'pendiente' ? (
                                renderDetalleTerminado(envio)
                            ) : (
                                !modoEntrega && !modoDevolucion
                                    ? renderActionButtons()
                                    : modoEntrega
                                        ? renderDeliveryForm()
                                        : renderRejectionForm()
                            )}
                        </ScrollView>

                    </Surface>
                </Modal>
            </Portal >

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
        </>
    );
};

// Helper for finished state
// Helper for finished state
const renderDetalleTerminado = (envio: any) => {
    const isEntregado = envio.estado?.toLowerCase() === 'entregado';
    return (
        <View style={{ gap: 20, alignItems: 'center', paddingVertical: 10 }}>
            {/* Status Icon with Ring */}
            <View style={{
                position: 'relative',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10
            }}>
                <View style={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: 50,
                    backgroundColor: isEntregado ? '#e6fcf5' : '#fff5f5',
                    opacity: 0.5,
                }} />
                <Avatar.Icon
                    size={80}
                    icon={isEntregado ? "check-bold" : "close-octagon"}
                    style={{ backgroundColor: isEntregado ? '#0ca678' : '#fa5252' }}
                    color="white"
                />
            </View>

            {/* Main Status Text */}
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
                <Text variant="headlineMedium" style={{
                    fontWeight: '900',
                    color: isEntregado ? '#0ca678' : '#fa5252',
                    letterSpacing: 0.5
                }}>
                    {isEntregado ? '¡ENTREGADO!' : 'RECHAZADO'}
                </Text>
                <Text variant="bodyMedium" style={{ color: '#adb5bd', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>
                    {new Date(envio.fechaActualizacion || new Date()).toLocaleDateString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
            </View>

            <Divider style={{ width: '80%', marginVertical: 10 }} />

            {/* Details Section - Clean & Modern */}
            <View style={{ width: '100%', paddingHorizontal: 10, gap: 15 }}>
                {isEntregado ? (
                    <>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#868e96', fontSize: 14 }}>Recibido por</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#343a40' }}>
                                {envio.nombreReceptor || envio.receptorNombre || '---'}
                            </Text>
                        </View>
                        <Divider />
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ color: '#868e96', fontSize: 14 }}>Documento</Text>
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#343a40' }}>
                                {envio.dniReceptor || envio.receptorDni || '---'}
                            </Text>
                        </View>
                    </>
                ) : (
                    <View style={{
                        backgroundColor: '#fff5f5',
                        padding: 16,
                        borderRadius: 12,
                        borderLeftWidth: 4,
                        borderLeftColor: '#fa5252',
                        gap: 4
                    }}>
                        <Text style={{ color: '#fa5252', fontWeight: 'bold', fontSize: 12, textTransform: 'uppercase' }}>
                            Motivo del rechazo
                        </Text>
                        <Text style={{ fontSize: 16, color: '#495057', lineHeight: 22 }}>
                            {envio.motivoNoEntrega || 'Sin motivo registrado'}
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        padding: 20,
        justifyContent: 'center',
    },
    surface: {
        borderRadius: 20,
        backgroundColor: 'white',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#f8f9fa',
    },

    // Main Actions
    actionButtonsContainer: {
        gap: 16,
        paddingVertical: 10,
    },
    bigButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        borderRadius: 16,
        borderWidth: 2,
        elevation: 1,
    },
    bigButtonText: {
        fontSize: 18,
        fontWeight: '900',
        marginLeft: 8,
    },

    // Forms
    formContainer: {
        gap: 8,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 4,
    },
    formSubtitle: {
        fontSize: 14,
        color: '#868e96',
        textAlign: 'center',
        marginBottom: 16,
    },
    input: {
        backgroundColor: 'white',
        marginBottom: 10,
    },
    confirmButton: {
        marginTop: 10,
        borderRadius: 8,
    },
    chipsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    chip: {
        backgroundColor: '#f1f3f5',
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 4,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#e9ecef',
        borderRadius: 12,
        height: 56,
    },
    optionText: {
        fontSize: 15,
        color: '#495057',
        fontWeight: '500',
        flex: 1,
    }
});

export default ModalAccionesEnvio;

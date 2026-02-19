
// components/hojaReparto/ModalAccionesEnvio.tsx

import React, { useState } from 'react';
import { View, Platform, ScrollView, TouchableOpacity, StyleSheet, Dimensions, KeyboardAvoidingView } from 'react-native';
import { Modal, Portal, Text, Button, TextInput, IconButton, Avatar, Divider, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { AppTheme } from '../../theme/theme';
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
    const theme = useTheme<AppTheme>();
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
        <View style={[styles.headerContainer, { borderBottomColor: theme.colors.outline }]}>
            <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.colors.textPrimary }]}>Gestionar Envío</Text>
                <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>#{envio.remitoNumero?.slice(-8) || '---'}</Text>

                {/* Contexto del Envío para el Chofer */}
                <View style={[styles.shipmentContext, { backgroundColor: theme.colors.surfaceVariant }]}>
                    <View style={styles.contextRow}>
                        <IconButton icon="account" size={16} iconColor={theme.colors.textSecondary} style={{ margin: 0, width: 20, height: 20 }} />
                        <Text style={[styles.contextText, { color: theme.colors.textPrimary }]}>{envio.destinatario?.nombre || 'Sin Nombre'}</Text>
                    </View>
                    <View style={styles.contextRow}>
                        <IconButton icon="map-marker" size={16} iconColor={theme.colors.textSecondary} style={{ margin: 0, width: 20, height: 20 }} />
                        <Text style={[styles.contextText, { color: theme.colors.textPrimary }]} numberOfLines={2}>
                            {envio.destinatario?.direccion}, {envio.localidadDestino?.nombre}
                        </Text>
                    </View>
                    <View style={styles.contextRow}>
                        <IconButton icon="package-variant" size={16} iconColor={theme.colors.textSecondary} style={{ margin: 0, width: 20, height: 20 }} />
                        <Text style={[styles.contextText, { color: theme.colors.textPrimary }]}>{envio.encomienda?.bultos || envio.encomienda?.cantidad || 1} Bulto(s)</Text>
                    </View>
                </View>

            </View>
            <TouchableOpacity onPress={resetState} style={[styles.closeButton, { backgroundColor: theme.colors.surfaceVariant }]}>
                <IconButton icon="close" iconColor={theme.colors.textPrimary} size={24} />
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
            <Text style={[styles.sectionTitle, { color: theme.colors.primary }]}>Datos del Receptor</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>¿Quién recibe el paquete?</Text>

            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
                <TextInput
                    mode="flat"
                    label="Nombre y Apellido"
                    value={nombreReceptor}
                    onChangeText={setNombreReceptor}
                    style={styles.inputDark}
                    textColor={theme.colors.textPrimary}
                    placeholderTextColor={theme.colors.textSecondary}
                    theme={{ colors: { primary: theme.colors.primary, onSurfaceVariant: theme.colors.textSecondary } }}
                    left={<TextInput.Icon icon="account" color={theme.colors.primary} />}
                />
            </View>

            <View style={[styles.inputWrapper, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
                <TextInput
                    mode="flat"
                    label="DNI / Documento"
                    value={dniReceptor}
                    onChangeText={setDniReceptor}
                    keyboardType="numeric"
                    style={styles.inputDark}
                    textColor={theme.colors.textPrimary}
                    theme={{ colors: { primary: theme.colors.primary, onSurfaceVariant: theme.colors.textSecondary } }}
                    left={<TextInput.Icon icon="card-account-details" color={theme.colors.primary} />}
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
                <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>VOLVER ATRÁS</Text>
            </TouchableOpacity>
        </View>
    );

    const renderRejectionForm = () => (
        <View style={styles.formContainer}>
            <Text style={[styles.sectionTitle, { color: theme.colors.error }]}>Reportar Incidente</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Seleccioná el motivo del fallo</Text>

            <View style={styles.optionsList}>
                {MOTIVOS_COMMON.map((motivo) => {
                    const isSelected = motivoDevolucion === motivo && !otrosCheck;
                    return (
                        <TouchableOpacity
                            key={motivo}
                            onPress={() => { setMotivoDevolucion(motivo); setOtrosCheck(false); }}
                            style={[
                                styles.optionRow,
                                { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline },
                                isSelected && { backgroundColor: 'rgba(244, 63, 94, 0.2)', borderColor: '#f43f5e' }
                            ]}
                        >
                            <Text style={[
                                styles.optionText,
                                { color: theme.colors.textPrimary },
                                isSelected && { color: theme.dark ? '#fecdd3' : '#be123c', fontWeight: 'bold' }
                            ]}>
                                {motivo}
                            </Text>
                            {isSelected && <IconButton icon="check" iconColor={theme.dark ? "#fecdd3" : "#be123c"} size={20} />}
                        </TouchableOpacity>
                    );
                })}

                <TouchableOpacity
                    onPress={() => { setOtrosCheck(true); setMotivoDevolucion(''); }}
                    style={[
                        styles.optionRow,
                        { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline },
                        otrosCheck && { backgroundColor: 'rgba(244, 63, 94, 0.2)', borderColor: '#f43f5e' }
                    ]}
                >
                    <Text style={[
                        styles.optionText,
                        { color: theme.colors.textPrimary },
                        otrosCheck && { color: theme.dark ? '#fecdd3' : '#be123c', fontWeight: 'bold' }
                    ]}>
                        Otro motivo...
                    </Text>
                    {otrosCheck && <IconButton icon="check" iconColor={theme.dark ? "#fecdd3" : "#be123c"} size={20} />}
                </TouchableOpacity>
            </View>

            {otrosCheck && (
                <TextInput
                    mode="flat"
                    label="Describí el problema"
                    value={motivoDevolucion}
                    onChangeText={setMotivoDevolucion}
                    style={[styles.inputDark, { marginTop: 10 }]}
                    textColor={theme.colors.textPrimary}
                    theme={{ colors: { primary: theme.colors.error, onSurfaceVariant: theme.colors.textSecondary } }}
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
                <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>VOLVER ATRÁS</Text>
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

                <View style={[styles.finishedCard, { backgroundColor: theme.colors.surfaceVariant, borderColor: theme.colors.outline }]}>
                    {isEntregado ? (
                        <>
                            <View style={styles.detailRow}>
                                <Text style={[styles.labelDark, { color: theme.colors.textSecondary }]}>Recibió:</Text>
                                <Text style={[styles.valueDark, { color: theme.colors.textPrimary }]}>{envio.nombreReceptor || envio.receptorNombre || '---'}</Text>
                            </View>
                            <Divider style={[styles.dividerDark, { backgroundColor: theme.colors.outline }]} />
                            <View style={styles.detailRow}>
                                <Text style={[styles.labelDark, { color: theme.colors.textSecondary }]}>DNI:</Text>
                                <Text style={[styles.valueDark, { color: theme.colors.textPrimary }]}>{envio.dniReceptor || envio.receptorDni || '---'}</Text>
                            </View>
                        </>
                    ) : (
                        <View>
                            <Text style={[styles.labelDark, { color: theme.colors.error, marginBottom: 5 }]}>Motivo del rechazo:</Text>
                            <Text style={[styles.valueDark, { fontSize: 16, color: theme.colors.textPrimary }]}>{envio.motivoNoEntrega || '---'}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <Portal>
            <Modal
                visible={visible}
                onDismiss={resetState}
                contentContainerStyle={[
                    styles.modalOverlay,
                    { backgroundColor: theme.dark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.4)' } // Less opacity in light mode
                ]}
            >
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'center' }}>
                    <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
                        <LinearGradient
                            colors={[theme.colors.surface, theme.colors.background]} // Slate 800 -> 900 base
                            style={styles.mainGradient}
                        >
                            {renderHeader()}

                            <View style={{ flex: 1 }}>
                                <ScrollView
                                    contentContainerStyle={{ padding: 20, paddingBottom: 40, flexGrow: 1 }}
                                    keyboardShouldPersistTaps="handled"
                                    showsVerticalScrollIndicator={false}
                                >
                                    {envio.estado !== 'en reparto' && envio.estado !== 'pendiente'
                                        ? renderDetalleTerminado()
                                        : (!modoEntrega && !modoDevolucion)
                                            ? renderActionButtons()
                                            : modoEntrega ? renderDeliveryForm() : renderRejectionForm()
                                    }
                                </ScrollView>
                            </View>
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
        backgroundColor: 'rgba(0,0,0,0.5)', // Base color, overridden inline
    },
    modalContent: {
        height: '85%', // Go back to fixed height but slightly smaller to satisfy "too tall" complaint
        width: '100%',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        overflow: 'hidden',
        // backgroundColor handled dynamically
    },
    mainGradient: {
        width: '100%',
        flex: 1, // Restore flex 1 to ensure it takes height
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align top items
        padding: 20,
        paddingTop: 25, // More top padding
        borderBottomWidth: 1,
        // borderBottomColor handled dynamically
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        // color handled dynamically
        width: '90%', // Prevent overlap with close button
    },
    headerSubtitle: {
        // color handled dynamically
        fontSize: 14,
        letterSpacing: 1,
        marginBottom: 10,
    },
    shipmentContext: {
        // backgroundColor handled dynamically
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
        // color handled dynamically
        fontSize: 13,
        flex: 1,
    },
    closeButton: {
        // backgroundColor handled dynamically
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
        width: '100%',
        // Removed flex: 1 and justifyContent: center to allow natural scroll
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        // color handled dynamically
        textAlign: 'center',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 15,
        // color handled dynamically
        textAlign: 'center',
        marginBottom: 30,
    },
    inputWrapper: {
        marginBottom: 15,
        borderRadius: 12,
        overflow: 'hidden',
        // backgroundColor handled dynamically
        borderWidth: 1,
        // borderColor handled dynamically
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
        // color handled dynamically
        fontWeight: '600',
    },

    // Rejection Options
    optionsList: {
        gap: 10,
    },
    optionRow: {
        padding: 16,
        // backgroundColor handled dynamically
        borderRadius: 12,
        borderWidth: 1,
        // borderColor handled dynamically
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    optionText: {
        // color handled dynamically
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
        // backgroundColor handled dynamically
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        // borderColor handled dynamically
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 8,
    },
    labelDark: {
        // color handled dynamically
        fontSize: 15,
    },
    valueDark: {
        // color handled dynamically
        fontSize: 18,
        fontWeight: '600',
    },
    dividerDark: {
        // backgroundColor handled dynamically
        marginVertical: 8,
    }
});

export default ModalAccionesEnvio;

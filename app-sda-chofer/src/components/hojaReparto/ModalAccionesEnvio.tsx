// components/hojaReparto/ModalAccionesEnvio.tsx

import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, Alert } from 'react-native';
import * as Location from 'expo-location';
import { modalesStyles } from '../../styles/modalesStyles';


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
    const [modoEntrega, setModoEntrega] = useState(false);
    const [nombreReceptor, setNombreReceptor] = useState('');
    const [dniReceptor, setDniReceptor] = useState('');

    const [modoDevolucion, setModoDevolucion] = useState(false);
    const [motivoDevolucion, setMotivoDevolucion] = useState('');
    const [mostrarOtroMotivo, setMostrarOtroMotivo] = useState(false);

    if (!visible || !envio) return null;

    const handleConfirmarEntrega = async () => {
        if (!nombreReceptor.trim() || !dniReceptor.trim()) {
            Alert.alert('Error', 'Por favor completá todos los campos.');
            return;
        }

        if (!/^[0-9]+$/.test(dniReceptor)) {
            Alert.alert('Error', 'El DNI debe ser un número válido.');
            return;
        }

        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Error', 'Permiso de ubicación denegado.');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const ubicacionEntrega = {
                type: "Point",
                coordinates: [location.coords.longitude, location.coords.latitude],
            };

            onEntregar(nombreReceptor.trim(), dniReceptor.trim(), ubicacionEntrega);

            setModoEntrega(false);
            setNombreReceptor('');
            setDniReceptor('');
        } catch (error) {
            Alert.alert('Error', 'No se pudo obtener la ubicación.');
            console.error("❌ Error al capturar ubicación:", error);
        }
    };

    const handleConfirmarDevolucion = () => {
        const motivoFinal = mostrarOtroMotivo ? motivoDevolucion.trim() : motivoDevolucion;

        if (!motivoFinal) {
            Alert.alert('Error', 'Por favor ingresá el motivo de la devolución.');
            return;
        }

        onDevolver(motivoFinal);
        setModoDevolucion(false);
        setMotivoDevolucion('');
        setMostrarOtroMotivo(false);
    };

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <View style={modalesStyles.modalOverlay}>
                <View style={modalesStyles.modalContainer}>
                    <Text style={modalesStyles.modalTitle}>
                        {envio.estado === "en reparto" ? "Acciones sobre el Envío" : "Detalle del Envío"}
                    </Text>

                    <Text style={modalesStyles.modalText}>Remito: {envio.remitoNumero || '-'}</Text>
                    <Text style={modalesStyles.modalText}>Destinatario: {envio.destinatario?.nombre || '-'}</Text>
                    <Text style={modalesStyles.modalText}>Localidad: {envio.localidadDestino?.nombre || '-'}</Text>

                    {envio.estado !== "en reparto" ? (
                        <View style={{ marginVertical: 10 }}>
                            <Text style={modalesStyles.modalText}>
                                Estado: {envio.estado.charAt(0).toUpperCase() + envio.estado.slice(1)}
                            </Text>

                            {envio.estado === "entregado" && (
                                <>
                                    <Text style={modalesStyles.modalText}>Recibido por: {envio.nombreReceptor || '-'}</Text>
                                    <Text style={modalesStyles.modalText}>DNI: {envio.dniReceptor || '-'}</Text>
                                </>
                            )}

                            {["devuelto", "rechazado", "no entregado", "reagendado", "cancelado"].includes(envio.estado) && (
                                <Text style={modalesStyles.modalText}>
                                    {(() => {
                                        switch (envio.estado) {
                                            case "devuelto":
                                                return `Motivo de devolución: ${envio.motivoDevolucion || '-'}`;
                                            case "rechazado":
                                                return `Motivo: ${envio.motivoDevolucion || 'Rechazo del destinatario'}`;
                                            case "no entregado":
                                                return `Motivo: ${envio.motivoNoEntrega || 'No se pudo realizar la entrega'}`;
                                            case "reagendado":
                                                return 'Este envío fue reagendado. Se reintentará más adelante.';
                                            case "cancelado":
                                                return 'Este envío fue cancelado por el administrador o remitente.';
                                            default:
                                                return '';
                                        }
                                    })()}
                                </Text>
                            )}
                        </View>
                    ) : (
                        <>
                            {!modoEntrega && !modoDevolucion ? (
                                <>
                                    <TouchableOpacity style={modalesStyles.btnConfirmar} onPress={() => setModoEntrega(true)}>
                                        <Text style={modalesStyles.buttonText}>Entregar Envío</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={modalesStyles.btnSecundario} onPress={() => setModoDevolucion(true)}>
                                        <Text style={modalesStyles.buttonText}>No se pudo entregar</Text>
                                    </TouchableOpacity>
                                </>
                            ) : modoEntrega ? (
                                <>
                                    <TextInput
                                        style={modalesStyles.input}
                                        placeholder="Nombre y Apellido del receptor"
                                        value={nombreReceptor}
                                        onChangeText={setNombreReceptor}
                                    />
                                    <TextInput
                                        style={modalesStyles.input}
                                        placeholder="DNI del receptor"
                                        keyboardType="numeric"
                                        value={dniReceptor}
                                        onChangeText={setDniReceptor}
                                    />
                                    <TouchableOpacity
                                        style={modalesStyles.btnConfirmar}
                                        onPress={() => {
                                            Alert.alert(
                                                "Confirmar entrega",
                                                "¿Estás seguro de que querés marcar este envío como entregado?",
                                                [
                                                    { text: "Cancelar", style: "cancel" },
                                                    { text: "Sí, confirmar", onPress: handleConfirmarEntrega }
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={modalesStyles.buttonText}>Confirmar Entrega</Text>
                                    </TouchableOpacity>

                                </>
                            ) : (
                                <>
                                    <TouchableOpacity
                                        style={modalesStyles.btnSecundario}
                                        onPress={() => {
                                            Alert.alert(
                                                "Confirmar devolución",
                                                "¿Querés marcar el envío como no entregado por este motivo?",
                                                [
                                                    { text: "Cancelar", style: "cancel" },
                                                    {
                                                        text: "Sí, confirmar",
                                                        onPress: () => {
                                                            onDevolver('No había nadie en el domicilio');
                                                            setModoDevolucion(false);
                                                            setMotivoDevolucion('');
                                                        }
                                                    }
                                                ]
                                            );
                                        }}

                                    >
                                        <Text style={modalesStyles.buttonText}>No había nadie en el domicilio</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={modalesStyles.btnSecundario}
                                        onPress={() => {
                                            Alert.alert(
                                                "Confirmar devolución",
                                                "¿Estás seguro de marcar el envío como no entregado por dirección incorrecta?",
                                                [
                                                    { text: "Cancelar", style: "cancel" },
                                                    {
                                                        text: "Sí, confirmar",
                                                        onPress: () => {
                                                            onDevolver('Dirección incorrecta');
                                                            setModoDevolucion(false);
                                                            setMotivoDevolucion('');
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={modalesStyles.buttonText}>No se encontró la dirección correcta</Text>
                                    </TouchableOpacity>


                                    <TouchableOpacity
                                        style={modalesStyles.btnSecundario}
                                        onPress={() => {
                                            Alert.alert(
                                                "Confirmar devolución",
                                                "¿Estás seguro de marcar el envío como no entregado porque no hay mayor de 18 años en el domicilio?",
                                                [
                                                    { text: "Cancelar", style: "cancel" },
                                                    {
                                                        text: "Sí, confirmar",
                                                        onPress: () => {
                                                            onDevolver('Sin mayor de 18 años en el domicilio');
                                                            setModoDevolucion(false);
                                                            setMotivoDevolucion('');
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={modalesStyles.buttonText}>No hay mayor de 18 años en el domicilio</Text>
                                    </TouchableOpacity>


                                    <TouchableOpacity
                                        style={modalesStyles.btnSecundario}
                                        onPress={() => {
                                            Alert.alert(
                                                "Confirmar devolución",
                                                "¿Estás seguro de marcar el envío como no entregado porque el destinatario rechazó la mercadería?",
                                                [
                                                    { text: "Cancelar", style: "cancel" },
                                                    {
                                                        text: "Sí, confirmar",
                                                        onPress: () => {
                                                            onDevolver('El destinatario rechazó la mercadería');
                                                            setModoDevolucion(false);
                                                            setMotivoDevolucion('');
                                                        }
                                                    }
                                                ]
                                            );
                                        }}
                                    >
                                        <Text style={modalesStyles.buttonText}>El destinatario rechaza la mercadería</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={modalesStyles.btnSecundario}
                                        onPress={() => setMostrarOtroMotivo(true)}
                                    >
                                        <Text style={modalesStyles.buttonText}>Otro motivo</Text>
                                    </TouchableOpacity>

                                    {mostrarOtroMotivo && (
                                        <>
                                            <TextInput
                                                style={modalesStyles.input}
                                                placeholder="Escribí el motivo"
                                                value={motivoDevolucion}
                                                onChangeText={setMotivoDevolucion}
                                            />
                                            <TouchableOpacity
                                                style={modalesStyles.btnConfirmar}
                                                onPress={() => {
                                                    const motivoFinal = motivoDevolucion.trim();

                                                    if (!motivoFinal) {
                                                        Alert.alert('Error', 'Por favor ingresá el motivo.');
                                                        return;
                                                    }

                                                    Alert.alert(
                                                        "Confirmar devolución",
                                                        `¿Estás seguro de marcar el envío como no entregado con el siguiente motivo?\n\n"${motivoFinal}"`,
                                                        [
                                                            { text: "Cancelar", style: "cancel" },
                                                            {
                                                                text: "Sí, confirmar",
                                                                onPress: () => {
                                                                    onDevolver(motivoFinal);
                                                                    setModoDevolucion(false);
                                                                    setMotivoDevolucion('');
                                                                    setMostrarOtroMotivo(false);
                                                                }
                                                            }
                                                        ]
                                                    );
                                                }}
                                            >
                                                <Text style={modalesStyles.buttonText}>Confirmar motivo</Text>
                                            </TouchableOpacity>

                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    <TouchableOpacity style={modalesStyles.btnCancelar} onPress={onClose}>
                        <Text style={modalesStyles.buttonText}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

};


export default ModalAccionesEnvio;

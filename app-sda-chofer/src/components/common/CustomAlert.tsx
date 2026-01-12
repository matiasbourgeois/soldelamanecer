
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Dialog, Portal, Text, Button, IconButton, useTheme } from 'react-native-paper';

interface CustomAlertProps {
    visible: boolean;
    title: string;
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    onClose: () => void;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
}

const CustomAlert: React.FC<CustomAlertProps> = ({
    visible,
    title,
    message,
    type = 'info',
    onClose,
    onConfirm,
    confirmText = 'ACEPTAR',
    cancelText = 'CANCELAR'
}) => {
    const theme = useTheme();

    const getIcon = () => {
        switch (type) {
            case 'success': return 'check-circle';
            case 'error': return 'alert-circle';
            case 'warning': return 'alert';
            default: return 'information';
        }
    };

    const getColor = () => {
        switch (type) {
            case 'success': return '#0ca678'; // Teal
            case 'error': return '#fa5252'; // Red
            case 'warning': return '#fcc419'; // Yellow
            default: return theme.colors.primary;
        }
    };

    const color = getColor();

    return (
        <Portal>
            <Dialog visible={visible} onDismiss={onClose} style={styles.dialog}>
                <Dialog.Content style={styles.content}>
                    <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                        <IconButton icon={getIcon()} iconColor={color} size={40} />
                    </View>

                    <Text style={[styles.title, { color: '#343a40' }]}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>
                </Dialog.Content>

                <Dialog.Actions style={styles.actions}>
                    {onConfirm && (
                        <Button
                            mode="text"
                            onPress={onClose}
                            textColor="#868e96"
                            style={{ flex: 1, borderRadius: 12 }}
                            labelStyle={{ fontWeight: '600' }}
                        >
                            {cancelText}
                        </Button>
                    )}
                    <Button
                        mode="contained"
                        onPress={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        buttonColor={color}
                        style={styles.confirmButton}
                        labelStyle={{ fontWeight: 'bold' }}
                    >
                        {confirmText}
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

const styles = StyleSheet.create({
    dialog: {
        borderRadius: 28,
        backgroundColor: 'white',
        alignSelf: 'center',
        width: '85%',
        maxWidth: 340,
        elevation: 24, // Strong shadow for Android
        shadowColor: '#000', // Shadow for iOS
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
    },
    content: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 0
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '800', // Extra bold
        marginBottom: 8,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    message: {
        fontSize: 16,
        color: '#495057',
        textAlign: 'center',
        marginBottom: 10,
        lineHeight: 24,
    },
    actions: {
        justifyContent: 'space-between', // Spread buttons evenly
        paddingBottom: 24,
        paddingHorizontal: 20, // Match content horizontal padding
        gap: 12,
        flexDirection: 'row',
        width: '100%', // Ensure actions container takes full width of dialog
    },
    confirmButton: {
        flex: 1, // Take available space
        borderRadius: 12,
        elevation: 0, // Flat look usually cleaner inside varied dialogs, or keep low
    }
});

export default CustomAlert;

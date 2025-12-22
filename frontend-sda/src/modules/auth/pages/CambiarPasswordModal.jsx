
import React, { useState, useContext } from 'react';
import { Modal, PasswordInput, Button, Group, Stack, Text, List, ThemeIcon } from '@mantine/core';
import { IconLock, IconCheck, IconX, IconShieldLock } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import axios from 'axios';
import AuthContext from '@core/context/AuthProvider';
import { apiUsuarios } from '@core/api/apiSistema';

const CambiarPasswordModal = ({ show, handleClose }) => {
    const { auth } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        passwordActual: '',
        passwordNueva: '',
        passwordConfirmar: ''
    });

    const handleChange = (name, value) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validatePassword = (password) => {
        const minLength = 8;
        const hasTwoNumbers = (password.match(/\d/g) || []).length >= 2;
        const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

        if (password.length < minLength) return "Debe tener al menos 8 caracteres";
        if (!hasTwoNumbers) return "Debe tener al menos 2 números";
        if (!hasSymbol) return "Debe tener al menos 1 símbolo";

        return null;
    };

    const handleSubmit = async () => {
        if (formData.passwordNueva !== formData.passwordConfirmar) {
            notifications.show({
                title: 'Error',
                message: 'Las nuevas contraseñas no coinciden',
                color: 'red',
                icon: <IconX size={18} />
            });
            return;
        }

        const error = validatePassword(formData.passwordNueva);
        if (error) {
            notifications.show({
                title: 'Contraseña Débil',
                message: error,
                color: 'red',
                icon: <IconShieldLock size={18} />
            });
            return;
        }

        setLoading(true);
        try {
            await axios.put(
                apiUsuarios('/api/usuarios/cambiar-password'),
                {
                    passwordActual: formData.passwordActual,
                    passwordNueva: formData.passwordNueva
                },
                {
                    headers: { Authorization: `Bearer ${auth.token}` }
                }
            );

            notifications.show({
                title: 'Éxito',
                message: 'Contraseña actualizada correctamente',
                color: 'green',
                icon: <IconCheck size={18} />
            });
            handleClose();
            setFormData({ passwordActual: '', passwordNueva: '', passwordConfirmar: '' });

        } catch (error) {
            console.error(error);
            notifications.show({
                title: 'Error',
                message: error.response?.data?.msg || 'No se pudo cambiar la contraseña',
                color: 'red',
                icon: <IconX size={18} />
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            opened={show}
            onClose={handleClose}
            title={<Text fw={700} c="cyan">Cambiar Contraseña</Text>}
            centered
            radius="md"
            overlayProps={{ opacity: 0.5, blur: 3 }}
        >
            <Stack>
                <PasswordInput
                    label="Contraseña Actual"
                    placeholder="Ingrese su contraseña actual"
                    icon={<IconLock size={16} />}
                    value={formData.passwordActual}
                    onChange={(e) => handleChange('passwordActual', e.currentTarget.value)}
                />

                <PasswordInput
                    label="Nueva Contraseña"
                    placeholder="Mínimo 8 caracteres"
                    icon={<IconLock size={16} />}
                    value={formData.passwordNueva}
                    onChange={(e) => handleChange('passwordNueva', e.currentTarget.value)}
                />

                {/* Password Requirements Hint */}
                <List size="xs" spacing={4} icon={<ThemeIcon color="gray" size={12} radius="xl"><IconCheck size={8} /></ThemeIcon>}>
                    <List.Item>Mínimo 8 caracteres</List.Item>
                    <List.Item>Al menos 2 números</List.Item>
                    <List.Item>Al menos 1 símbolo (ej. @, #, $)</List.Item>
                </List>

                <PasswordInput
                    label="Confirmar Nueva Contraseña"
                    placeholder="Repita la nueva contraseña"
                    icon={<IconLock size={16} />}
                    value={formData.passwordConfirmar}
                    onChange={(e) => handleChange('passwordConfirmar', e.currentTarget.value)}
                />

                <Group justify="flex-end" mt="md">
                    <Button variant="subtle" color="gray" onClick={handleClose}>Cancelar</Button>
                    <Button
                        color="cyan"
                        loading={loading}
                        onClick={handleSubmit}
                        disabled={!formData.passwordActual || !formData.passwordNueva}
                    >
                        Actualizar
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default CambiarPasswordModal;

import React, { createContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, setAuthToken } from '../api/client';
import { Usuario } from '../types';

interface AuthContextData {
    user: Usuario | null;
    token: string | null;
    isLoading: boolean;
    login: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextData>({} as AuthContextData);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<Usuario | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadStorageData();
    }, []);

    const loadStorageData = async () => {
        try {
            const storedUser = await AsyncStorage.getItem('@auth_user');
            const storedToken = await AsyncStorage.getItem('@auth_token');

            if (storedUser && storedToken) {
                const parsedUser = JSON.parse(storedUser);
                // ⚠️ Set global header immediately
                setAuthToken(storedToken);
                setUser(parsedUser);
                setToken(storedToken);
            }
        } catch (error) {
            console.log('Error loading auth data', error);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (email: string, pass: string) => {
        try {
            // ⚠️ Usando endpoint original que funcionaba
            const response = await api.post('/usuarios/login', {
                email: email.trim(),
                contrasena: pass // Backend espera 'contrasena'
            });
            const { token, usuario } = response.data;

            // 🛡️ BLOCK CLIENTS: Solo Choferes (o Admins) pueden entrar a la App Móvil
            if (usuario.rol !== 'chofer' && usuario.rol !== 'admin') {
                throw new Error('Acceso denegado. Esta app es exclusiva para choferes.');
            }

            setAuthToken(token);
            setUser(usuario);
            setToken(token);

            await AsyncStorage.setItem('@auth_token', token);
            await AsyncStorage.setItem('@auth_user', JSON.stringify(usuario));

        } catch (error: any) {
            if (error.response) {
                // Backend sends "error" prop, but we check "msg" too just in case
                throw new Error(error.response.data.error || error.response.data.msg || 'Error de credenciales');
            }
            throw new Error('Error de conexión con el servidor');
        }
    };

    const logout = async () => {
        setUser(null);
        setToken(null);
        setAuthToken(null);
        await AsyncStorage.removeItem('@auth_token');
        await AsyncStorage.removeItem('@auth_user');
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

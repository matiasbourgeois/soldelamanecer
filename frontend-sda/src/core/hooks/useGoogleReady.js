import { useState, useEffect } from "react";

/**
 * Hook que detecta cuando el script de Google GSI está listo.
 * Resuelve el race condition donde React renderiza el componente
 * antes de que el script de Google termine de cargarse en la primera visita.
 * 
 * El script ahora se precarga en index.html (async defer), pero puede
 * tardar algunos ms en estar disponible como window.google.accounts.id.
 * Este hook espera hasta que esté listo.
 */
export function useGoogleReady() {
    const [isReady, setIsReady] = useState(() => {
        // Chequeo síncrono: si ya está disponible (ej: F5 con caché), arrancar en true
        return typeof window !== "undefined" && !!window.google?.accounts?.id;
    });

    useEffect(() => {
        // Si ya estaba listo en el chequeo inicial, no hacer nada
        if (isReady) return;

        // Esperar a que window.google.accounts.id esté disponible
        const interval = setInterval(() => {
            if (window.google?.accounts?.id) {
                setIsReady(true);
                clearInterval(interval);
            }
        }, 50);

        // Safety timeout: si en 5 segundos no cargó, mostrarlo igual
        // (el componente GoogleLogin manejará el error internamente)
        const timeout = setTimeout(() => {
            setIsReady(true);
            clearInterval(interval);
        }, 5000);

        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [isReady]);

    return isReady;
}

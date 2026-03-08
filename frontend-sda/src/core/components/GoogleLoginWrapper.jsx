import { useGoogleOAuth } from "@react-oauth/google";
import { GoogleLogin } from "@react-oauth/google";
import { Text } from "@mantine/core";

/**
 * Wrapper sobre GoogleLogin que espera a que el Provider haya
 * inicializado correctamente el script de Google GSI.
 *
 * PROBLEMA RAÍZ: GoogleOAuthProvider inyecta el script dinámicamente
 * y rastrea cuándo termina a través de scriptLoadedSuccessfully.
 * Si el componente GoogleLogin se renderiza antes de que eso sea true,
 * no muestra nada (ni error). Esto pasa en producción en la primera visita.
 *
 * useGoogleOAuth() expone ese estado interno del Provider → es la manera
 * correcta y oficial de verificar si el script está listo.
 */
export function GoogleLoginWrapper({ text = "continue_with", ...props }) {
    const { scriptLoadedSuccessfully } = useGoogleOAuth();

    if (!scriptLoadedSuccessfully) {
        return (
            <div style={{ height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Text size="sm" c="dimmed">Cargando acceso con Google...</Text>
            </div>
        );
    }

    return (
        <GoogleLogin
            shape="pill"
            size="large"
            theme="outline"
            text={text}
            {...props}
        />
    );
}

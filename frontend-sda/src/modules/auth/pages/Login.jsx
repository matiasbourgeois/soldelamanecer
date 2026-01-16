import React, { useState, useContext } from "react";
import { apiUsuarios } from "@core/api/apiSistema";
import AuthContext from "@core/context/AuthProvider";
import { useNavigate } from "react-router-dom";
import {
  TextInput,
  PasswordInput,
  Checkbox,
  Anchor,
  Paper,
  Title,
  Text,
  Container,
  Group,
  Button,
  Alert,
  Stack,
  Box,
  rem,
  Center,
  Badge
} from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";

function Login() {
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", contrasena: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch(apiUsuarios("/api/usuarios/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        const { token, usuario } = data;
        const usuarioConToken = { ...usuario, _id: usuario._id || usuario.id, token };

        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(usuarioConToken));

        // Fetch complete profile
        const perfilResponse = await fetch(apiUsuarios("/api/usuarios/perfil"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const perfilData = await perfilResponse.json();

        const usuarioActualizado = {
          ...perfilData.usuario,
          token,
          _id: perfilData.usuario._id || perfilData.usuario.id,
        };

        localStorage.setItem("token", token);
        localStorage.setItem("usuario", JSON.stringify(usuarioActualizado));
        setAuth(usuarioActualizado);

        setTimeout(() => {
          if (usuario.rol === "cliente" && !usuario.perfilCompleto) {
            navigate("/completar-perfil");
          } else {
            navigate("/perfil");
          }
        }, 800);
      } else {
        setError(data.error || "Credenciales incorrectas");
        setLoading(false);
      }
    } catch (error) {
      console.error("Login error:", error);
      setError("Error de conexión. Intente nuevamente.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      backgroundColor: 'white',
      flex: 1,
      overflow: 'hidden'
    }}>
      {/* LADO IZQUIERDO: FORMULARIO (45% ancho) */}
      <div style={{
        flex: '0 0 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: rem(60),
        backgroundColor: 'white',
        zIndex: 2,
        position: 'relative',
        boxShadow: '20px 0 50px rgba(0,0,0,0.02)'
      }}>
        <Container size={400} px={0} m={0} style={{ width: '100%' }}>
          <Stack gap="xs" mb={40}>
            <Badge variant="light" color="cyan" size="lg" radius="sm" style={{ alignSelf: 'flex-start' }}>
              GESTIÓN LOGÍSTICA
            </Badge>
            <Title order={1} style={{ fontSize: rem(42), fontWeight: 900, letterSpacing: '-1.5px' }}>
              Acceso al <Text span inherit variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }}>sistema</Text>
            </Title>
            <Text c="dimmed" size="md">
              Ingrese sus credenciales para administrar sus operaciones.
            </Text>
          </Stack>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error de Acceso" color="red" radius="md" mb="xl" variant="light">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="lg">
              <TextInput
                label="Correo Electrónico"
                placeholder="usuario@soldelamanecer.ar"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                size="md"
                radius="md"
                styles={{ input: { fontSize: rem(15), height: rem(52) } }}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="••••••••"
                required
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                size="md"
                radius="md"
                styles={{ input: { fontSize: rem(15), height: rem(52) } }}
              />

              <Button
                fullWidth
                type="submit"
                loading={loading}
                size="lg"
                color="cyan"
                radius="md"
                style={{
                  height: rem(55),
                  fontSize: rem(16),
                  fontWeight: 800,
                  boxShadow: '0 10px 30px rgba(34, 184, 209, 0.3)',
                  marginTop: rem(10)
                }}
              >
                INICIAR SESIÓN
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt={40}>
            <Text size="sm" c="dimmed">¿No tiene una cuenta?</Text>
            <Anchor size="sm" fw={700} color="cyan" component="button" onClick={() => navigate('/registro')}>
              Solicitar Registro
            </Anchor>
          </Group>
        </Container>
      </div>

      {/* LADO DERECHO: VISUAL IMPACTANTE (55% ancho) */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #0b7285 0%, #1098ad 50%, #22b8cf 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Decoraciones de fondo */}
        <Box style={{
          position: 'absolute',
          top: '-10%',
          right: '-10%',
          width: rem(600),
          height: rem(600),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'pulse 8s infinite ease-in-out'
        }} />

        <Stack align="center" gap="xl" style={{ p: rem(40), textAlign: 'center', color: 'white', zIndex: 1 }}>
          <Box style={{ maxWidth: rem(450) }}>
            <Title order={2} style={{ fontSize: rem(38), fontWeight: 800, lineHeight: 1.1 }}>
              Soluciones para la Gestión de Transporte
            </Title>
            <Text mt="md" size="lg" c="cyan.0" style={{ opacity: 0.9 }}>
              Optimice su cadena de suministro con nuestra plataforma de herramientas logísticas profesionales.
            </Text>
          </Box>
        </Stack>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 0.6; }
            50% { transform: scale(1.1); opacity: 0.8; }
          }
          @media (max-width: 900px) {
            div[style*="flex: '0 0 45%'"] { flex: 1 !important; padding: 30px !important; }
            div[style*="background: 'linear-gradient"] { display: none !important; }
          }
        `}</style>
      </div>
    </div>
  );
}

export default Login;

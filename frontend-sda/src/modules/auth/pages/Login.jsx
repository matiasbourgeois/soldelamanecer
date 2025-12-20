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
    <div style={{ height: '100%', minHeight: '600px', display: 'flex', backgroundColor: '#f8f9fa', flex: 1 }}>
      {/* LEFT SIDE: FORM */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '600px', padding: '40px', backgroundColor: 'white', zIndex: 1 }}>
        <Container size={420} my={40} px={0}>
          <Title ta="center" order={2} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: rem(32) }}>
            Bienvenido de nuevo
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            ¿No tienes una cuenta aún?{' '}
            <Anchor size="sm" component="button" onClick={() => navigate('/registro')}>
              Crear cuenta
            </Anchor>
          </Text>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md" mt="xl">
              {error}
            </Alert>
          )}

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <form onSubmit={handleSubmit}>
              <Stack>
                <TextInput
                  label="Correo electrónico"
                  placeholder="tu@soldelamanecer.com"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />

                <PasswordInput
                  label="Contraseña"
                  placeholder="Tu contraseña"
                  required
                  mt="md"
                  name="contrasena"
                  value={formData.contrasena}
                  onChange={handleChange}
                />

                <Group justify="space-between" mt="lg">
                  <Checkbox label="Recordarme" />
                  <Anchor component="button" size="sm">
                    ¿Olviaste tu contraseña?
                  </Anchor>
                </Group>

                <Button fullWidth mt="xl" type="submit" loading={loading} size="md">
                  Iniciar Sesión
                </Button>
              </Stack>
            </form>
          </Paper>
        </Container>
      </div>

      {/* RIGHT SIDE: HERO IMAGE */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1098ad 0%, #0b7285 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Abstract Pattern Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(255,255,255,0.15) 0%, transparent 40%)',
          zIndex: 0
        }} />

        <Box style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: 'white', padding: '40px' }}>
          <Title order={1} style={{ fontSize: rem(36), fontWeight: 900, letterSpacing: '-1px', whiteSpace: 'nowrap' }}>
            Sol del Amanecer
          </Title>
          <Badge
            variant="light"
            color="white"
            size="lg"
            radius="sm"
            mt="md"
            style={{
              letterSpacing: '3px',
              textTransform: 'uppercase',
              fontWeight: 800,
              fontSize: rem(12),
              paddingInline: '1.5rem',
              border: '1px solid rgba(255,255,255,0.3)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255,255,255,0.1)'
            }}
          >
            WEB APP
          </Badge>
          <Text size="xl" mt="xl" style={{ opacity: 0.9, maxWidth: 500, marginInline: 'auto' }}>
            Gestiona tus envíos, rutas y logística con nuestra plataforma integral de última generación.
          </Text>
        </Box>
      </div>

      {/* Mobile Breakpoint Hiding (CSS would be better, but doing inline for quick win) */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="linear-gradient"] { display: none !important; }
          div[style*="maxWidth: '600px'"] { maxWidth: '100%' !important; flex: 1; }
        }
      `}</style>
    </div>
  );
}

export default Login;

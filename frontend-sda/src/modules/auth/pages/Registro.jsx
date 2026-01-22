
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiUsuarios } from "@core/api/apiSistema";
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Text,
  Container,
  Alert,
  Stack,
  Anchor,
  Box,
  rem,
  Checkbox,
  Badge,
  Modal,
  List,
  ThemeIcon,
  Group,
  ScrollArea
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconX, IconShieldLock } from "@tabler/icons-react";

function Registro() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    contrasena: "",
    confirmPassword: ""
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  // Password Validation Logic
  const validatePassword = (password) => {
    const minLength = 8;
    const hasTwoNumbers = (password.match(/\d/g) || []).length >= 2;
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password);

    if (password.length < minLength) return "Debe tener al menos 8 caracteres";
    if (!hasTwoNumbers) return "Debe tener al menos 2 números";
    if (!hasSymbol) return "Debe tener al menos 1 símbolo";

    return null;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!termsAccepted) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    if (formData.contrasena !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    const passwordError = validatePassword(formData.contrasena);
    if (passwordError) {
      setError(`Contraseña insegura: ${passwordError}`);
      return;
    }

    setMensaje("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(apiUsuarios("/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje(data.mensaje || "¡Registro exitoso! Redirigiendo...");
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.error || "Error al registrarse. Intente nuevamente.");
        setLoading(false);
      }
    } catch (error) {
      console.error("❌ Error en el registro:", error);
      setError("Error de conexión con el servidor");
      setLoading(false);
    }
  };

  // Helper for password requirements list
  const getRequirementIcon = (met) => (
    <ThemeIcon color={met ? "teal" : "gray"} size="xs" radius="xl">
      {met ? <IconCheck size={10} /> : <IconX size={8} />}
    </ThemeIcon>
  );

  const pwd = formData.contrasena;
  const hasMinLength = pwd.length >= 8;
  const hasTwoNums = (pwd.match(/\d/g) || []).length >= 2;
  const hasSym = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(pwd);
  const passwordsMatch = formData.contrasena === formData.confirmPassword;

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      backgroundColor: 'white',
      flex: 1,
      overflow: 'hidden'
    }}>
      {/* LADO IZQUIERDO: FORMULARIO */}
      <div style={{
        flex: '0 0 45%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: rem(30),
        backgroundColor: 'white',
        zIndex: 2,
        position: 'relative',
        boxShadow: '20px 0 50px rgba(0,0,0,0.02)'
      }}>
        <Container size={400} px={0} m={0} style={{ width: '100%' }}>
          <Stack gap="xs" mb={10}>
            <Title order={1} style={{ fontSize: rem(28), fontWeight: 900, letterSpacing: '-1.5px' }}>
              Registro de <Text span inherit variant="gradient" gradient={{ from: 'cyan', to: 'indigo' }}>usuarios</Text>
            </Title>
            <Text c="dimmed" size="md">
              Cree su cuenta corporativa para acceder a nuestras soluciones de gestión de carga.
            </Text>
          </Stack>

          {mensaje && (
            <Alert icon={<IconCheck size={16} />} title="¡Éxito!" color="green" radius="md" mb="xl" variant="light">
              {mensaje}
            </Alert>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md" mb="xl" variant="light">
              {error}
            </Alert>
          )}


          <form onSubmit={handleSubmit}>
            <Stack gap="xs">
              <TextInput
                label="Nombre Completo"
                placeholder="Su nombre completo"
                required
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                size="md"
                radius="md"
                styles={{ input: { height: rem(36) } }}
              />

              <TextInput
                label="Correo Electrónico"
                placeholder="tu@mail.com"
                required
                name="email"
                value={formData.email}
                onChange={handleChange}
                size="md"
                radius="md"
                styles={{ input: { height: rem(36) } }}
              />

              <PasswordInput
                label="Contraseña"
                placeholder="Mínimo 8 caracteres"
                required
                name="contrasena"
                value={formData.contrasena}
                onChange={handleChange}
                size="md"
                radius="md"
                styles={{ input: { height: rem(36) } }}
              />

              <PasswordInput
                label="Confirmar Contraseña"
                placeholder="Repita su contraseña"
                required
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                size="md"
                radius="md"
                styles={{ input: { height: rem(36) } }}
              />

              {/* Password Requirements Box - ALWAYS VISIBLE */}
              <Paper withBorder p="xs" radius="md" bg="gray.0">
                <Text size="sm" fw={700} mb="xs" c="dimmed">Requisitos de contraseña:</Text>
                <List spacing="xs" size="sm" center icon={
                  <ThemeIcon color="gray" size="xs" radius="xl">
                    <IconX size={8} />
                  </ThemeIcon>
                }>
                  <List.Item icon={getRequirementIcon(hasMinLength)}>
                    Mínimo 8 caracteres
                  </List.Item>
                  <List.Item icon={getRequirementIcon(hasTwoNums)}>
                    Al menos 2 números
                  </List.Item>
                  <List.Item icon={getRequirementIcon(hasSym)}>
                    Al menos 1 símbolo
                  </List.Item>
                  <List.Item icon={getRequirementIcon(passwordsMatch && formData.contrasena.length > 0)}>
                    Las contraseñas coinciden
                  </List.Item>
                </List>
              </Paper>

              <Group align="center" gap="xs">
                <Checkbox
                  checked={termsAccepted}
                  onChange={(event) => setTermsAccepted(event.currentTarget.checked)}
                />
                <Text size="xs">
                  Acepto los <Anchor component="button" type="button" onClick={() => setShowTerms(true)} size="xs" fw={700}>términos y condiciones</Anchor>
                </Text>
              </Group>

              <Button
                fullWidth
                type="submit"
                loading={loading}
                size="lg"
                color="cyan"
                radius="md"
                style={{
                  height: rem(42),
                  fontSize: rem(15),
                  fontWeight: 800,
                  boxShadow: '0 10px 30px rgba(34, 184, 209, 0.3)',
                  marginTop: rem(5)
                }}
              >
                REGISTRARSE
              </Button>
            </Stack>
          </form>

          <Group justify="center" mt={30}>
            <Text size="sm" c="dimmed">¿Ya tiene cuenta?</Text>
            <Anchor size="sm" fw={700} color="cyan" component="button" onClick={() => navigate('/login')}>
              Iniciar Sesión
            </Anchor>
          </Group>
        </Container>
      </div>

      {/* LADO DERECHO: VISUAL IMPACTANTE */}
      <div style={{
        flex: 1,
        background: 'linear-gradient(135deg, #1864ab 0%, #1098ad 50%, #0b7285 100%)',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Decoraciones animadas */}
        <Box style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: rem(500),
          height: rem(500),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          filter: 'blur(50px)',
          animation: 'pulse-reg 10s infinite ease-in-out'
        }} />

        <Stack align="center" gap="xl" style={{ p: rem(40), textAlign: 'center', color: 'white', zIndex: 1 }}>
          <Box style={{ maxWidth: rem(450) }}>
            <Title order={2} style={{ fontSize: rem(34), fontWeight: 800, lineHeight: 1.2 }}>
              Gestión Integral de su Flota
            </Title>
            <Text mt="md" size="lg" c="cyan.0" style={{ opacity: 0.85 }}>
              Herramientas integrales para el control de envíos y administración de recursos logísticos.
            </Text>
          </Box>
        </Stack>

        <style>{`
          @keyframes pulse-reg {
            0%, 100% { transform: scale(1.1) translate(0,0); opacity: 0.5; }
            50% { transform: scale(1) translate(20px, -20px); opacity: 0.7; }
          }
          @media (max-width: 900px) {
            div[style*="flex: '0 0 45%'"] { flex: 1 !important; padding: 30px !important; }
            div[style*="background: 'linear-gradient"] { display: none !important; }
          }
        `}</style>
      </div>

      {/* T&C Modal */}
      <Modal
        opened={showTerms}
        onClose={() => setShowTerms(false)}
        title={<Text fw={700}>Términos y Condiciones</Text>}
        size="lg"
        centered
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="md">
          <Text size="sm">
            Bienvenido a la plataforma de Sol del Amanecer. Al registrarte, aceptas los siguientes términos de uso:
          </Text>

          <Title order={5}>1. Uso del Servicio</Title>
          <Text size="sm">
            Esta plataforma está destinada exclusivamente para la gestión de envíos y logística. El uso indebido o fraudulento de la cuenta resultará en su suspensión inmediata.
          </Text>

          <Title order={5}>2. Privacidad de Datos</Title>
          <Text size="sm">
            Sus datos personales serán tratados con estricta confidencialidad y utilizados únicamente para fines operativos del servicio de transporte y facturación.
          </Text>

          <Title order={5}>3. Responsabilidad</Title>
          <Text size="sm">
            El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso. Sol del Amanecer no se hace responsable por accesos no autorizados derivados de negligencia del usuario.
          </Text>

          <Title order={5}>4. Modificaciones</Title>
          <Text size="sm" mb="lg">
            Nos reservamos el derecho de modificar estos términos en cualquier momento. Se notificará a los usuarios sobre cambios relevantes.
          </Text>

          <Group justify="flex-end">
            <Button onClick={() => setShowTerms(false)}>Entendido</Button>
          </Group>
        </Stack>
      </Modal>
    </div>
  );
}

export default Registro;

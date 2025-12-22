
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

    const passwordError = validatePassword(formData.contrasena);
    if (passwordError) {
      setError(`Contraseña insegura: ${passwordError}`);
      return;
    }

    setMensaje("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(apiUsuarios("/api/usuarios/register"), {
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

  return (
    <div style={{ height: '100%', minHeight: '600px', display: 'flex', backgroundColor: '#f8f9fa', flex: 1 }}>
      {/* LEFT SIDE: FORM */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', maxWidth: '600px', padding: '40px', backgroundColor: 'white', zIndex: 1 }}>
        <Container size={420} my={40} px={0}>
          <Title ta="center" order={2} style={{ fontFamily: 'Inter, sans-serif', fontWeight: 900, fontSize: rem(32) }}>
            Crear cuenta
          </Title>
          <Text c="dimmed" size="sm" ta="center" mt={5}>
            ¿Ya tienes una cuenta?{' '}
            <Anchor size="sm" component="button" onClick={() => navigate('/login')}>
              Iniciar sesión
            </Anchor>
          </Text>

          {mensaje && (
            <Alert icon={<IconCheck size={16} />} title="¡Éxito!" color="green" radius="md" mt="xl">
              {mensaje}
            </Alert>
          )}

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" radius="md" mt="xl">
              {error}
            </Alert>
          )}

          <Paper withBorder shadow="md" p={30} mt={30} radius="md">
            <form onSubmit={handleSubmit}>
              <Stack>
                <TextInput
                  label="Nombre completo"
                  placeholder="Juan Pérez"
                  required
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  autoComplete="off"
                  readOnly={true}
                  onFocus={(e) => e.target.readOnly = false}
                />

                <TextInput
                  label="Correo electrónico"
                  placeholder="tu@mail.com"
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="new-email" // Non-standard but effective
                  readOnly={true}
                  onFocus={(e) => e.target.readOnly = false}
                />

                <Box>
                  <PasswordInput
                    label="Contraseña"
                    placeholder="Mínimo 8 caracteres"
                    required
                    name="contrasena"
                    value={formData.contrasena}
                    onChange={handleChange}
                    autoComplete="new-password"
                    readOnly={true}
                    onFocus={(e) => e.target.readOnly = false}
                  />
                  {/* Password Requirements Hint */}
                  <List size="xs" spacing={4} mt={5} center>
                    <List.Item icon={getRequirementIcon(hasMinLength)}>Mínimo 8 caracteres</List.Item>
                    <List.Item icon={getRequirementIcon(hasTwoNums)}>Al menos 2 números</List.Item>
                    <List.Item icon={getRequirementIcon(hasSym)}>Al menos 1 símbolo (ej. @, #, $)</List.Item>
                  </List>
                </Box>

                <Group align="center" gap="xs">
                  <Checkbox
                    checked={termsAccepted}
                    onChange={(event) => setTermsAccepted(event.currentTarget.checked)}
                  />
                  <Text size="sm">
                    Acepto los <Anchor component="button" type="button" onClick={() => setShowTerms(true)} size="sm">términos y condiciones</Anchor>
                  </Text>
                </Group>

                <Button fullWidth mt="xl" type="submit" loading={loading} size="md">
                  Crear cuenta
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
            Únete a la red
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
            Comienza a gestionar tu logística de manera eficiente hoy mismo.
          </Text>
        </Box>
      </div>

      {/* Mobile Breakpoint Hiding */}
      <style>{`
        @media (max-width: 900px) {
          div[style*="linear-gradient"] { display: none !important; }
          div[style*="maxWidth: '600px'"] { maxWidth: '100%' !important; flex: 1; }
        }
      `}</style>

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

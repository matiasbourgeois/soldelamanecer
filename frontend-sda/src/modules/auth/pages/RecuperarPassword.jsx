import React, { useState } from "react";
import { Container, Paper, Title, Text, TextInput, Button, Group, Box, Anchor } from "@mantine/core";
import { Mail, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { apiUsuariosApi } from "@core/api/apiSistema";
import axios from "axios";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";

const RecuperarPassword = () => {
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      mostrarAlerta("Por favor ignresa tu correo electrónico.", "warning");
      return;
    }

    setCargando(true);
    try {
      // POST a la API pública /recuperar-password
      await axios.post(apiUsuariosApi("/recuperar-password"), { email });
      setEnviado(true);
      mostrarAlerta("¡Instrucciones enviadas exitosamente!", "success");
    } catch (error) {
      console.error("Error al solicitar recuperación:", error);
      mostrarAlerta(
        error.response?.data?.error || "Ocurrió un error al procesar la solicitud.",
        "danger"
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Title ta="center" className="login-title">
        ¿Olvidaste tu <span className="highlight-text">contraseña?</span>
      </Title>
      
      <Text c="dimmed" fz="sm" ta="center" mt={5}>
        Ingresá tu email para recibir un enlace de recuperación
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" bg="white">
        {enviado ? (
          <Box ta="center">
            <Mail size={48} color="#0891b2" style={{ margin: "auto", marginBottom: "1rem" }} />
            <Text fw={500} size="lg" mb="sm">¡Revisa tu bandeja de entrada!</Text>
            <Text c="dimmed" size="sm" mb="lg">
              Te enviamos las instrucciones paso a paso para recuperar tu cuenta a <b>{email}</b>. (Verifica también la carpeta de Spam).
            </Text>
            <Button component={Link} to="/login" fullWidth mt="xl" color="cyan" variant="light">
              Volver al inicio de sesión
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <TextInput
              label="Correo electrónico"
              placeholder="tu@email.com"
              required
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              leftSection={<Mail size={16} />}
              radius="md"
              size="md"
              disabled={cargando}
            />

            <Button
              fullWidth
              mt="xl"
              size="md"
              color="cyan"
              type="submit"
              loading={cargando}
            >
              Enviar instrucciones
            </Button>

            <Group justify="center" mt="md">
              <Anchor component={Link} to="/login" c="dimmed" size="sm" display="flex" style={{ alignItems: 'center', gap: '5px' }}>
                <ArrowLeft size={14} /> Volver a iniciar sesión
              </Anchor>
            </Group>
          </form>
        )}
      </Paper>
    </Container>
  );
};

export default RecuperarPassword;

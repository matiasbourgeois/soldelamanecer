import React, { useState } from "react";
import { Container, Paper, Title, Text, PasswordInput, Button, Box, Anchor } from "@mantine/core";
import { Lock, ArrowLeft } from "lucide-react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiUsuariosApi } from "@core/api/apiSistema";
import axios from "axios";
import { mostrarAlerta } from "@core/utils/alertaGlobal.jsx";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [nuevaContrasena, setNuevaContrasena] = useState("");
  const [confirmarContrasena, setConfirmarContrasena] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!nuevaContrasena || !confirmarContrasena) {
      mostrarAlerta("Completá ambos campos", "warning");
      return;
    }

    if (nuevaContrasena !== confirmarContrasena) {
      mostrarAlerta("Las contraseñas no coinciden", "warning");
      return;
    }

    if (nuevaContrasena.length < 6) {
      mostrarAlerta("La contraseña debe tener al menos 6 caracteres", "warning");
      return;
    }

    setCargando(true);
    try {
      const { data } = await axios.post(apiUsuariosApi(`/reset-password/${token}`), {
        nuevaContrasena,
      });

      mostrarAlerta(data.mensaje || "Contraseña restablecida con éxito.", "success");
      navigate("/login");
    } catch (error) {
      console.error("Error al restablecer:", error);
      mostrarAlerta(
        error.response?.data?.error || "Error al restablecer la contraseña. El enlace puede haber expirado.",
        "danger"
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <Container size={420} my={80}>
      <Title ta="center" className="login-title">
        Crear nueva <span className="highlight-text">contraseña</span>
      </Title>
      
      <Text c="dimmed" fz="sm" ta="center" mt={5}>
        Ingresá tu nueva clave segura
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md" bg="white">
        <form onSubmit={handleSubmit}>
          <PasswordInput
            label="Nueva contraseña"
            placeholder="Tu nueva contraseña"
            required
            value={nuevaContrasena}
            onChange={(e) => setNuevaContrasena(e.currentTarget.value)}
            leftSection={<Lock size={16} />}
            radius="md"
            size="md"
            disabled={cargando}
            mb="md"
          />

          <PasswordInput
            label="Confirmar contraseña"
            placeholder="Repetí la contraseña"
            required
            value={confirmarContrasena}
            onChange={(e) => setConfirmarContrasena(e.currentTarget.value)}
            leftSection={<Lock size={16} />}
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
            Actualizar Contraseña
          </Button>

          <Box mt="md" ta="center">
            <Anchor component={Link} to="/login" c="dimmed" size="sm" display="inline-flex" style={{ alignItems: 'center', gap: '5px' }}>
              <ArrowLeft size={14} /> Volver al Inicio
            </Anchor>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default ResetPassword;

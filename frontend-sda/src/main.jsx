import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";



import { AuthProvider } from "@core/context/AuthProvider";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
  // 📐 Breakpoints explícitos para UI responsiva en 19" (1366x768)
  breakpoints: {
    xs: '30em',      // 480px
    sm: '48em',      // 768px
    md: '64em',      // 1024px
    lg: '85.375em',  // 1366px ← TARGET: Monitores 19"
    xl: '120em',     // 1920px — Monitores 24"/27"
  },
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <MantineProvider theme={theme}>
        <Notifications position="top-right" zIndex={2077} />
        <ModalsProvider labels={{ confirm: 'Confirmar', cancel: 'Cancelar' }}>
          <AuthProvider>
            <App key={Date.now()} />
          </AuthProvider>
        </ModalsProvider>
      </MantineProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);

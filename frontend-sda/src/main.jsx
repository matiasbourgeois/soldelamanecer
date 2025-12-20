import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";



import { AuthProvider } from "@core/context/AuthProvider";
import { MantineProvider, createTheme } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

const theme = createTheme({
  primaryColor: 'cyan',
  fontFamily: 'Inter, sans-serif',
  defaultRadius: 'md',
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <Notifications position="top-right" zIndex={2077} />
      <ModalsProvider labels={{ confirm: 'Confirmar', cancel: 'Cancelar' }}>
        <AuthProvider>
          <App key={Date.now()} />
        </AuthProvider>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
);

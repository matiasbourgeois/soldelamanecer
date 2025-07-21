import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./index.css";
import "react-datepicker/dist/react-datepicker.css";



// IMPORTAMOS EL PROVIDER
import { AuthProvider } from "./context/AuthProvider";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <App key={Date.now()} />
    </AuthProvider>
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom"; // Importamos BrowserRouter
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css"; // Importamos Bootstrap

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter> {/* 🔹 Envuelve App con BrowserRouter */}
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

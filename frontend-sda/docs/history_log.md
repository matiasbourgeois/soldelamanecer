# 📝 Historial de Cambios y Rastreo (Project Log)

Este archivo registra la evolución del proyecto, las herramientas utilizadas y los cambios significativos realizados.

## Sesión: Refinamiento de Tracking y Auth (18/12/2025)

### Objetivos Completados
1.  **Refinamiento UI Seguimiento (`BuscarSeguimiento.jsx`, `ResultadoSeguimiento.jsx`)**:
    *   **Cambio:** Eliminación de fondos opacos/beige. Implementación de Fondo Blanco Puro (`#ffffff`).
    *   **Cambio:** Ajuste de layout a `Container size="lg"` para balance visual.
    *   **Cambio:** Reducción del espaciado vertical en el Timeline (40px -> 20px).
    *   **Verificación:** Testeado con código real `SDA-2025-VNARUV` (Historial complejo).

2.  **Unificación de Iconos**:
    *   **Cambio:** Estandarización de librería de íconos en Auth.
    *   **Detalle:** `Login.jsx` migrado de `lucide-react` a `@tabler/icons-react` para coincidir con `Registro.jsx`.

3.  **Verificación de Servidores**:
    *   **Acción:** Se levantaron los servidores (Frontend Vite + Backend Usuarios + Backend Sistema) que estaban caídos.
    *   **Acción:** Captura de pantallas de verificación para Login y Registro en vivo.

### Tecnologías Activas
*   **Frontend Framework:** React + Vite.
*   **UI Library:** Mantine UI v7 (Core, Hooks).
*   **Icons:** `@tabler/icons-react` (Estándar principal).
*   **HTTP Client:** Axios / Fetch.
*   **Backend:** Node.js + Express + MongoDB (No modificado en esta sesión salvo consultas).

### Archivos Modificados
*   `src/pages/seguimiento/BuscarSeguimiento.jsx`
*   `src/pages/seguimiento/ResultadoSeguimiento.jsx`
*   `src/pages/Login.jsx`
*   `docs/golden_rules.md`
*   `docs/history_log.md`

________________________________________________________________________________

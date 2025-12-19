# 📜 Reglas de Oro - Sol del Amanecer

Este documento define los principios inquebrantables para el diseño y desarrollo del sistema.

## 🎨 1. Sistema de Diseño (Estética "God Level")

### Paleta de Colores
Utilizar la **Paleta Cyan de Mantine** (`primaryColor: 'cyan'`).
*   **Color Principal:** Mantine Cyan (Ocean Blue) - Tono fresco, moderno y energético.
*   **Estética:** "Ocean Tech", vibrante pero profesional.
*   **Contraste:** Texto blanco sobre botones cyan, gris oscuro sobre fondo blanco.

### Regla del Fondo Blanco
*   **Fondo General:** Siempre **Blanco Puro (`#FFFFFF`)**.
*   **Prohibido:** Fondos grises, beige u opacos en los contenedores principales de contenido. La limpieza es prioridad.

### Componentes UI
*   **Consistencia:** Usar componentes de **Mantine UI** para todo.
*   **Estilo de Tarjetas:** `shadow="xl"`, `radius="lg"`, `withBorder`. Deben "flotar" elegantemente.
*   **Inputs:** Deben tener buena definición. Si están sobre blanco, asegurar que el borde sea visible.

## 🛡️ 2. Protocolo de Desarrollo

### Seguridad del Backend
*   **NO TOCAR EL BACKEND** a menos que sea estrictamente necesario.
*   Si se requiere un cambio en el backend, **PREGUNTAR PRIMERO**.
*   No romper la lógica existente al refactorizar el frontend.

### "Nivel Dios"
*   El objetivo estético es siempre la excelencia. No entregar diseños básicos o "MVPs".
*   Si algo se ve "roto", "desalineado" o "amontonado", es un **bug**.

## 📝 3. Documentación y Rastreo
*   Mantener actualizado el archivo `history_log.md` con cada sesión de trabajo.
*   Registrar qué se cambió, qué tecnologías se usaron y el resultado.

---
*Última actualización: 18/12/2025*

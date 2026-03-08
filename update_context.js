const fs = require("fs");
const content = fs.readFileSync("CONTEXTO_COMPLETO_SISTEMA.md", "utf8");
let lines = content.split("\n");
let truncateIndex = lines.findIndex(l => l.includes("El personal administrativo modificaba rutas"));
if (truncateIndex === -1) {
    truncateIndex = lines.findIndex(l => l.includes("FIN DEL DOCUMENTO"));
}
if (truncateIndex !== -1) {
    lines.length = truncateIndex;
} else {
    const phase85 = lines.findIndex(l => l.includes("FASE 8.5"));
    if (phase85 > 0) lines.length = phase85 + 50; 
}

while(lines.length > 0 && (lines[lines.length-1].trim() === "" || !lines[lines.length-1].startsWith("- "))) {
    if (lines[lines.length-1].includes("FASE 8.5") || lines[lines.length-1].includes("NotificacionesPanel")) break;
    lines.pop();
}

const appendix = `

## FASE 9: GOD TIER FIXES Y REFINAMIENTO LOGÍSTICO (Marzo 2026)
Esta fase representa la consolidación y blindaje absoluto del sistema frente a concurrencia, errores humanos, caídas de servidor y problemas de husos horarios.

### 1. Sistema Integral de Aprobaciones para Rutas
- **Problema**: Riesgo de alteraciones no autorizadas en tarifas y datos de rutas por parte de administrativos.
- **Solución**: Creación de un motor de intercepción (modelo SolicitudAprobacion). Toda edición o creación por parte de un administrativo genera una solicitud pendiente, bloqueando ediciones adicionales hasta que un administrador (o gerente) resuelva la solicitud.
- **UI Nivel Dios**: Vista de diff (antes/después) en React, cruce en tiempo real de los datos, y badge visual tipo "candado" en el gestor de rutas.

### 2. Time Machine & Backfill de Hojas de Reparto
- **Problema**: Al estar apagado el servidor por días, el cronjob automático omitió la creación de hojas de reparto necesarias.
- **Solución**: Programación de scripts ad-hoc para inyección retroactiva (Backfill) y creación de una "Time Machine" oficial: el endpoint /api/sistema/recuperar-dias-caidos.
- **Efecto**: Capacidad de generar hojas operativas perdidas respetando validaciones de fin de semana y feriados, con cambio de estado progresivo en el tiempo.

### 3. Blindaje Huso Horario (Timezones) y Fechas Estrictas
- **Problema**: Inconsistencias temporales entre el Frontend (que parseaba en Local Time) y MongoDB (UTC), provocando desfases de -1 día en reportes y asignaciones de hojas.
- **Solución**: Refactorización global utilizando moment-timezone centrada rígidamente en America/Argentina/Buenos_Aires.
- **Ejecución**: Se eliminaron usos de setHours() manual y cruces con Day.js en la interfaz, consolidando todo sobre la librería timeUtil.js desarrollada para blindaje backend.

### 4. Upgrade Absoluto del Motor de Liquidaciones
- **Problema**: El cálculo de liquidaciones fallaba al arrastrar tarifas fijas transversales o no incluir el último día del mes en el simulador.
- **Solución**:
    - Re-ingeniería del simulador sumando T23:59:59 a los rangos de fecha ($lte).
    - Rescate automatizado de tarifas ("Por Distribución" y "Por Mes") directo del esquema raíz si la Hoja de Reparto las omite.
    - Prevención de sueldos fijos mensuales duplicados vía uso de Sets() en el ciclo iterativo.
    - Cancelación silenciosa: Al anular una liquidación en estado borrador, el sistema libera estructuralmente los viajes sin enviar correos falsos a los contratistas.

### 5. Configuración Dinámica y Reportes Automatizados a Droguería del Sud
- **Problema**: Necesidad de exportar y notificar por correo el parte diario logístico a los clientes B2B.
- **Solución**: Implementación de una arquitectura híbrida de plantillas HTML y generador Puppeteer en Node. Se añadió una sección en ConfiguracionAdmin.jsx para administrar la lista de destinatarios, logrando un envío One-Click con PDFs profesionales desde el Control Operativo.

### 6. Controles Estrictos Frontend / Backend
- **Problema**: Choferes con mismo documento, introducción de horas ilógicas (ej: 29:99) en partes diarios.
- **Solución**:
    - Validaciones asíncronas en el alta rápida de origen para denegar duplicidad DNI/CUIL.
    - Refactorización de Auto-Formatting Time Input HHMM -> HH:MM, restringiendo horas a 23 y minutos a 59 usando expresiones regulares interactivas en Mantine.

---

**FIN DEL DOCUMENTO - CONTEXTO COMPLETO ACTUALIZADO**
`;

fs.writeFileSync("CONTEXTO_COMPLETO_SISTEMA.md", lines.join("\n") + appendix, "utf8");
console.log("Context updated successfully.");


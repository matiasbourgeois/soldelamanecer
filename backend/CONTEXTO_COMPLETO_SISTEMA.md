# 📋 CONTEXTO COMPLETO DEL SISTEMA - Sol del Amanecer

**Última actualización**: 27/02/2026 (Refactorización Nivel Dios)
**Estado**: ✅ **FASE 14 COMPLETA — Soft Delete, Auto-Cierre y Bautismo de Hojas**

---

## 🧠 HANDOVER NIVEL DIOS: LO QUE TENÉS QUE SABER SÍ O SÍ (Toda Nueva IA Leer Aquí)

### 1. El Core del Negocio (Logística B2B)
Sol del Amanecer trabaja principalmente para **DROGUERÍA**. Droguería no está modelada como un "Cliente" en la BD normal, ella es el alma operativa: te paga por **Rutas Fijas** y vos mandas vehículos a hacerlas.
El objetivo secundario ("la ganancia real") es meter paquetes de OTROS clientes en estas rutas armadas para aprovechar el viaje (costo cero extra).

### 2. Empleados vs Contratados (La Regla de Oro)
- **Empleados**: Relación de dependencia. Tienen chofer asignado pero usan vehículos de la empresa.
- **Contratados (Proveedores)**: Son monotributistas externos. **"LA RUTA MANDA"**: Si un contratado tiene asignada la ruta 'L-ALCA', el sistema jala su tarifa y vehículo **desde la Ruta**, no desde su legajo fiscal.
- **Tipos de Pago de Contratados**: 
   - `por_km`: (Km de Ruta + Km Extras en Hoja) * Precio/Km
   - `por_vuelta`: Pagos por giros o viajes específicos.
   - `fijo_viaje`: Un monto llano por día (Hojas Especiales).
   - `por_mes`: Tarifa plana mensual sin importar la producción.

### 3. El Ciclo de Vida de las "Hojas de Reparto" (El Eje del ERP)
Todo viaje nace y muere en una **Hoja de Reparto**. Nunca toques envíos huérfanos sin entender la Hoja.
1. **00:01 AM (Cron)**: Nacen hojas vacías para cada ruta activa que no sea feriado en el `cronGenerarHojas.js`. (Inician en estado `pendiente`). **AQUÍ NACEN CON EL CÓDIGO `HR-[RUTA]-YYYY-MM-DD`**.
2. **Cada 15 min (Cron)**: Si la hora actual superó la `horaSalida` de la ruta, la hoja pasa a `en reparto`. (`cronCambiarEstados.js`).
3. **Durante el día**: El Chofer usa la App Móvil para entregar paquetes.
4. **Auto-Cierre Reactivo**: Si el Chofer entrega/rechaza el ÚLTIMO paquete que quedaba "en reparto" en la hoja, la hoja se **Cierra Automáticamente** y libera el vehículo para otro viaje.
5. **00:30 AM (Cron)**: Escoba nocturna (`cronCerrarHojas.js`). Cierra brutalmente cualquier hoja del día anterior que haya quedado abierta y pasa a `reagendado` los paquetes no entregados.

### 4. Seguridad de la Data: Soft Delete (NUNCA BORRES NADA)
- Las Hojas de Reparto **se pueden eliminar** en caso de suspensión de un recorrido o error de ruteo, pero **NUNCA DE LA BASE DE DATOS**.
- Se cambió su estado a `cancelada`.
- **Efecto de la Cancelación**: La hoja desaparece del Control Operativo (a menos que uses el filtro explícito), sus envíos vuelven a Pila/Bodega (`hojaReparto: null`), y el departamento Financiero ignora las hojas `canceladas` a la hora de pagar a los Contratistas.

---


---

## 📦 FASE 12: SESIÓN 27/02/2026 — Control Operativo God Tier y Soft Delete

### 🗂 Soft Delete en Hojas de Reparto
**Problema resuelto:** Los administrativos necesitaban poder "Limpiar" o "Anular" hojas de reparto creadas por accidente o viajes suspendidos de Droguería (ej. feriados locales o cancelaciones de último minuto), pero Recursos Humanos y Finanzas exigían historial de dichas eliminaciones.
**Solución Arquitectural:**
1. **Endpoint**: `DELETE /api/hojas-reparto/:id` → Ahora efectúa un "Soft Delete". Pone `estado: 'cancelada'` en vez de remover la fila en MongoDB.
2. **Efecto Cascada Inverso**: Libera permanentemente los `envios` que tenía la hoja adentro (los pone en `pendiente` y `hojaReparto: null`), devolviéndolos a bodega.
3. **Finanzas Blindadas**: `liquidacionController.js` ignora implícitamente estados 'cancelada' a la hora de emitir cheques de Contratistas.

---

## 🤖 FASE 13: SESIÓN 27/02/2026 — Auto-Cierre Inteligente y Reactivo

### 🗂 Fin a las Hojas Abiertas ("Stuck")
**Problema resuelto:** Las hojas solo se cerraban con el Cron a la 00:30 AM ("Cierre Nocturno"), o cuando un Admin lo forzaba a mano. Esto retenía el Vehículo en el sistema y generaba ruido logístico.
**Solución Arquitectural:**
- Se inyectó un watcher en `envioController.js` → `actualizarEstadoEnvio()`.
- **Lógica**: Cada vez que el chofer en la calle marca un paquete como Entregado / Rechazado / Reagendado / Devuelto, el backend inspecciona silenciosamente a los hermanos de ese paquete en la Hoja actual. Si descubre que ya no queda ni un solo paquete "en reparto" o "pendiente", declara la ruta 100% transaccionada y ejecuta `hoja.estado = "cerrada"` y `hoja.terminadaPorChofer = true` on the fly.

---

## 🏷️ FASE 14: SESIÓN 27/02/2026 — Bautismo Logístico y Backfill Retroactivo

### 🗂 Fix: Bug de Identidad en `numeroHoja`
**Problema resuelto:** Durante meses, las hojas nacían como "S/N" (Sin Número) o retornaban un Error `500` debido a colisiones en `generarNumeroHoja()`. La vieja IA había roto el generador al no pasar el `codigoRuta`.
**Solución Arquitectural:**
1. **Refactorización del Motor Gen**: Se arregló `generarNumeroHoja(codigoRuta)` para que parsee la fecha actual y la abrevie en formato `HR-CGE-2026-02-27`.
2. **Limpieza Visual**: Se eliminó el sufijo incremental ("-001") estúpido de las hojas únicas de la mañana, logrando una estética ultra-pulida y profesional. Solo usa sufijos si un segundo refuerzo va a la misma ruta el mismo día.
3. **Pasantía del Cron**: Ahora `generarHojasAutomaticas()` las bautiza al nacer, erradicando los valores "null".
4. **Rescate Histórico (Backfill)**: Se desarrolló y ejecutó un Script en Producción (`backfill-numeros-hojas.js`) que escaneó 379 Hojas muertas de meses pasados y les inyectó su nombre legítimo retrospectivamente según su Timestamp, curando para siempre el linaje de la base de datos de Sol del Amanecer.

---
**FIN DEL DOCUMENTO - CONTEXTO COMPLETO ACTUALIZADO (27/02/2026)**

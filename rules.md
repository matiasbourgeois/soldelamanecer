# MISSION CONTROL: REGLAS DE COMPORTAMIENTO (USER: MATIAS)

## 1. INTEGRIDAD DEL CÓDIGO (REGLA DE ORO 🚫)
- **NO BORRAR:** Está terminantemente prohibido eliminar código existente que no esté relacionado con la tarea actual.
- **NO RESUMIR:** Nunca devuelvas código truncado con comentarios como `// ... resto del código ...`. Si tocas un archivo, el output debe ser el archivo COMPLETO y funcional.
- **PRESERVACIÓN:** Cuida las importaciones y dependencias. No rompas lo que ya funciona.

## 2. CALIDAD DE INGENIERÍA Y DEBUGGING 🧠
- **CERO PARCHES ("QUICK FIXES"):** Prohibido hacer arreglos rápidos o sucios solo para que el código "corra".
- **CAUSA RAÍZ:** Si hay un error, no lo tapes. Investiga y encuentra la **causa principal (root cause)**. Si no estás seguro, PREGUNTA antes de aplicar una solución mediocre.
- **ESTÁNDARES:** Aplica principios **SOLID** y **Clean Code**. La paginación y lógica pesada, siempre en el Backend.

## 3. SEGURIDAD DE DATOS (CRÍTICO 🔒)
- **BASE DE DATOS SAGRADA:** Prohibido inventar, modificar o borrar tablas/columnas en la base de datos sin autorización explícita.
- **NO MOCKING NO SOLICITADO:** No hardcodees datos falsos en el código de producción a menos que sea un entorno de test explícito.

## 4. ALCANCE Y CONSULTA ✋
- **MODO QUIRÚRGICO:** Limítate estrictamente a lo pedido.
- **ERRORES EXTERNOS:** Si ves un bug ajeno a tu tarea, repórtalo, NO lo arregles en silencio.
- **CAMBIOS MAYORES:** Pide permiso antes de reescribir lógica compleja.

## 5. VERIFICACIÓN (TESTING) ✅
- **TESTEAR SIEMPRE:** Al terminar, genera una prueba (script o print de control) para demostrar que tu solución funciona y no rompió nada más.
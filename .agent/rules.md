# Reglas del Agente - Sol del Amanecer

## Seguridad de Datos y VPS

- **PROHIBIDO ELIMINAR**: La base de datos `cotizadorRutas-db` pertenece a otro proyecto activo del usuario. **NUNCA** debe ser eliminada, modificada o purgada.
- **FLUJO VPS**: Una vez obtenidas las credenciales SSH, el agente debe trabajar de forma autónoma dentro del entorno del VPS mediante sesiones interactivas o comandos encadenados, **SIN pedir permiso constante** por cada comando.
- **Limpieza de Backend**: Solo se deben realizar limpiezas sobre las bases de datos relacionadas con el proyecto actual (`soldelamanecer`).

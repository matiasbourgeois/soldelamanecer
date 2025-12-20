
# 📱 Guía para Usar la App en tu Celular

Para probar la aplicación **App Chofer** en tu teléfono físico, seguí estos pasos sencillos. No necesitás instalar Android Studio ni configurar cables complicados, solo usar **Expo Go**.

## 1. Descargar la App "Expo Go"
Andá a la tienda de aplicaciones de tu celular y descargá la app gratuita:
*   **Android (Play Store):** Buscar "Expo Go".
*   **iPhone (App Store):** Buscar "Expo Go".

## 2. Conectar a la Misma Wi-Fi
⚠️ **MUY IMPORTANTE:**
Tu celular y tu computadora deben estar conectados a la **misma red Wi-Fi**. Si tu PC está por cable y el celu por Wi-Fi, a veces funciona, pero lo ideal (y más seguro para evitar errores) es que ambos estén en la misma red.

## 3. Iniciar el Servidor en tu PC
En la terminal de Visual Studio Code (asegurate de estar en la carpeta `app-sda-chofer`), ejecutá:

```powershell
npm start
```

Esto iniciará el servidor de desarrollo ("Metro Bundler"). Verás un **Código QR** grande en la terminal.

## 4. Escanear el Código QR
*   **En Android:** Abrí la app "Expo Go", tocá "Scan QR Code" y escaneá el código de la pantalla de tu PC.
*   **En iPhone:** Abrí la cámara normal del iPhone, apuntá al QR y tocá el enlace que aparece para abrirlo en Expo Go.

---

## 🛠 Solución de Problemas Comunes

### "Network Error" o "No se puede conectar al backend"
La App necesita saber dónde está tu servidor (el Backend). Actualmente está configurada para buscarlo en la IP `192.168.0.132`.

**Si tu computadora cambia de IP (por reiniciar el router, etc.), la app dejará de conectar.**

**¿Cómo arreglarlo?**
1.  En tu PC, abrí una terminal nueva y escribí: `ipconfig`
2.  Buscá la línea **Dirección IPv4** (ej: `192.168.0.15` o `192.168.1.50`).
3.  Si es diferente a `192.168.0.132`, tenés que actualizarla en estos dos archivos de la App:
    *   `src/screens/LoginScreen.tsx`
    *   `src/screens/HojaRepartoScreen.tsx`
4.  Guardá los cambios y la app se recargará sola.

### "La app se queda en blanco o cargando"
A veces Expo necesita reiniciarse.
1.  En la terminal de la PC, apretá `r` para recargar.
2.  Si no funciona, cerrá Expo Go en el celu y volvelo a abrir.

---

¡Listo! Ya podés usar la app como si fuera una aplicación nativa real. 🚀

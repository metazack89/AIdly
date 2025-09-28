# 🚑 Aidly: Rescate Digital

**El primer asistente digital de emergencias que funciona incluso sin internet.**  
Un proyecto nacido en *vibe coding* durante un hackatón, creado para **empoderar a cualquier persona a salvar vidas** en los momentos más críticos.

🌐 **Deploy:** https://rescate-digital.emergent.host/

---

## 💡 La Idea
Cada segundo cuenta en una emergencia. Muchas veces no sabemos cómo reaccionar, no tenemos internet o no podemos pedir ayuda a tiempo.

**Aidly** nace como un **compañero digital** que te guía paso a paso en **primeros auxilios básicos**:
- RCP 🫀
- Atragantamiento 😮‍💨
- Quemaduras 🔥
- Heridas 🩹

Con **voz integrada en español latino** para que no necesites mirar la pantalla, y un **botón SOS** que alerta a tus contactos de confianza con tu ubicación.

---

## ⚙️ Tecnologías (especial atención: **PWA**)
Aidly es una **PWA (Progressive Web App)** construida con un stack moderno y pensada para ser **installable** y **offline-first**:

- **PWA:** Web App Manifest, Service Worker (Workbox recomendado), Cache Storage, Background Sync, Installable (Add to Home Screen).
- **Frontend:** React + Vite ⚡
- **UI/UX:** TailwindCSS 🎨
- **Asistente por voz:** Web Speech API con fallback a ResponsiveVoice / Google TTS 🔊
- **Almacenamiento offline:** IndexedDB (localForage) para datos sensibles y colas de acciones
- **Backend (opcional):** Node.js + Express para auth y mensajería 🔐
- **Integraciones SOS:** APIs nativas del navegador (tel:, geolocation), proveedores SMS (Twilio/Messaging) opcional
- **Deploy:** Host estático (Emergent Host) 🚀

> **Nota PWA:** La app está pensada para instalarse en el dispositivo y funcionar aún en modo avión. El Service Worker precarga protocolos críticos (textos, imágenes y audios) para garantizar guía ininterrumpida.

---

## 🔥 Features principales
- Asistente guiado paso a paso (RCP, atragantamiento, quemaduras, heridas).  
- **PWA installable**: se puede agregar a la pantalla principal como app nativa.  
- **Modo voz** en español latino que lee cada paso sin que el usuario mire la pantalla.  
- Detección inteligente por preguntas rápidas que derivan al protocolo correcto.  
- **Offline-first**: cache y colas para enviar SOS cuando vuelva la conexión.  
- **Botón SOS**: long-press para evitar false positives, envía SMS con ubicación y abre llamada al número local de emergencia (configurable por país).  
- Importar y gestionar contactos de emergencia.  
- Accesibilidad: alto contraste, tipografías legibles y control de tamaño.

---

## 📲 Cómo instalar como PWA (usuario)
- **Android/Chrome:** Abrir `https://rescate-digital.emergent.host` → Menú (⋮) → "Agregar a pantalla de inicio".  
- **iOS/Safari:** Abrir en Safari → Botón compartir → "Agregar a pantalla de inicio".  
- Una vez instalado, la app se comporta como nativa: splash screen, pantalla full, y acceso offline.

---

## 🛠️ Cómo correr localmente (desarrollador)
```bash
# clonar repositorio
git clone <repo-url>
cd aidly

# instalar dependencias
npm install

# modo desarrollo
npm run dev

# build para producción
npm run build
# servir la build localmente para probar PWA
npm run preview
```

**Sugerencias para PWA en desarrollo:** usar `vite-plugin-pwa` para integrar manifest y precaching fácilmente, y `workbox` si se necesita control avanzado de caches.

---

## 🧭 Buenas prácticas PWA y recomendaciones
- Pre-cachear assets críticos: protocolos, audios TTS fallback, iconos y manifest.  
- Usar `Background Sync` para colas de SOS si el usuario está offline.  
- Mantener `emergencyNumbers.json` local y actualizable por país.  
- Cifrar información sensible en IndexedDB con Web Crypto API.  
- Pedir permisos (ubicación, contactos) **con explicaciones claras** antes de solicitar.

---

## 🎶 Vibe Coding
Este proyecto nació en **vibe coding**: música alta, café, deadlines amistosos, prototipado rápido y mucha energía de equipo. El resultado es una PWA pensada para el mundo real: práctica, rápida y emocionalmente relevante.

---

## 🚀 Roadmap
- [x] Deploy inicial online  
- [x] Protocolos de primeros auxilios en español latino  
- [x] Botón SOS y geolocalización básica  
- [x] PWA shell y manifest  
- [ ] Optimizar TTS con voces naturales y cache de audios precargados  
- [ ] Encriptación y backend robusto para sincronización de contactos  
- [ ] Integraciones con wearables / smartwatches

---

## 🤝 Contribuciones
¿Quieres sumar? ¡Genial!  
1. Forkea el repo.  
2. Crea una rama feature/tu-idea.  
3. Abre un PR con descripción clara y screenshots.  
4. Mantén el tono de *vibe coding* en los commits 🎧☕️

---

## 📄 Licencia
MIT — Haz lo que quieras, solo no olvides salvar vidas.

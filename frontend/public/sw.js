/* Aidly Medical Emergency PWA Service Worker */

const CACHE_NAME = 'aidly-v1.0.0';
const RUNTIME_CACHE = 'aidly-runtime';

// Core resources to cache immediately
const PRECACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  // ResponsiveVoice for offline voice support
  'https://code.responsivevoice.org/responsivevoice.js',
  // Medical procedure images
  'https://images.unsplash.com/photo-1622115297822-a3798fdbe1f6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxDUFJ8ZW58MHx8fHwxNzU5MDMwNjQ3fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1630964046403-8b745c1e3c69?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwyfHxDUFJ8ZW58MHx8fHwxNzU5MDMwNjQ3fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1622115585848-1d5b6e8af4e4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHw0fHxDUFJ8ZW58MHx8fHwxNzU5MDMwNjQ3fDA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1580115465903-0e4a824a4e9a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwxfHxmaXJzdCUyMGFpZHxlbnwwfHx8fDE3NTkwMzA2NTN8MA&ixlib=rb-4.1.0&q=85',
  'https://images.unsplash.com/photo-1624638760852-8ede1666ab07?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxmaXJzdCUyMGFpZHxlbnwwfHx8fDE3NTkwMzA2NTN8MA&ixlib=rb-4.1.0&q=85',
  'https://images.pexels.com/photos/3760275/pexels-photo-3760275.jpeg'
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/medical-procedures/,
  /\/api\/health/
];

// Medical emergency data - critical offline content
const EMERGENCY_PROCEDURES = {
  'cpr-adult': {
    id: 'cpr-adult',
    name: 'RCP para Adultos',
    description: 'Reanimación cardiopulmonar para adultos que han perdido el conocimiento',
    category: 'cpr',
    difficulty: 'intermedio',
    duration_minutes: 5,
    images: [
      'https://images.unsplash.com/photo-1622115297822-a3798fdbe1f6?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDF8MHwxfHNlYXJjaHwxfHxDUFJ8ZW58MHx8fHwxNzU5MDMwNjQ3fDA&ixlib=rb-4.1.0&q=85'
    ],
    steps: [
      { step: 1, title: 'Verificar consciencia', description: 'Toca suavemente los hombros de la persona. Pregunta en voz alta si está bien. Observa si responde o se mueve', duration: 10 },
      { step: 2, title: 'Pedir ayuda médica', description: 'Llama inmediatamente al servicio de emergencias. Si hay alguien cerca, pídele que llame mientras tú continúas', duration: 30 },
      { step: 3, title: 'Posicionar las manos', description: 'Coloca el talón de una mano en el centro del pecho, entre los pezones. Pon la otra mano encima, entrelazando los dedos', duration: 15 },
      { step: 4, title: 'Comprensiones torácicas', description: 'Presiona fuerte y rápido, hundiendo el pecho al menos 5 centímetros. Mantén un ritmo de 100 a 120 compresiones por minuto', duration: 120 },
      { step: 5, title: 'Respiración de rescate', description: 'Inclina la cabeza hacia atrás, levanta la barbilla. Sella su boca con la tuya y da dos respiraciones lentas', duration: 10 },
      { step: 6, title: 'Continuar ciclos', description: 'Alterna 30 compresiones con 2 respiraciones. No te detengas hasta que llegue ayuda médica profesional', duration: 0 }
    ]
  },
  'choking-adult': {
    id: 'choking-adult',
    name: 'Atragantamiento en Adultos',
    description: 'Maniobra de Heimlich para adultos conscientes que se están atragantando',
    category: 'choking',
    difficulty: 'básico',
    duration_minutes: 2,
    steps: [
      { step: 1, title: 'Reconocer el atragantamiento', description: 'Pregunta si se está atragantando. Busca señales como no poder hablar, toser débilmente o dificultad para respirar', duration: 5 },
      { step: 2, title: 'Colocarse detrás', description: 'Párate detrás de la persona. Rodea su cintura con tus brazos manteniendo la calma', duration: 5 },
      { step: 3, title: 'Formar el puño', description: 'Haz un puño con una mano. Coloca el lado del pulgar contra el abdomen, justo arriba del ombligo', duration: 5 },
      { step: 4, title: 'Empujes abdominales', description: 'Agarra el puño con la otra mano. Realiza empujes rápidos y firmes hacia arriba y hacia adentro', duration: 30 },
      { step: 5, title: 'Continuar hasta desalojar', description: 'Repite los empujes hasta que el objeto salga o la persona pierda el conocimiento. Mantén la calma', duration: 0 }
    ]
  },
  'burns-minor': {
    id: 'burns-minor',
    name: 'Quemaduras Menores',
    description: 'Tratamiento para quemaduras leves y escaldaduras que no son graves',
    category: 'burns',
    difficulty: 'básico',
    duration_minutes: 10,
    steps: [
      { step: 1, title: 'Alejar del calor', description: 'Retira inmediatamente a la persona de la fuente de calor. Asegúrate de que esté en un lugar seguro', duration: 5 },
      { step: 2, title: 'Enfriar la quemadura', description: 'Aplica agua fresca, no fría, sobre la quemadura durante 10 a 20 minutos. Esto aliviará el dolor', duration: 600 },
      { step: 3, title: 'Retirar objetos', description: 'Quita cuidadosamente joyas y ropa suelta del área quemada antes de que se inflame', duration: 30 },
      { step: 4, title: 'Proteger la herida', description: 'Cubre con una gasa estéril limpia. Nunca uses hielo, mantequilla o remedios caseros', duration: 60 },
      { step: 5, title: 'Aliviar el dolor', description: 'Si es necesario, puedes dar medicamentos para el dolor que se vendan sin receta médica', duration: 5 }
    ]
  },
  'wounds-bleeding': {
    id: 'wounds-bleeding',
    name: 'Hemorragia Severa',
    description: 'Control de sangrado abundante en heridas que no se detienen',
    category: 'wounds',
    difficulty: 'intermedio',
    duration_minutes: 5,
    steps: [
      { step: 1, title: 'Protégete', description: 'Usa guantes si tienes, o coloca una barrera limpia entre tus manos y la sangre para evitar infecciones', duration: 10 },
      { step: 2, title: 'Presión directa', description: 'Aplica presión firme y constante sobre la herida con un paño limpio o gasa. No retires el paño', duration: 30 },
      { step: 3, title: 'Elevar si es posible', description: 'Si es seguro hacerlo, eleva la parte herida por encima del nivel del corazón para reducir el sangrado', duration: 5 },
      { step: 4, title: 'Mantener presión', description: 'Continúa aplicando presión constante. Si la sangre empapa el vendaje, añade más encima sin quitar el anterior', duration: 180 },
      { step: 5, title: 'Buscar ayuda médica', description: 'Llama inmediatamente a los servicios de emergencia. El sangrado severo requiere atención profesional urgente', duration: 30 }
    ]
  }
};

// Emergency contact numbers for Latin America
const EMERGENCY_NUMBERS = {
  'AR': '911', // Argentina
  'BO': '911', // Bolivia
  'BR': '192', // Brazil (SAMU)
  'CL': '131', // Chile
  'CO': '123', // Colombia
  'CR': '911', // Costa Rica
  'CU': '104', // Cuba
  'DO': '911', // Dominican Republic
  'EC': '911', // Ecuador
  'SV': '911', // El Salvador
  'GT': '123', // Guatemala
  'HN': '911', // Honduras
  'MX': '911', // Mexico
  'NI': '911', // Nicaragua
  'PA': '911', // Panama
  'PY': '911', // Paraguay
  'PE': '116', // Peru
  'UY': '911', // Uruguay
  'VE': '171', // Venezuela
  'default': '911'
};

// Install event - cache core resources
self.addEventListener('install', event => {
  console.log('[SW] Installing Aidly Service Worker');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching core resources');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Core resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache core resources:', error);
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating Aidly Service Worker');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName.startsWith('aidly-') && cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map(cacheName => {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle other requests (CSS, JS, images)
  event.respondWith(handleResourceRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  // Special handling for medical procedures - provide offline fallback
  if (url.pathname === '/api/medical-procedures') {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        // Cache the fresh response
        const cache = await caches.open(RUNTIME_CACHE);
        cache.put(request, networkResponse.clone());
        return networkResponse;
      }
    } catch (error) {
      console.log('[SW] Network failed for medical procedures, serving offline data');
    }
    
    // Return offline procedures if network fails
    const procedures = Object.values(EMERGENCY_PROCEDURES);
    return new Response(JSON.stringify(procedures), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // For other API requests, try network first, then cache
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for API request:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return generic error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable', offline: true }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle navigation requests (page loads)
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      return networkResponse;
    }
  } catch (error) {
    console.log('[SW] Network failed for navigation, serving cached page');
  }
  
  // Fallback to cached index.html
  const cachedResponse = await caches.match('/');
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Ultimate fallback - offline page
  return new Response(
    generateOfflinePage(),
    {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    }
  );
}

// Handle resource requests (CSS, JS, images)
async function handleResourceRequest(request) {
  // Try cache first for better performance
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Failed to fetch resource:', request.url);
    
    // For images, return a placeholder
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="#f3f4f6"/><text x="50" y="50" text-anchor="middle" dy=".3em" fill="#9ca3af">Imagen</text></svg>',
        {
          status: 200,
          headers: { 'Content-Type': 'image/svg+xml' }
        }
      );
    }
    
    throw error;
  }
}

// Generate offline page HTML
function generateOfflinePage() {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Aidly - Modo Sin Conexión</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .container {
          max-width: 400px;
          background: white;
          padding: 2rem;
          border-radius: 16px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .heart {
          width: 64px;
          height: 64px;
          background: #ef4444;
          margin: 0 auto 1rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
        }
        h1 {
          color: #1f2937;
          margin-bottom: 1rem;
          font-size: 1.5rem;
        }
        p {
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 1.5rem;
        }
        .procedures {
          text-align: left;
          background: #f9fafb;
          padding: 1rem;
          border-radius: 8px;
          margin: 1rem 0;
        }
        .procedures h3 {
          color: #374151;
          margin-top: 0;
          font-size: 1rem;
        }
        .procedures ul {
          margin: 0;
          padding-left: 1.2rem;
        }
        .procedures li {
          color: #4b5563;
          margin-bottom: 0.5rem;
        }
        .sos-info {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 1rem;
          margin-top: 1rem;
        }
        .sos-info h3 {
          color: #dc2626;
          margin-top: 0;
          font-size: 1rem;
        }
        .emergency-number {
          font-size: 1.5rem;
          font-weight: bold;
          color: #dc2626;
        }
        .retry-btn {
          background: #ef4444;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          margin-top: 1rem;
        }
        .retry-btn:hover {
          background: #dc2626;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="heart">❤️</div>
        <h1>Aidly - Modo Sin Conexión</h1>
        <p>No hay conexión a internet, pero puedes acceder a los procedimientos médicos básicos guardados en tu dispositivo.</p>
        
        <div class="procedures">
          <h3>📚 Procedimientos Disponibles:</h3>
          <ul>
            <li>RCP para Adultos</li>
            <li>Atragantamiento en Adultos</li>
            <li>Tratamiento de Quemaduras Menores</li>
            <li>Control de Sangrado Severo</li>
          </ul>
        </div>
        
        <div class="sos-info">
          <h3>🚨 En Caso de Emergencia</h3>
          <p>Número de emergencia:</p>
          <div class="emergency-number">911</div>
          <p style="font-size: 0.9rem; margin-top: 0.5rem;">Llama directamente desde tu teléfono</p>
        </div>
        
        <button class="retry-btn" onclick="window.location.reload()">Intentar Reconectar</button>
      </div>
      
      <script>
        // Check for connection periodically
        setInterval(() => {
          if (navigator.onLine) {
            window.location.reload();
          }
        }, 5000);
      </script>
    </body>
    </html>
  `;
}

// Handle background sync for emergency alerts
self.addEventListener('sync', event => {
  if (event.tag === 'emergency-sync') {
    event.waitUntil(syncEmergencyData());
  }
});

// Sync emergency data when connection is restored
async function syncEmergencyData() {
  try {
    // Get pending emergency alerts from IndexedDB or localStorage
    const pendingAlerts = await getPendingEmergencyAlerts();
    
    for (const alert of pendingAlerts) {
      try {
        await fetch('/api/emergency/sos', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${alert.token}`
          },
          body: JSON.stringify(alert.data)
        });
        
        // Remove from pending list after successful sync
        await removePendingAlert(alert.id);
        console.log('[SW] Emergency alert synced successfully');
      } catch (error) {
        console.error('[SW] Failed to sync emergency alert:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Handle push notifications for emergency updates
self.addEventListener('push', event => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'Tienes una nueva notificación de emergencia',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: [200, 100, 200, 100, 200],
      tag: 'emergency-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Ver Detalles',
          icon: '/icons/view-action.png'
        },
        {
          action: 'dismiss',
          title: 'Descartar',
          icon: '/icons/dismiss-action.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Aidly Emergency', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Utility functions for IndexedDB operations
async function getPendingEmergencyAlerts() {
  // Implementation would use IndexedDB to store/retrieve pending alerts
  // For now, return empty array
  return [];
}

async function removePendingAlert(alertId) {
  // Implementation would remove alert from IndexedDB
  console.log(`[SW] Removing pending alert: ${alertId}`);
}

// Handle critical resource caching and audio caching
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_EMERGENCY_DATA') {
    event.waitUntil(cacheEmergencyResources());
  } else if (event.data && event.data.type === 'CACHE_AUDIO_DATA') {
    event.waitUntil(cacheAudioResources(event.data.audioData));
  } else if (event.data && event.data.type === 'GENERATE_OFFLINE_AUDIO') {
    event.waitUntil(generateOfflineAudioCache());
  }
});

// Cache emergency resources
async function cacheEmergencyResources() {
  const cache = await caches.open(CACHE_NAME);
  
  // Cache emergency procedure images
  const imagesToCache = [
    'https://images.unsplash.com/photo-1622115297822-a3798fdbe1f6',
    'https://images.unsplash.com/photo-1630964046403-8b745c1e3c69',
    'https://images.unsplash.com/photo-1622115585848-1d5b6e8af4e4',
    'https://images.unsplash.com/photo-1580115465903-0e4a824a4e9a',
    'https://images.unsplash.com/photo-1624638760852-8ede1666ab07',
    'https://images.pexels.com/photos/3760275/pexels-photo-3760275.jpeg'
  ];
  
  try {
    await cache.addAll(imagesToCache);
    console.log('[SW] Emergency resources cached successfully');
  } catch (error) {
    console.error('[SW] Failed to cache emergency resources:', error);
  }
}

// Cache audio data for offline voice synthesis
async function cacheAudioResources(audioData) {
  try {
    const cache = await caches.open('aidly-audio-cache');
    
    for (const audio of audioData) {
      const audioBlob = new Blob([audio.data], { type: 'audio/wav' });
      const audioResponse = new Response(audioBlob, {
        headers: {
          'Content-Type': 'audio/wav',
          'X-Audio-Text': audio.text,
          'X-Audio-Language': 'es-MX'
        }
      });
      
      await cache.put(`/audio/${audio.id}`, audioResponse);
    }
    
    console.log('[SW] Audio resources cached for offline use');
  } catch (error) {
    console.error('[SW] Failed to cache audio resources:', error);
  }
}

// Generate and cache audio for all emergency procedures
async function generateOfflineAudioCache() {
  console.log('[SW] Generating offline audio cache for emergency procedures');
  
  const audioTexts = [];
  
  // Generate audio texts for all procedures
  Object.values(EMERGENCY_PROCEDURES).forEach(procedure => {
    procedure.steps.forEach((step, index) => {
      const stepNumber = index + 1;
      const totalSteps = procedure.steps.length;
      
      const introText = stepNumber === 1 
        ? `Iniciando procedimiento de ${procedure.name}. Paso ${stepNumber} de ${totalSteps}.`
        : `Paso ${stepNumber} de ${totalSteps}.`;
      
      const mainText = `${step.title}. ${step.description}`;
      const timeText = step.duration > 0 
        ? `Mantén esto durante ${step.duration} segundos.`
        : '';
      
      const fullText = `${introText} ${mainText} ${timeText}`.trim();
      
      audioTexts.push({
        id: `${procedure.id}_step_${stepNumber}`,
        text: fullText,
        procedure: procedure.id,
        step: stepNumber
      });
    });
  });
  
  // Store audio text mappings for offline synthesis
  try {
    const cache = await caches.open('aidly-audio-text-cache');
    
    for (const audioText of audioTexts) {
      const textResponse = new Response(JSON.stringify(audioText), {
        headers: {
          'Content-Type': 'application/json',
          'X-Procedure-ID': audioText.procedure,
          'X-Step-Number': audioText.step.toString()
        }
      });
      
      await cache.put(`/audio-text/${audioText.id}`, textResponse);
    }
    
    console.log('[SW] Generated offline audio text cache with', audioTexts.length, 'entries');
  } catch (error) {
    console.error('[SW] Failed to generate offline audio cache:', error);
  }
}

// Retrieve cached audio for offline use
async function getCachedAudio(procedureId, stepNumber) {
  try {
    const audioId = `${procedureId}_step_${stepNumber}`;
    
    // Try to get pre-generated audio
    const audioCache = await caches.open('aidly-audio-cache');
    const audioResponse = await audioCache.match(`/audio/${audioId}`);
    
    if (audioResponse) {
      return await audioResponse.blob();
    }
    
    // Fallback to text for Web Speech API
    const textCache = await caches.open('aidly-audio-text-cache');
    const textResponse = await textCache.match(`/audio-text/${audioId}`);
    
    if (textResponse) {
      const textData = await textResponse.json();
      return { text: textData.text, fallbackToWebSpeech: true };
    }
    
    return null;
  } catch (error) {
    console.error('[SW] Failed to retrieve cached audio:', error);
    return null;
  }
}

console.log('[SW] Aidly Service Worker loaded successfully');

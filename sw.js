/*
 * Copyright (C) 2026 Vitor Faustino
 * Licensed under the GNU Affero General Public License v3.0.
 * This software is provided "as is", without any warranty of any kind.
 * The author disclaims liability for damages and inaccurate AI-generated or AI-assisted results,
 * to the fullest extent permitted by law.
 * See the GNU Affero General Public License for details.
 */

const CACHE_NAME = 'porketo-runtime-v1.3';
const STATIC_CACHE = 'porketo-static-v1.3';

const STATIC_ASSETS = [
  '/src/assets/images/logo.webp',
  '/src/assets/images/no-image.webp'
];

function isNavigationRequest(request) {
  return request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');
}

function isSameOriginCriticalAsset(url) {
  return url.origin === self.location.origin && /\.(css|js|html)$/.test(url.pathname);
}

function isImageRequest(request) {
  return (request.headers.get('accept') || '').includes('image');
}

function buildNoStoreRequest(request) {
  return new Request(request, { cache: 'no-store' });
}

async function networkFirst(request, options = {}) {
  const { cacheName = null, fallbackResponse = null } = options;

  try {
    const networkResponse = await fetch(buildNoStoreRequest(request));

    if (cacheName && networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    if (cacheName) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }

    if (fallbackResponse) {
      return fallbackResponse;
    }

    throw error;
  }
}

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
          return caches.delete(cacheName);
        }
        return Promise.resolve(false);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', event => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isGoogleApi = url.href.includes('maps.googleapis.com') || url.href.includes('places.googleapis.com');

  if (isGoogleApi) {
    event.respondWith(fetch(request));
    return;
  }

  if (isNavigationRequest(request) || isSameOriginCriticalAsset(url)) {
    event.respondWith(
      networkFirst(request, {
        fallbackResponse: new Response('Conteudo indisponivel offline. Recarregue quando a conexao voltar.', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        })
      })
    );
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(
      networkFirst(request, {
        cacheName: STATIC_CACHE,
        fallbackResponse: caches.match('/src/assets/images/no-image.webp')
      })
    );
    return;
  }

  event.respondWith(fetch(request));
});

// Background sync para dados offline
self.addEventListener('sync', event => {
  if (event.tag === 'sync-leads') {
    console.log('Service Worker: Sincronizando leads offline');
    // Implementar sincronização de leads aqui
  }
});

// Push notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Porketo',
    icon: '/src/assets/images/logo.webp',
    badge: '/src/assets/images/logo.webp',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      { action: 'explore', title: 'Abrir', icon: '/src/assets/images/logo.webp' },
      { action: 'close', title: 'Fechar', icon: '/src/assets/images/logo.webp' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('Porketo', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Advanced Service Worker for BLOXPVP Casino - Optimized for Fast Refresh
const CACHE_NAME = 'bloxpvp-cache-v2';
const STATIC_CACHE = 'bloxpvp-static-v2';
const API_CACHE = 'bloxpvp-api-v2';

// Resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
];

// API endpoints to cache aggressively
const API_ENDPOINTS = [
  '/login-auto',
  '/chat',
  '/coinflips',
  '/jackpot'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🚀 Service Worker installing...');
  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      caches.open(API_CACHE).then((cache) => {
        console.log('🔄 Preparing API cache...');
        return cache; // Just create the cache
      })
    ]).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('⚡ Service Worker activating...');
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== CACHE_NAME && cacheName !== API_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim()
    ])
  );
});

// Advanced fetch event with smart caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle GET requests from same origin
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Handle API requests with stale-while-revalidate
  if (API_ENDPOINTS.some(endpoint => url.pathname.includes(endpoint))) {
    event.respondWith(handleApiRequest(event.request));
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(handleStaticAsset(event.request));
    return;
  }

  // Handle HTML requests with network-first strategy
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(handleHtmlRequest(event.request));
    return;
  }

  // Default cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => cachedResponse || fetch(event.request))
  );
});

// Smart API request handling with stale-while-revalidate
async function handleApiRequest(request) {
  const cache = await caches.open(API_CACHE);
  const cachedResponse = await cache.match(request);

  // Always try to fetch fresh data
  const fetchPromise = fetch(request)
    .then((response) => {
      // Cache successful responses
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      // Return cached response if network fails
      return cachedResponse || new Response(JSON.stringify({ error: 'Offline' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    });

  // Return cached response immediately if available, then update in background
  if (cachedResponse) {
    // Update cache in background
    fetchPromise.then(() => {
      console.log('🔄 API cache updated in background');
    });
    return cachedResponse;
  }

  return fetchPromise;
}

// Static asset handling with cache-first strategy
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Check if asset is stale (24 hours)
    const cacheTime = new Date(cachedResponse.headers.get('sw-cache-time') || 0);
    const isStale = Date.now() - cacheTime.getTime() > 24 * 60 * 60 * 1000;

    if (!isStale) {
      return cachedResponse;
    }
  }

  // Fetch fresh asset
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Clone and cache with timestamp
      const responseClone = response.clone();
      const responseWithTimestamp = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: {
          ...Object.fromEntries(responseClone.headers.entries()),
          'sw-cache-time': new Date().toISOString()
        }
      });
      cache.put(request, responseWithTimestamp);
    }
    return response;
  } catch (error) {
    // Return cached version if available
    return cachedResponse || fetch(request);
  }
}

// HTML request handling with network-first strategy
async function handleHtmlRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      // Cache the HTML for offline use
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return cached HTML if network fails
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Message event for advanced cache management
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => {
      console.log('🧹 All caches cleared');
      event.ports[0].postMessage({ type: 'CACHE_CLEARED' });
    });
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => cache.keys()),
      caches.open(API_CACHE).then(cache => cache.keys()),
      caches.open(CACHE_NAME).then(cache => cache.keys())
    ]).then(([staticKeys, apiKeys, generalKeys]) => {
      const totalSize = staticKeys.length + apiKeys.length + generalKeys.length;
      event.ports[0].postMessage({
        type: 'CACHE_SIZE',
        size: totalSize,
        breakdown: {
          static: staticKeys.length,
          api: apiKeys.length,
          general: generalKeys.length
        }
      });
    });
  }
});
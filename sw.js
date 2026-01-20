// Service Worker for StopIt PWA
const CACHE_NAME = 'stopit-v1.0.0';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './assets/css/design.css',
    './assets/css/animations.css',
    './assets/css/components.css',
    './assets/css/views.css',
    './assets/js/app.js',
    './assets/js/auth.js',
    './assets/js/db.js',
    './assets/js/crypto.js',
    './assets/js/state.js',
    './assets/js/views/dashboard.js',
    './assets/js/views/craving.js',
    './assets/js/views/stats.js',
    './assets/js/views/badges.js',
    './assets/js/views/profile.js',
    './assets/js/utils/calculations.js',
    './assets/js/utils/badges-engine.js',
    './assets/js/utils/triggers.js',
    'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&family=Poppins:wght@600;700;800&display=swap'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching assets');
                return cache.addAll(ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                if (response) {
                    return response;
                }

                return fetch(event.request).then((response) => {
                    // Don't cache non-successful responses
                    if (!response || response.status !== 200 || response.type === 'error') {
                        return response;
                    }

                    // Clone the response
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                });
            })
            .catch(() => {
                // Return offline page if available
                return caches.match('./index.html');
            })
    );
});

// Background sync for future features
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-data') {
        event.waitUntil(syncData());
    }
});

async function syncData() {
    // Placeholder for future sync functionality
    console.log('[SW] Background sync triggered');
}

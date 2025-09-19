const CACHE_NAME = 'subscription-manager-cache-v1';
// This list should ideally include all the assets needed for the app to run offline.
const urlsToCache = [
    '/',
    '/index.html',
    '/icon.svg',
    '/manifest.webmanifest',
    // External dependencies from importmap
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700&display=swap',
    'https://aistudiocdn.com/react@^19.1.1',
    'https://aistudiocdn.com/react-dom@^19.1.1/',
    'https://aistudiocdn.com/recharts@^3.2.1',
    'https://aistudiocdn.com/jspdf@^3.0.3',
    'https://aistudiocdn.com/jspdf-autotable@^5.0.2',
    'https://aistudiocdn.com/xlsx@^0.18.5'
];

// Install event: cache all the essential assets.
self.addEventListener('install', event => {
    // skipWaiting forces the waiting service worker to become the active service worker.
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Opened cache');
            // Using 'no-cors' for third-party resources can lead to opaque responses.
            // This is okay for CDN assets that don't need credentialed access.
            const requests = urlsToCache.map(url => new Request(url, { mode: 'no-cors' }));
            return cache.addAll(requests).catch(err => {
               console.error('Failed to cache resources during install:', err);
            });
        })
    );
});

// Activate event: clean up old caches.
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => Promise.all(
            cacheNames.map(cacheName => {
                if (cacheWhitelist.indexOf(cacheName) === -1) {
                    console.log('Deleting old cache:', cacheName);
                    return caches.delete(cacheName);
                }
            })
        ))
    );
    // clients.claim() ensures that the new service worker takes control of the page immediately.
    return self.clients.claim();
});

// Fetch event: serve assets from cache if available, otherwise fetch from network.
self.addEventListener('fetch', event => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }
    
    event.respondWith(
        caches.match(event.request).then(response => {
            // Cache hit - return response
            if (response) {
                return response;
            }

            // Not in cache - fetch from network
            return fetch(event.request).then(networkResponse => {
                // If the response is not valid, don't cache it.
                // An opaque response (type: 'opaque') is for a cross-origin request
                // made with 'no-cors'. We can't inspect its status, so we cache it optimistically.
                if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
                    return networkResponse;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                const responseToCache = networkResponse.clone();

                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return networkResponse;
            }).catch(() => {
                // The fetch failed, likely due to being offline.
                // A fallback page could be returned here if one was cached.
                // For now, let the request fail.
                console.warn(`Fetch failed for: ${event.request.url}`);
            });
        })
    );
});

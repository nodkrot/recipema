// Service Worker for aggressive image caching
const CACHE_NAME = "recipema-cache-v1";
const IMAGE_CACHE_NAME = "recipema-images-v1";

// Cache duration in milliseconds (7 days for images)
const IMAGE_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

// Install event - setup caches
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Service Worker: Cache opened");
      return cache.addAll([
        "/",
        "/index.html",
        "/manifest.webmanifest"
      ]);
    })
  );
  self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activating...");
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== IMAGE_CACHE_NAME) {
            console.log("Service Worker: Deleting old cache:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch event - implement caching strategy
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle Firebase Storage images (firebasestorage.googleapis.com)
  if (url.hostname.includes("firebasestorage.googleapis.com")) {
    event.respondWith(
      caches.open(IMAGE_CACHE_NAME).then(async (cache) => {
        // Try to get from cache first
        const cachedResponse = await cache.match(request);

        if (cachedResponse) {
          // Check if cache is still valid
          const cachedDate = new Date(cachedResponse.headers.get("sw-cached-date"));
          const now = new Date();

          if (now - cachedDate < IMAGE_CACHE_DURATION) {
            console.log("Service Worker: Serving image from cache:", url.pathname);
            return cachedResponse;
          } else {
            console.log("Service Worker: Cache expired, fetching fresh image");
          }
        }

        // Fetch from network and cache
        try {
          const networkResponse = await fetch(request);

          if (networkResponse.ok) {
            // Clone the response and add cache date header
            const responseToCache = networkResponse.clone();
            const headers = new Headers(responseToCache.headers);
            headers.set("sw-cached-date", new Date().toISOString());

            const modifiedResponse = new Response(responseToCache.body, {
              status: responseToCache.status,
              statusText: responseToCache.statusText,
              headers: headers
            });

            cache.put(request, modifiedResponse);
            console.log("Service Worker: Cached new image:", url.pathname);
          }

          return networkResponse;
        } catch (error) {
          console.error("Service Worker: Fetch failed, returning cached response if available:", error);
          // If network fails, try to return stale cache as fallback
          if (cachedResponse) {
            return cachedResponse;
          }
          throw error;
        }
      })
    );
    return;
  }

  // For other requests, use network-first strategy
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Only cache successful responses for same-origin requests
        if (response.ok && url.origin === location.origin) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(request);
      })
  );
});

// Message event - allow clearing cache from app
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }
});


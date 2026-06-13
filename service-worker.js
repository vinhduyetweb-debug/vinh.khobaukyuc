const CACHE_NAME = "khobaukyuc-v6.1.0";
const CACHE_PREFIX = "khobaukyuc-";

const APP_SHELL = [
  ".",
  "index.html",
  "manifest.json",
  "style.css",
  "style.css?v=6.1",
  "vendor/jszip.min.js",
  "src/main.js",
  "src/main.js?v=6.1",
  "src/constants/age-stages.js",
  "src/constants/app.js",
  "src/constants/event-types.js",
  "src/constants/schema.js",
  "src/constants/timeline-labels.js",
  "src/db/indexeddb-service.js",
  "src/services/backup-export-service.js",
  "src/services/backup-manifest-service.js",
  "src/services/file-system-service.js",
  "src/services/google-drive-service.js",
  "src/services/image-compression-service.js",
  "src/services/import-preview-service.js",
  "src/services/media-storage-strategy-service.js",
  "src/services/storage-quota-service.js",
  "src/ui/backup-health-renderer.js",
  "src/ui/editor-renderer.js",
  "src/ui/future-letters-renderer.js",
  "src/ui/home-renderer.js",
  "src/ui/import-preview-renderer.js",
  "src/ui/memory-grid-renderer.js",
  "src/ui/settings-renderer.js",
  "src/ui/timeline-renderer.js",
  "src/ui/viewer-renderer.js",
  "src/utils/date.js",
  "src/utils/dom.js",
  "src/utils/filename.js",
  "src/utils/schema.js",
  "src/utils/validators.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter(
              (cacheName) =>
                cacheName.startsWith(CACHE_PREFIX) && cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches.match("index.html", { ignoreSearch: true }).then((response) =>
          response || caches.match(".", { ignoreSearch: true }),
        ),
      ),
    );
    return;
  }

  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;
      return fetch(request);
    }),
  );
});

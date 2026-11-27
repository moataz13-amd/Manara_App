const CACHE = "manara-v9-mobile-cache";
self.addEventListener("install", () => { self.skipWaiting(); });
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/",
          "/data/quran.json",
          "/data/hafs-display.json",
          "/data/mushaf/ayah-pages.json",
          "/data/tafsir-muyassar.json",
          "/manifest.webmanifest",
          "/images/splash-screen-1.svg",
          "/images/splash-screen-2.svg",
          "/images/HomeIcon.svg",
          "/images/QuranIcon.svg",
          "/images/AwqatIcon.svg",
          "/images/SebhaIcon.svg",
          "/images/MoreIcon.svg",
          "/fonts/arbfonts_Qurraan_sora.woff2",
          "/fonts/UthmanicHafs_v2-1.woff2",
          "/fonts/Elgharib%20Ajzaa%20Alquran%20Madina.woff2",
          "/data/adhkar.json",
          "/data/hadith.json",
          "/data/reciters.json",
          "/images/Manara_App_H_Logo.svg",
          "/images/Manara_App_Logo.svg",
          "/images/app-icon-180.png",
          "/images/app-icon-192.png",
          "/images/app-icon-512.png",
        ]),
      ),
  ),
);
self.addEventListener("activate", (event) => { event.waitUntil(self.clients.claim()); });
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k.startsWith("manara-") && k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/data/") || url.pathname.startsWith("/assets/")) {
    const cachePromise = caches.open(CACHE);
    const cachedPromise = cachePromise.then((cache) => cache.match(event.request));
    const update = async () => {
      const response = await fetch(event.request);
      if (response.ok) await (await cachePromise).put(event.request, response.clone());
      return response;
    };
    // Hashed build assets are immutable. Data is served immediately and refreshed.
    const refresh = cachedPromise.then((cached) =>
      cached && url.pathname.startsWith("/assets/") ? cached : update(),
    );
    event.waitUntil(refresh.catch(() => {}));
    event.respondWith(cachedPromise.then((cached) => cached || refresh));
    return;
  }
  if (url.pathname.startsWith("/fonts/")) {
    event.respondWith(caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    }));
    return;
  }
  const navigation = fetch(event.request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(CACHE);
          await cache.put(event.request, response.clone());
        }
        return response;
      })
      .catch(() =>
        caches
          .match(event.request)
          .then(
            (r) =>
              r ||
              (event.request.mode === "navigate"
                ? caches.match("/")
                : Response.error()),
          ),
      );
  event.waitUntil(navigation.then(() => {}, () => {}));
  event.respondWith(navigation);
});

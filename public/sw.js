const CACHE = "manara-v3-fonts";
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([
          "/",
          "/data/quran.json",
          "/fonts/arbfonts_Qurraan_sora.woff2",
          "/fonts/UthmanicHafs_v2-1.woff2",
          "/fonts/Elgharib%20Ajzaa%20Alquran%20Madina.woff2",
          "/data/adhkar.json",
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
self.addEventListener("activate", (event) =>
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  ),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== location.origin) return;
  if (url.pathname.startsWith("/fonts/")) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
    return;
  }
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((c) => c.put(event.request, copy));
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
      ),
  );
});

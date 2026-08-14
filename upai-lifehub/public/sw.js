/* UPAI LifeHub Service Worker v4 */
const CACHE = "upai-v4";

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(["./", "./index.html"]).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network-first for navigation and API, cache-first for static assets. */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // never touch AI API calls
  if (url.pathname.includes("/.netlify/functions/")) return; // never cache sync

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});

/* Notifications */
self.addEventListener("push", (e) => {
  let data = { title: "UPAI LifeHub", body: "Hatırlatma" };
  try { if (e.data) data = e.data.json(); } catch {}
  e.waitUntil(
    self.registration.showNotification(data.title || "UPAI LifeHub", {
      body: data.body,
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      vibrate: [200, 100, 200],
      tag: data.tag || "upai",
      data: { url: "./" },
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) if ("focus" in c) return c.focus();
      return self.clients.openWindow("./");
    })
  );
});

/* Timer-based scheduling requested by the page */
self.addEventListener("message", (e) => {
  const d = e.data || {};
  if (d.type === "SCHEDULE_NOTIFICATION" && d.delay > 0) {
    setTimeout(() => {
      self.registration.showNotification(d.title, {
        body: d.body, icon: "./icon-192.png", badge: "./icon-192.png",
        vibrate: [200, 100, 200], tag: d.tag || "upai",
      });
    }, d.delay);
  }
});

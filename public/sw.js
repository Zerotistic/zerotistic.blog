// Keeps the shell on disk: hashed build assets, fonts and the static art.
// Pages are never cached, so a return visit paints from disk and reads
// fresh. Hashed files are immutable; /static/ is refreshed in the
// background after serving.
const version = "shell-v1"
const immutable = /^\/_astro\//
const refreshing = /^\/(static|videos)\//

self.addEventListener("install", () => self.skipWaiting())

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== version)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return
  const cacheFirst = immutable.test(url.pathname)
  const staleWhileRevalidate = refreshing.test(url.pathname)
  if (!cacheFirst && !staleWhileRevalidate) return

  event.respondWith(
    caches.open(version).then(async (cache) => {
      const cached = await cache.match(request)
      const network = fetch(request)
        .then((response) => {
          if (response.ok) cache.put(request, response.clone())
          return response
        })
        .catch(() => cached)
      if (cached && cacheFirst) return cached
      if (cached) {
        event.waitUntil(network)
        return cached
      }
      return network
    }),
  )
})

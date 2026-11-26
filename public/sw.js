// Keeps the shell on disk: hashed build assets, fonts, link previews, and static art.
// Pages are never cached, so a return visit paints from disk and reads fresh.
// Hashed files are immutable (cache-first, no redundant network fetch);
// /static/ and /link-previews/ use stale-while-revalidate.
// Videos use byte-range (206) streaming and are never passed to Cache.put().
const version = "shell-v2"
const immutable = /^\/_astro\//
const refreshing = /^\/(static|link-previews)\//
const maxImmutableEntries = 200

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

async function trimCache(cache) {
  const keys = await cache.keys()
  const hashed = keys.filter((req) => immutable.test(new URL(req.url).pathname))
  if (hashed.length <= maxImmutableEntries) return
  await Promise.all(
    hashed.slice(0, hashed.length - maxImmutableEntries).map((req) => cache.delete(req)),
  )
}

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET" || request.headers.has("range")) return
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  const isImmutable = immutable.test(url.pathname)
  const isRefreshing = refreshing.test(url.pathname)
  if (!isImmutable && !isRefreshing) return

  event.respondWith(
    caches.open(version).then(async (cache) => {
      const cached = await cache.match(request)
      if (cached && isImmutable) return cached

      const network = fetch(request)
        .then(async (response) => {
          // Only cache complete 200 responses; Cache.put() rejects 206 partial responses.
          if (response.status === 200 && response.type === "basic") {
            await cache.put(request, response.clone())
            if (isImmutable) void trimCache(cache)
          }
          return response
        })
        .catch(() => cached)

      if (cached) {
        event.waitUntil(network)
        return cached
      }
      return network
    }),
  )
})

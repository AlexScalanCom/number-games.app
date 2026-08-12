const CACHE_NAME = "number-chain-v2";

self.addEventListener("install", (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(["/number-games.app/"]);
		}),
	);
	// Immediately activate new install (needed for auto-update flow)
	self.skipWaiting();
});

self.addEventListener("activate", (event) => {
	event.waitUntil(
		caches
			.keys()
			.then((keys) =>
				Promise.all(
					keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
				),
			),
	);
	// Take control of all open clients right away
	self.clients.claim();
});

// Listen for SKIP_WAITING message from the app — activates immediately
self.addEventListener("message", (event) => {
	if (event.data && event.data.type === "SKIP_WAITING") {
		self.skipWaiting();
	}
});

// Stale-while-revalidate strategy: serve cached response, fetch in background
self.addEventListener("fetch", (event) => {
	event.respondWith(
		caches.match(event.request).then((cached) => {
			const fetchPromise = fetch(event.request).then((response) => {
				if (!response || response.status !== 200) return response;
				const clone = response.clone();
				caches
					.open(CACHE_NAME)
					.then((cache) => cache.put(event.request, clone));
				return response;
			});
			// Return cached version immediately (if available), else wait for fetch
			return cached || fetchPromise;
		}),
	);
});

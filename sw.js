const CACHE_NAME = 'imago-dei-v3';
const APP_SHELL = ['./','./index.html','./about.html','./admin.html','./blogs.html','./gallery.html','./videos.html','./content-store.js','./nav.js','./style.css','./manifest.json','./logo.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request).then(response => {
      if (!response.ok || !event.request.url.endsWith('.html')) return response;
      return response.text().then(html => {
        const injected = html.includes('nav.js') ? html : html.replace('</head>', '<script src="nav.js" defer></script></head>');
        return new Response(injected, { headers: response.headers, status: response.status, statusText: response.statusText });
      });
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
  );
});

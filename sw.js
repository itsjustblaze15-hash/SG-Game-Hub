'use strict';

// Cache the hub shell, covers and the five installed arcade games as a single release.
const CACHE = 'sg-mobile-arcade-2026112602';
const ids = ['slice-master', 'highway-rush', 'color-switch', 'hole-city', 'burger-rush'];
const scope = self.registration.scope;
const paths = [
  'index.html', 'hub.css', 'hub.js', 'catalog.js', 'manifest.webmanifest',
  'assets/sg-logo.png', 'assets/sg-180.png', 'assets/sg-192.png', 'assets/sg-512.png',
  ...['alive','apex-circuit','armor-dynasty','ben10-open-world','blacktide','eight-ball','estuary',
    'foamfall','fus','gp','little-garden','minecraft-kingdoms','motor-dynasty','pitchside',
    'police-patrol-simulator','president-simulator','redwood','second-chance',
    'traffic-jam-simulator','world-conquest','world-forge'].map(name => 'assets/'+name+'.jpg'),
  'games/mobile/platform.js', 'games/mobile/arcade.js', 'games/mobile/arcade.css', 'games/mobile/arcade-themes.css',
  ...ids.flatMap(id => ['assets/'+id+'.png', 'games/'+id+'/index.html', 'games/'+id+'/game.js']),
  'games/slice-master/paradise.jpg', 'games/highway-rush/highway-art.js',
  'games/hole-city/city-art.js', 'games/hole-city/district.js', 'games/burger-rush/burger-art.js'
];
const installed = new Set(paths);
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(paths.map(path => new Request(new URL(path, scope), {cache:'reload'})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const stale = (await caches.keys()).filter(key => key.startsWith('sg-mobile-arcade-') && key !== CACHE);
    await Promise.all(stale.map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(scope)) return;
  const url = new URL(req.url);
  if (url.searchParams.has('sg-check')) return;
  const path = url.pathname.slice(new URL(scope).pathname.length);
  const key = !path ? 'index.html'
    : path.endsWith('/') && installed.has(path+'index.html') ? path+'index.html' : path;
  if (!installed.has(key)) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const local = () => cache.match(new URL(key,scope));
    if (!url.search || [...url.searchParams.values()].includes('2026112602')) {
      const hit = await local();
      if (hit) return hit;
    }
    try {
      const response = await fetch(req);
      return response.ok ? response : await local() || response;
    } catch {
      return await local() || Response.error();
    }
  })());
});

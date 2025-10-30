// client/sw.js
const CACHE_NAME = 'sih-cache-v1';
const PRECACHE_URLS = [
  '/',                // root (served as index.html)
  '/index.html',
  '/offline.html',    // create this file (simple fallback)
   '/css/bio.css',
  '/css/blood.css',
  '/css/bloodline.css',
  '/css/chem.css',
  '/css/circuit.css',
  '/css/classes.css',
  '/css/cs.css',
  '/css/eddy.css',
  '/css/games.css',
  '/css/integral.css',
  '/css/math.css',
  '/css/mito.css',
  '/css/mito1.css',
  '/css/ohms.css',
  '/css/pclasses.css',
  '/css/periodic.css',
  '/css/phy.css',
  '/css/progress.css',
  '/css/psignin.css',
  '/css/reaction.css',
  '/css/register.css',
  '/css/search.css',
  '/css/signin.css',
  '/css/sorting.css',
  '/css/stack.css',
  '/css/style.css',
  '/css/torque.css',
  '/css/triangle.css',
  '/css/virus.css',
   // update if your main CSS filename is different
  '/js/bio.js',
  '/js/blood.js',
  '/js/bloodline.js',
  '/js/chem.js',
  '/js/circuit.js',
  '/js/classes.js',
  '/js/cs.js',
  '/js/eddy.js',
  '/js/game.js',
  '/js/index.js',
  '/js/integral.js',
  '/js/math.js',
  '/js/mito.js',
  '/js/mito1.js',
  '/js/ohms.js',
  '/js/pclasses.js',
  '/js/periodic.js',
  '/js/phy.js',
  '/js/progress.js',
  '/js/psignin.js',
  '/js/reaction.js',
  '/js/register.js',
  '/js/search.js',
  '/js/signin.js',
  '/js/sorting.js',
  '/js/stack.js',
  '/js/torque.js',
  '/js/triangle.js',
  '/js/virus.js',

  '/progress/pclasses.html',
  '/progress/progress.html',
  '/progress/psign.html',
  '/math.html',
  '/bio.html',
  '/blood.html',
  '/bloodline.html',
  '/circuit.html',
  '/classes.html',
  '/cs.html',
  '/eddy.html',
  '/integral.html',
  '/mito.html',
  '/mito1.html',
  '/ohms.html',
  '/periodic.html',
  '/phy.html',
  '/reaction.html',
  '/register.html',
  '/signin.html',
  '/sorting.html',
  '/stack.html',
  '/sw.js',
  '/virus.html',
  '/chem.html',
  '/games.html',
  '/triangle.html',
  './images/logo1.png'

     // update if your main global JS filename is different
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // HTML navigation requests: network-first -> fallback to cache -> offline page
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req).then(res => {
        // cache a copy
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('/offline.html')))
    );
    return;
  }

  // other requests: cache-first then network
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(networkRes => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(req, networkRes.clone());
          return networkRes;
        });
      }).catch(() => {
        // fallback for images could go here
        return caches.match('/offline.html');
      });
    })
  );
});

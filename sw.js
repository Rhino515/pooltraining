const CACHE = 'pool-iq-v5';
const ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './js/analyze.js',
  './js/app.js',
  './js/career.js',
  './js/dashboard.js',
  './js/drills.js',
  './js/drillsExtra.js',
  './js/games/aimView.js',
  './js/games/builders.js',
  './js/games/coaching.js',
  './js/games/cueBallDiagram.js',
  './js/games/diamonds.js',
  './js/games/data/bankVault.js',
  './js/games/data/bosses.js',
  './js/games/data/caromChallenge.js',
  './js/games/data/drawChallenge.js',
  './js/games/data/followChallenge.js',
  './js/games/data/kickEscape.js',
  './js/games/data/landingZone.js',
  './js/games/data/patternPuzzle.js',
  './js/games/data/pocketSniper.js',
  './js/games/data/positionTrain.js',
  './js/games/data/railRunner.js',
  './js/games/data/safetyLock.js',
  './js/games/data/speedLadder.js',
  './js/games/data/stunMaster.js',
  './js/games/engine.js',
  './js/games/geometry.js',
  './js/games/recipe.js',
  './js/games/registry.js',
  './js/games/speed.js',
  './js/games/stageTable.js',
  './js/games/text.js',
  './js/ghost.js',
  './js/skills.js',
  './js/storage.js',
  './js/tableDiagram.js',
  './js/ui/play.js',
  './js/ui/sheet.js'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((cached) =>
      cached ||
      fetch(e.request)
        .then((res) => {
          if (res && res.ok && new URL(e.request.url).origin === location.origin) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => (e.request.mode === 'navigate' ? caches.match('./index.html') : cached))
    )
  );
});

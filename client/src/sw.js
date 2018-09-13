// Much of this code is courtesy of my and Dylan Scheffer's notes from the Udacity service worker course

const staticCacheName = 'restaurants-v1';
const externalAssetsCache = 'restaurants-externals-v1';
const allCaches = [staticCacheName, externalAssetsCache];

const mapboxURL = 'https://api.tiles.mapbox.com';

// Open cache; cache site assets
self.addEventListener('install', (event) => {

  event.waitUntil(
    caches.open(staticCacheName).then((cache) => {
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        'js/main.js',
        'js/restaurant_info.js',
        // 'data/restaurants.json',  // No longer needed because it's being bundled
        'js/leaflet.js',
        'css/styles.css',
        'css/leaflet.css',
        './img/1.jpg',
        './img/2.jpg',
        './img/3.jpg',
        './img/4.jpg',
        './img/5.jpg',
        './img/6.jpg',
        './img/7.jpg',
        './img/8.jpg',
        './img/9.jpg',
        './img/10.jpg',
        './img/marker-icon.png',
        './img/marker-icon-2x.png',
        './img/marker-shadow.png'
        ]);
    })
  );
});

// Activate service worker, clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      Promise.all(
        cacheNames.filter((cacheName) => cacheName.startsWith('restaurants-') && cacheName != staticCacheName)
        .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});

// Fetch assets from cache if offline, from network otherwise
// self.addEventListener('fetch', (event) => {
//   console.log(event)
//   event.respondWith(
//     caches.match(event.request, {ignoreSearch: true}).then((response) => response || fetch(event.request))
//   );
// });

self.addEventListener('fetch', (event) => {
  var requestURL = new URL(event.request.url);
  var storageURL = requestURL.pathname;
  console.log('Internal asset storageURL: ', storageURL);

  if (requestURL.origin !== location.origin) {
    // if (requestURL.pathname === '/') {
    //   event.respondWith(caches.match('/skeleton'));
    //   return;
    // }
    if (requestURL.href.startsWith(mapboxURL)) {
      event.respondWith(getExternalAsset(event.request));
      return;
    }
    // // TODO: respond to avatar urls by responding with
    // // the return value of serveAvatar(event.request)
    // if (requestURL.pathname.startsWith('/avatars/')) {
    //   event.respondWith(serveAvatar(event.request));
    // }
  } else {
    console.log(event);
    event.respondWith(
      caches.match(storageURL, {ignoreSearch: true}).then((response) => response || fetch(event.request))
    );
  }
});

function getExternalAsset(request) {
  // var storageURL = request.url.replace(/-\d+px\.jpg$/, '');
  var requestURL = new URL(request.url);
  var storageURL = requestURL.pathname;
  console.log('External asset storageURL: ', storageURL);

  if (request.url.origin === mapboxURL || request.url.origin === leafletURL) {
    return caches.open(externalAssetsCache)
    .then((cache) => {
      return cache.match(storageURL, {ignoreSearch: true})
      .then((response) => {
        if (response) return response;

        return fetch(request).then((networkResponse) => {
          cache.put(storageURL, networkResponse.clone());
          return networkResponse;
        });
      });
    });
  }
  return;
}

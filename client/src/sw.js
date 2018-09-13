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
// Route requests by origin
self.addEventListener('fetch', (event) => {
  var requestURL = new URL(event.request.url);
  var storageURL = requestURL.pathname.slice(1);
  console.log('Internal asset storageURL: ', storageURL);

  if (requestURL.origin !== location.origin) {
    if (requestURL.href.startsWith(mapboxURL)) {
      event.respondWith(getExternalAsset(event.request));
    } else {
      event.respondWith(fetch(event.request));
    }
  } else {
    console.log(event);
    event.respondWith(
      caches.match(storageURL, {ignoreSearch: true}).then((response) => response || fetch(event.request))
    );
  }
});

function getExternalAsset(request) {
  request.mode = 'no-cors';

  var requestURL = new URL(request.url);
  var storageURL = requestURL.pathname.slice(1);
  console.log('External asset storageURL: ', storageURL);

  return caches.open(externalAssetsCache)
  .then((cache) => {
    return cache.match(storageURL, {ignoreSearch: true})
    .then((response) => {
      console.log(`Evaluating the response: undefined=${typeof response === 'undefined'}`, response);
      if (typeof response !== 'undefined') {
        console.log("Returning response for ", storageURL);
        return response;
      }

      return fetch(request).then((networkResponse) => {
        cache.put(storageURL, networkResponse.clone());
        console.log(`Putting ${storageURL} in cache`);
        return networkResponse;
      });
    });
  });
}

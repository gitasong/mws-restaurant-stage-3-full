// Much of this code is courtesy of my and Dylan Scheffer's notes from the Udacity service worker course

const staticCacheName = 'restaurants-v1';
const externalAssetsCache = 'restaurants-externals-v1';
const allCaches = [staticCacheName, externalAssetsCache];

const mapboxURL = 'https://api.tiles.mapbox.com';
const leafletURL = 'https://unpkg.com';

// Open cache; cache site assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('restaurants-v1').then((cache) => {
      return cache.addAll([
        '/',
        'index.html',
        'restaurant.html',
        'js/main.js',
        'js/restaurant_info.js',
        // 'data/restaurants.json',  // No longer needed because it's being bundled
        'css/styles.css',
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
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
        'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
        'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon.png',
        'https://unpkg.com/leaflet@1.3.1/dist/images/marker-icon-2x.png',
        'https://unpkg.com/leaflet@1.3.1/dist/images/marker-shadow.png',
        'https://api.tiles.mapbox.com/v4/mapbox.streets/12/1205/1539.jpg70?access_token=pk.eyJ1IjoibmZyZWVkIiwiYSI6ImNqNnkzc2FrdTFyc2EycW80bzZpcXZrOG8ifQ.3G3y2EHmJYG9TPUEYEK91Q',
        'https://api.tiles.mapbox.com/v4/mapbox.streets/12/1206/1539.jpg70?access_token=pk.eyJ1IjoibmZyZWVkIiwiYSI6ImNqNnkzc2FrdTFyc2EycW80bzZpcXZrOG8ifQ.3G3y2EHmJYG9TPUEYEK91Q',
        'https://api.tiles.mapbox.com/v4/mapbox.streets/12/1205/1540.jpg70?access_token=pk.eyJ1IjoibmZyZWVkIiwiYSI6ImNqNnkzc2FrdTFyc2EycW80bzZpcXZrOG8ifQ.3G3y2EHmJYG9TPUEYEK91Q',
        'https://api.tiles.mapbox.com/v4/mapbox.streets/12/1206/1540.jpg70?access_token=pk.eyJ1IjoibmZyZWVkIiwiYSI6ImNqNnkzc2FrdTFyc2EycW80bzZpcXZrOG8ifQ.3G3y2EHmJYG9TPUEYEK91Q'
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
self.addEventListener('fetch', (event) => {
  console.log(event)
  event.respondWith(
    caches.match(event.request, {ignoreSearch: true}).then((response) => response || fetch(event.request))
  );
});

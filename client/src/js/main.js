'use strict';

require('./swRegistration.js');
import DBHelper from './dbhelper.js';

let restaurants,
  neighborhoods,
  cuisines;
var newMap;   // I'm leaving this variable declared with var, per the original code, because the map and markers actually don't load with let (try it!)
let markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  // Initialize map
  self.initMap(); // added
  // Fetch restaurants from server and populate database
  DBHelper.routeRestaurants((error, restaurants) => {
    if (error) {
      console.log("Error getting restaurants from routeRestaurants(): ", error);
    } else {
      console.log("Reviews result from routeRestaurants(): ", restaurants);
    }
  });
  fetchNeighborhoods();
  fetchCuisines();
  // Post any temporary reviews to server, if online
  DBHelper.postTempReviews();
  // Push any offline favorites to server, if online
  DBHelper.pushFavorites();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
const fetchNeighborhoods = () => {
  DBHelper.fetchNeighborhoods((error, neighborhoods) => {
    if (error) { // Got an error
      console.error(error);
    } else {
      self.neighborhoods = neighborhoods;
      fillNeighborhoodsHTML();
    }
  });
}

/**
 * Set neighborhoods HTML.
 */
const fillNeighborhoodsHTML = (neighborhoods = self.neighborhoods) => {
  const select = document.getElementById('neighborhoods-select');
  neighborhoods.forEach(neighborhood => {
    const option = document.createElement('option');
    option.innerHTML = neighborhood;
    option.value = neighborhood;
    select.append(option);
  });
}

/**
 * Fetch all cuisines and set their HTML.
 */
const fetchCuisines = () => {
  DBHelper.fetchCuisines((error, cuisines) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.cuisines = cuisines;
      fillCuisinesHTML();
    }
  });
}

/**
 * Set cuisines HTML.
 */
const fillCuisinesHTML = (cuisines = self.cuisines) => {
  const select = document.getElementById('cuisines-select');

  cuisines.forEach(cuisine => {
    const option = document.createElement('option');
    option.innerHTML = cuisine;
    option.value = cuisine;
    select.append(option);
  });
}

/**
 * Initialize leaflet map, called from HTML.
 */
self.initMap = () => {  // initMap() and its methods and properties need to be called on self/window because webpack wraps everything in its own IIFE
  self.newMap = L.map('map', {
        center: [40.722216, -73.987501],
        zoom: 12,
        scrollWheelZoom: false
      });
  L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
    mapboxToken: 'pk.eyJ1IjoibmZyZWVkIiwiYSI6ImNqNnkzc2FrdTFyc2EycW80bzZpcXZrOG8ifQ.3G3y2EHmJYG9TPUEYEK91Q',
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
      '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
      'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
  }).addTo(self.newMap);

  self.updateRestaurants();
}

/**
 * Update page and map for current restaurants.
 */
self.updateRestaurants = () => {
  const cSelect = document.getElementById('cuisines-select');
  const nSelect = document.getElementById('neighborhoods-select');

  const cIndex = cSelect.selectedIndex;
  const nIndex = nSelect.selectedIndex;

  const cuisine = cSelect[cIndex].value;
  const neighborhood = nSelect[nIndex].value;

  DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      resetRestaurants(restaurants);
      fillRestaurantsHTML();
    }
  })
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
const resetRestaurants = restaurants => {
  // Remove all restaurants
  self.restaurants = [];
  const ul = document.getElementById('restaurants-list');
  ul.innerHTML = '';

  // Remove all map markers
  if (self.markers) {
    self.markers.forEach(marker => marker.remove());
  }
  self.markers = [];
  self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
const fillRestaurantsHTML = (restaurants = self.restaurants) => {
  const ul = document.getElementById('restaurants-list');
  restaurants.forEach(restaurant => {
    ul.append(createRestaurantHTML(restaurant));
  });
  addMarkersToMap();
}

/**
 * Create restaurant HTML.
 */
const createRestaurantHTML = restaurant => {
  const li = document.createElement('li');

  const imageContainer = document.createElement('div');
  imageContainer.className = 'restaurant-img-container';

  const image = document.createElement('img');
  image.className = 'restaurant-img';
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Image of ${restaurant.name} restaurant`;
  imageContainer.append(image);

  const infoContainer = document.createElement('div');
  infoContainer.className = 'restaurant-info';

  const name = document.createElement('h1');
  name.innerHTML = restaurant.name;
  infoContainer.append(name);

  const iconContainer = document.createElement('div');
  iconContainer.className = 'icon-container';
  infoContainer.append(iconContainer);

  const favorite = document.createElement('i');
  let isSolid = restaurant.is_favorite;
  console.log(`isSolid for ${restaurant.name}, id ${restaurant.id}: ${restaurant.is_favorite}`);
  // console.log(typeof(restaurant.is_favorite));
  isSolid == true ? favorite.className = 'fas fa-heart' : favorite.className = 'far fa-heart';
  isSolid == true ? favorite.setAttribute('aria-label', 'Favorited!') : favorite.setAttribute('aria-label', 'Favorite Me!');
  favorite.setAttribute('data-id', restaurant.id);
  iconContainer.append(favorite);

  favorite.addEventListener('click', () => {
    if (isSolid == false) {  // TODO: check for false and 'false'
      favorite.className = 'fas fa-heart';
      favorite.setAttribute('aria-label', 'Favorited!');
      isSolid = true;
      DBHelper.postFavorite(restaurant, isSolid);
    } else {
      favorite.className = 'far fa-heart';
      favorite.setAttribute('aria-label', 'Favorite Me!');
      isSolid = false;
      DBHelper.postFavorite(restaurant, isSolid);
    }
  });

  const neighborhood = document.createElement('p');
  neighborhood.innerHTML = restaurant.neighborhood;
  infoContainer.append(neighborhood);

  const address = document.createElement('p');
  address.innerHTML = restaurant.address;
  infoContainer.append(address);

  const more = document.createElement('a');
  more.innerHTML = 'View Details';
  more.setAttribute('aria-label', `View details for ${restaurant.name}`);
  more.href = DBHelper.urlForRestaurant(restaurant);
  infoContainer.append(more)

  li.append(imageContainer);
  li.append(infoContainer);

  return li;
}

/**
 * Add markers for current restaurants to the map.
 */
const addMarkersToMap = (restaurants = self.restaurants) => {
  restaurants.forEach(restaurant => {
    // Add marker to the map
    const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.newMap);
    marker.on("click", onClick);
    function onClick() {
      window.location.href = marker.options.url;
    }
    self.markers.push(marker);
  });

}

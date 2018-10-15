'use strict';

require('./swRegistration.js');
import DBHelper from './dbhelper.js';

let restaurant;
let reviews;
var newMap;  // I'm leaving this variable declared with var, per the original code, because the map actually doesn't load with let (try it!)

/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', event => {
  self.initMap();
  // Post any temporary reviews to server, if online
  DBHelper.postTempReviews();
  DBHelper.pushFavorites();
});

/**
 * Initialize leaflet map
 */
self.initMap = () => {  // initMap() and its methods and properties need to be called on self/window because webpack wraps everything in its own IIFE
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.newMap = L.map('map', {
        center: [restaurant.latlng.lat, restaurant.latlng.lng],
        zoom: 16,
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
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
    }
  });
}

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = callback => {
  if (self.restaurant) { // restaurant already fetched!
    callback(null, self.restaurant)
    return;
  }
  const id = getParameterByName('id');
  if (!id) { // no id found in URL
    const error = 'No restaurant id in URL';
    callback(error, null);
  } else {
    DBHelper.fetchRestaurantById(id, (error, restaurant) => {
      self.restaurant = restaurant;
      if (!restaurant) {
        console.error(error);
        return;
      }
      fillRestaurantHTML();
      callback(null, restaurant);

      // load and subset reviews into IDB
      let params = (new URL(window.location)).searchParams;
      console.log(`params: ${params}`);
      let restaurantID = parseInt(params.get('id'));
      console.log(`restaurantID: ${restaurantID}`);

      DBHelper.populateReviews((error, results) => {
        if (error) {
          console.log("Error populating reviews in populateReviews(): ", error);
        } else {
          console.log("Reviews result from populateReviews(): ", results);
          // save reviews in IDB to global scope, so they're available to other functions (thanks to Doug Brown for this)
          self.reviews = results;
          // fill reviews from global scope (thanks to Doug Brown for this)
          fillReviewsHTML();
        }
      }, self.restaurant.id);

      // fill reviews from all IDB object stores if present; from server if not
      self.reviews = DBHelper.routeReviews((error, results) => {
        if (error) {
          console.log("Error getting reviews from routeReviews(): ", error);
        } else {
          console.log("Reviews result from routeReviews(): ", results);
          results = results.filter(r => r.restaurant_id == restaurantID);
          // TODO: Possibly delete non-subsetted reviews at this point?
          // save reviews returned from routeReviews() to global scope, so they're available to other functions (thanks to Doug Brown for this)
          self.reviews = results;
          // fill reviews from global scope (thanks to Doug Brown for this)
          fillReviewsHTML();
          return results;
        }
      }, restaurantID);
    });
  }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
  const name = document.getElementById('restaurant-name');
  name.innerHTML = restaurant.name + '  ';

  const favorite = document.createElement('i');
  let isSolid = restaurant.is_favorite;
  console.log(`isSolid for ${restaurant.name}, id ${restaurant.id}: ${restaurant.is_favorite}`);
  // console.log(typeof(restaurant.is_favorite));
  isSolid == true ? favorite.className = 'fas fa-heart' : favorite.className = 'far fa-heart';
  isSolid == true ? favorite.setAttribute('aria-label', 'Favorited!') : favorite.setAttribute('aria-label', 'Favorite Me!');
  favorite.setAttribute('data-id', restaurant.id);
  name.append(favorite);

  favorite.addEventListener('click', () => {
    if (isSolid == false) {
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

  const address = document.getElementById('restaurant-address');
  address.innerHTML = restaurant.address;

  const image = document.getElementById('restaurant-img');
  image.className = 'restaurant-img'
  image.src = DBHelper.imageUrlForRestaurant(restaurant);
  image.alt = `Image of ${restaurant.name} restaurant`;

  const cuisine = document.getElementById('restaurant-cuisine');
  cuisine.innerHTML = restaurant.cuisine_type;

  // fill operating hours
  if (restaurant.operating_hours) {
    fillRestaurantHoursHTML();
  }
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
  const hours = document.getElementById('restaurant-hours');
  for (let key in operatingHours) {
    const row = document.createElement('tr');

    const day = document.createElement('td');
    day.innerHTML = key;
    row.appendChild(day);

    const time = document.createElement('td');
    time.innerHTML = operatingHours[key];
    row.appendChild(time);

    hours.appendChild(row);
  }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
const fillReviewsHTML = (reviews = self.reviews) => {
  const container = document.getElementById('reviews-container');
  // clear reviews-list each time UI is rendered (thanks to Doug Brown for this hack)
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
  const header = document.createElement('div');
  header.setAttribute('id', 'reviews-header');
  const titleSpan = document.createElement('span');
  const title = document.createElement('h2');
  title.innerHTML = 'Reviews';
  titleSpan.appendChild(title);
  header.appendChild(titleSpan);
  const buttonSpan = document.createElement('span');
  const addButton = document.createElement('a');
  addButton.innerHTML = 'Add A Review';
  addButton.href = DBHelper.urlForReviewsForm(restaurant = self.restaurant);
  buttonSpan.appendChild(addButton);
  header.appendChild(buttonSpan);
  container.appendChild(header);

  if (!reviews) {
    const noReviews = document.createElement('p');
    noReviews.innerHTML = 'No reviews yet!';
    container.appendChild(noReviews);
    return;
  }
  const ul = document.createElement('ul');
  ul.setAttribute('id', 'reviews-list')
  reviews.forEach(review => {
    ul.appendChild(createReviewHTML(review));
  });
  container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = review => {
  const li = document.createElement('li');
  li.className = 'review';

  const reviewHeader = document.createElement('div');
  reviewHeader.className = 'review-header';

  const name = document.createElement('p');
  name.className = 'review-name';
  name.innerHTML = review.name;
  reviewHeader.appendChild(name);

  const date = document.createElement('p');
  date.className = 'review-date';
  const reviewDate = new Date(review.createdAt);
  date.innerHTML = reviewDate.toDateString();
  reviewHeader.appendChild(date);
  li.appendChild(reviewHeader);

  // debugger;
  const ratingContainer = document.createElement('p');
  ratingContainer.className = 'review-rating-container';
  const rating = document.createElement('span');
  rating.className = 'review-rating';
  rating.innerHTML = `Rating: ${review.rating}`;
  ratingContainer.append(rating);
  li.appendChild(ratingContainer);

  const comments = document.createElement('p');
  comments.className = 'review-comments';
  comments.innerHTML = review.comments;
  li.appendChild(comments);

  return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
  const breadcrumb = document.getElementById('breadcrumb');
  const li = document.createElement('li');
  li.setAttribute('aria-current', 'page');

  li.innerHTML = restaurant.name;
  breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
  if (!url)
    url = window.location.href;
  name = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
    results = regex.exec(url);
  if (!results)
    return null;
  if (!results[2])
    return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

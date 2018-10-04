'use strict';
import idb from 'idb';

/**
 * Common database helper functions.
 */
export default class DBHelper {

  /**
   * Database URL for restaurants.
   */
  static get RESTAURANTS_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Database URL for reviews.
   */
  static get REVIEWS_URL() {
    const port = 1337;
    return `http://localhost:${port}/reviews`;
  }

  /**
   * Pings appropriate server to see if online.
   * Adapted from code by Laura Franklin, per my idea to ping the server
   * Takes either RESTAURANTS_URL OR REVIEWS_URL as argument
   */
  static pingServer(server) {
    console.log(`pingServer server: ${server}`);
    const status = fetch(server).then(response => {
      if (response.ok) { return true; }
    }).catch(error => {
      console.error('Error while pinging server: ', error);
      return false;
    });
    return status;
  }

  /**
   * Opens and creates database
  */
  static openDatabase() {
    return idb.open('restaurants', 3, function(upgradeDB) {
      switch(upgradeDB.oldVersion) {
        case 0:
          // placeholder
        case 1:
          console.log('Creating restaurants store');
          upgradeDB.createObjectStore('restaurants', {keyPath: 'id'});
        case 2:
          console.log('Creating reviews store');
          upgradeDB.createObjectStore('reviews', {
            keyPath: 'id',
            autoIncrement: true
          });
        case 3:
          console.log('Creating temporary reviews store');
          upgradeDB.createObjectStore('tempReviews', {
            keyPath: 'id',
            autoIncrement: true
        });
      }
    });
  }

  /**
   * Fetch restaurants from database if present; from server otherwise
   */
  static routeRestaurants(callback) {
    DBHelper.getRestaurants()
    .then((restaurants) => {
      if (restaurants.length) {
        console.log('Displaying restaurants from database', restaurants);
        if (callback) callback(null, restaurants);
        return restaurants;
      } else {
        console.log('Displaying restaurants from server');
        DBHelper.populateRestaurants(callback);
      }
    });
  }

  /**
   * Fetch restaurants from database if present; from server otherwise
   */
  static routeReviews(callback, id) {
    DBHelper.getReviews()
    .then((reviews) => {
      if (reviews.length) {
        console.log('Displaying reviews from database', reviews);
        if (callback) callback(null, reviews);
        return reviews;
      } else {
        console.log('Displaying reviews from server');
        DBHelper.populateReviews(callback, id);
      }
    });
  }

  /**
   * Fetch restaurants from server
   */
  static serveRestaurants(callback) {
    fetch(DBHelper.RESTAURANTS_URL)
    .then(response => {
      if (!response.ok) throw new Error(`Restaurants request failed. Returned status of ${error}.`);
      return response.json()
      .then(data => {
        console.log('Data from serveRestaurants(): ', data);
        const restaurants = data;
        console.log('Restaurants from server: ', restaurants);
        callback(null, restaurants);
      }).catch((error) => {
        callback(error, null);
      });
    })
  }

  /**
   * Fetch reviews from server
   */
  static serveReviews(callback, id) {
    fetch(`${DBHelper.REVIEWS_URL}/?restaurant_id=${id}`)
    .then(response => {
      if (!response.ok) throw new Error(`Reviews request failed. Returned status of ${error}.`);
      return response.json()
      .then(data => {
        console.log('Data from serveReviews(): ', data);
        const reviews = data;
        console.log('Reviews from server: ', reviews);
        callback(null, reviews);
      }).catch((error) => {
        callback(error, null);
      });
    })
  }

  /**
   * Populate database with restaurants data from server
   */
  static populateRestaurants(callback) {
    console.log('Opening database within populateRestaurants()');
    const dbPromise = DBHelper.openDatabase();

    dbPromise.then(function(db) {
      DBHelper.serveRestaurants((error, restaurants) => {
        const tx = db.transaction('restaurants', 'readwrite');
        const restaurantStore = tx.objectStore('restaurants');

        return Promise.all(
          restaurants.map(function(restaurant) {
            console.log('Adding restaurant: ', restaurant);
            return restaurantStore.put(restaurant);
          }
        )).then(function(result) {
          console.log('Result from populateRestaurants: ', result);
          callback(null, restaurants);
        })
        .then(function() {
          console.log('All restaurants added to database successfully!');
        })
        .catch(function(error) {
          tx.abort();
          console.log(error);
        });
      })
    });
  }

  /**
   * Populate database with reviews data from server
   */
  static populateReviews(callback, id) {
    console.log('Opening database within populateReviews()');
    const dbPromise = DBHelper.openDatabase();

    dbPromise.then(function(db) {
      DBHelper.serveReviews((error, reviews) => {
        const tx = db.transaction('reviews', 'readwrite');
        const reviewStore = tx.objectStore('reviews');

        return Promise.all(
          reviews.map(function(review) {
            console.log('Adding review: ', review);
            return reviewStore.put(review);
          }
        )).then(function(result) {
          console.log('Result from populateReviews: ', result);
          callback(null, reviews);
        })
        .then(function() {
          console.log('All reviews added successfully!');
        })
        .catch(function(error) {
          tx.abort();
          console.log(error);
        });
      }, id)
    });
  }

  /**
   * Get restaurants from database
   */
  static getRestaurants() {
    const dbPromise = DBHelper.openDatabase();

    return dbPromise.then(function(db) {
      const tx = db.transaction('restaurants', 'readonly');
      const restaurantStore = tx.objectStore('restaurants');
      return restaurantStore.getAll()
      .then(restaurants => {
        console.log('Got restaurants from database: ', restaurants);
        return restaurants;
      });
    }).catch((error) => console.error('Error fetching restaurants from database', error));
  }

  /**
   * Get reviews from database
   */
  static getReviews() {
    const dbPromise = DBHelper.openDatabase();

    return dbPromise.then(function(db) {
      const tx = db.transaction('reviews', 'readonly');
      const reviewStore = tx.objectStore('reviews');
      return reviewStore.getAll()
      .then(reviews => {
        console.log('Got reviews from database: ', reviews);
        return reviews;
      });
    }).catch((error) => console.error('Error fetching reviews from database', error));
  }

  /**
   * Post a favorite to the IDB first, then the
   * server if online; if not online, notifies user
   * that changes will be submitted when online
   */
  static postFavorite(restaurant, isFavorite) {
    // add favorite to IDB
    const dbPromise = DBHelper.openDatabase();

    dbPromise.then(function(db) {
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantStore = tx.objectStore('restaurants');

      restaurant.is_favorite = isFavorite;

      restaurantStore.put(restaurant);

      return tx.complete;
    })
    .then(() => console.log(`Favorited ${restaurant.name}, id ${restaurant.id}`))
    .catch((databaseError) => console.log(`Failed to favorite ${restaurant.name}, id ${restaurant.id} with error ${databaseError}`));

    // checks if server online
    const isOnline = DBHelper.pingServer(DBHelper.RESTAURANTS_URL);
    // if server online, PUT favorite
    if (isOnline) {
      const init = { method: 'PUT' };
      console.log(`PUT URL: ${DBHelper.RESTAURANTS_URL}/${restaurant.id}/?is_favorite=${isFavorite}`);
      return fetch(`${DBHelper.RESTAURANTS_URL}/${restaurant.id}/?is_favorite=${isFavorite}`, init).then(serverResponse => serverResponse.json())
      .then(serverResponseJSON => {
        console.log(`Response from postFavorite: ${serverResponseJSON}`);
        return serverResponseJSON;
      }).catch((serverError) => console.log(`Failed to post favorite with error: ${serverError}`));
    }
    else {
      // if server offline, notify user and post when online
      console.log('Server connection has been lost. Your post will be submitted when the server comes online.');
    }
  }

  /**
   * Post a new review to the temporary database first,
   * then the server if online; if not online,
   * notifies user that changes will be submitted when online
   * TODO: Will need to create function to post reviews when server is back online
   */
  static postReview(review) {
    // checks if server online
    DBHelper.pingServer(DBHelper.REVIEWS_URL)
    .then(isOnline => {
      // if server online, PUT favorite
      if (isOnline) {
        const init = {
          method: 'POST',
          headers: {
            "Content-Type": "application/json; charset=utf-8"
          },
          body: JSON.stringify(review)
        };
        console.log(`POST URL: ${DBHelper.REVIEWS_URL}`);
        return fetch(`${DBHelper.REVIEWS_URL}`, init)
        .then(serverResponse => {
          console.log(`Response from postReview: ${serverResponse}`);
          return serverResponse;
        }).catch(serverError => console.log(`Failed to post review ${review.name} with error: ${serverError}`));
      } else {
        // if app/server offline, save review to tempReviews object store, **TODO: notify user,** and post when app/server online
        console.log('Opening tempReviews database within postReview()');
        const dbPromise = DBHelper.openDatabase();

        dbPromise.then(function(db) {
          const tx = db.transaction('tempReviews', 'readwrite');
          const tempReviewsStore = tx.objectStore('tempReviews');

          console.log(`Putting review ${review} into tempReviews object store`);
          tempReviewsStore.put(review);
          console.log(`Have put review ${review} into tempReviews object store`);

          console.log('tx.complete:', tx.complete);
          return tx.complete;
        }).then((review) => console.log(`Saved review ${review} to tempReviews`))
        .catch((databaseError) => console.log(`Failed to save review ${review} to database with error ${databaseError}`));

        console.log('Server connection has been lost. Your review will be submitted when the server comes online.');
      }
    }).catch(pingError => console.log('Failed to ping server with error', pingError));
  }

  /**
   *  Fetches a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    DBHelper.routeRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        const restaurant = restaurants.find(r => r.id == id);
        if (restaurant) { // Got the restaurant
          callback(null, restaurant);
        } else { // Restaurant does not exist in the database
          callback('Restaurant does not exist', null);
        }
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.routeRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.routeRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.routeRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.routeRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.routeRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Reviews form page URL for individual restaurants.
   */
  static urlForReviewsForm(restaurant) {
    return (`./reviews_form.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    if (!restaurant.photograph) return (`/img/${restaurant.id}.jpg`);
    return (`/img/${restaurant.photograph}.jpg`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

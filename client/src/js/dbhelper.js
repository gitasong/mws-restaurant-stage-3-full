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
      console.log('Error while pinging server: ', error);
      return false;
    });
    return status;
  }

  /**
   * Opens and creates database
  */
  static openDatabase() {
    return idb.open('restaurants', 3, upgradeDB => {
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
  static async routeRestaurants() {
    const restaurants = await DBHelper.getRestaurants();
      if (restaurants.length) {
        console.log('Displaying restaurants from database', restaurants);
        return restaurants;
      } else {
        console.log('Displaying restaurants from server');
        await DBHelper.populateRestaurants();
      }
  }

  /**
   * Fetch restaurants from database if present; from server otherwise
   */
  static routeReviews(callback, id) {
    DBHelper.getReviews()
    .then((objectStores) => {
      let allReviews = [];
      objectStores.forEach(store => {
        store.forEach(review => {
          allReviews.push(review);
        });
      });

      if (allReviews.length) {
        console.log(`Reviews from reviews object store + tempReviews objectStore: ${allReviews}`);
        if (callback) callback(null, allReviews);
        return allReviews;
      } else {
        console.log('Displaying reviews from server');
        DBHelper.populateReviews(callback, id);
      }
    });
  }

  /**
   * Fetch restaurants from server
   */
  static async serveRestaurants() {
    try {
      const response = await fetch(DBHelper.RESTAURANTS_URL);
      if (!response.ok) throw new Error(`Restaurants request failed. Returned status of ${error}.`);
      const restaurants = await response.json();
      console.log('Restaurants from server: ', restaurants);
      return restaurants;
    }
    catch(error) {
      console.log(`Error serving restaurants from database: ${error}`);
    }
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
      }).catch(error => {
        callback(error, null);
      });
    })
  }

  /**
   * Populate database with restaurants data from server
   */
  static async populateRestaurants() {
    try {
      console.log('Opening database within populateRestaurants()');
      const db = await DBHelper.openDatabase();

      const restaurants = await DBHelper.serveRestaurants();
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantStore = tx.objectStore('restaurants');

      restaurants.map(async restaurant => {
        console.log('Adding restaurant: ', restaurant);
        let putRestaurant = await restaurantStore.put(restaurant);
        console.log('Put result from populateRestaurants: ', putRestaurant);
        return putRestaurant;
      });
      console.log('All restaurants added to database successfully!');
    }
    catch(error) {
      tx.abort();
      console.log(`Error populating database: ${error}`);
    }
  }

  /**
   * Populate database with reviews data from server
   */
  static populateReviews(callback, id) {
    console.log('Opening database within populateReviews()');
    const dbPromise = DBHelper.openDatabase();

    dbPromise.then(db => {
      DBHelper.serveReviews((error, reviews) => {
        const tx = db.transaction('reviews', 'readwrite');
        const reviewStore = tx.objectStore('reviews');

        return Promise.all(
          reviews.map(review => {
            console.log('Adding review: ', review);
            return reviewStore.put(review);
          }
        )).then(result => {
          console.log('Result from populateReviews: ', result);
          callback(null, reviews);
        })
        .then(() => {
          console.log('All reviews added successfully!');
        })
        .catch(error => {
          tx.abort();
          console.log(error);
        });
      }, id)
    });
  }

  /**
   * Get restaurants from database
   */
  static async getRestaurants() {
    try {
      const db =  await DBHelper.openDatabase();

      // return db.then(db => {
      const tx = db.transaction('restaurants', 'readonly');
      const restaurantStore = tx.objectStore('restaurants');
      const restaurants = await restaurantStore.getAll();
      console.log('Got restaurants from database: ', restaurants);
      return restaurants;
      // });
    }
    catch(error) {
      console.log('Error fetching restaurants from database', error);
    }
  }

  /**
   * Get reviews from database
   */
  static getReviews() {
    const dbPromise = DBHelper.openDatabase();

    const savedReviews = dbPromise.then(db => {
      const tx = db.transaction('reviews', 'readonly');
      const reviewStore = tx.objectStore('reviews');
      return reviewStore.getAll()
      .then(reviews => {
        console.log('Got reviews from reviews object store: ', reviews);
        return reviews;
      });
    }).catch(reviewsError => {
      console.log('Error fetching reviews from reviews object store', reviewsError);
      return [];
    });

    const tempReviews = dbPromise.then(db => {
      const tx = db.transaction('tempReviews', 'readonly');
      const tempReviewStore = tx.objectStore('tempReviews');
      return tempReviewStore.getAll()
      .then(tempReviews => {
        console.log('Got reviews from tempReviews object store: ', tempReviews);
        return tempReviews;
      });
    }).catch(tempReviewsError => {
      console.log('Error fetching reviews from tempReviews object store', tempReviewsError)
      return [];
    });

    return Promise.all([savedReviews, tempReviews]);
  }

  /**
   * Post a favorite to the IDB first, then the
   * server if online; if not online, notifies user
   * that changes will be submitted when online
   */
  static postFavorite(restaurant, isFavorite) {
    // add favorite to IDB
    const dbPromise = DBHelper.openDatabase();

    dbPromise.then(db => {
      const tx = db.transaction('restaurants', 'readwrite');
      const restaurantStore = tx.objectStore('restaurants');

      restaurant.is_favorite = isFavorite;
      restaurant.updatedAt = Date.now();

      restaurantStore.put(restaurant);

      return tx.complete;
    })
    .then(() => console.log(`Favorited ${restaurant.name}, id ${restaurant.id}`))
    .catch(databaseError => console.log(`Failed to favorite ${restaurant.name}, id ${restaurant.id} with error ${databaseError}`));

    // checks if server online
    const isOnline = DBHelper.pingServer(DBHelper.RESTAURANTS_URL);
    // if server online, PUT favorite
    if (isOnline) {
      const init = {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json; charset=utf-8"
        },
        body: JSON.stringify(restaurant)
      };
      console.log(`PUT URL: ${DBHelper.RESTAURANTS_URL}/${restaurant.id}/?is_favorite=${isFavorite}`);
      return fetch(`${DBHelper.RESTAURANTS_URL}/${restaurant.id}/?is_favorite=${isFavorite}`, init).then(serverResponse => serverResponse.json())
      .then(serverResponseJSON => {
        console.log(`Response from postFavorite: ${serverResponseJSON}`);
        return serverResponseJSON;
      }).catch(serverError => console.log(`Failed to post favorite with error: ${serverError}`));
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

        dbPromise.then(db => {
          const tx = db.transaction('tempReviews', 'readwrite');
          const tempReviewsStore = tx.objectStore('tempReviews');

          console.log(`Putting review ${review} into tempReviews object store`);
          tempReviewsStore.put(review);
          console.log(`Have put review ${review} into tempReviews object store`);

          console.log('tx.complete:', tx.complete);
          return tx.complete;
        }).then(review => console.log(`Saved review ${review} to tempReviews`))
        .catch(databaseError => {
          console.log(`Failed to save review ${review} to database with error ${databaseError}`);

          alert('The server appears to be offline. Your review will be submitted when the server comes online.');
        }
      )};
    }).catch(pingError => console.log('Failed to ping server with error', pingError));
  }

  /**
   * Post temporary reviews to the server when online
   */
  static postTempReviews() {
    DBHelper.pingServer(DBHelper.REVIEWS_URL)
    .then(isOnline => {
      if (isOnline) {
        const dbPromise = DBHelper.openDatabase();

        // post temporary reviews to server
        return dbPromise.then(db => {
          const tx = db.transaction('tempReviews', 'readonly');
          const tempReviewsStore = tx.objectStore('tempReviews');
          return tempReviewsStore.getAll()

          .then(reviews => {
            console.log('Got reviews from tempReviews: ', reviews);

            reviews.map(review => delete review.id); // deletes ID from each review, to avoid ID conflicts on the server
            console.log(`Reviews after deleting IDs: ${reviews}`);

            const init = {
              method: 'POST',
              headers: {
                "Content-Type": "application/json;charset=utf-8"
              },
              body: JSON.stringify(reviews)
            };

            console.log(`POST URL for postTempReviews: ${DBHelper.REVIEWS_URL}`);
            return fetch(`${DBHelper.REVIEWS_URL}`, init)
            .then(serverResponse => {
              console.log(`Temp reviews submitted successfully! ${serverResponse}`);
              return serverResponse;
            }).then(() => {
              // clear tempReviews object store
              return dbPromise.then(db => {
                const tx = db.transaction('tempReviews', 'readwrite');
                tx.objectStore('tempReviews').clear();
                return tx.complete;
              });
            }).catch(serverError => console.log(`Error posting temp reviews to server with error ${serverError}`));
          }).catch(dbError => console.log(`Error getting temp reviews from tempReviews object store`));
        });
      } else {
        console.log(`The server appears to be offline. Your reviews will be submitted when it comes back online.`);
        return;
      }
    }).catch(pingError => {
      console.log(`The server appears to be offline. Your reviews will be submitted when it comes back online.`);
    });
  }

  /**
   * Push offline favorites to the server when online
   */
  static pushFavorites() {
    DBHelper.pingServer(DBHelper.RESTAURANTS_URL)
    .then(isOnline => {
      if (isOnline) {
        const dbPromise = DBHelper.openDatabase();

        return dbPromise.then(db => {
          const tx = db.transaction('restaurants', 'readonly');
          const restaurantStore = tx.objectStore('restaurants');
          return restaurantStore.getAll()

          .then(restaurants => {
            console.log(`Restaurants from pushFavorites getAll(): ${restaurants}`);

            let updatedRestaurants = restaurants.filter(r => {
              console.log(`restaurant id: ${r.id} updated at: ${r.updatedAt} created at: ${r.createdAt}`);

              // check createdAt date format; if ISO string, convert to milliseconds and return all restaurants where updatedAt > createdAt
              if (typeof r.updatedAt === 'string') {
                const updatedAtISO = new Date(r.updatedAt);
                const updatedAtMilliseconds = updatedAtISO.getTime();
                return updatedAtMilliseconds > r.createdAt;
              }

              // if createdAt date in milliseconds, return restaurants where updatedAt > createdAt
              return r.updatedAt > r.createdAt;
            });

            console.log(`updatedRestaurants: ${updatedRestaurants}`);

            updatedRestaurants.forEach(restaurant => {
              const init = {
                method: 'PUT',
                headers: {
                  "Content-Type": "application/json;charset=utf-8"
                },
                body: JSON.stringify(restaurant)
              };

              return fetch(`${DBHelper.RESTAURANTS_URL}/${restaurant.id}`, init)
              .then(serverResponse => {
                if (serverResponse.ok) {
                  console.log(`Offline favorites pushed successfully!`);
                } else {
                  console.log(`Failed to push offline favorites to server with error ${serverResponse}`);
                }
              }).catch(serverError => console.log(`Failed to PUT offline favorites with error ${serverError}`));
            });
          }).catch(dbError => console.log(`Failed to getAll() updated restaurants from restaurants object store with error ${dbError}`));
        }).catch(dbOpenError => console.log(`Failed to open database within pushFavorites() with error ${dbOpenError}`));
      } else {
        console.log(`The server appears to be offline. Offline favorites will be submitted when the server comes back online.`);
      }
    }).catch(pingError => console.log(`Error pinging server within pushFavorites() with error ${pingError}`));
  }

  /**
   *  Fetches a restaurant by its ID.
   */
  static async fetchRestaurantById(id) {
    // fetch all restaurants with proper error handling.
    try {
      const restaurants = await DBHelper.routeRestaurants();

      const restaurant = restaurants.find(r => r.id == id);
      if (restaurant) { // Got the restaurant
        return restaurant;
      } else { // Restaurant does not exist in the database
        throw new Error('Restaurant does not exist');
      }
    }
    catch(error) {
      console.log(`Failed to fetch restaurant ${id} by ID with error ${error}`);
    }
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

}

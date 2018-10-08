'use strict';

require('./swRegistration.js');
import DBHelper from './dbhelper.js';

// grab restaurant ID from query string params
let params = (new URL(window.location)).searchParams;
let restaurantID = params.get('id');
console.log(`restaurantID for form: ${restaurantID}`);

// get restaurant data
let restaurants = DBHelper.getRestaurants();
restaurants.then(theseRestaurants => {
  console.log(`restaurantID inside .then(): ${restaurantID}`);
  console.log(`Restaurants for form: ${theseRestaurants}`);

  // filter restaurant data for restaurant matching id parameter
  let restaurant = theseRestaurants.filter(r => {
    console.log(`r.id: ${r.id}`);
    console.log(`restaurant for form: ${r.name}`);
    return r.id == restaurantID;
  });

  // set global restaurant object equal to return value of filter function
  self.restaurant = restaurant[0];
  console.log(`Restaurant for this form: ${self.restaurant.name}`);
  console.log(`self.restaurant: ${self.restaurant.name}`);

  // fill in form header with restaurant name
  let restaurantName = document.querySelector('#form-restaurant-name');
  restaurantName.innerHTML = self.restaurant.name;
}).catch(err => console.error(err));


window.submitFormData = (event) => {
  event.preventDefault();
  console.log('submitting form data...');

  // grab form data
  let reviewUsername = document.querySelector('#review-username').value;
  console.log(`reviewUsername: ${reviewUsername}`);
  let reviewRating = document.querySelector('#review-rating').value;
  console.log(`reviewRating: ${reviewRating}`);
  let reviewText = document.querySelector('#review-text').value;
  console.log(`reviewText: ${reviewText}`);
  let formData = {
    "restaurant_id": restaurantID,
    "name": reviewUsername,
    "rating": reviewRating,
    "comments": reviewText,
    "createdAt": Date.now(),
    "modifiedAt": Date.now()
  };
  console.log(formData);

  // post new review using form data to database and server, if online
  DBHelper.postReview(formData);
  console.log('called postReview');
  console.log(`params: ${params}`);
  console.log(`restaurantID: ${restaurantID}`);

  // reset form fields
  reviewUsername = '';
  reviewRating = '';
  reviewText = '';
  // redirect to restaurant page
  console.log(`Redirecting to: ./restaurant.html?id=${restaurantID}`);
  window.location.replace(`./restaurant.html?id=${restaurantID}`);
}

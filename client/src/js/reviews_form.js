'use strict';

require('./swRegistration.js');
import DBHelper from './dbhelper.js';

let restaurant;
let reviews;

window.submitFormData = (event) => {
  event.preventDefault();
  console.log('submitting form data...');

  // grab restaurant ID from query string params
  let params = (new URL(window.location)).searchParams;
  let restaurantID = params.get('id');

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
    "comments": reviewText
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
}

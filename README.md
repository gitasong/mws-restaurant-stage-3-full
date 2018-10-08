# **Grow With Google Mobile Web Specialist Certification Course**

### **Restaurant Reviews - Stage 3**

#### _By Nicole Freed_

## Note to Udacity Reviewers:
The directory structure of this project is somewhat different from the norm. Therefore, please carefully follow the instructions below to set the project. Also, this project uses webpack-dev-server on `localhost:8080` instead of the Python server on port 8000. Please follow this protocol for best results. Thank you!


## Project Overview: Stage 3

### Description

A responsive, accessible, offline-first web application that allows the user to get a list of NYC restaurants corresponding to the neighborhoods and cuisines selected from two dropdown menus.

### Project Overview

For the **Restaurant Reviews** projects, we are incrementally converting a static webpage to a mobile-ready, offline-first web application. In **Stage Three**, we take the connected application we built in **Stage One** and **Stage Two** and add additional functionality. We add a form to allow users to create their own reviews. If the app is offline, the form defers updating to the remote database until a connection is established. Finally, we optimize the site to meet even stricter performance benchmarks than the previous project, and test again using Lighthouse.


## Setup/Installation Requirements

### Required Software
- [Node.js](https://nodejs.org/) or `brew install node` in Terminal. Minimum version: v6.11.2.
- [npm](https://www.npmjs.org) (should be installed with Node.js)
- [Sails.js](http://sailsjs.com/). Install globally before starting with `npm i sails -g`.

### Installation
1. Clone the [repo](https://github.com/gitasong/mws-restaurant-stage-2-full).
2. In Terminal, navigate to the `server` directory and install the server dependencies with `npm install`.
3. Open a new Terminal window and spin up the sails (data) server with `node server`.
4. Still in Terminal, migrate back to the root project directory and install the project dependencies with `npm install`.
5. Open up a new Terminal window and spin up the development server (webpack-dev-server) with `npm run start`.
6. Navigate to `http://localhost:8080` in your browser to view the app.

### Development Notes
This project uses webpack-dev-server instead of the Python HTTP server for development. Please follow the instructions above in the Installation section to get this up and running properly.

For faster refresh times while developing, comment out the two lines for UglifyJsPlugin in webpack.config.js. This will drop the app's performance scores considerably.

### A Note about API keys:

This repository uses [Leafletjs](https://leafletjs.com/) with [Mapbox](https://www.mapbox.com/). Mapbox is free to use, and does not require any payment information. Therefore, its API keys are essentially public. For this project, since we are not making any modifications to the `server` files, we are not hiding our API keys server-side. Obviously, in a production environment, we would do this.

## Known Bugs

If a user loads the main page and navigates to one of the individual restaurant pages while online, then goes offline and navigates back to the main page, the Mapbox tiles for the main page fail to load from the cache. However, all other assets should properly load from indexedDB and the cache.

## Technologies Used

* HTML 5
* CSS 3
* ARIA and WCAG web accessibility guidelines
* JavaScript ES5, ES6
* Node.js
* npm
* Progressive Web App technologies:
  * service workers
  * indexedDB in-browser database using Jake Archibald's [indexedDB Promised](https://github.com/jakearchibald/idb) library
  * in-browser caching
* Sails.js
* Webpack + various plugins and loaders, including webpack-dev-server

### Legal

Copyright (c) 2018 **Nicole Freed**. All rights reserved.

This software is licensed under the MIT License.

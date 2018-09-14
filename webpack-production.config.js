// This code courtesy of https://medium.com/javascript-training/beginner-s-guide-to-webpack-b1f1a3638460

const WebpackStripLoader = require('strip-loader');
const devConfig = require('./webpack.config.js');
const stripLoader = {
 test: [/\.js$/, /\.es6$/],
 exclude: /node_modules/,
 loader: WebpackStripLoader.loader('console.log')
}
devConfig.module.loaders.push(stripLoader);
module.exports = devConfig;

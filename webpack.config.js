const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    main: './client/src/js/main.js',
    restaurant_info: './client/src/js/restaurant_info.js',
    leaflet: './client/src/js/leaflet.js',
  },
  output: {
    filename: 'js/[name].js',
    path: path.resolve(__dirname, './client/public')
  },
  devtool: 'source-maps',
  mode: 'development',
  devServer: {
    port: 8080
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'src/sw.js',
        to: 'sw.js',
        toType: 'file'
      },
      {
        from: 'src/js/dbhelper.js',
        to: 'js/dbhelper.js',
        toType: 'file'
      },
      {
        from: 'src/data/',
        to: 'data/',
        toType: 'dir'
      },
      {
        from: 'src/img/',
        to: 'img/',
        toType: 'dir'
      },
      {
        from: 'src/css/',
        to: 'css/',
        toType: 'dir'
      }
    ], {context: './client/'}),
    new UglifyJsPlugin(),
    new HtmlWebpackPlugin({
      title: 'Restaurant Reviews, Stage 2',
      template: './client/src/index.html',  // origin file
      filename: 'index.html',  // destination file in public
      chunks: ['main', 'leaflet'],
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      title: 'Restaurant Reviews, Stage 2',
      template: './client/src/restaurant.html',  // origin file
      filename: 'restaurant.html',  // destination file in public
      chunks: ['restaurant_info', 'leaflet'],
      inject: 'body'
    }),
    new CompressionPlugin({
      include: './client/src/*/'
    }),
    new CleanWebpackPlugin(['./client/public/*/'])
  ],
  module: {
    rules: [
      {
        test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/, query: {presets: ['es2015']}
      }
    ]
  }
};

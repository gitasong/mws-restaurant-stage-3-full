const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  entry: './client/src/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './client/dist')
  },
  plugins: [
    new UglifyJsPlugin(),
    new CleanWebpackPlugin(['dist']),
    new HtmlWebpackPlugin({
      title: 'Restaurant Reviews, Stage 2',
      template: './client/src/index.html',  // origin file
      filename: 'index.html',  // destination file in dist
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      title: 'Restaurant Reviews, Stage 2',
      template: './client/src/restaurant.html',  // origin file
      filename: 'restaurant.html',  // destination file in dist
      inject: 'body'
    })
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      },
      {
        test: /\.js$/, loader: 'babel-loader', exclude: /node_modules/, query: {presets: ['es2015']}
      }
    ]
  }
};

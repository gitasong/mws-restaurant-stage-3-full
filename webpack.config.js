const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
  entry: {
    main: './client/src/js/main.js',
    restaurant_info: './client/src/js/restaurant_info.js',
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, './client/public/')
  },
  plugins: [
    new CopyWebpackPlugin([
      {
        from: 'src/sw.js',
        to: 'sw.js',
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
      }
    ], {context: './client/'}),
    new CleanWebpackPlugin(['public']),
    new HtmlWebpackPlugin({
      title: 'Restaurant Reviews, Stage 2',
      template: './client/src/index.html',  // origin file
      filename: 'index.html',  // destination file in public
      inject: 'body'
    }),
    new HtmlWebpackPlugin({
      title: 'Restaurant Reviews, Stage 2',
      template: './client/src/restaurant.html',  // origin file
      filename: 'restaurant.html',  // destination file in public
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

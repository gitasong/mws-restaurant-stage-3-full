const path = require('path');

module.exports = {
  entry: './client/src/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './client/dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ]
  }
};

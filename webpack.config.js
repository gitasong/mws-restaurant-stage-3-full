const path = require('path');

module.exports = {
  entry: './client/src/js/main.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './client/dist')
  }
};

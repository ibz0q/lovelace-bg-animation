const path = require('path');

module.exports = {
  entry: './frontend//bg-animation.js',
  mode: 'production',
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
  output: {
    filename: 'bg-animation.min.js',
    path: path.resolve(__dirname, 'dist'),
  }
};

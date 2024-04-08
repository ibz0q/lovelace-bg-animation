const path = require('path');

module.exports = {
  entry: './bg-animation.js',
  watch: true,
  output: {
    filename: 'bg-animation.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
};

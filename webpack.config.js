const path = require('path');

module.exports = {
  entry: './bg-animation.js',
  watch: true,
  mode: 'development',
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
  output: {
    filename: 'bg-animation.min.js',
    path: '\\\\storage\\docker\\services\\homeassistant\\config\\www\\lovelace-bg-animation\\dist',
//  path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
};

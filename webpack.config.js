const path = require('path');

module.exports = {
  entry: './frontend//bg-animation.js',
  watch: true,
  mode: 'development',
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
  output: {
    filename: 'bg-animation.min.js',
    // path: '\\\\storage\\docker\\services\\homeassistant\\config\\www\\lovelace-bg-animation\\frontend',
    path: path.resolve(__dirname, 'dist'),
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
};

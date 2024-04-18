const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

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
  },
  optimization: {
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './frontend/css', to: './frontend/css' },
        { from: './frontend/webfonts', to: './frontend/webfonts' },
        { from: './gallery', to: 'gallery' },
      ],
    }),
  ],
};


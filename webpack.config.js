const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/bg-animation.js',
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
        { from: './src/css', to: './src/css' },
        { from: './src/webfonts', to: './src/webfonts' },
        { from: './gallery/packages', to: './gallery/packages' },
        { from: './gallery/gallery.manifest', to: './gallery/gallery.manifest' },
      ],
    }),
  ],
};


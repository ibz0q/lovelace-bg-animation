const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const { version } = require('./package.json');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  entry: './src/bg-animation.js',
  mode: 'production',
  devtool: false,
  watchOptions: {
    aggregateTimeout: 200,
    poll: 1000,
  },
  output: {
    filename: 'bg-animation.min.js',
    path: path.resolve(__dirname, 'dist'),
  },
  performance: {
    hints: 'warning'
  },
  optimization: {
    removeAvailableModules: true,
    removeEmptyChunks: true,
    splitChunks: false,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
        terserOptions: {
          compress: {
            drop_console: false,
            drop_debugger: true,
            pure_funcs: ['console.log']
          },
          mangle: true,
          output: {
            comments: false
          }
        }
      }),
    ],
    usedExports: true,
    sideEffects: true
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: './src/css', to: './src/css' },
        { from: './src/webfonts', to: './src/webfonts' },
        { from: './gallery/packages', to: './gallery/packages' },
        { from: './gallery/common', to: './gallery/common' },
        { from: './gallery/gallery.manifest', to: './gallery/gallery.manifest' },
      ],
    }),
    new webpack.DefinePlugin({
      VERSION: JSON.stringify(version)
    }),
  ]
};


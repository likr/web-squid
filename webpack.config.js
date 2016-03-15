/* eslint-env node */

var path = require('path');

module.exports = {
  module: {
    loaders: [
      {
        test: path.join(__dirname, 'src'),
        loader: 'babel-loader',
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
  entry: {
    bundle: './src/index',
  },
  output: {
    path: path.join(__dirname, 'public'),
    filename: '[name].js',
  },
};

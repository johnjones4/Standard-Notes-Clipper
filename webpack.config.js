const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

const _resolve = {
  extensions: ['.jsx', '.js', '.json', '.less'],
  modules: [
    path.resolve(__dirname, 'node_modules'),
    'node_modules'
  ]
}

const _module = {
  rules: [
    {
      test: /\.jsx?$/,
      exclude: path.resolve(__dirname, 'src'),
      enforce: 'pre',
      use: 'source-map-loader'
    },
    {
      test: /\.jsx?$/,
      exclude: /node_modules/,
      use: 'babel-loader'
    },
    {
      test: /\.css$/,
      use: [{
        loader: 'style-loader' // creates style nodes from JS strings
      }, {
        loader: 'css-loader' // translates CSS into CommonJS
      }]
    }
  ]
}

module.exports = [
  {
    devtool: 'source-map',
    entry: [
      path.resolve(__dirname, 'src', 'settings', 'settings.js')
    ],
    output: {
      // build to the extension src vendor directory
      path: path.resolve(__dirname, 'build'),
      filename: path.join('settings', 'settings.js')
    },
    resolve: _resolve,
    module: _module
  },
  {
    devtool: 'source-map',
    entry: [
      path.resolve(__dirname, 'src', 'content', 'content.js')
    ],
    output: {
      // build to the extension src vendor directory
      path: path.resolve(__dirname, 'build'),
      filename: path.join('content', 'content.js')
    },
    resolve: _resolve,
    module: _module
  },
  {
    devtool: 'source-map',
    entry: [
      path.resolve(__dirname, 'src', 'background', 'background.js')
    ],
    output: {
      // build to the extension src vendor directory
      path: path.resolve(__dirname, 'build'),
      filename: path.join('background', 'background.js')
    },
    plugins: [
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, 'static', '**', '*'),
          to: './',
          context: 'static/'
        }
      ])
    ],
    resolve: _resolve,
    module: _module
  }
]

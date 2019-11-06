const path = require('path')
const CopyWebpackPlugin = require('copy-webpack-plugin')

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

    resolve: {
      extensions: ['.jsx', '.js', '.json', '.less'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
        'node_modules'
      ]
    },

    plugins: [
      new CopyWebpackPlugin([
        {
          from: path.resolve(__dirname, 'src', 'settings', 'index.html'),
          to: path.join('settings', 'index.html')
        }
      ])
    ],

    module: {
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

    resolve: {
      extensions: ['.jsx', '.js', '.json', '.less'],
      modules: [
        path.resolve(__dirname, 'node_modules'),
        'node_modules'
      ]
    },

    plugins: [],

    module: {
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
  }
]

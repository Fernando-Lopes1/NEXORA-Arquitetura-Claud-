const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const webpack = require('webpack');
const path = require('path');
const deps = require('./package.json').dependencies;

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const remoteUrl = process.env.REMOTE_URL || (isProd ? '/remote/remoteEntry.js' : 'http://localhost:3001/remoteEntry.js');
  return {
    entry: './src/index.js',
    mode: argv.mode || 'development',
    devServer: {
      port: 3000,
      historyApiFallback: true,
      hot: true,
    },
    output: {
      publicPath: 'auto',
      path: path.resolve(__dirname, 'dist'),
      clean: true,
    },
    resolve: {
      extensions: ['.jsx', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          loader: 'babel-loader',
          exclude: /node_modules/,
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react'],
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.REMOTE_URL': JSON.stringify(remoteUrl),
      }),
      new ModuleFederationPlugin({
        name: 'host',
        remotes: {
          remote: `remote@${remoteUrl}`,
        },
        shared: {
          react: {
            singleton: true,
            requiredVersion: deps.react,
          },
          'react-dom': {
            singleton: true,
            requiredVersion: deps['react-dom'],
          },
        },
      }),
      new HtmlWebpackPlugin({
        template: './public/index.html',
      }),
    ],
  };
};

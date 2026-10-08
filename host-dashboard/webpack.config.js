const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
const webpack = require('webpack');
const path = require('path');
const deps = require('./package.json').dependencies;

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const remoteDashboardUrl =
    process.env.REMOTE_DASHBOARD_URL ||
    (isProd ? '/remote-dashboard/remoteEntry.js' : 'http://localhost:3002/remoteEntry.js');

  return {
    entry: './src/index.js',
    mode: argv.mode || 'development',
    devServer: {
      port: 3004,
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
        'process.env.REMOTE_DASHBOARD_URL': JSON.stringify(remoteDashboardUrl),
      }),
      new ModuleFederationPlugin({
        name: 'hostDashboard',
        remotes: {
          remoteDashboard: `remoteDashboard@${remoteDashboardUrl}`,
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

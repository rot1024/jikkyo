"use strict";

const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const BabiliPlugin = require("babili-webpack-plugin");

const PORT = 3000;

const extractCSS = new ExtractTextPlugin("style.css");

module.exports = ({ platform, prod } = {}) => {
  const electronMain = platform === "electron";
  const electronRenderer = !electronMain;

  const cssLoaders = [
    {
      loader: "css-loader",
      options: {
        camelCase: true,
        importLoaders: 1,
        localIdentName: "[local]_[hash:base64:5]",
        modules: true,
        sourceMap: !prod
      }
    },
    "postcss-loader"
  ];

  return {
    devServer: {
      hot: true,
      port: PORT
    },
    devtool: prod ? undefined : "inline-source-map",
    entry: electronMain ? [
      "./app/main"
    ] : [
      ...!prod ? [
        "react-hot-loader/patch",
        `webpack-dev-server/client?http://localhost:${PORT}`,
        "webpack/hot/only-dev-server",
      ] : [],
      "./app/renderer"
    ],
    externals: electronMain && !prod ? [
      "source-map-support"
    ] : [],
    module: {
      rules: [
        {
          test: /\.js($|\?)/,
          use: [
            ...electronRenderer && !prod ? ["react-hot-loader/webpack"] : [],
            "babel-loader"
          ],
          exclude: /node_modules/
        },
        {
          test: /\.css($|\?)/,
          use: prod ? extractCSS.extract({
            fallback: "style-loader",
            use: cssLoaders
          }) : ["style-loader", ...cssLoaders],
          exclude: /node_modules/
        },
        {
          test: /\.node$/,
          use: "node-loader"
        }
      ]
    },
    node: electronMain ? {
      __dirname: false, // for asar
      __filename: false
    } : {},
    output: {
      filename: electronMain ? "index.js" : "bundle.js",
      libraryTarget: "commonjs2",
      path: path.resolve(__dirname, "build"),
      publicPath: electronRenderer && !prod ? `http://localhost:${PORT}/build/` : undefined
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.NODE_ENV": JSON.stringify(prod ? "production" : "development")
      }),
      ...electronRenderer ? [
        ...prod ? [
          extractCSS
        ] : [
          new webpack.HotModuleReplacementPlugin(),
        ],
        new HtmlPlugin({
          template: "app/renderer/index.html"
        }),
        new CopyPlugin([
          { from: "resources", to: "resources", ignore: [".gitkeep"] }
        ])
      ] : [
        ...prod ? [] : [
          new webpack.BannerPlugin({
            banner: 'require("source-map-support").install();',
            entryOnly: false,
            raw: true
          })
        ],
      ],
      ...prod ? [
        new BabiliPlugin()
      ] : [
        new webpack.NamedModulesPlugin(),
        new webpack.NoEmitOnErrorsPlugin()
      ]
    ],
    target: electronMain ? "electron-main" : "electron-renderer"
  };

};

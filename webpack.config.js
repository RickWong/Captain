const lodash = require("lodash");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

function srcPaths(src) {
  return path.join(__dirname, src);
}

const isEnvProduction = process.env.NODE_ENV === "production";
const isEnvDevelopment = process.env.NODE_ENV === "development";

// #region Common settings
const commonConfig = {
  devtool: isEnvDevelopment ? "source-map" : false,
  mode: isEnvProduction ? "production" : "development",
  output: { path: srcPaths("dist") },
  node: { __dirname: false, __filename: false },
  resolve: {
    alias: {
      _: srcPaths("src"),
      _main: srcPaths("src/main"),
      _models: srcPaths("src/models"),
      _public: srcPaths("public"),
      _renderer: srcPaths("src/renderer"),
      _utils: srcPaths("src/utils"),
    },
    extensions: [".js", ".json", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        loader: "ts-loader",
      },
      {
        test: /\.(scss|css)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(jpg|png|svg|ico|icns)$/,
        loader: "file-loader",
        options: {
          name: "[path][name].[ext]",
        },
      },
    ],
  },
};
// #endregion

const mainConfig = lodash.cloneDeep(commonConfig);
mainConfig.entry = "./src/main/index.ts";
mainConfig.target = "electron-main";
mainConfig.output.filename = "main.bundle.js";
mainConfig.plugins = [
  new CopyPlugin({
    patterns: [
      {
        from: "package.json",
        to: "package.json",
        transform: (content, _path) => {
          // eslint-disable-line no-unused-vars
          const jsonContent = JSON.parse(content);

          delete jsonContent.devDependencies;
          delete jsonContent.scripts;
          delete jsonContent.build;

          jsonContent.main = "./main.bundle.js";
          jsonContent.scripts = { start: "electron ./main.bundle.js" };
          jsonContent.postinstall = "electron-builder install-app-deps";

          return JSON.stringify(jsonContent, undefined, 2);
        },
      },
    ],
  }),
];

const preloadConfig = lodash.cloneDeep(commonConfig);
preloadConfig.entry = "./src/main/preload.ts";
preloadConfig.target = "electron-preload";
preloadConfig.output.filename = "preload.bundle.js";

const rendererConfig = lodash.cloneDeep(commonConfig);
rendererConfig.entry = [
  "webpack-dev-server/client?http://localhost:9999/",
  "webpack/hot/dev-server",
  "./src/renderer/index.ts",
];
rendererConfig.target = "electron-renderer";
rendererConfig.output.filename = "renderer.bundle.js";
rendererConfig.devServer = {
  hot: true,
  compress: true,
  port: 9999,
  static: {
    directory: path.join(__dirname, "public"),
  },
};
rendererConfig.plugins = [
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, "./public/index.html"),
  }),
];

module.exports = [rendererConfig, mainConfig];

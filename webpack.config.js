const lodash = require("lodash");
const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ReactRefreshTypeScript = require("react-refresh-typescript");

const isDevelopment = process.env.NODE_ENV === "development";

// #region Common settings
const commonConfig = {
  devtool: isDevelopment ? "source-map" : false,
  mode: isDevelopment ? "development" : "production",
  output: { path: path.join(__dirname, "dist") },
  node: { __dirname: false, __filename: false },
  resolve: {
    alias: {
      _: path.join(__dirname, "src"),
      _main: path.join(__dirname, "src/main"),
      _models: path.join(__dirname, "src/models"),
      _public: path.join(__dirname, "public"),
      _renderer: path.join(__dirname, "src/renderer"),
      _utils: path.join(__dirname, "src/utils"),
    },
    extensions: [".js", ".json", ".ts", ".tsx"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: require.resolve("ts-loader"),
            options: {
              getCustomTransformers: () => ({
                before: [isDevelopment && ReactRefreshTypeScript()].filter(Boolean),
              }),
              transpileOnly: isDevelopment,
            },
          },
        ],
      },
      {
        test: /\.(scss|css)$/,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: "asset/resource",
        generator: {
          filename: "images/[name][ext]",
        },
      },
    ],
  },
};
// #endregion

const rendererConfig = lodash.cloneDeep(commonConfig);
rendererConfig.entry = ["./src/renderer/index.tsx"];
rendererConfig.target = "electron-renderer";
rendererConfig.output.filename = "./renderer.bundle.js";
rendererConfig.plugins = [
  new HtmlWebpackPlugin({
    template: path.resolve(__dirname, "./public/index.html"),
  }),
];

if (isDevelopment) {
  rendererConfig.devServer = {
    hot: true,
    compress: true,
    port: 9999,
    static: {
      directory: path.join(__dirname, "./public/"),
    },
  };

  rendererConfig.plugins.push(new ReactRefreshWebpackPlugin());
}

module.exports = [rendererConfig];

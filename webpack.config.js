const lodash = require("lodash");
const path = require("path");
const NodemonPlugin = require("nodemon-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const ReactRefreshWebpackPlugin = require("@pmmmwh/react-refresh-webpack-plugin");
const ReactRefreshTypeScript = require("react-refresh-typescript");

const isDevelopment = process.env.NODE_ENV === "development";

const commonConfig = {
  devtool: isDevelopment ? "inline-source-map" : false,
  mode: isDevelopment ? "development" : "production",
  output: { path: path.join(__dirname, "./build/") },
  node: { __dirname: false, __filename: false },
  resolve: {
    alias: {
      _: path.join(__dirname, "./src/"),
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

const mainConfig = lodash.cloneDeep(commonConfig);
mainConfig.entry = ["./src/main/index.ts"];
mainConfig.target = "electron-main";
mainConfig.output.filename = "./main.bundle.js";
mainConfig.plugins = [];

if (isDevelopment) {
  mainConfig.plugins.push(
    new NodemonPlugin({
      script: "./build/main.bundle.js",
      watch: "./build/main.bundle.js",
      execMap: {
        js: "electron",
      },
      nodeArgs: ["--inspect=9991"],
      env: {
        NODE_ENV: "development",
        DEBUG: "*",
      },
      verbose: true,
    }),
  );
}

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
    devMiddleware: {
      writeToDisk: true,
    },
  };

  rendererConfig.plugins.push(new ReactRefreshWebpackPlugin());
}

module.exports = [mainConfig, rendererConfig];

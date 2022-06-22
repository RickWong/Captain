const lodash = require("lodash");
const path = require("path");
const NodemonPlugin = require("nodemon-webpack-plugin");

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
              transpileOnly: isDevelopment,
            },
          },
        ],
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

module.exports = [mainConfig];

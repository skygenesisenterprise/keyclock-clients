const path = require("path");
const { merge } = require("webpack-merge");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const configurator = require("./config/config");
const { EnvironmentPlugin } = require("webpack");

const NODE_ENV = process.env.NODE_ENV == null ? "development" : process.env.NODE_ENV;

console.log("Preload process config");
const envConfig = configurator.load(NODE_ENV);
configurator.log(envConfig);

const common = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules\/(?!(@bitwarden)\/).*/,
      },
    ],
  },
  plugins: [],
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    plugins: [new TsconfigPathsPlugin({ configFile: "./tsconfig.json" })],
  },
};

const prod = {
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
  },
};

const dev = {
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "build"),
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  devtool: "cheap-source-map",
};

const main = {
  mode: NODE_ENV,
  target: "electron-preload",
  node: {
    __dirname: false,
    __filename: false,
  },
  entry: {
    preload: "./src/preload.ts",
  },
  optimization: {
    minimize: false,
  },
};

module.exports = merge(common, NODE_ENV === "development" ? dev : prod, main);

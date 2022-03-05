import { ModuleOptions, WebpackPluginInstance } from "webpack";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

interface ModuleConfig {
  module: ModuleOptions;
}

interface ModuleWithPluginConfig extends ModuleConfig {
  plugins: WebpackPluginInstance[];
}

export const scriptsConfig: ModuleConfig = {
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/i,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-typescript",
              "@babel/preset-env",
              "@babel/preset-react",
            ],
          },
        },
      },
    ],
  },
};

export const stylesConfig: ModuleWithPluginConfig = {
  module: {
    rules: [
      {
        test: /\.module.scss$/i,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              modules: {
                mode: "true",
                auto: true,
                exportGlobals: true,
                localIdentName: "[path][name]__[local]--[hash:base64:5]",
                namedExport: true,
                exportLocalsConvention: "camelCase",
                exportOnlyLocals: false,
              },
            },
          },
          "css-loader",
          "sass-loader",
        ],
      },
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
    ],
  },
  plugins: [new MiniCssExtractPlugin()],
};

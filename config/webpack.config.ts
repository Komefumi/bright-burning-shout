import fs from "fs";
import path from "path";
import { Configuration } from "webpack";
import { merge as webpackMerge } from "webpack-merge";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { scriptsConfig, stylesConfig } from "./webpack.utils";
import { pathToModuleEntriesSrc, pathToModuleEntriesDist } from "./config";

export default function generateWebpackConfig() {
  const entryFiles = fs
    .readdirSync(pathToModuleEntriesSrc, { encoding: "utf8" })
    .reduce((building, filename) => {
      building[filename.split(".")[0]] = path.join(
        pathToModuleEntriesSrc,
        filename
      );
      return building;
    }, {} as { [filename: string]: string });
  const configOptions: Configuration[] = [
    {
      entry: entryFiles,
      output: {
        filename: "[name].js",
        path: pathToModuleEntriesDist,
      },
      resolve: {
        extensions: ["", ".js", ".json", ".ts"],
      },
    },
    scriptsConfig,
    stylesConfig,
  ];

  return webpackMerge(configOptions);
}

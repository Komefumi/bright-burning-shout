import fs from "fs";
import path from "path";
import { Configuration } from "webpack";
import { merge as webpackMerge } from "webpack-merge";
import { CleanWebpackPlugin } from "clean-webpack-plugin";
import { scriptsConfig, stylesConfig } from "./webpack.utils";
import { pathToModuleEntriesSrc, pathToModuleEntriesDist } from "./config";

export default function generateWebpackConfig(entryFilePath?: string) {
  let entry;
  if (!entryFilePath) {
    const entryFiles = fs
      .readdirSync(pathToModuleEntriesSrc, { encoding: "utf8" })
      .reduce((building, filename) => {
        building[filename.split(".")[0]] = path.join(
          pathToModuleEntriesSrc,
          filename
        );
        return building;
      }, {} as { [filename: string]: string });
    entry = entryFiles;
  } else {
    const moduleName = path.basename(entryFilePath).split(".")[0];
    entry = {
      [moduleName]: entryFilePath,
    };
  }
  const configOptions: Configuration[] = [
    {
      entry: entry,
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

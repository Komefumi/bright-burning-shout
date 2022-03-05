import fs from "fs";
import webpack from "webpack";
import chokidar from "chokidar";
import { pathToModuleEntriesSrc } from "../config/config";
import generateWebpackConfig from "../config/webpack.config";

const compiler = webpack(generateWebpackConfig());

compiler.run(onRunCompiler);

if (process.argv.includes("--just-write")) {
  process.exit(0);
}

runWatcher();

function runWatcher() {
  chokidar
    .watch(pathToModuleEntriesSrc)
    .on("all", (_event, filePath: string) => {
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        return;
      }
      console.log({ filePath });
      const newConfig = generateWebpackConfig(filePath);
      const compiler = webpack(newConfig);
      compiler.run(onRunCompiler);
    });
  console.log("Modules watch initiated");
}

function onRunCompiler(err: unknown, stats: any) {
  if (err) {
    console.error(err);
  }

  if (stats) {
    console.log("From stats:");
    console.log({ errors: stats.errors, warnings: stats.warnings });
  }
}

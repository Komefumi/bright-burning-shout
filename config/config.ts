import path from "path";

const pathToProjectRoot = path.join(__dirname, "..");
const pathToModuleEntriesSrc = path.join(
  pathToProjectRoot,
  "src/module-entries"
);
const pathToModuleEntriesDist = path.join(
  pathToProjectRoot,
  "dist/module-entries"
);

const pathToDist = path.join(pathToProjectRoot, "dist");

export { pathToModuleEntriesSrc, pathToModuleEntriesDist, pathToDist };

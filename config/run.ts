import { load as loadDocumentForCheerio } from "cheerio";
import path from "path";
import fs from "fs";

const staticPathPrefix = "/static/";

interface PageConfigInterface {
  title: string;
  templateName: string;
}

function generateEmptyPageConfig(): PageConfigInterface {
  return {
    title: "",
    templateName: "",
  };
}

const ultimateRoot = path.join(__dirname, "../../");
const templatesPath = path.join(__dirname, "templates");
const pagesSrcPath = path.join(ultimateRoot, "src", "pages");
const pagesDistPath = path.join(ultimateRoot, "dist", "pages");

const pageArgIndex = process.argv.findIndex((arg) => {
  if (arg.startsWith("--page=")) {
    return true;
  }
});

if (pageArgIndex === -1) {
  compileAllPages();
  process.exit(0);
}

const pageName = process.argv[pageArgIndex].replace("--page=", "");

compileSinglePage(pageName);

function compileSinglePage(pageName: string) {
  const inSrc = path.join(pagesSrcPath, pageName + ".html");
  if (!fs.existsSync(inSrc)) {
    throw new Error("Requested page '" + pageName + "' does not exist");
  }

  writePage(inSrc);
}

function compileAllPages() {
  const pagesPathContents = collectFilePaths(pagesSrcPath);
  pagesPathContents.forEach(writePage);
}

function collectFilePaths(startPath: string): string[] {
  const levelOneContents = fs.readdirSync(startPath, { encoding: "utf8" });
  const filePathsCollected: string[] = [];
  levelOneContents.forEach((contentPath) => {
    const contentPathFull = path.join(startPath, contentPath);
    if (fs.statSync(contentPathFull).isFile()) {
      filePathsCollected.push(contentPathFull);
    } else {
      const subPaths = collectFilePaths(contentPathFull);
      filePathsCollected.push(...subPaths);
    }
  });

  return filePathsCollected;
}

function getDistPathForSrcPage(pagePath: string): string {
  const filename = path.basename(pagePath);
  const containingPathAbsolute = path.dirname(pagePath);
  const containingPath = containingPathAbsolute.slice(pagesSrcPath.length);
  const pathToDist = path.join(pagesDistPath, containingPath, filename);
  return pathToDist;
}

function writePage(pagePath: string) {
  const $injection = loadDocumentForCheerio(
    fs.readFileSync(pagePath, { encoding: "utf8" })
  );
  let pageConfig = generateEmptyPageConfig();
  eval($injection("#config").html() as string);
  const pathToTemplateChosen = path.join(
    templatesPath,
    pageConfig.templateName + ".html"
  );
  if (!fs.existsSync(pathToTemplateChosen)) {
    throw new Error(
      "Could not process page generation request template '" +
        pageConfig.templateName +
        "' not found"
    );
  }
  const $finalPage = loadDocumentForCheerio(
    fs.readFileSync(pathToTemplateChosen, { encoding: "utf8" })
  );
  $finalPage("title").text(pageConfig.title);
  $injection("script", "#scripts").each(function () {
    $finalPage("body").append(`
        <script type="text/javascript" src="${staticPathPrefix}${$injection(this).prop("src")}"></script>
      `);
  });
  $injection("link", "#style-sheets").each(function () {
    $finalPage("head").append(
      `<link rel="stylesheet" href="${staticPathPrefix}${$injection(this).prop(
        "href"
      )}" />`
    );
  });
  $finalPage("#main-content").html(
    $injection("#main-content").html() as string
  );
  const distPathForPage = getDistPathForSrcPage(pagePath);
  const containingPathInDist = path.dirname(distPathForPage);
  fs.mkdirSync(containingPathInDist, { recursive: true });
  fs.writeFileSync(distPathForPage, $finalPage.html());
}

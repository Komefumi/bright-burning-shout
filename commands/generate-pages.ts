import { load as loadDocumentForCheerio } from "cheerio";
import chokidar from "chokidar";
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

const ultimateRoot = path.join(__dirname, "..");
const templatesPath = path.join(ultimateRoot, "config/templates");
const pagesSrcPath = path.join(ultimateRoot, "src", "pages");
const pagesDistPath = path.join(ultimateRoot, "dist", "pages");

compileAllPages();

if (process.argv.includes("--just-write")) {
  process.exit(0);
}

watchAndCompilePages();

function compileAllPages() {
  const pagesPathContents = collectFilePaths(pagesSrcPath);
  pagesPathContents.forEach(writePage);
}

function watchAndCompilePages() {
  chokidar.watch(pagesSrcPath).on("all", (_event, filePath) => {
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      return;
    }
    writePage(filePath);
  });
  console.log("Pages watch initiated");
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
    // @ts-ignore
    const src = $injection(this).prop("src");
    $finalPage("body").append(`
        <script type="text/javascript" src="${staticPathPrefix}${src}"></script>
      `);
  });
  $injection("link", "#style-sheets").each(function () {
    // @ts-ignore
    const src = $injection(this).prop("src");
    $finalPage("head").append(
      `<link rel="stylesheet" href="${staticPathPrefix}${src}" />`
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

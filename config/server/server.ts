import Koa from "koa";
import staticServe from "koa-static";
import { pathToDist } from "../config";

const app = new Koa();

app.use(staticServe(pathToDist));

app.listen(3333);

console.log("Listening on port 3333");

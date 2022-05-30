import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const html = await Deno.readFile("./static/index.html");

const app = new Application();
const router = new Router();
router
  .get("/", (context) => {
    context.response.body = html;
  })
  .get("/json", (context) => {
    context.response.body = { status: "ok" };
  })
  .get("/json/:id", (context) => {
    context.response.body = {
      status: "ok",
      id: context.params.id,
    };
  });
app.use(router.routes());
// routerの設定を読み取り、許可するメソッドを自動設定
app.use(router.allowedMethods());
await app.listen({ port: 8000 });

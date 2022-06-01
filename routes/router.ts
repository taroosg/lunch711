import { Router } from "https://deno.land/x/oak/mod.ts";
import { get711Json, getFavicon, getHtml } from "../controllers/controller.ts";

export const router = new Router();

router
  .get("/", (context) => getHtml(context))
  .get("/json", (context) => get711Json(context))
  .get("/favicon", (context) => getFavicon(context));

import { get711Data } from "../services/service.ts";

export const getHtml = async (context: any) => {
  const html = await Deno.readFile("./static/index.html");
  context.response.body = html;
};

export const get711Json = async (context: any) => {
  context.response.body = await get711Data(
    context.request.url.searchParams.get("latitude"),
    context.request.url.searchParams.get("longitude"),
  );
};

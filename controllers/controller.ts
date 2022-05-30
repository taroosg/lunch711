import { get711Data } from "../services/service.ts";

export const getHtml = async (context: any) => {
  const html = await Deno.readFile("./static/index.html");
  context.response.body = html;
};

export const get711Json = (context: any) => {
  context.response.body = get711Data(1, 2);
};

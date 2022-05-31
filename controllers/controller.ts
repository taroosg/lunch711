import { getAllData, getRegionalData } from "../services/service.ts";

export const getHtml = async (context: any) => {
  const html = await Deno.readFile("./static/index.html");
  context.response.body = html;
};

export const get711Json = async (context: any) => {
  const latitude = context?.request?.url?.searchParams?.get("latitude");
  const longitude = context?.request?.url?.searchParams?.get("longitude");
  context.response.body = !latitude || !longitude
    ? await getAllData()
    : await getRegionalData(
      context?.request?.url?.searchParams?.get("latitude"),
      context?.request?.url?.searchParams?.get("longitude"),
    );
};

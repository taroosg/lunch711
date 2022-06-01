import { getAllData, getRegionalData } from "../services/service.ts";

export const getFavicon = async (context: any) => {
  const favicon = (await fetch(
    new URL("../static/favicon.png", import.meta.url).toString(),
  )).body;
  context.response.body = favicon;
};

export const getHtml = async (context: any) => {
  try {
    const html = (await fetch(
      new URL("../static/index.html", import.meta.url).toString(),
    )).body;
    context.response.body = html;
  } catch (error) {
    console.log(error.message);
    context.response.status = 500;
    context.response.body = { message: "busy now..." };
  }
};

export const get711Json = async (context: any) => {
  try {
    const latitude = context?.request?.url?.searchParams?.get("latitude");
    const longitude = context?.request?.url?.searchParams?.get("longitude");
    context.response.body = !latitude || !longitude
      ? await getAllData()
      : await getRegionalData(
        context?.request?.url?.searchParams?.get("latitude"),
        context?.request?.url?.searchParams?.get("longitude"),
      );
  } catch (error) {
    console.log(error.message);
    context.response.status = 500;
    context.response.body = { message: "busy now..." };
  }
};

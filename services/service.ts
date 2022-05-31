import { placeData, productUrl } from "../repositories/repository.ts";
import "https://deno.land/x/dotenv/load.ts";

type FantasticJson = {
  name: string;
  price: number;
  place: string[];
  url: string;
  img: string;
};

// 記号数字を全角→半角
// 全角スペース→半角スペースに
// 連続スペースを一つに
const getProductName = (productHtmlString: string): string =>
  productHtmlString
    .match(
      /(?<=<p><a href="\/products\/a\/item\/[0-9]{4,}\/">)[\s\S]+(?=<\/a><\/p>)/,
    )![0]
    .replaceAll(/　/g, " ")
    .replace(
      /[！-～]/g,
      (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0),
    )
    .replace(/(?<=\S) {2,}/g, " ");

const getProductPrice = (productHtmlString: string): number =>
  ~~Number(productHtmlString.match(/(?<=（税込)[\s\S]+(?=円）)/));

const getProductPlace = (productHtmlString: string): string[] =>
  productHtmlString
    .match(/(?<=<span>販売地域：<\/span>)[\s\S]+(?=<\/p><\/div>)/)![0].split("、");

const getProductUrl = (productHtmlString: string): string =>
  `https://www.sej.co.jp${
    productHtmlString.match(/(?<=<p><a href=")[\s\S]+(?=\/\">)/)![0]
  }/`;

const getProductImageUrl = (productHtmlString: string): string =>
  productHtmlString.match(/https:[\s\S]+.jpg/)![0];

const createFantasticJson = (productHtmlString: string): FantasticJson => ({
  name: getProductName(productHtmlString),
  price: getProductPrice(productHtmlString),
  place: getProductPlace(productHtmlString),
  url: getProductUrl(productHtmlString),
  img: getProductImageUrl(productHtmlString),
});

const getAllProducts = async (url: string): Promise<FantasticJson[]> =>
  (await (await fetch(url)).text())
    .replaceAll(/\n|\r|\t/g, "")!
    .match(/<div class="list_inner(?: .+?)?>.*?<\/div><\/div>/g)!
    .map((productHtmlString) => createFantasticJson(productHtmlString));

const getPlace = async (
  latitude: number,
  longitude: number,
): Promise<string> => {
  const appid = Deno.env.get("YAHOO_APP_ID");
  const result = await fetch(
    `https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder?output=json&lat=${latitude}&lon=${longitude}&appid=${appid}`,
  );
  const json = await result.json();
  return json.Feature[0].Property.AddressElement[0].Name;
};

const getRegion = (prefecture: string): string | undefined =>
  placeData.region.find((x) => x.pref.find((x) => x.ja === prefecture))?.ja;

const filterRegionalProducts = (
  allProducts: FantasticJson[],
  place: string,
  region: string,
): FantasticJson[] => [
  ...new Set([
    ...allProducts.filter((x) => x.place.includes(place)), // 都道府県
    ...allProducts.filter((x) => x.place.includes(region)), // 地方
    ...allProducts.filter((x) => x.place[0] === "全国"), // 全国
  ]),
];

export const getRegionalData = async (
  latitude: number,
  longitude: number,
): Promise<FantasticJson> => {
  const place = await getPlace(latitude, longitude);
  const region = getRegion(place);
  const allProducts =
    (await Promise.all(productUrl.map((x) => getAllProducts(x.url))))
      .flat();
  // 実行地域で購入できるやつ
  const canGetProducts = filterRegionalProducts(allProducts, place, region!);
  return canGetProducts[~~(Math.random() * canGetProducts.length)];
};

export const getAllData = async (): Promise<FantasticJson> => {
  // 全部
  const allProducts =
    (await Promise.all(productUrl.map((x) => getAllProducts(x.url)))).flat();
  return allProducts[~~(Math.random() * allProducts.length)];
};

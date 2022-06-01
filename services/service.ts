import { placeData, productUrl } from "../repositories/repository.ts";
import "https://deno.land/x/dotenv/load.ts";

type FantasticJson = {
  name: string;
  price: number;
  place: string[];
  url: string;
  img: string;
};

type ProductUrl = {
  category: string;
  url: string;
};

// 全角スペース→半角スペースに
// 記号数字を全角→半角
// 連続スペースを一つに
const getProductName = (productHtmlString: string): string =>
  productHtmlString
    .match(
      /(?<=<p><a href="\/products\/a\/item\/[0-9]{4,}\/">)[\s\S]+(?=<\/a><\/p>)/,
    )![0]
    .replace(/　/g, " ")
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

const filterSeason = (productUrl: ProductUrl[]): ProductUrl[] =>
  3 < new Date().getMonth() + 1 && new Date().getMonth() + 1 < 9
    ? productUrl.filter((x) => !["おでん", "中華まん"].includes(x.category))
    : productUrl;

const getAllProducts = async (
  productUrl: ProductUrl[],
): Promise<FantasticJson[]> =>
  (await Promise.all(
    filterSeason(productUrl).map((x) => getCategoryProducts(x.url)),
  )).flat();

const getCategoryProducts = async (url: string): Promise<FantasticJson[]> =>
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

export const getRegionalProduct = async (
  latitude: number,
  longitude: number,
): Promise<FantasticJson> => {
  const place = await getPlace(latitude, longitude);
  const region = getRegion(place);
  const allProducts = await getAllProducts(productUrl);
  // 実行地域で購入できるやつ
  const canGetProducts = filterRegionalProducts(allProducts, place, region!);
  return canGetProducts[~~(Math.random() * canGetProducts.length)];
};

export const getGlobalProduct = async (): Promise<FantasticJson> => {
  // 全部
  const allProducts = await getAllProducts(productUrl);
  return allProducts[~~(Math.random() * allProducts.length)];
};

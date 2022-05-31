import { placeData, productUrl } from "../repositories/repository.ts";
import "https://deno.land/x/dotenv/load.ts";

const getAllProductData = async (url: string) => {
  const response = await fetch(url);

  return (await response.text())
    .replaceAll(/\n|\r|\t/g, "")!
    .match(/<div class="list_inner(?: .+?)?>.*?<\/div><\/div>/g)!
    .map((x) => {
      return {
        // 記号数字を全角→半角
        // 全角スペース→半角スペースに
        // 連続スペースを一つに
        name: x
          .match(
            /(?<=<p><a href="\/products\/a\/item\/[0-9]{4,}\/">)[\s\S]+(?=<\/a><\/p>)/,
          )![0]
          // .match(
          //   /[^ -~｡-ﾟ]+/g,
          // )![0]
          .replaceAll(/　/g, " ")
          .replace(
            /[！-～]/g,
            (s) => String.fromCharCode(s.charCodeAt(0) - 0xFEE0),
          )
          .replace(/(?<=\S) {2,}/g, " "),
        price: ~~Number(x
          .match(/(?<=（税込)[\s\S]+(?=円）)/)),
        place: x
          .match(/(?<=<span>販売地域：<\/span>)[\s\S]+(?=<\/p><\/div>)/)![0]
          .split("、"),
        url: `https://www.sej.co.jp/${
          x.match(
            /(?<=<p><a href=")[\s\S]+(?=\/\">)/,
          )![0]
        }`,
        img: x.match(/https:[\s\S]+.jpg/)![0],
      };
    });
};

const getPlace = async (latitude: number, longitude: number) => {
  const appid = Deno.env.get("YAHOO_APP_ID");
  const result = await fetch(
    `https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder?output=json&lat=${latitude}&lon=${longitude}&appid=${appid}`,
  );
  const json = await result.json();
  return json.Feature[0].Property.AddressElement[0].Name;
};

const getRegion = (prefecture: string) =>
  placeData.region.find((x) => x.pref.find((x) => x.ja === prefecture))?.ja;

export const getRegionalData = async (latitude: number, longitude: number) => {
  // 都道府県
  const place = await getPlace(latitude, longitude);
  // 地方
  const region = getRegion(place);
  // 全部
  const allProducts =
    (await Promise.all(productUrl.map((x) => getAllProductData(x.url))))
      .flat();
  // 都道府県
  const placeProducts = allProducts.filter((x) => x.place.includes(place));
  // 地方
  const regionProducts = allProducts.filter((x) => x.place.includes(region!));
  // 全国
  const globalProducts = allProducts.filter((x) => x.place[0] === "全国");
  // 実行地域で購入できるやつ
  const canGetProducts = [
    ...new Set([...placeProducts, ...regionProducts, ...globalProducts]),
  ];
  const rand = ~~(Math.random() * canGetProducts.length);
  return canGetProducts[rand];
};

export const getAllData = async () => {
  // 全部
  const allProducts =
    (await Promise.all(productUrl.map((x) => getAllProductData(x.url)))).flat();
  const rand = ~~(Math.random() * allProducts.length);
  return allProducts[rand];
};

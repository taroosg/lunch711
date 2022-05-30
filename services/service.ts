import { placeData, productUrl } from "../repositories/repository.ts";

const getProductData = async (url: string) => {
  const response = await fetch(url);
  const result = (await response.text())
    .replaceAll(/\n|\t/g, "")
    .match(/<div class="flex_wrap">[\s\S]+<!-- flex_wrap -->/g) ?? [];
  return result[0]
    .split("<!-- list_inner -->")
    .filter((x, i, arr) => x !== " " && i !== 0 && i !== arr.length - 1)
    .map((x) => {
      return {
        name: x
          .match(/<p><a href=[\s\S]+<\/a><\/p>/)![0]
          .match(
            /[^ -~｡-ﾟ]+/g,
          )![0],
        price: Number(x
          .match(/(?<=item_price"><p>)[\s\S]+）<\/p><\/div>/g)![0]
          .match(/(?<=（税込)[\s\S]+(?=円）)/)),
        place: x
          .match(/<span>販売地域：<\/span>[\s\S]+<\/p><\/div>/g)![0]
          .match(/(?<=<\/span>)[\s\S]+(?=<\/p><\/div>)/)![0].split("、"),
        img: x.match(/https:[\s\S]+.jpg/)![0],
      };
    });
};

// const getFlattedProductData = (productData)=>

const getPlace = async (latitude: number, longitude: number) => {
  const appid = "dj00aiZpPTdFczJycG5Yand0aCZzPWNvbnN1bWVyc2VjcmV0Jng9Nzk-";
  const result = await fetch(
    `https://map.yahooapis.jp/geoapi/V1/reverseGeoCoder?output=json&lat=${latitude}&lon=${longitude}&appid=${appid}`,
  );
  const json = await result.json();
  return json.Feature[0].Property.AddressElement[0].Name;
};

const getRegion = (prefecture: string) =>
  placeData.region.find((x) => x.pref.find((x) => x.ja === prefecture))?.ja;

export const get711Data = async (
  latitude: number = 35.68381981,
  longitude: number = 139.77456498,
) => {
  // 都道府県
  const place = await getPlace(latitude, longitude);
  // 地方
  const region = getRegion(place);
  // 全部
  const allData =
    (await Promise.all(productUrl.map((x) => getProductData(x.url))))
      .flat();
  // 都道府県
  const placeProduct = allData.filter((x) => x.place.includes(place));
  // 地方
  const regionProduct = allData.filter((x) => x.place.includes(region!));

  return [...placeProduct, ...regionProduct].find((x, i, arr) =>
    i === ~~(Math.random() * [...placeProduct, ...regionProduct].length)
  );
};

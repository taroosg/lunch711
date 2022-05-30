import { productUrl } from "../repositories/repository.ts";

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
export const get711Data = async (
  latitude: number = 35.68381981,
  longitude: number = 139.77456498,
) => {
  console.log(latitude, longitude);
  const place = await getPlace(latitude, longitude);
  console.log(place);
  const allData =
    (await Promise.all(productUrl.map((x) => getProductData(x.url))))
      .flat();
  return allData.filter((x) => x.place.includes(place));
};

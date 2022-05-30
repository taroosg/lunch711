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

export const get711Data = async (
  latitude: number = 45,
  longitude: number = 135,
) => (await Promise.all(productUrl.map((x) => getProductData(x.url)))).flat();

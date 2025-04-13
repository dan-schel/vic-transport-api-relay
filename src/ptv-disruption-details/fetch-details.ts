import { parse } from "node-html-parser";
import { z } from "zod";

const query = ".js-react[data-name='LiveTravelUpdatesPage_article']";
const schema = z.object({
  content: z.string(),
});

export async function fetchDetails(url: string): Promise<string> {
  return `Some stuff from ${url}`;

  // const response = await fetch(url);
  // const htmlStr = await response.text();
  // const html = parse(htmlStr);

  // const element = html.querySelector(query);
  // if (element == null) {
  //   throw new Error(`Nothing matches "${query}" query.`);
  // }

  // const text = element.getAttribute("data-init-props") ?? null;
  // if (text == null) {
  //   throw new Error(`Element missing "data-init-props" attribute.`);
  // }

  // try {
  //   const json = JSON.parse(text);
  //   return schema.parse(json).content;
  // } catch (err) {
  //   throw new Error(`Content of "data-init-props" is not the expected JSON.`);
  // }
}

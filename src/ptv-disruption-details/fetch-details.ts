import { parse, HTMLElement } from "node-html-parser";
import { z } from "zod";

const query = ".js-react[data-name='LiveTravelUpdatesPage_article']";
const schema = z.object({
  content: z.string(),
});

export type FetchDetailsResult =
  | { details: string }
  | { error: "parsing-error"; parsingError: string }
  | { error: "fetch-failed" | "not-found" };

export async function fetchDetails(url: string): Promise<FetchDetailsResult> {
  const fetchResult = await fetchHtml(url);
  if (fetchResult == null) return { error: "fetch-failed" };
  if ("notFound" in fetchResult) return { error: "not-found" };

  const element = fetchResult.html.querySelector(query);
  if (element == null) {
    return {
      error: "parsing-error",
      parsingError: `Nothing matches "${query}" query.`,
    };
  }

  const text = element.getAttribute("data-init-props") ?? null;
  if (text == null) {
    return {
      error: "parsing-error",
      parsingError: `Element missing "data-init-props" attribute.`,
    };
  }

  try {
    const json = schema.parse(JSON.parse(text));
    return { details: json.content };
  } catch (err) {
    return {
      error: "parsing-error",
      parsingError: `Content of "data-init-props" is not the expected JSON.`,
    };
  }
}

type FetchHtmlResult = { notFound: true } | { html: HTMLElement } | null;

async function fetchHtml(url: string): Promise<FetchHtmlResult> {
  try {
    const response = await fetch(url);
    if (response.status === 404) return { notFound: true };

    const htmlStr = await response.text();
    const html = parse(htmlStr);
    return { html };
  } catch {
    return null;
  }
}

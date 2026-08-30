import { parse, HTMLElement } from "node-html-parser";
import { z } from "zod";

const elementId = "__NEXT_DATA__";
const schema = z
  .object({
    props: z.object({
      pageProps: z.object({
        disruption: z.object({
          Article: z.string(),
        }),
      }),
    }),
  })
  .transform((x) => ({ content: x.props.pageProps.disruption.Article }));

export type FetchDetailsResult =
  | { details: string }
  | { error: "parsing-error"; parsingError: string }
  | { error: "fetch-failed" | "not-found" };

export async function fetchDetails(url: string): Promise<FetchDetailsResult> {
  const fetchResult = await fetchHtml(url);
  if (fetchResult == null) return { error: "fetch-failed" };
  if ("notFound" in fetchResult) return { error: "not-found" };

  // Womp womp, they've got Cloudflare :(
  console.log(fetchResult.html.toString());

  const element = fetchResult.html.getElementById(elementId);
  if (element == null) {
    return {
      error: "parsing-error",
      parsingError: `No element with ID "${elementId}" found.`,
    };
  }

  try {
    const json = schema.parse(JSON.parse(element.innerHTML));
    return { details: json.content };
  } catch {
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

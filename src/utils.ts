import { load } from "cheerio";
import AWS from "aws-sdk";
import xml2js from "xml2js";

import { Article, Feed, FeedId, HTMLString, Selector } from "./types";
import { get } from "lodash";

const s3 = new AWS.S3({
  region: "eu-west-2", // London
});

const S3_BUCKET = "rssify";

export async function readFromS3(feedId: FeedId) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: `${feedId}.xml`,
    };

    const data = await s3.getObject(params).promise();
    const xmlContent = data.Body?.toString("utf-8");
    const lastModified = data.LastModified;
    if (!xmlContent || !lastModified) {
      return undefined;
    }

    return { data: xmlContent, lastModified };
  } catch (err) {
    console.error("Failed to read from S3", err);
    return undefined;
  }
}

export async function updateS3(feedId: FeedId, data: string) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: `${feedId}.xml`,
      Body: data,
      ContentType: "application/xml",
    };

    await s3.putObject(params).promise();
  } catch (err) {
    console.error("Failed to update S3", err);
  }
}

export async function xmlToArticles(xml: string): Promise<Article[]> {
  const parser = new xml2js.Parser();
  const parsed = await parser.parseStringPromise(xml);
  return get(parsed, "rss.channel[0].item", []).map((xmlArticle: any) => {
    return {
      title: get(xmlArticle, "title[0]"),
      description: get(xmlArticle, "description[0]"),
      link: get(xmlArticle, "link[0]"),
      date: get(xmlArticle, "pubDate[0]", new Date(0)),
    };
  });
}

export function articlesToXml(articles: Article[], feed: Feed): string {
  const builder = new xml2js.Builder();
  return builder.buildObject({
    rss: {
      $: { version: "2.0" },
      channel: {
        title: feed.title,
        link: feed.link,
        description: feed.description,
        item: articles.map((article) => ({
          title: article.title,
          description: article.description,
          ...(article.link ? { link: article.link } : {}),
          ...(article.link
            ? { guid: { $: { isPermalink: "false" }, _: article.link } }
            : {}),
          pubDate: article.date?.toUTCString(),
        })),
      },
    },
  });
}

export async function loadArticles(feed: Feed) {
  const res = await fetch(feed.link);
  const html = await res.text();
  return parseArticlesFromHtml(feed, html);
}

export function parseArticlesFromHtml(feed: Feed, html: HTMLString) {
  const articles = useMultiSelector(feed.selectors.articles, html);
  const parsedArticles: Article[] = articles.map((articleHtml: string) => {
    const title = useSingleSelector(feed.selectors.title, articleHtml);
    const description = `<![CDATA[${
      feed.selectors.description &&
      useSingleSelector(feed.selectors.description, articleHtml)
    }]]>`;
    const link = useSingleSelector(feed.selectors.link, articleHtml);
    const date =
      feed.selectors.date && feed.selectors.date !== ""
        ? new Date(useSingleSelector(feed.selectors.date, articleHtml))
        : undefined;

    return {
      title,
      description,
      link,
      date,
    };
  });

  return parsedArticles;
}

function useSingleSelector(
  selector: Selector<string>,
  html: string
): HTMLString {
  if (typeof selector === "function") {
    return selector(html);
  }

  // check if its regex
  if (selector instanceof RegExp) {
    const match = html.match(selector);
    return match && match[1] ? match[1] : "";
  }

  const $ = load(html);
  return $(selector).html() ?? "";
}

function useMultiSelector(
  selector: Selector<string[]>,
  html: string
): HTMLString[] {
  if (typeof selector === "function") {
    return selector(html);
  }

  // check if its regex
  // example selector: /<article>.*?<\/article>/gs
  if (selector instanceof RegExp) {
    return html.match(selector) ?? [];
  }

  const $ = load(html);
  return $(selector)
    .map((_, el) => $(el).html())
    .toArray();
}

import { readFileSync } from "fs";

import feeds from "../src/feeds";
import { FeedId } from "../src/types";
import { loadArticles, parseArticlesFromHtml } from "../src/utils";

const html = readFileSync(`${__dirname}/resources/cmudb.html`, "utf-8");

describe("CMUDB", () => {
  it("should parse local articles", async () => {
    const feedId = FeedId.CMUDB;
    const feed = feeds[feedId];
    const articles = parseArticlesFromHtml(feed, html);
    expect(articles).toHaveLength(4);
    expect(articles[0].title).toBe(
      `Dear User-Defined Functions,  Inlining isn’t working out so great for us.  Let’s try batching to make our relationship work.  Sincerely, SQL,`
    );
  });

  it("should parse remote", async () => {
    const feedId = FeedId.CMUDB;
    const feed = feeds[feedId];
    const articles = await loadArticles(feed);
    expect(articles[0].title).toBeTruthy();
    expect(articles[0].link.startsWith("https://")).toBe(true);
  });
});

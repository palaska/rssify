import express, { Request, Response } from "express";
import { createServer, proxy } from "aws-serverless-express";
import { APIGatewayProxyEvent, Context } from "aws-lambda";

import feeds from "./feeds";
import { FeedId } from "./types";
import {
  articlesToXml,
  loadArticles,
  readFromS3,
  updateS3,
  xmlToArticles,
} from "./utils";

const app = express();

app.get("/:feedId", async (req: Request, res: Response) => {
  const feedId = req.params.feedId.toUpperCase() as FeedId;

  if (!Object.values(FeedId).includes(feedId)) {
    return res.status(404).send("Feed not found");
  }

  const feed = feeds[feedId];
  const cachedData = await readFromS3(feedId);
  const now = new Date();

  if (
    cachedData !== undefined &&
    now.getTime() - cachedData.lastModified.getTime() <
      feed.freshnessThreshold.asMilliseconds()
  ) {
    res.send(cachedData.data);
    return;
  }

  const cachedArticles = cachedData?.data
    ? await xmlToArticles(cachedData.data)
    : [];

  const cachedArticleTitles = new Set(
    cachedArticles.map((article) => article.title)
  );

  try {
    const latestArticles = await loadArticles(feed);
    const newArticles = latestArticles
      .filter((article) => !cachedArticleTitles.has(article.title))
      .map((article) => ({ ...article, date: article.date ?? new Date() }));

    const resolvedArticles = [...newArticles, ...cachedArticles];
    const xml = articlesToXml(resolvedArticles, feed);
    await updateS3(feedId, xml);

    // return the xml
    res.set("Content-Type", "application/xml");
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to process the feed.");
  }
});

const server = createServer(app);

export const handler = (event: APIGatewayProxyEvent, context: Context) => {
  return proxy(server, event, context);
};

// if local argument is passed, start the server locally
if (process.argv[2] === "local") {
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

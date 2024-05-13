import { duration } from "moment";
import { load } from "cheerio";

import { Feed, FeedId } from "./types";

const feeds: Record<FeedId, Feed> = {
  [FeedId.CMUDB]: {
    title: "CMU DB",
    description: "Carneige Mellon University Database Group",
    link: "https://db.cs.cmu.edu/publications/",
    image: "https://www.google.com/s2/favicons?domain=https://db.cs.cmu.edu",
    freshnessThreshold: duration(1, "day"),
    selectors: {
      articles: "article ul li.bibtex",
      title: /"([^"]*)"/,
      description: (s) => s.split("<a href")[0]?.trim(),
      link: (s) => {
        const $ = load(s);
        return $("a.bibtex").attr("href") ?? "";
      },
    },
  },
};

export default feeds;

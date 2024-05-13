import { duration } from "moment";
import { load } from "cheerio";

import { Feed, FeedId } from "./types";
import { parseTUMDate } from "./feedHelpers";

const feeds: Record<FeedId, Feed> = {
  [FeedId.CMUDB]: {
    title: "CMU DB",
    description: "Carneige Mellon University Database Group",
    link: "https://db.cs.cmu.edu/publications",
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
  [FeedId.TUMDB]: {
    title: "TUM DB",
    description: "Technical University of Munich Database Group",
    link: "https://db.in.tum.de/research/publications",
    image: "https://www.google.com/s2/favicons?domain=https://db.in.tum.de",
    freshnessThreshold: duration(1, "day"),
    selectors: {
      articles: "li.publication",
      title: ".title",
      description: "span.in",
      date: (s) => {
        const strIncludingDate = s
          .split(`locationtime">`)[1]
          ?.split("</span>")[0];

        try {
          return parseTUMDate(strIncludingDate).toISOString();
        } catch (e) {
          return "";
        }
      },
      link: (s) => {
        const $ = load(s);
        return $(".title > a").attr("href") ?? "";
      },
    },
  },
};

export default feeds;

import { Duration } from "moment";

export enum FeedId {
  CMUDB = "CMUDB", // Carneige Mellon University Database Group
  TUMDB = "TUMDB", // Technical University of Munich Database Group
}

export type Article = {
  title: string;
  description: string;
  link: string;
  date?: Date;
};

export type HTMLString = string;
type DOMSelector = string;

export type Selector<T> = DOMSelector | RegExp | ((html: HTMLString) => T);

export type Feed = {
  title: string;
  description: string;
  link: string;
  image?: string;
  freshnessThreshold: Duration;
  selectors: {
    articles: Selector<HTMLString[]>;
    title: Selector<string>;
    link: Selector<string>;
    description?: Selector<string>;
    image?: Selector<string>;
    date?: Selector<string>;
  };
};

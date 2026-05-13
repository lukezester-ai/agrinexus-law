export type IngestDiscoverMode = "html" | "sitemap" | "rss";

export type IngestSource = {
  name: string;
  /** HTML страница, sitemap.xml / sitemap index, или RSS/Atom feed. */
  indexUrl: string;
  institution: string;
  category: string;
  docType: "regulation" | "procedure" | "deadline" | "scheme";
  /**
   * html = scrape на `<a href>` като досега (по подразбиране).
   * sitemap / rss = безплатно: чете XML и вади линкове към документи.
   */
  discoverMode?: IngestDiscoverMode;
};

export type DiscoveredFile = {
  fileUrl: string;
  title: string;
};

export type IngestResult = {
  source: string;
  fetched: number;
  stored: number;
  errors: string[];
};

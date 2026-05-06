export type IngestSource = {
  name: string;
  indexUrl: string;
  institution: string;
  category: string;
  docType: "regulation" | "procedure" | "deadline" | "scheme";
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

import type { IngestSource } from "@/lib/ingest/types";

export const INGEST_SOURCES: IngestSource[] = [
  {
    name: "dfz",
    indexUrl: "https://www.dfz.bg/bg/schemes-and-measures/",
    institution: "ДФЗ",
    category: "Субсидии",
    docType: "scheme",
  },
  {
    name: "mzh",
    indexUrl: "https://www.mzh.government.bg/bg/zakoni/",
    institution: "МЗХ",
    category: "Нормативни актове",
    docType: "regulation",
  },
  {
    name: "eur-lex",
    indexUrl: "https://eur-lex.europa.eu/bg/index.htm",
    institution: "EUR-Lex",
    category: "ЕС регламенти",
    docType: "regulation",
  },
];

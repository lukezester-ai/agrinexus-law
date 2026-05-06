import type { IngestSource } from "@/lib/ingest/types";

export const INGEST_SOURCES: IngestSource[] = [
  {
    name: "dfz",
    indexUrl: "https://www.dfz.bg/",
    institution: "ДФЗ",
    category: "Субсидии",
    docType: "scheme",
  },
  {
    name: "mzh",
    indexUrl: "https://www.mzh.government.bg/bg/ministerstvo/deystvashti-normativni-aktove/",
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

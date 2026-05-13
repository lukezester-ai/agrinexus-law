import type { IngestSource } from "@/lib/ingest/types";

/**
 * Основни източници за ingest: sitemap (без платен search API).
 * Лимитът на брой файлове идва от `limitPerSource` в POST /api/ingest/run.
 *
 * EUR-Lex: `robots.txt` често не се обслужва към автоматични клиенти — задайте
 * `EUR_LEX_SITEMAP_URL` и/или `EUR_LEX_RSS_URL` (копирани от браузър).
 */
const CORE_SITEMAP_SOURCES: IngestSource[] = [
  {
    name: "dfz",
    indexUrl: "https://dfz.bg/sitemap.xml",
    institution: "ДФЗ",
    category: "Субсидии",
    docType: "scheme",
    discoverMode: "sitemap",
  },
  {
    name: "mzh",
    indexUrl: "https://www.mzh.government.bg/sitemap.xml",
    institution: "МЗХ",
    category: "Нормативни актове",
    docType: "regulation",
    discoverMode: "sitemap",
  },
];

export function getIngestSources(): IngestSource[] {
  const list: IngestSource[] = [...CORE_SITEMAP_SOURCES];

  const eurSitemap = process.env.EUR_LEX_SITEMAP_URL?.trim();
  if (eurSitemap) {
    list.push({
      name: "eur-lex-sitemap",
      indexUrl: eurSitemap,
      institution: "EUR-Lex",
      category: "ЕС регламенти",
      docType: "regulation",
      discoverMode: "sitemap",
    });
  }

  const eurRss = process.env.EUR_LEX_RSS_URL?.trim();
  if (eurRss) {
    list.push({
      name: "eur-lex-rss",
      indexUrl: eurRss,
      institution: "EUR-Lex",
      category: "ЕС регламенти",
      docType: "regulation",
      discoverMode: "rss",
    });
  }

  return list;
}

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
    discoverMode: "direct-urls",
    seedUrls: [
      // Компенсиране на щети 2025
      "https://dfz.bg/documents/20121/1798020/Ukazania_kompensirane+zagubi_prez+2025.pdf/5595d7e1-6dfc-cff5-e64b-0674cbbf9c96?t=1752044476346",
      "https://dfz.bg/documents/20121/1798020/Ukazania_kompensirane+zagubi_prez+2025_Dopalnitelen+resurs.pdf/6c350e7e-88c9-a39e-43f5-3ba25d100437?t=1759742309242",
      "https://dfz.bg/documents/20121/1798020/Ukazania_kompensirane+zagubi_prez+2025_izmenenie.pdf/3c3f4471-deb9-67fe-2db8-84ffb011c424?t=1755766232655",
      // Компенсиране измръзване/слана други култури 2025
      "https://www.dfz.bg/documents/20121/1911705/Ukazania_kompensirane+zagubi_IZMRAZVANE+DRUGI+KULTURI+PREZ+2025.pdf/ad406b34-d087-ffdd-f5e3-c651766666c9?t=1760348292744",
      // Компенсиране градушка/буря/наводнение/суша 2025
      "https://www.dfz.bg/documents/20121/2002000/Ukazania_kompensirane+zagubi_GRADUSHKA_BURIA+I+PROLIVEN+DAJD_NAVODNENIA_SUSHA_2025_priem_intenzitet_NOVI+STAVKI.pdf/f9d9aa86-6e64-ad2e-a546-12d055a1b297?t=1770127078753",
      // Растителна защита лоза 2025
      "https://www.dfz.bg/documents/20121/1727676/Ukazania_rastitelna+zashtita_LOZA+2025.pdf/81a10917-e66c-8cce-fcad-c3a919934dd1?t=1741857751707",
      // Растителна защита лоза 2026
      "https://www.dfz.bg/documents/20121/2087995/Ukazania_rastitelna+zashtita_LOZA+2026.pdf/a06a5221-dfe8-a62f-f49b-9dbceb58c4be?t=1781260649205",
      // Tuta Absoluta оранжерии 2026
      "https://www.dfz.bg/documents/20121/2060505/Ukazania_Tuta+Absoluta_oranjerii_2026.pdf/3879cbf3-7dca-7ef7-7ff4-52ba243f4c00?t=1776934685358",
      // De minimis оранжерии/картофи/гъби/роза/тютюн 2025
      "https://www.dfz.bg/documents/20121/1917222/Ukazania_DE+MINIMIS_ORANJERII_KARTOFI_GABI_ROZI_TUTUN_2025_.pdf/4b96ea9f-3dde-1f70-4518-0cfddf6eebde?t=1760712149044",
      // Хуманно отношение птици 2026
      "https://www.dfz.bg/documents/20121/2060380/UKAZANIA_HUMANNO_PTICI_2026.pdf/6c17fa68-9002-d310-8f19-3bd8e16701f1?t=1776935659826",
      // Имунопрофилактика 2025
      "https://www.dfz.bg/documents/20121/1727672/UKAZANIA_IMUNOPROFILAKTIKA_2025_deinosti+za+perioda+01.06.2025+-+31.12.2025.pdf/62ce8a85-1a37-09ee-cd4e-740e1f1a6684?t=1764670620215",
      // Наредба 2 от 18.03.2025 — застрахователни схеми
      "https://www.dfz.bg/documents/20121/1742502/NAREDBA_2_ot_18032025_g_za_usloviqta_i_reda_za_predostavqne_na_podpomagane_po_intervenciqta_po_cl_76.pdf/8faff535-9555-3dd5-a560-977a75d75fc7?t=1742907552024",
      // Застраховки 2024
      "https://www.dfz.bg/documents/20121/1311169/Ukazania_shema_zastrahovki_2024_uvelichen+RESURS_13.09.24.pdf/53345190-d3f0-033b-b969-19825e41190d?t=1726484552958",
      // Компенсиране щети 2024
      "https://www.dfz.bg/documents/20121/1525074/Ukazania_kompensirane%20zagubi_prez%202024.pdf/95e5ddff-2057-4231-d78f-f7039e62a3d9?t=1726470418918",
      // Наредба 1 от 06.01.2026 — спешна финансова помощ
      "https://dfz.bg/documents/20121/1994771/%D0%9D%D0%B0%D1%80%D0%B5%D0%B4%D0%B1%D0%B0+1+%D0%BE%D1%82+06.01.2026+%D0%B3.+%D0%B7%D0%B0+%D1%83%D1%81%D0%BB%D0%BE%D0%B2%D0%B8%D1%8F%D1%82%D0%B0+%D1%80%D0%B5%D0%B4%D0%B0+%D0%B7%D0%B0+%D0%BF%D1%80%D0%B5%D0%B4%D0%BE%D1%81%D1%82%D0%B2%D1%8F%D0%BD%D0%B5+%D0%BD%D0%B0+%D1%81%D0%BF%D0%B5%D1%88%D0%BD%D0%B0+%D1%84%D0%B8%D0%BD%D0%B0%D0%BD%D1%81%D0%BE%D0%B2%D0%B0+%D0%BF%D0%BE%D0%BC%D0%BE%D1%89+%D0%BD%D0%B0+%D0%97%D0%9F%2C+%D0%B7%D0%B0%D1%81%D0%B5%D0%B3%D0%BD%D0%B0%D1%82%D0%B8+%D0%BE%D1%82+%D0%BD%D0%B5%D0%B1%D0%BB%D0%B0%D0%B3%D0%BE%D0%BF%D1%80%D0%B8%D1%8F%D1%82%D0%BD%D0%B8+%D0%BC%D0%B5%D1%82%D0%B5%D0%BE%D1%80%D0%BE%D0%BB%D0%BE%D0%B3%D0%B8%D1%87%D0%BD%D0%B8+%D1%8F%D0%B2%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F+%D0%B7%D0%B0+%D1%89%D0%B5%D1%82%D0%B8+%D0%BE%D1%82+%D0%B8%D0%B7%D0%BC%D1%80%D1%8A%D0%B7%D0%B2%D0%B0%D0%BD%D0%B5-%D1%81%D0%BB%D0%B0%D0%BD%D0%B0.pdf/1c6967dd-3ca0-aeba-0da6-b702f2036cbc?t=1768550619671",
      // Закон за подпомагане на земеделските производители
      "https://www.dfz.bg/documents/d/sfa/zakon-za-podpomagane-na-zemedelskite-proizvoditeli?download=true",
    ],
  },
  {
    name: "mzh",
    indexUrl: "https://www.mzh.government.bg/sitemap.xml",
    institution: "МЗХ",
    category: "Нормативни актове",
    docType: "regulation",
    discoverMode: "sitemap-html",
  },
];

function getEurLexRegulations(): { celex: string; title: string }[] {
  return [
    { celex: "32021R2115", title: "Стратегически планове по ОСП 2023-2027" },
    { celex: "32021R2116", title: "Финансиране, управление и мониторинг на ОСП" },
    { celex: "32021R2117", title: "Изменение на регламенти за ОСП" },
    { celex: "32021R2118", title: "Преходни правила за ОСП" },
    { celex: "32018R0848", title: "Биологично производство" },
    { celex: "32013R1308", title: "Обща организация на пазарите (ООП)" },
    { celex: "32013R1307", title: "Директни плащания (2014-2020)" },
    { celex: "32013R1306", title: "Финансиране на ОСП (2014-2020)" },
    { celex: "32013R1305", title: "Развитие на селските райони" },
    { celex: "32016R0429", title: "Здраве на животните (Animal Health Law)" },
    { celex: "32017R0625", title: "Официален контрол в хранителната верига" },
    { celex: "32009R1107", title: "Продукти за растителна защита (ПРЗ)" },
    { celex: "32005R0396", title: "Максимално допустими нива на остатъци от пестициди" },
    { celex: "32012R1151", title: "Схеми за качество (ЗНП, ЗГУ, ХГ)" },
    { celex: "32002R0178", title: "Общо законодателство в областта на храните" },
    { celex: "32011R1169", title: "Предоставяне на информация за храните" },
    { celex: "32020R2220", title: "Преходни правила за ОСП 2021-2022" },
    { celex: "32014R0514", title: "Общи разпоредби за ЕФГЗ и ЕЗФРСР" },
  ];
}

function buildEurLexUrl(celex: string): string {
  return `https://eur-lex.europa.eu/legal-content/BG/TXT/?uri=CELEX:${celex}`;
}

export function getIngestSources(): IngestSource[] {
  const list: IngestSource[] = [...CORE_SITEMAP_SOURCES];

  list.push({
    name: "eurlex",
    indexUrl: "https://eur-lex.europa.eu/",
    institution: "EUR-Lex",
    category: "ЕС регламенти",
    docType: "regulation",
    discoverMode: "direct-urls",
    seedUrls: getEurLexRegulations().map((r) => buildEurLexUrl(r.celex)),
  });

  return list;
}

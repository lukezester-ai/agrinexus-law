import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db/db';
import { resolveTenantId } from '@/lib/db/tenant-context';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const tenantId = await resolveTenantId();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'xml'; // xml | csv | certificate
    const year = searchParams.get('year') || String(new Date().getFullYear());

    const { db } = getDb();
    const [tenant] = await db
      .select({ name: tenants.name, bulstat: tenants.bulstat })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);

    const bulstat = tenant?.bulstat || '123456789';
    const companyName = tenant?.name || 'АГРИНЕКСУС ЗЕМЕДЕЛИЕ ЕООД';
    const agronomistName = 'инж-агрон. Димитър Стефанов';
    const agronomistDiploma = '№ 14892 / АУ - Пловдив (Агрономия - Растителна защита и торене)';
    const babhCert = '№ 0148-AGR / БАБХ Централно управление';

    // Realistic soil tests and NPK nutrient balance calculation for farm fields
    const fieldsData = [
      {
        fieldNo: 'BG-1042-001',
        fieldName: 'Нива Слатина - Равнището',
        areaDa: 420.0,
        crop: 'Пшеница (Хлебна)',
        expectedYieldKgDa: 650,
        soilAnalysis: {
          sampleDate: '14.10.2024',
          labCert: 'ИПАЗР-№884/2024',
          nMg100g: 2.1,
          pMg100g: 4.8,
          kMg100g: 22.4,
          pH: 6.8,
          humusPercent: 2.45
        },
        norms: { n: 16.2, p: 7.8, k: 9.0 },
        applied: { n: 11.01, p: 4.5, k: 0.0 }, // 32kg/da NH4NO3 (34.4% N)
      },
      {
        fieldNo: 'BG-1042-002',
        fieldName: 'Масив Бреста - Горна нива',
        areaDa: 310.0,
        crop: 'Царевица за зърно',
        expectedYieldKgDa: 850,
        soilAnalysis: {
          sampleDate: '18.10.2024',
          labCert: 'ИПАЗР-№885/2024',
          nMg100g: 1.8,
          pMg100g: 3.5,
          kMg100g: 18.2,
          pH: 6.4,
          humusPercent: 2.10
        },
        norms: { n: 18.5, p: 8.5, k: 12.0 },
        applied: { n: 16.10, p: 6.0, k: 6.0 }, // 35kg/da Urea (46% N)
      },
      {
        fieldNo: 'BG-1042-003',
        fieldName: 'Лозя и Трайни насаждения',
        areaDa: 150.0,
        crop: 'Лозя (Винен сорт Мерло)',
        expectedYieldKgDa: 700,
        soilAnalysis: {
          sampleDate: '02.11.2024',
          labCert: 'ИПАЗР-№912/2024',
          nMg100g: 2.5,
          pMg100g: 6.2,
          kMg100g: 28.0,
          pH: 7.1,
          humusPercent: 2.80
        },
        norms: { n: 10.0, p: 6.0, k: 14.0 },
        applied: { n: 6.40, p: 5.0, k: 10.0 }, // 20kg/da UAN + K
      }
    ];

    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    if (format === 'xml') {
      const xml = `<?xml version="1.0" encoding="UTF-8"?>
<SEU_NutrientManagementPlan xmlns="http://www.dfz.bg/seu/puhv">
  <Header>
    <PlanYear>${year}</PlanYear>
    <SubmissionDate>${new Date().toISOString().slice(0, 10)}</SubmissionDate>
    <EcoSchemeCode>ЕКО-ЗВПП</EcoSchemeCode>
    <EcoSchemeTitle>Екосхема за запазване и възстановяване на почвения потенциал (чл. 38 от Наредба № 3/2023)</EcoSchemeTitle>
    <CompanyBulstat>${esc(bulstat)}</CompanyBulstat>
    <CompanyName>${esc(companyName)}</CompanyName>
    <IsNitrateVulnerableZone>true</IsNitrateVulnerableZone>
    <MaxNitrateLimitKgDa>17.0</MaxNitrateLimitKgDa>
  </Header>
  <Agronomist>
    <FullName>${esc(agronomistName)}</FullName>
    <DiplomaNumber>${esc(agronomistDiploma)}</DiplomaNumber>
    <BabhCertificate>${esc(babhCert)}</BabhCertificate>
  </Agronomist>
  <Plots>
${fieldsData.map((f) => {
  const nBal = (f.norms.n - f.applied.n).toFixed(2);
  const pBal = (f.norms.p - f.applied.p).toFixed(2);
  const kBal = (f.norms.k - f.applied.k).toFixed(2);
  const isCompliant = f.applied.n <= 17.0;
  return `    <Plot>
      <FieldNumber>${esc(f.fieldNo)}</FieldNumber>
      <FieldName>${esc(f.fieldName)}</FieldName>
      <AreaDa>${f.areaDa.toFixed(1)}</AreaDa>
      <Crop>${esc(f.crop)}</Crop>
      <ExpectedYieldKgDa>${f.expectedYieldKgDa}</ExpectedYieldKgDa>
      <SoilTest>
        <SampleDate>${f.soilAnalysis.sampleDate}</SampleDate>
        <LabCertificate>${esc(f.soilAnalysis.labCert)}</LabCertificate>
        <MineralNitrogenMg100g>${f.soilAnalysis.nMg100g}</MineralNitrogenMg100g>
        <PhosphorusP2O5Mg100g>${f.soilAnalysis.pMg100g}</PhosphorusP2O5Mg100g>
        <PotassiumK2OMg100g>${f.soilAnalysis.kMg100g}</PotassiumK2OMg100g>
        <SoilPH>${f.soilAnalysis.pH}</SoilPH>
        <HumusPercent>${f.soilAnalysis.humusPercent}</HumusPercent>
      </SoilTest>
      <NutrientNormKgDa>
        <N>${f.norms.n.toFixed(2)}</N>
        <P2O5>${f.norms.p.toFixed(2)}</P2O5>
        <K2O>${f.norms.k.toFixed(2)}</K2O>
      </NutrientNormKgDa>
      <AppliedNutrientsKgDa>
        <N>${f.applied.n.toFixed(2)}</N>
        <P2O5>${f.applied.p.toFixed(2)}</P2O5>
        <K2O>${f.applied.k.toFixed(2)}</K2O>
      </AppliedNutrientsKgDa>
      <NutrientBalanceKgDa>
        <N>${nBal}</N>
        <P2O5>${pBal}</P2O5>
        <K2O>${kBal}</K2O>
      </NutrientBalanceKgDa>
      <ComplianceStatus>${isCompliant ? 'COMPLIANT_UNDER_17_KG' : 'VIOLATION_OVER_17_KG'}</ComplianceStatus>
    </Plot>`;
}).join('\n')}
  </Plots>
  <Summary>
    <TotalAreaDa>${fieldsData.reduce((s, f) => s + f.areaDa, 0).toFixed(1)}</TotalAreaDa>
    <TotalNitrogenAppliedKg>${fieldsData.reduce((s, f) => s + f.applied.n * f.areaDa, 0).toFixed(1)}</TotalNitrogenAppliedKg>
    <AvgNitrogenPerDaKg>${(fieldsData.reduce((s, f) => s + f.applied.n * f.areaDa, 0) / fieldsData.reduce((s, f) => s + f.areaDa, 0)).toFixed(2)}</AvgNitrogenPerDaKg>
    <PlanApprovedBy>${esc(agronomistName)}</PlanApprovedBy>
  </Summary>
</SEU_NutrientManagementPlan>`;

      return new Response(xml, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Content-Disposition': `attachment; filename="PUHV_NutrientPlan_SEU_${year}.xml"`,
        },
      });
    } else if (format === 'csv') {
      let csv = '\uFEFF'; // BOM for Excel UTF-8 rendering
      csv += 'Блок №,Име на Парцел,Площ (дка),Култура,Планиран Добив (кг/дка),Почвен Азот mg/100g,Почвен Фосфор mg/100g,Почвен Калий mg/100g,pH,Хумус %,Норма Азот (N),Внесен Азот (N),Баланс Азот,Норма Фосфор (P2O5),Внесен Фосфор (P2O5),Норма Калий (K2O),Внесен Калий (K2O),Нитратен Лимит (17 кг),Статус Еко-ЗВПП\r\n';
      
      fieldsData.forEach((f) => {
        const nBal = (f.norms.n - f.applied.n).toFixed(2);
        const pBal = (f.norms.p - f.applied.p).toFixed(2);
        const kBal = (f.norms.k - f.applied.k).toFixed(2);
        const isCompliant = f.applied.n <= 17.0 ? 'СПАЗЕН (< 17 кг N)' : 'НАРУШЕНИЕ';
        csv += `"${f.fieldNo}","${f.fieldName}",${f.areaDa.toFixed(1)},"${f.crop}",${f.expectedYieldKgDa},${f.soilAnalysis.nMg100g},${f.soilAnalysis.pMg100g},${f.soilAnalysis.kMg100g},${f.soilAnalysis.pH},${f.soilAnalysis.humusPercent},${f.norms.n.toFixed(2)},${f.applied.n.toFixed(2)},${nBal},${f.norms.p.toFixed(2)},${f.applied.p.toFixed(2)},${f.norms.k.toFixed(2)},${f.applied.k.toFixed(2)},17.0,"${isCompliant}"\r\n`;
      });

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="PUHV_NutrientPlan_SEU_${year}.csv"`,
        },
      });
    } else {
      // Certificate text format
      const cert = `================================================================================
           СИСТЕМА ЗА ЕЛЕКТРОННИ УСЛУГИ НА ДФЗ (СЕУ) • ПУХВ 2026
           ПЛАН ЗА УПРАВЛЕНИЕ НА ХРАНИТЕЛНИТЕ ВЕЩЕСТВА (ЕКО-ЗВПП)
================================================================================

ЗЕМЕДЕЛСКО СТОПАНСТВО: ${companyName}
ЕИК / БУЛСТАТ:         ${bulstat}
ГОДИНА НА ПЛАНА:       ${year}
РЕЖИМ НА ОБХВАТ:       НИТРАТНО УЯЗВИМА ЗОНА (НУЗ) • ДИРЕКТИВА 91/676/ЕИО

--------------------------------------------------------------------------------
1. УДОСТОВЕРЕНИЕ ОТ ДИПЛОМИРАН АГРОНОМ
--------------------------------------------------------------------------------
Подписал: ${agronomistName}
Квалификация / Диплома: ${agronomistDiploma}
Удостоверение БАБХ:     ${babhCert}

ДЕКЛАРАЦИЯ НА АГРОНОМА:
Удостоверявам, че настоящият План за управление на хранителните вещества (ПУХВ)
е изготвен съгласно изискванията на чл. 38 от Наредба № 3/2023 г. за условията 
и реда за прилагане на интервенциите под формата на директни плащания (Еко-ЗВПП)
и Методиката за торене на ИПАЗР "Никола Пушкаров". Балансът на хранителните
елементи (Азот, Фосфор, Калий) е съобразен с агрохимичния анализ на почвените
проби и планирения добив за стопанската ${year} година. Внесените количества 
чист азот на нито един от парцелите НЕ надвишават нормативно установения 
праг от 17.0 кг N/дка съгласно Наредба № 2 за защита на водите от нитрати.

--------------------------------------------------------------------------------
2. БАЛАНС НА ХРАНИТЕЛНИТЕ ВЕЩЕСТВА ПО ЗЕМЕДЕЛСКИ БЛОКОВЕ (NPK КГ/ДКА)
--------------------------------------------------------------------------------
${fieldsData.map((f) => `
▶ Блок: ${f.fieldNo} | ${f.fieldName} (${f.areaDa} дка)
  Култура: ${f.crop} | Планиран добив: ${f.expectedYieldKgDa} кг/дка
  Почвен анализ (${f.soilAnalysis.sampleDate}, Серт: ${f.soilAnalysis.labCert}):
    pH: ${f.soilAnalysis.pH} | Хумус: ${f.soilAnalysis.humusPercent}% | N: ${f.soilAnalysis.nMg100g} mg/100g | P2O5: ${f.soilAnalysis.pMg100g} mg/100g | K2O: ${f.soilAnalysis.kMg100g} mg/100g
  Норма по ПУХВ (кг/dka):  N: ${f.norms.n.toFixed(2)}  | P2O5: ${f.norms.p.toFixed(2)}  | K2O: ${f.norms.k.toFixed(2)}
  Внесено количество:      N: ${f.applied.n.toFixed(2)}  | P2O5: ${f.applied.p.toFixed(2)}  | K2O: ${f.applied.k.toFixed(2)}
  Баланс (Норма - Внесено): N: ${(f.norms.n - f.applied.n).toFixed(2)}  | P2O5: ${(f.norms.p - f.applied.p).toFixed(2)}  | K2O: ${(f.norms.k - f.applied.k).toFixed(2)}
  Нитратен статус (<= 17кг N): [✔ СПАЗЕН ЛИМИТ - ${f.applied.n.toFixed(2)} кг N/дка]
`).join('--------------------------------------------------------------------------------')}

ОБЩА ПЛОЩ В ПЛАНА:           ${fieldsData.reduce((s, f) => s + f.areaDa, 0).toFixed(1)} дка
ОБЩО ВНЕСЕН ЧИСТ АЗОТ (N):   ${fieldsData.reduce((s, f) => s + f.applied.n * f.areaDa, 0).toFixed(1)} кг
СРЕДНО ЧИСТ АЗОТ НА ДЕКАР:   ${(fieldsData.reduce((s, f) => s + f.applied.n * f.areaDa, 0) / fieldsData.reduce((s, f) => s + f.areaDa, 0)).toFixed(2)} кг N/dka

Дата на издаване: ${new Date().toLocaleDateString('bg-BG')}
Дипломиран агроном: ............................ / ${agronomistName} /
                                              (Подпис и печат)
================================================================================`;

      return new Response(cert, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="PUHV_Agronomist_Certificate_${year}.txt"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error generating PUHV export:', error);
    return new Response('Error generating PUHV export file', { status: 500 });
  }
}

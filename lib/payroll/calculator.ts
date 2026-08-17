// Актуални законови стойности (от 01.08.2026):
// - Максимален месечен осигурителен доход: 2300 EUR (= 4498 лв. по 1.95583)
// - Минимална работна заплата: 620.20 EUR (= 1213 лв.)
// Могат да бъдат презаписани чрез env за годишни актуализации.
const DEFAULT_MAX_INSURANCE_BASE_BGN = Number(process.env.PAYROLL_MAX_INSURANCE_BASE_BGN ?? 4498);
const DEFAULT_MIN_WAGE_BGN = Number(process.env.PAYROLL_MIN_WAGE_BGN ?? 1213);
const EUR_RATE = 1.95583;

export function calculatePayrollItem(params: {
  baseSalary: number;
  workingDays: number;
  workedDays: number;
  bonus?: number;
  maxInsuranceBase?: number;
  contractType?: string; // 'full_time' | 'part_time' | 'civil' | 'seasonal_114a'
}) {
  const maxBase = params.maxInsuranceBase ?? DEFAULT_MAX_INSURANCE_BASE_BGN;
  const bonus = params.bonus ?? 0;
  const ratio = params.workingDays > 0 ? Math.min(1, params.workedDays / params.workingDays) : 1;
  const gross = Math.round(((params.baseSalary * ratio) + bonus) * 100) / 100;
  const insuranceBase = Math.min(gross, maxBase);

  // Специфика за еднодневни трудови договори по чл. 114а от КТ (Селскостопанска сезонна работа)
  if (params.contractType === 'seasonal_114a') {
    // При чл. 114а се дължат само авансови вноски за Фонд Пенсии (ДОО) и ТЗПБ за сметка на работодател и работник
    // Няма ЗОВ (Здравно), няма ДЗПО и няма ДОД на дневен фиш
    const dooEmp = Math.round(insuranceBase * 0.0838 * 100) / 100;
    const dooEmpr = Math.round(insuranceBase * 0.1092 * 100) / 100;
    const tzpbEmpr = Math.round(insuranceBase * 0.005 * 100) / 100; // ТЗПБ за растениевъдство ~0.5%
    
    const employeeInsurance = dooEmp;
    const employerInsurance = Math.round((dooEmpr + tzpbEmpr) * 100) / 100;
    const incomeTax = 0;
    const net = Math.round((gross - employeeInsurance) * 100) / 100;
    const employerCost = Math.round((gross + employerInsurance) * 100) / 100;

    const grossEur = Math.round((gross / EUR_RATE) * 100) / 100;
    const netEur = Math.round((net / EUR_RATE) * 100) / 100;
    const employerCostEur = Math.round((employerCost / EUR_RATE) * 100) / 100;

    return {
      gross,
      grossEur,
      insuranceBase,
      employeeInsurance,
      employerInsurance,
      incomeTax,
      net,
      netEur,
      employerCost,
      employerCostEur,
      breakdown: {
        dooEmployee: dooEmp,
        dzpoEmployee: 0,
        zovEmployee: 0,
        dooEmployer: dooEmpr,
        dzpoEmployer: 0,
        zovEmployer: 0,
        tzpbEmployer: tzpbEmpr,
      },
      hasWarning: 'false',
      warning: '',
    };
  }

  // Стандартни трудови и граждански договори (ДОО, ДЗПО, ЗОВ, ТЗПБ)
  // Лични вноски (За сметка на служителя - общо 13.78%)
  const dooEmployee = Math.round(insuranceBase * 0.0838 * 100) / 100;  // 8.38% ДОО
  const dzpoEmployee = Math.round(insuranceBase * 0.0220 * 100) / 100; // 2.20% ДЗПО (УПФ)
  const zovEmployee = Math.round(insuranceBase * 0.0320 * 100) / 100;  // 3.20% Здравно (40% от 8%)
  const employeeInsurance = Math.round((dooEmployee + dzpoEmployee + zovEmployee) * 100) / 100;

  // Работодателски вноски (За сметка на работодателя - общо ~19.12%)
  const dooEmployer = Math.round(insuranceBase * 0.1092 * 100) / 100;  // 10.92% ДОО
  const dzpoEmployer = Math.round(insuranceBase * 0.0280 * 100) / 100; // 2.80% ДЗПО (УПФ)
  const zovEmployer = Math.round(insuranceBase * 0.0480 * 100) / 100;  // 4.80% Здравно (60% от 8%)
  const tzpbEmployer = Math.round(insuranceBase * 0.0060 * 100) / 100; // 0.60% ТЗПБ за селско стопанство
  const employerInsurance = Math.round((dooEmployer + dzpoEmployer + zovEmployer + tzpbEmployer) * 100) / 100;

  const taxableIncome = gross - employeeInsurance;
  const incomeTax = Math.round(Math.max(0, taxableIncome) * 0.10 * 100) / 100; // 10% ДОД
  const net = Math.round((gross - employeeInsurance - incomeTax) * 100) / 100;
  const employerCost = Math.round((gross + employerInsurance) * 100) / 100;

  const minWage = DEFAULT_MIN_WAGE_BGN;
  const hasWarning = params.baseSalary < minWage && params.contractType !== 'part_time' && params.contractType !== 'civil';
  const warning = hasWarning ? `Основната заплата е под минималната за страната (${minWage.toFixed(2)} лв. / ${(minWage / EUR_RATE).toFixed(2)} €)` : '';

  // Преизчисляване в Евро (€) по фиксирания курс на БНБ 1 EUR = 1.95583 BGN
  const grossEur = Math.round((gross / EUR_RATE) * 100) / 100;
  const netEur = Math.round((net / EUR_RATE) * 100) / 100;
  const employerCostEur = Math.round((employerCost / EUR_RATE) * 100) / 100;

  return {
    gross,
    grossEur,
    insuranceBase,
    employeeInsurance,
    employerInsurance,
    incomeTax,
    net,
    netEur,
    employerCost,
    employerCostEur,
    breakdown: {
      dooEmployee,
      dzpoEmployee,
      zovEmployee,
      dooEmployer,
      dzpoEmployer,
      zovEmployer,
      tzpbEmployer,
    },
    hasWarning: hasWarning ? 'true' : 'false',
    warning,
  };
}

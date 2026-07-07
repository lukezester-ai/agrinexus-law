export function calculatePayrollItem(params: {
  baseSalary: number;
  workingDays: number;
  workedDays: number;
  bonus?: number;
  maxInsuranceBase?: number;
}) {
  const maxBase = params.maxInsuranceBase ?? 10666.00;
  const bonus = params.bonus ?? 0;
  const gross = params.baseSalary + bonus;
  const insuranceBase = Math.min(gross, maxBase);
  const employeeInsurance = Math.round(insuranceBase * 0.1378 * 100) / 100;
  const employerInsurance = Math.round(insuranceBase * 0.1912 * 100) / 100;
  const taxableIncome = gross - employeeInsurance;
  const incomeTax = Math.round(Math.max(0, taxableIncome) * 0.10 * 100) / 100;
  const net = Math.round((gross - employeeInsurance - incomeTax) * 100) / 100;
  const employerCost = Math.round((gross + employerInsurance) * 100) / 100;
  const hasWarning = params.baseSalary < 1077;
  const warning = hasWarning ? 'Заплатата е под минималната (1077.00 BGN)' : '';

  return { gross, insuranceBase, employeeInsurance, employerInsurance, incomeTax, net, employerCost, hasWarning: hasWarning ? 'true' : 'false', warning };
}

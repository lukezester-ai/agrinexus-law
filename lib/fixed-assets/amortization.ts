export function calculateAmortization(params: {
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  accumulatedAmortization: number;
}): { monthlyAmount: number; remainingMonths: number; newAccumulated: number; bookValue: number } {
  const { acquisitionCost, salvageValue, usefulLifeMonths, accumulatedAmortization } = params;
  const depreciableBase = acquisitionCost - salvageValue;
  const monthlyAmount = usefulLifeMonths > 0 ? Math.round((depreciableBase / usefulLifeMonths) * 100) / 100 : 0;

  const monthsDone = monthlyAmount > 0 ? Math.floor(accumulatedAmortization / monthlyAmount) : 0;
  const remainingMonths = Math.max(0, usefulLifeMonths - monthsDone);

  const newAccumulated = Math.min(
    accumulatedAmortization + monthlyAmount,
    depreciableBase
  );
  const bookValue = Math.max(0, acquisitionCost - newAccumulated);

  return { monthlyAmount, remainingMonths, newAccumulated, bookValue };
}

export function generateAmortizationSchedule(params: {
  acquisitionCost: number;
  salvageValue: number;
  usefulLifeMonths: number;
  acquisitionDate: string;
}): Array<{ month: number; date: string; amount: number; bookValue: number }> {
  const { acquisitionCost, salvageValue, usefulLifeMonths, acquisitionDate } = params;
  const depreciableBase = acquisitionCost - salvageValue;
  const monthlyAmount = usefulLifeMonths > 0 ? Math.round((depreciableBase / usefulLifeMonths) * 100) / 100 : 0;

  const startDate = new Date(acquisitionDate);
  const schedule = [];
  let accumulated = 0;

  for (let m = 1; m <= usefulLifeMonths; m++) {
    accumulated += monthlyAmount;
    const remaining = acquisitionCost - Math.min(accumulated, depreciableBase);
    const date = new Date(startDate.getFullYear(), startDate.getMonth() + m, 1);
    schedule.push({
      month: m,
      date: date.toISOString().slice(0, 10),
      amount: monthlyAmount,
      bookValue: Math.max(0, Math.round(remaining * 100) / 100),
    });
  }

  return schedule;
}

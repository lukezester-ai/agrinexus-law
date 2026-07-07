import { describe, it, expect } from "vitest";
import { calculatePayrollItem } from "@/lib/payroll/calculator";

describe("calculatePayrollItem", () => {
  it("смята нето за стандартна заплата 2000 BGN", () => {
    const result = calculatePayrollItem({
      baseSalary: 2000,
      workingDays: 22,
      workedDays: 22,
    });

    expect(result.gross).toBe(2000);
    expect(result.employeeInsurance).toBeCloseTo(275.60, 1);
    expect(result.employerInsurance).toBeCloseTo(382.40, 1);
    expect(result.incomeTax).toBeCloseTo(172.44, 1);
    expect(result.net).toBeCloseTo(1551.96, 1);
    expect(result.employerCost).toBeCloseTo(2382.40, 1);
    expect(result.hasWarning).toBe("false");
  });

  it("прилага максималния осигурителен праг от 10666 BGN", () => {
    const result = calculatePayrollItem({
      baseSalary: 15000,
      workingDays: 22,
      workedDays: 22,
    });

    expect(result.insuranceBase).toBe(10666);
    expect(result.employeeInsurance).toBeCloseTo(1469.77, 1);
  });

  it("включва бонус в бруто заплатата", () => {
    const result = calculatePayrollItem({
      baseSalary: 2000,
      bonus: 500,
      workingDays: 22,
      workedDays: 22,
    });

    expect(result.gross).toBe(2500);
    expect(result.net).toBeGreaterThan(1551);
  });

  it("предупреждава при заплата под минималната (1077 BGN)", () => {
    const result = calculatePayrollItem({
      baseSalary: 800,
      workingDays: 22,
      workedDays: 22,
    });

    expect(result.hasWarning).toBe("true");
    expect(result.warning).toContain("1077");
  });

  it("смята 0 данък при 0 осигурителна основа", () => {
    const result = calculatePayrollItem({
      baseSalary: 0,
      workingDays: 22,
      workedDays: 0,
    });

    expect(result.gross).toBe(0);
    expect(result.incomeTax).toBe(0);
    expect(result.net).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import {
  calculateAmortization,
  generateAmortizationSchedule,
} from "@/lib/fixed-assets/amortization";

describe("calculateAmortization", () => {
  it("смята линейна амортизация за 60 месеца", () => {
    const result = calculateAmortization({
      acquisitionCost: 12000,
      salvageValue: 0,
      usefulLifeMonths: 60,
      accumulatedAmortization: 0,
    });

    expect(result.monthlyAmount).toBe(200);
    expect(result.remainingMonths).toBe(60);
    expect(result.newAccumulated).toBe(200);
    expect(result.bookValue).toBe(11800);
  });

  it("отчита остатъчна стойност", () => {
    const result = calculateAmortization({
      acquisitionCost: 12000,
      salvageValue: 2000,
      usefulLifeMonths: 60,
      accumulatedAmortization: 0,
    });

    expect(result.monthlyAmount).toBeCloseTo(166.67, 1);
    expect(result.bookValue).toBeGreaterThan(0);
  });

  it("коригира натрупана амортизация", () => {
    const result = calculateAmortization({
      acquisitionCost: 12000,
      salvageValue: 0,
      usefulLifeMonths: 60,
      accumulatedAmortization: 4000,
    });

    expect(result.remainingMonths).toBeLessThan(60);
  });

  it("връща нула при 0 полезен живот", () => {
    const result = calculateAmortization({
      acquisitionCost: 12000,
      salvageValue: 0,
      usefulLifeMonths: 0,
      accumulatedAmortization: 0,
    });

    expect(result.monthlyAmount).toBe(0);
  });
});

describe("generateAmortizationSchedule", () => {
  it("генерира график за 12 месеца", () => {
    const schedule = generateAmortizationSchedule({
      acquisitionCost: 12000,
      salvageValue: 0,
      usefulLifeMonths: 12,
      acquisitionDate: "2026-01-01",
    });

    expect(schedule).toHaveLength(12);
    expect(schedule[0].month).toBe(1);
    expect(schedule[0].amount).toBe(1000);
    expect(schedule[0].bookValue).toBe(11000);
    expect(schedule[11].bookValue).toBe(0);
  });
});

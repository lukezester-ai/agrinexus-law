import { describe, it, expect } from "vitest";
import { isValidEmail, normalizeEmail } from "@/lib/validation/email";

describe("isValidEmail", () => {
  it("валидира коректен email", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.uk")).toBe(true);
  });

  it("отхвърля невалидни имейли", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("not-an-email")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("user@.com")).toBe(false);
    expect(isValidEmail("user@domain")).toBe(false);
  });

  it("отхвърля не-string стойности", () => {
    expect(isValidEmail(null)).toBe(false);
    expect(isValidEmail(undefined)).toBe(false);
    expect(isValidEmail(123)).toBe(false);
  });
});

describe("normalizeEmail", () => {
  it("трими и прави lowercase", () => {
    expect(normalizeEmail("  User@Example.COM  ")).toBe("user@example.com");
  });
});

import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv-export";

describe("toCsv", () => {
  it("генерира CSV header + редове", () => {
    const data = [
      { name: "Иван", salary: 2000 },
      { name: "Петър", salary: 2500 },
    ];
    const columns = [
      { key: "name", label: "Име" },
      { key: "salary", label: "Заплата" },
    ];

    const csv = toCsv(data, columns);
    const lines = csv.split("\r\n");

    expect(lines[0]).toBe("Име,Заплата");
    expect(lines[1]).toBe("Иван,2000");
    expect(lines[2]).toBe("Петър,2500");
  });

  it("екранира стойности със запетая", () => {
    const data = [{ name: "Иван, Петър", age: 30 }];
    const csv = toCsv(data, [
      { key: "name", label: "Име" },
      { key: "age", label: "Години" },
    ]);

    expect(csv).toContain('"Иван, Петър"');
  });

  it("екранира стойности с кавички", () => {
    const data = [{ note: 'Той каза "здравей"', id: 1 }];
    const csv = toCsv(data, [
      { key: "note", label: "Бележка" },
      { key: "id", label: "ID" },
    ]);

    expect(csv).toContain('"Той каза ""здравей"""');
  });

  it("обработва null/undefined стойности", () => {
    const data = [{ name: "Иван", salary: null }];
    const csv = toCsv(data, [
      { key: "name", label: "Име" },
      { key: "salary", label: "Заплата" },
    ]);

    expect(csv).toContain("Иван,");
  });

  it("поддържа nested ключове", () => {
    const data = [{ person: { name: "Иван" } }];
    const csv = toCsv(data, [{ key: "person.name", label: "Име" }]);

    expect(csv).toContain("Иван");
  });
});

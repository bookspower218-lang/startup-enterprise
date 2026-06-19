import { describe, expect, it } from "vitest";
import { FREE_TRIAL_COMPANY_LIMIT } from "@/lib/freeTrial";

describe("free trial constants", () => {
  it("allows five companies before payment is required", () => {
    expect(FREE_TRIAL_COMPANY_LIMIT).toBe(5);
  });
});

describe("free trial slot logic (mirrors SQL ranking)", () => {
  type Interest = { companyId: string; at: number };

  function companyRank(interests: Interest[], companyId: string): number {
    const firstByCompany = new Map<string, number>();
    for (const row of interests) {
      const prev = firstByCompany.get(row.companyId);
      if (prev === undefined || row.at < prev) firstByCompany.set(row.companyId, row.at);
    }
    const ordered = [...firstByCompany.entries()].sort((a, b) => a[1] - b[1]);
    return ordered.findIndex(([id]) => id === companyId) + 1;
  }

  it("grants trial for the first five distinct interested companies", () => {
    const interests: Interest[] = [
      { companyId: "c1", at: 1 },
      { companyId: "c2", at: 2 },
      { companyId: "c3", at: 3 },
      { companyId: "c4", at: 4 },
      { companyId: "c5", at: 5 },
    ];
    expect(companyRank(interests, "c5")).toBeLessThanOrEqual(FREE_TRIAL_COMPANY_LIMIT);
    expect(companyRank(interests, "c5")).toBe(5);
  });

  it("denies trial for the sixth distinct interested company", () => {
    const interests: Interest[] = [
      { companyId: "c1", at: 1 },
      { companyId: "c2", at: 2 },
      { companyId: "c3", at: 3 },
      { companyId: "c4", at: 4 },
      { companyId: "c5", at: 5 },
      { companyId: "c6", at: 6 },
    ];
    expect(companyRank(interests, "c6")).toBe(6);
    expect(companyRank(interests, "c6")).toBeGreaterThan(FREE_TRIAL_COMPANY_LIMIT);
  });

  it("uses earliest interest time per company when ranking", () => {
    const interests: Interest[] = [
      { companyId: "c1", at: 10 },
      { companyId: "c1", at: 99 },
      { companyId: "c2", at: 5 },
    ];
    expect(companyRank(interests, "c2")).toBe(1);
    expect(companyRank(interests, "c1")).toBe(2);
  });
});

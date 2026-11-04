import { describe, it, expect } from "vitest";
import {
  filterByDateRange,
  filterByProject,
  filterByOptionalProject,
  countByStatus,
  groupBy,
  safeNumber,
  formatCrore,
  pct,
  calcSceneProgress,
  calcVarianceDays,
  varianceStatus,
} from "./report-utils";

describe("report-utils", () => {
  describe("filterByProject", () => {
    const items = [
      { projectId: "p1", name: "a" },
      { projectId: "p2", name: "b" },
      { projectId: "p1", name: "c" },
    ];

    it("returns all when projectId is undefined", () => {
      expect(filterByProject(items)).toHaveLength(3);
    });

    it("returns all when projectId is 'all'", () => {
      expect(filterByProject(items, "all")).toHaveLength(3);
    });

    it("filters by specific project", () => {
      const result = filterByProject(items, "p1");
      expect(result).toHaveLength(2);
      expect(result.every((i) => i.projectId === "p1")).toBe(true);
    });

    it("returns empty for non-existent project", () => {
      expect(filterByProject(items, "p99")).toHaveLength(0);
    });
  });

  describe("filterByOptionalProject", () => {
    const items = [
      { projectId: "p1", name: "a" },
      { projectId: undefined, name: "b" },
      { projectId: "p2", name: "c" },
    ];

    it("returns all when no filter", () => {
      expect(filterByOptionalProject(items)).toHaveLength(3);
    });

    it("filters by specific project", () => {
      expect(filterByOptionalProject(items, "p1")).toHaveLength(1);
    });
  });

  describe("filterByDateRange", () => {
    const items = [
      { date: "2026-01-01", name: "a" },
      { date: "2026-06-15", name: "b" },
      { date: "2026-12-31", name: "c" },
      { date: undefined, name: "d" },
    ];
    const dateFn = (i: typeof items[0]) => i.date;

    it("returns all when no range", () => {
      expect(filterByDateRange(items, dateFn, {})).toHaveLength(4);
    });

    it("filters by from date", () => {
      const result = filterByDateRange(items, dateFn, { from: "2026-06-01" });
      expect(result).toHaveLength(3); // b, c, and d (undefined dates pass)
    });

    it("filters by to date", () => {
      const result = filterByDateRange(items, dateFn, { to: "2026-06-30" });
      expect(result).toHaveLength(3); // a, b, and d
    });

    it("filters by date range", () => {
      const result = filterByDateRange(items, dateFn, { from: "2026-03-01", to: "2026-09-01" });
      expect(result).toHaveLength(2); // b and d
    });

    it("items without dates pass through", () => {
      const result = filterByDateRange(items, dateFn, { from: "2027-01-01" });
      expect(result.some((i) => i.name === "d")).toBe(true);
    });
  });

  describe("countByStatus", () => {
    const items = [
      { status: "active" },
      { status: "active" },
      { status: "completed" },
      { status: "pending" },
    ];

    it("counts correctly", () => {
      const counts = countByStatus(items, (i) => i.status);
      expect(counts.active).toBe(2);
      expect(counts.completed).toBe(1);
      expect(counts.pending).toBe(1);
    });

    it("returns empty for empty input", () => {
      expect(countByStatus([], (i: any) => i.status)).toEqual({});
    });
  });

  describe("groupBy", () => {
    it("groups items by key", () => {
      const items = [
        { dept: "camera", name: "a" },
        { dept: "sound", name: "b" },
        { dept: "camera", name: "c" },
      ];
      const groups = groupBy(items, (i) => i.dept);
      expect(groups.camera).toHaveLength(2);
      expect(groups.sound).toHaveLength(1);
    });
  });

  describe("safeNumber", () => {
    it("returns valid numbers", () => {
      expect(safeNumber(42)).toBe(42);
      expect(safeNumber(0)).toBe(0);
      expect(safeNumber(-5)).toBe(-5);
    });

    it("returns 0 for invalid inputs", () => {
      expect(safeNumber(NaN)).toBe(0);
      expect(safeNumber(Infinity)).toBe(0);
      expect(safeNumber(undefined)).toBe(0);
      expect(safeNumber(null)).toBe(0);
      expect(safeNumber("abc")).toBe(0);
    });

    it("converts numeric strings", () => {
      expect(safeNumber("123")).toBe(123);
    });
  });

  describe("formatCrore", () => {
    it("formats zero", () => {
      expect(formatCrore(0)).toBe("₹0");
    });

    it("formats crores", () => {
      expect(formatCrore(10000000)).toBe("₹1.00 Cr");
      expect(formatCrore(277600000)).toBe("₹27.76 Cr");
    });

    it("formats lakhs", () => {
      expect(formatCrore(500000)).toBe("₹5.00 L");
    });

    it("formats small values", () => {
      const result = formatCrore(50000);
      expect(result).toContain("₹");
      expect(result).toContain("50");
    });
  });

  describe("pct", () => {
    it("calculates percentage", () => {
      expect(pct(50, 100)).toBe(50);
      expect(pct(1, 3)).toBe(33);
    });

    it("returns 0 for zero total", () => {
      expect(pct(50, 0)).toBe(0);
    });

    it("returns 0 for negative total", () => {
      expect(pct(50, -10)).toBe(0);
    });
  });

  describe("calcSceneProgress", () => {
    it("calculates progress correctly", () => {
      const scenes = [
        { status: "completed" },
        { status: "shot" },
        { status: "in-progress" },
        { status: "shooting" },
        { status: "planned" },
        { status: "upcoming" },
      ];
      const progress = calcSceneProgress(scenes);
      expect(progress.total).toBe(6);
      expect(progress.completed).toBe(2);
      expect(progress.inProgress).toBe(2);
      expect(progress.pending).toBe(2);
      expect(progress.completionPct).toBe(33);
    });

    it("handles empty scenes", () => {
      const progress = calcSceneProgress([]);
      expect(progress.total).toBe(0);
      expect(progress.completed).toBe(0);
      expect(progress.completionPct).toBe(0);
    });
  });

  describe("calcVarianceDays", () => {
    it("calculates positive variance (delayed)", () => {
      expect(calcVarianceDays("2026-01-01", "2026-01-05")).toBe(4);
    });

    it("calculates negative variance (ahead)", () => {
      expect(calcVarianceDays("2026-01-05", "2026-01-01")).toBe(-4);
    });

    it("returns 0 for same dates", () => {
      expect(calcVarianceDays("2026-01-01", "2026-01-01")).toBe(0);
    });

    it("returns 0 for missing dates", () => {
      expect(calcVarianceDays(undefined, "2026-01-01")).toBe(0);
      expect(calcVarianceDays("2026-01-01", undefined)).toBe(0);
      expect(calcVarianceDays(undefined, undefined)).toBe(0);
    });

    it("returns 0 for invalid dates", () => {
      expect(calcVarianceDays("not-a-date", "2026-01-01")).toBe(0);
    });
  });

  describe("varianceStatus", () => {
    it("returns pending when no planned date", () => {
      expect(varianceStatus(undefined, undefined)).toBe("pending");
    });

    it("returns on-time for same dates", () => {
      expect(varianceStatus("2026-01-01", "2026-01-01")).toBe("on-time");
    });

    it("returns delayed for late completion", () => {
      expect(varianceStatus("2026-01-01", "2026-01-10")).toBe("delayed");
    });

    it("returns ahead for early completion", () => {
      expect(varianceStatus("2026-01-10", "2026-01-01")).toBe("ahead");
    });

    it("returns delayed when planned date is past and no actual", () => {
      expect(varianceStatus("2020-01-01", undefined)).toBe("delayed");
    });

    it("returns pending when planned date is future and no actual", () => {
      expect(varianceStatus("2030-01-01", undefined)).toBe("pending");
    });
  });

  describe("data integrity - no source mutation", () => {
    it("filterByProject does not mutate input", () => {
      const items = [{ projectId: "p1" }, { projectId: "p2" }];
      const copy = [...items];
      filterByProject(items, "p1");
      expect(items).toEqual(copy);
    });

    it("countByStatus does not mutate input", () => {
      const items = [{ status: "a" }, { status: "b" }];
      const copy = JSON.stringify(items);
      countByStatus(items, (i) => i.status);
      expect(JSON.stringify(items)).toBe(copy);
    });

    it("groupBy does not mutate input", () => {
      const items = [{ k: "a" }, { k: "b" }];
      const copy = JSON.stringify(items);
      groupBy(items, (i) => i.k);
      expect(JSON.stringify(items)).toBe(copy);
    });
  });

  describe("empty data handling", () => {
    it("all functions handle empty arrays", () => {
      expect(filterByProject([], "p1")).toEqual([]);
      expect(filterByDateRange([], () => undefined, { from: "2026-01-01" })).toEqual([]);
      expect(countByStatus([], () => "")).toEqual({});
      expect(groupBy([], () => "")).toEqual({});
      expect(calcSceneProgress([])).toEqual({ total: 0, completed: 0, inProgress: 0, pending: 0, completionPct: 0 });
    });
  });
});

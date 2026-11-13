import { describe, it, expect, vi, beforeEach } from "vitest";
import { formatFilterContext } from "./report-export";

// exportToCsv uses DOM APIs (Blob, URL, createElement) which need browser environment.
// We test the pure helper formatFilterContext and the CSV logic indirectly.

describe("report-export", () => {
  describe("formatFilterContext", () => {
    it("returns default when no filters", () => {
      expect(formatFilterContext({})).toBe("No filters applied");
    });

    it("includes project name", () => {
      expect(formatFilterContext({ projectName: "Thunderbolt" })).toContain("Project: Thunderbolt");
    });

    it("excludes 'All projects'", () => {
      expect(formatFilterContext({ projectName: "All projects" })).toBe("No filters applied");
    });

    it("includes date range", () => {
      const result = formatFilterContext({ dateFrom: "2026-01-01", dateTo: "2026-12-31" });
      expect(result).toContain("From: 2026-01-01");
      expect(result).toContain("To: 2026-12-31");
    });

    it("includes department", () => {
      expect(formatFilterContext({ department: "camera" })).toContain("Department: camera");
    });

    it("excludes 'all' department", () => {
      expect(formatFilterContext({ department: "all" })).toBe("No filters applied");
    });

    it("includes status", () => {
      expect(formatFilterContext({ status: "active" })).toContain("Status: active");
    });

    it("combines multiple filters", () => {
      const result = formatFilterContext({
        projectName: "Thunderbolt",
        dateFrom: "2026-01-01",
        department: "camera",
      });
      expect(result).toContain("Project: Thunderbolt");
      expect(result).toContain("From: 2026-01-01");
      expect(result).toContain("Department: camera");
      expect(result).toContain(" | ");
    });
  });
});

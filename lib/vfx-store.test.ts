import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpdateAppDataSlice = vi.fn();
const mockGetAppDataSlice = vi.fn();
const mockUseAppDataSlice = vi.fn();

vi.mock("./app-data-store", () => ({
  updateAppDataSlice: (...args: unknown[]) => mockUpdateAppDataSlice(...args),
  getAppDataSlice: (key: string) => mockGetAppDataSlice(key),
  useAppDataSlice: (key: string) => mockUseAppDataSlice(key),
}));

import type { VfxShot, VfxShotStatus } from "./types";
import {
  createVfxShot,
  updateVfxShot,
  deleteVfxShot,
  changeVfxShotStatus,
  advanceVfxShot,
  assignVfxVendor,
  submitVfxVersion,
  reviewVfxVersion,
  calcVfxStats,
  getOverdueVfxShots,
  getLatestVfxVersion,
  VALID_STATUS_TRANSITIONS,
} from "./vfx-store";

function makeShot(overrides: Partial<VfxShot> = {}): VfxShot {
  return {
    id: "vfx-1",
    projectId: "p1",
    shotCode: "VFX-001",
    sequence: "Climax",
    description: "Hero shot with CGI monster",
    vendorId: "DNEG India",
    status: "briefed",
    priority: "high",
    dueDate: "2026-12-01",
    ...overrides,
  };
}

describe("vfx-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createVfxShot", () => {
    it("creates shot with valid input", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = createVfxShot({
        projectId: "p1",
        shotCode: "VFX-002",
        sequence: "Opening",
        description: "Sky replacement",
        status: "briefed",
        priority: "medium",
        dueDate: "2026-11-15",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.shot.shotCode).toBe("VFX-002");
        expect(result.shot.sequence).toBe("Opening");
        expect(result.shot.id).toMatch(/^vfx-/);
      }
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("vfxShots", expect.any(Function));
    });

    it("rejects empty shot code", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = createVfxShot({
        projectId: "p1",
        shotCode: "  ",
        sequence: "Opening",
        description: "Test",
        status: "briefed",
        priority: "medium",
        dueDate: "2026-11-15",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Shot code");
      }
    });

    it("rejects empty description", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = createVfxShot({
        projectId: "p1",
        shotCode: "VFX-002",
        sequence: "Opening",
        description: "",
        status: "briefed",
        priority: "medium",
        dueDate: "2026-11-15",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Description");
      }
    });

    it("rejects missing project reference", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = createVfxShot({
        projectId: "",
        shotCode: "VFX-002",
        sequence: "Opening",
        description: "Test",
        status: "briefed",
        priority: "medium",
        dueDate: "2026-11-15",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Project");
      }
    });

    it("rejects duplicate shot code in same project", () => {
      const existing = makeShot({ shotCode: "VFX-001" });
      mockGetAppDataSlice.mockReturnValue([existing]);

      const result = createVfxShot({
        projectId: "p1",
        shotCode: "VFX-001",
        sequence: "Opening",
        description: "Test",
        status: "briefed",
        priority: "medium",
        dueDate: "2026-11-15",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already exists");
      }
    });

    it("allows same shot code in different project", () => {
      const existing = makeShot({ projectId: "p1", shotCode: "VFX-001" });
      mockGetAppDataSlice.mockReturnValue([existing]);

      const result = createVfxShot({
        projectId: "p2",
        shotCode: "VFX-001",
        sequence: "Opening",
        description: "Test",
        status: "briefed",
        priority: "medium",
        dueDate: "2026-11-15",
      });

      expect(result.success).toBe(true);
    });
  });

  describe("updateVfxShot", () => {
    it("updates shot successfully", () => {
      const existing = makeShot();
      mockGetAppDataSlice.mockReturnValue([existing]);

      const result = updateVfxShot("vfx-1", { priority: "low" });

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalled();
    });

    it("returns error for non-existent shot", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const result = updateVfxShot("non-existent", { priority: "low" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("not found");
      }
    });

    it("rejects duplicate shot code on update", () => {
      const shot1 = makeShot({ id: "vfx-1", shotCode: "VFX-001" });
      const shot2 = makeShot({ id: "vfx-2", shotCode: "VFX-002" });
      mockGetAppDataSlice.mockReturnValue([shot1, shot2]);

      const result = updateVfxShot("vfx-2", { shotCode: "VFX-001" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already exists");
      }
    });
  });

  describe("deleteVfxShot", () => {
    it("deletes non-final shot", () => {
      const shot = makeShot({ status: "in-progress" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = deleteVfxShot("vfx-1");

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("vfxShots", expect.any(Function));
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("vfxVersions", expect.any(Function));
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("vfxReviews", expect.any(Function));
    });

    it("rejects deletion of finalized shot", () => {
      const shot = makeShot({ status: "final" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = deleteVfxShot("vfx-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("finalized");
      }
    });
  });

  describe("changeVfxShotStatus", () => {
    it("allows valid transition briefed -> in-progress", () => {
      const shot = makeShot({ status: "briefed" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = changeVfxShotStatus("vfx-1", "in-progress");

      expect(result.success).toBe(true);
    });

    it("allows valid transition in-progress -> client-review", () => {
      const shot = makeShot({ status: "in-progress" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = changeVfxShotStatus("vfx-1", "client-review");

      expect(result.success).toBe(true);
    });

    it("allows valid transition client-review -> final", () => {
      const shot = makeShot({ status: "client-review" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = changeVfxShotStatus("vfx-1", "final");

      expect(result.success).toBe(true);
    });

    it("allows revision transition client-review -> in-progress", () => {
      const shot = makeShot({ status: "client-review" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = changeVfxShotStatus("vfx-1", "in-progress");

      expect(result.success).toBe(true);
    });

    it("rejects invalid transition briefed -> final", () => {
      const shot = makeShot({ status: "briefed" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = changeVfxShotStatus("vfx-1", "final");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Cannot transition");
      }
    });

    it("rejects invalid transition final -> anywhere", () => {
      const shot = makeShot({ status: "final" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = changeVfxShotStatus("vfx-1", "in-progress");

      expect(result.success).toBe(false);
    });

    it("allows same status (no-op)", () => {
      const shot = makeShot({ status: "in-progress" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = changeVfxShotStatus("vfx-1", "in-progress");

      expect(result.success).toBe(true);
    });
  });

  describe("advanceVfxShot", () => {
    it("advances from briefed to in-progress", () => {
      const shot = makeShot({ status: "briefed" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = advanceVfxShot("vfx-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newStatus).toBe("in-progress");
      }
    });

    it("advances from in-progress to client-review", () => {
      const shot = makeShot({ status: "in-progress" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = advanceVfxShot("vfx-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.newStatus).toBe("client-review");
      }
    });

    it("cannot advance from final", () => {
      const shot = makeShot({ status: "final" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = advanceVfxShot("vfx-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("final");
      }
    });
  });

  describe("assignVfxVendor", () => {
    it("assigns vendor successfully", () => {
      const shot = makeShot();
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = assignVfxVendor("vfx-1", "Makuta VFX");

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalled();
    });

    it("clears vendor with empty string", () => {
      const shot = makeShot({ vendorId: "DNEG" });
      mockGetAppDataSlice.mockReturnValue([shot]);

      const result = assignVfxVendor("vfx-1", "");

      expect(result.success).toBe(true);
    });
  });

  describe("submitVfxVersion", () => {
    it("creates version for briefed shot", () => {
      const shot = makeShot({ status: "briefed" });
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "vfxShots") return [shot];
        if (key === "vfxVersions") return [];
        return [];
      });

      const result = submitVfxVersion("vfx-1", {
        assetReference: "/path/to/render.exr",
        notes: "Initial composite",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.version.versionNumber).toBe(1);
        expect(result.version.status).toBe("submitted");
      }
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("vfxVersions", expect.any(Function));
    });

    it("increments version number correctly", () => {
      const shot = makeShot({ status: "in-progress" });
      const existingVersions = [
        { id: "v1", shotId: "vfx-1", versionNumber: 1 },
        { id: "v2", shotId: "vfx-1", versionNumber: 2 },
      ];
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "vfxShots") return [shot];
        if (key === "vfxVersions") return existingVersions;
        return [];
      });

      const result = submitVfxVersion("vfx-1", { notes: "Version 3" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.version.versionNumber).toBe(3);
      }
    });

    it("rejects version for finalized shot", () => {
      const shot = makeShot({ status: "final" });
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "vfxShots") return [shot];
        return [];
      });

      const result = submitVfxVersion("vfx-1", {});

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("finalized");
      }
    });
  });

  describe("reviewVfxVersion", () => {
    it("approves version and finalizes shot from client-review", () => {
      const shot = makeShot({ status: "client-review" });
      const version = {
        id: "ver-1",
        shotId: "vfx-1",
        versionNumber: 1,
        status: "submitted",
      };
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "vfxVersions") return [version];
        if (key === "vfxShots") return [shot];
        return [];
      });

      const result = reviewVfxVersion("ver-1", "approved", "director", "Perfect!");

      expect(result.success).toBe(true);
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("vfxVersions", expect.any(Function));
      expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("vfxReviews", expect.any(Function));
    });

    it("requests revision and moves shot back to in-progress", () => {
      const shot = makeShot({ status: "client-review" });
      const version = {
        id: "ver-1",
        shotId: "vfx-1",
        versionNumber: 1,
        status: "submitted",
      };
      mockGetAppDataSlice.mockImplementation((key) => {
        if (key === "vfxVersions") return [version];
        if (key === "vfxShots") return [shot];
        return [];
      });

      const result = reviewVfxVersion("ver-1", "revision-required", "director", "More smoke needed");

      expect(result.success).toBe(true);
    });

    it("rejects review of already-rejected version", () => {
      const version = {
        id: "ver-1",
        shotId: "vfx-1",
        versionNumber: 1,
        status: "rejected",
      };
      mockGetAppDataSlice.mockReturnValue([version]);

      const result = reviewVfxVersion("ver-1", "approved");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Cannot review");
      }
    });

    it("rejects review of superseded version", () => {
      const version = {
        id: "ver-1",
        shotId: "vfx-1",
        versionNumber: 1,
        status: "superseded",
      };
      mockGetAppDataSlice.mockReturnValue([version]);

      const result = reviewVfxVersion("ver-1", "approved");

      expect(result.success).toBe(false);
    });
  });

  describe("calcVfxStats", () => {
    it("calculates statistics correctly", () => {
      const today = new Date().toISOString().slice(0, 10);
      const pastDate = "2020-01-01";
      const futureDate = "2030-12-31";

      const shots: VfxShot[] = [
        makeShot({ id: "1", status: "briefed", priority: "high", dueDate: futureDate, vendorId: "DNEG" }),
        makeShot({ id: "2", status: "in-progress", priority: "high", dueDate: pastDate, vendorId: "DNEG" }),
        makeShot({ id: "3", status: "client-review", priority: "medium", dueDate: futureDate, vendorId: "Makuta" }),
        makeShot({ id: "4", status: "final", priority: "low", dueDate: pastDate, vendorId: undefined }),
        makeShot({ id: "5", status: "in-progress", priority: "medium", dueDate: futureDate, vendorId: "DNEG" }),
      ];

      const stats = calcVfxStats(shots);

      expect(stats.total).toBe(5);
      expect(stats.briefed).toBe(1);
      expect(stats.inProgress).toBe(2);
      expect(stats.inReview).toBe(1);
      expect(stats.final).toBe(1);
      expect(stats.overdue).toBe(1); // shot 2 is overdue (not final, past due date)
      expect(stats.highPriority).toBe(2); // shots 1 and 2 are high priority and not final
      expect(stats.byVendor["DNEG"]).toBe(3);
      expect(stats.byVendor["Makuta"]).toBe(1);
      expect(stats.byVendor["Unassigned"]).toBe(1);
    });
  });

  describe("getOverdueVfxShots", () => {
    it("returns only overdue non-final shots", () => {
      const pastDate = "2020-01-01";
      const futureDate = "2030-12-31";

      const shots: VfxShot[] = [
        makeShot({ id: "1", status: "briefed", dueDate: pastDate }),
        makeShot({ id: "2", status: "final", dueDate: pastDate }),
        makeShot({ id: "3", status: "in-progress", dueDate: futureDate }),
      ];
      mockGetAppDataSlice.mockReturnValue(shots);

      const overdue = getOverdueVfxShots();

      expect(overdue).toHaveLength(1);
      expect(overdue[0].id).toBe("1");
    });

    it("filters by project", () => {
      const pastDate = "2020-01-01";

      const shots: VfxShot[] = [
        makeShot({ id: "1", projectId: "p1", status: "briefed", dueDate: pastDate }),
        makeShot({ id: "2", projectId: "p2", status: "briefed", dueDate: pastDate }),
      ];
      mockGetAppDataSlice.mockReturnValue(shots);

      const overdue = getOverdueVfxShots("p1");

      expect(overdue).toHaveLength(1);
      expect(overdue[0].projectId).toBe("p1");
    });
  });

  describe("getLatestVfxVersion", () => {
    it("returns version with highest number", () => {
      const versions = [
        { id: "v1", shotId: "vfx-1", versionNumber: 1 },
        { id: "v3", shotId: "vfx-1", versionNumber: 3 },
        { id: "v2", shotId: "vfx-1", versionNumber: 2 },
      ];
      mockGetAppDataSlice.mockReturnValue(versions);

      const latest = getLatestVfxVersion("vfx-1");

      expect(latest?.versionNumber).toBe(3);
    });

    it("returns undefined for shot with no versions", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      const latest = getLatestVfxVersion("vfx-1");

      expect(latest).toBeUndefined();
    });
  });

  describe("VALID_STATUS_TRANSITIONS", () => {
    it("defines correct transitions", () => {
      expect(VALID_STATUS_TRANSITIONS["briefed"]).toEqual(["in-progress"]);
      expect(VALID_STATUS_TRANSITIONS["in-progress"]).toEqual(["client-review", "briefed"]);
      expect(VALID_STATUS_TRANSITIONS["client-review"]).toEqual(["final", "in-progress"]);
      expect(VALID_STATUS_TRANSITIONS["final"]).toEqual([]);
    });
  });
});

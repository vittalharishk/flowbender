import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpdateAppDataSlice = vi.fn();
const mockGetAppDataSlice = vi.fn();
const mockUseAppDataSlice = vi.fn();

vi.mock("./app-data-store", () => ({
  updateAppDataSlice: (...args: unknown[]) => mockUpdateAppDataSlice(...args),
  getAppDataSlice: (key: string) => mockGetAppDataSlice(key),
  useAppDataSlice: (key: string) => mockUseAppDataSlice(key),
}));

import type { CameraCard, StorageDevice, FootageMetadata } from "./types";
import {
  createCameraCard,
  updateCameraCard,
  deleteCameraCard,
  createStorageDevice,
  updateStorageDevice,
  deleteStorageDevice,
  createFootage,
  updateFootage,
  deleteFootage,
  createMediaAsset,
  updateMediaAsset,
  createMediaVersion,
  reviewMediaVersion,
  archiveMediaAsset,
  calcMediaStats,
} from "./media-store";

function makeCard(overrides: Partial<CameraCard> = {}): CameraCard {
  return {
    id: "card-1",
    projectId: "p1",
    cardId: "CFast-001",
    capacity: 512,
    available: 128,
    format: "RAW",
    shootDate: "2026-11-01",
    status: "active",
    shootCount: 30,
    backupStatus: "verified",
    location: "DIT Cart",
    ...overrides,
  };
}

function makeStorage(overrides: Partial<StorageDevice> = {}): StorageDevice {
  return {
    id: "stor-1",
    projectId: "p1",
    deviceId: "SSD-001",
    type: "SSD",
    capacity: 4000,
    used: 2400,
    status: "active",
    location: "Edit Suite",
    content: ["Raw Footage", "Proxies"],
    lastVerified: "2026-11-01",
    redundancy: true,
    ...overrides,
  };
}

function makeFootage(overrides: Partial<FootageMetadata> = {}): FootageMetadata {
  return {
    id: "ft-1",
    projectId: "p1",
    sceneId: "SC-101",
    takeNumber: 1,
    duration: 180,
    format: "RED R3D",
    resolution: "8K",
    fps: 24,
    codecs: "REDCODE RAW",
    storedOn: ["SSD-001", "NAS-001"],
    status: "synced",
    shootDate: "2026-11-01",
    ...overrides,
  };
}

describe("media-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Camera Cards", () => {
    describe("createCameraCard", () => {
      it("creates card with valid input", () => {
        mockGetAppDataSlice.mockReturnValue([]);

        const result = createCameraCard({
          projectId: "p1",
          cardId: "CFast-002",
          capacity: 256,
          available: 64,
          format: "RAW",
          shootDate: "2026-11-01",
          status: "active",
          shootCount: 20,
          backupStatus: "pending",
          location: "On Set",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.card.cardId).toBe("CFast-002");
          expect(result.card.id).toMatch(/^card-/);
        }
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("cameraCards", expect.any(Function));
      });

      it("rejects empty card ID", () => {
        const result = createCameraCard({
          projectId: "p1",
          cardId: "",
          capacity: 256,
          available: 64,
          format: "RAW",
          shootDate: "2026-11-01",
          status: "active",
          shootCount: 20,
          backupStatus: "pending",
          location: "On Set",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Card ID");
        }
      });

      it("rejects negative capacity", () => {
        const result = createCameraCard({
          projectId: "p1",
          cardId: "CFast-002",
          capacity: -100,
          available: 64,
          format: "RAW",
          shootDate: "2026-11-01",
          status: "active",
          shootCount: 20,
          backupStatus: "pending",
          location: "On Set",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("positive");
        }
      });

      it("rejects NaN capacity", () => {
        const result = createCameraCard({
          projectId: "p1",
          cardId: "CFast-002",
          capacity: NaN,
          available: 64,
          format: "RAW",
          shootDate: "2026-11-01",
          status: "active",
          shootCount: 20,
          backupStatus: "pending",
          location: "On Set",
        });

        expect(result.success).toBe(false);
      });

      it("rejects missing project reference", () => {
        const result = createCameraCard({
          projectId: "",
          cardId: "CFast-002",
          capacity: 256,
          available: 64,
          format: "RAW",
          shootDate: "2026-11-01",
          status: "active",
          shootCount: 20,
          backupStatus: "pending",
          location: "On Set",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Project");
        }
      });
    });

    describe("updateCameraCard", () => {
      it("updates card successfully", () => {
        const existing = makeCard();
        mockGetAppDataSlice.mockReturnValue([existing]);

        const result = updateCameraCard("card-1", { location: "Vault" });

        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalled();
      });

      it("returns error for non-existent card", () => {
        mockGetAppDataSlice.mockReturnValue([]);

        const result = updateCameraCard("non-existent", { location: "Vault" });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("not found");
        }
      });
    });

    describe("deleteCameraCard", () => {
      it("deletes card successfully", () => {
        const existing = makeCard();
        mockGetAppDataSlice.mockReturnValue([existing]);

        const result = deleteCameraCard("card-1");

        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("cameraCards", expect.any(Function));
      });
    });
  });

  describe("Storage Devices", () => {
    describe("createStorageDevice", () => {
      it("creates device with valid input", () => {
        mockGetAppDataSlice.mockReturnValue([]);

        const result = createStorageDevice({
          projectId: "p1",
          deviceId: "NAS-001",
          type: "NAS",
          capacity: 16000,
          used: 8000,
          status: "active",
          location: "Server Room",
          content: ["Working Proxies"],
          lastVerified: "2026-11-01",
          redundancy: true,
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.device.deviceId).toBe("NAS-001");
        }
      });

      it("rejects negative used space", () => {
        const result = createStorageDevice({
          projectId: "p1",
          deviceId: "SSD-002",
          type: "SSD",
          capacity: 4000,
          used: -100,
          status: "active",
          location: "Edit Suite",
          content: [],
          lastVerified: "2026-11-01",
          redundancy: false,
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("non-negative");
        }
      });
    });

    describe("updateStorageDevice", () => {
      it("updates device successfully", () => {
        const existing = makeStorage();
        mockGetAppDataSlice.mockReturnValue([existing]);

        const result = updateStorageDevice("stor-1", { used: 3000 });

        expect(result.success).toBe(true);
      });
    });

    describe("deleteStorageDevice", () => {
      it("deletes device successfully", () => {
        const existing = makeStorage();
        mockGetAppDataSlice.mockReturnValue([existing]);

        const result = deleteStorageDevice("stor-1");

        expect(result.success).toBe(true);
      });
    });
  });

  describe("Footage Metadata", () => {
    describe("createFootage", () => {
      it("creates footage with valid input", () => {
        mockGetAppDataSlice.mockReturnValue([]);

        const result = createFootage({
          projectId: "p1",
          sceneId: "SC-102",
          takeNumber: 3,
          duration: 240,
          format: "ProRes 4444",
          resolution: "4K",
          fps: 24,
          codecs: "Apple ProRes",
          storedOn: ["SSD-001"],
          status: "raw",
          shootDate: "2026-11-01",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.footage.sceneId).toBe("SC-102");
          expect(result.footage.takeNumber).toBe(3);
        }
      });

      it("rejects zero duration", () => {
        const result = createFootage({
          projectId: "p1",
          sceneId: "SC-102",
          takeNumber: 1,
          duration: 0,
          format: "ProRes",
          resolution: "4K",
          fps: 24,
          codecs: "Apple ProRes",
          storedOn: [],
          status: "raw",
          shootDate: "2026-11-01",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("positive");
        }
      });

      it("rejects invalid take number", () => {
        const result = createFootage({
          projectId: "p1",
          sceneId: "SC-102",
          takeNumber: 0,
          duration: 180,
          format: "ProRes",
          resolution: "4K",
          fps: 24,
          codecs: "Apple ProRes",
          storedOn: [],
          status: "raw",
          shootDate: "2026-11-01",
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("positive");
        }
      });
    });

    describe("updateFootage", () => {
      it("updates footage successfully", () => {
        const existing = makeFootage();
        mockGetAppDataSlice.mockReturnValue([existing]);

        const result = updateFootage("ft-1", { status: "synced" });

        expect(result.success).toBe(true);
      });
    });

    describe("deleteFootage", () => {
      it("deletes footage successfully", () => {
        const existing = makeFootage();
        mockGetAppDataSlice.mockReturnValue([existing]);

        const result = deleteFootage("ft-1");

        expect(result.success).toBe(true);
      });
    });
  });

  describe("Media Assets", () => {
    describe("createMediaAsset", () => {
      it("creates asset with valid input", () => {
        mockGetAppDataSlice.mockReturnValue([]);

        const result = createMediaAsset({
          projectId: "p1",
          title: "Scene 101 Take 5",
          mediaType: "video",
          status: "registered",
          tags: ["dailies", "scene-101"],
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.asset.title).toBe("Scene 101 Take 5");
          expect(result.asset.currentVersion).toBe(1);
        }
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("mediaAssets", expect.any(Function));
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("mediaVersions", expect.any(Function));
      });

      it("rejects empty title", () => {
        const result = createMediaAsset({
          projectId: "p1",
          title: "  ",
          mediaType: "video",
          status: "registered",
          tags: [],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Title");
        }
      });

      it("rejects missing media type", () => {
        const result = createMediaAsset({
          projectId: "p1",
          title: "Test Asset",
          mediaType: "" as any,
          status: "registered",
          tags: [],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Media type");
        }
      });
    });

    describe("updateMediaAsset", () => {
      it("updates asset successfully", () => {
        const asset = {
          id: "media-1",
          projectId: "p1",
          title: "Test Asset",
          mediaType: "video",
          status: "registered",
          currentVersion: 1,
          tags: [],
          uploadedAt: "2026-11-01T00:00:00Z",
          updatedAt: "2026-11-01T00:00:00Z",
        };
        mockGetAppDataSlice.mockReturnValue([asset]);

        const result = updateMediaAsset("media-1", { status: "in-review" });

        expect(result.success).toBe(true);
      });
    });

    describe("createMediaVersion", () => {
      it("creates new version and supersedes previous", () => {
        const asset = {
          id: "media-1",
          projectId: "p1",
          title: "Test Asset",
          mediaType: "video",
          status: "registered",
          currentVersion: 1,
          tags: [],
          uploadedAt: "2026-11-01T00:00:00Z",
          updatedAt: "2026-11-01T00:00:00Z",
        };
        const existingVersion = {
          id: "ver-1",
          assetId: "media-1",
          versionNumber: 1,
          status: "active",
          createdAt: "2026-11-01T00:00:00Z",
        };
        mockGetAppDataSlice.mockImplementation((key) => {
          if (key === "mediaAssets") return [asset];
          if (key === "mediaVersions") return [existingVersion];
          return [];
        });

        const result = createMediaVersion("media-1", {
          fileReference: "/path/to/new/version.mov",
          notes: "Updated color grade",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.version.versionNumber).toBe(2);
          expect(result.version.status).toBe("active");
        }
      });

      it("returns error for non-existent asset", () => {
        mockGetAppDataSlice.mockReturnValue([]);

        const result = createMediaVersion("non-existent", {});

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("not found");
        }
      });
    });

    describe("reviewMediaVersion", () => {
      it("approves version and updates asset status", () => {
        const version = {
          id: "ver-1",
          assetId: "media-1",
          versionNumber: 1,
          status: "active",
          createdAt: "2026-11-01T00:00:00Z",
        };
        const asset = {
          id: "media-1",
          projectId: "p1",
          title: "Test Asset",
          status: "in-review",
        };
        mockGetAppDataSlice.mockImplementation((key) => {
          if (key === "mediaVersions") return [version];
          if (key === "mediaAssets") return [asset];
          return [];
        });

        const result = reviewMediaVersion("ver-1", "approved", "reviewer-1", "Looks good");

        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("mediaVersions", expect.any(Function));
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("mediaAssets", expect.any(Function));
      });

      it("rejects review of rejected version", () => {
        const version = {
          id: "ver-1",
          assetId: "media-1",
          versionNumber: 1,
          status: "rejected",
          createdAt: "2026-11-01T00:00:00Z",
        };
        mockGetAppDataSlice.mockReturnValue([version]);

        const result = reviewMediaVersion("ver-1", "approved");

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain("Cannot review");
        }
      });
    });

    describe("archiveMediaAsset", () => {
      it("archives asset", () => {
        const asset = {
          id: "media-1",
          projectId: "p1",
          title: "Test Asset",
          mediaType: "video",
          status: "approved",
          currentVersion: 1,
          tags: [],
          uploadedAt: "2026-11-01T00:00:00Z",
          updatedAt: "2026-11-01T00:00:00Z",
        };
        mockGetAppDataSlice.mockReturnValue([asset]);

        const result = archiveMediaAsset("media-1");

        expect(result.success).toBe(true);
      });
    });
  });

  describe("calcMediaStats", () => {
    it("calculates statistics correctly", () => {
      const cards: CameraCard[] = [
        makeCard({ id: "1", status: "active" }),
        makeCard({ id: "2", status: "verified" }),
        makeCard({ id: "3", status: "active" }),
      ];
      const storage: StorageDevice[] = [
        makeStorage({ id: "1", capacity: 4000, used: 2000 }),
        makeStorage({ id: "2", capacity: 8000, used: 6000 }),
      ];
      const footage: FootageMetadata[] = [
        makeFootage({ id: "1", status: "synced" }),
        makeFootage({ id: "2", status: "raw" }),
        makeFootage({ id: "3", status: "synced" }),
      ];

      const stats = calcMediaStats(cards, storage, footage);

      expect(stats.cards.total).toBe(3);
      expect(stats.cards.active).toBe(2);
      expect(stats.cards.verified).toBe(1);
      expect(stats.storage.devices).toBe(2);
      expect(stats.storage.capacityGB).toBe(12000);
      expect(stats.storage.usedGB).toBe(8000);
      expect(stats.storage.usagePercent).toBe(67);
      expect(stats.footage.total).toBe(3);
      expect(stats.footage.synced).toBe(2);
    });
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";

const mockUpdateAppDataSlice = vi.fn();
const mockGetAppDataSlice = vi.fn();
const mockUseAppDataSlice = vi.fn();

vi.mock("./app-data-store", () => ({
  updateAppDataSlice: (...args: unknown[]) => mockUpdateAppDataSlice(...args),
  getAppDataSlice: (key: string) => mockGetAppDataSlice(key),
  useAppDataSlice: (key: string) => mockUseAppDataSlice(key),
}));

import type { RightsDeal, DistributionAgreement, DistributionRelease, DistributionRevenue } from "./types";
import {
  createRightsDeal,
  updateRightsDeal,
  deleteRightsDeal,
  createAgreement,
  updateAgreement,
  changeAgreementStatus,
  deleteAgreement,
  VALID_AGREEMENT_TRANSITIONS,
  createRelease,
  updateRelease,
  changeReleaseStatus,
  VALID_RELEASE_TRANSITIONS,
  createRevenue,
  updateRevenue,
  updateCollectionStatus,
  createSettlement,
  updateSettlement,
  updateDeliverableStatus,
  calcDistributionStats,
} from "./distribution-store";

function makeDeal(overrides: Partial<RightsDeal> = {}): RightsDeal {
  return {
    id: "rd-1",
    projectId: "p1",
    territory: "North India",
    distributor: "AA Films",
    rightsType: "theatrical",
    status: "open",
    minimumGuarantee: 1000000,
    advanceReceived: 500000,
    deliveryStatus: "pending",
    ...overrides,
  };
}

function makeAgreement(overrides: Partial<DistributionAgreement> = {}): DistributionAgreement {
  return {
    id: "dagr-1",
    projectId: "p1",
    distributorName: "Netflix India",
    channel: "digital-ott",
    territories: ["India", "Southeast Asia"],
    agreementValue: 5000000,
    advancePaid: 1000000,
    startDate: "2026-01-01",
    endDate: "2028-12-31",
    status: "draft",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeRelease(overrides: Partial<DistributionRelease> = {}): DistributionRelease {
  return {
    id: "drel-1",
    projectId: "p1",
    title: "Theatrical Release India",
    channel: "theatrical",
    territory: "India",
    plannedDate: "2027-01-15",
    status: "planned",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeRevenue(overrides: Partial<DistributionRevenue> = {}): DistributionRevenue {
  return {
    id: "drev-1",
    projectId: "p1",
    revenueType: "advance",
    amount: 2000000,
    status: "pending",
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("distribution-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Rights Deals ──────────────────────────────────────────────────────────

  describe("Rights Deals", () => {
    describe("createRightsDeal", () => {
      it("creates deal with valid input", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = createRightsDeal({
          projectId: "p1",
          territory: "South India",
          distributor: "Saffron Films",
          rightsType: "theatrical",
          status: "open",
          minimumGuarantee: 5000000,
          advanceReceived: 1000000,
          deliveryStatus: "pending",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.deal.territory).toBe("South India");
          expect(result.deal.id).toMatch(/^rights-/);
        }
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("rightsDeals", expect.any(Function));
      });

      it("rejects empty territory", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = createRightsDeal({
          projectId: "p1", territory: "  ", distributor: "X",
          rightsType: "theatrical", status: "open", minimumGuarantee: 0, advanceReceived: 0, deliveryStatus: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Territory");
      });

      it("rejects empty distributor", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = createRightsDeal({
          projectId: "p1", territory: "India", distributor: "",
          rightsType: "theatrical", status: "open", minimumGuarantee: 0, advanceReceived: 0, deliveryStatus: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Distributor");
      });

      it("rejects empty project", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = createRightsDeal({
          projectId: "", territory: "India", distributor: "X",
          rightsType: "theatrical", status: "open", minimumGuarantee: 0, advanceReceived: 0, deliveryStatus: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Project");
      });

      it("rejects negative minimum guarantee", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = createRightsDeal({
          projectId: "p1", territory: "India", distributor: "X",
          rightsType: "theatrical", status: "open", minimumGuarantee: -100, advanceReceived: 0, deliveryStatus: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("non-negative");
      });

      it("rejects negative advance", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = createRightsDeal({
          projectId: "p1", territory: "India", distributor: "X",
          rightsType: "theatrical", status: "open", minimumGuarantee: 1000, advanceReceived: -1, deliveryStatus: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("non-negative");
      });

      it("rejects advance exceeding minimum guarantee", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = createRightsDeal({
          projectId: "p1", territory: "India", distributor: "X",
          rightsType: "theatrical", status: "open", minimumGuarantee: 1000, advanceReceived: 2000, deliveryStatus: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("exceed");
      });

      it("rejects duplicate active rights in same project", () => {
        const existing = makeDeal({ territory: "North India", rightsType: "theatrical", status: "open" });
        mockGetAppDataSlice.mockReturnValue([existing]);
        const result = createRightsDeal({
          projectId: "p1", territory: "North India", distributor: "New Dist",
          rightsType: "theatrical", status: "open", minimumGuarantee: 0, advanceReceived: 0, deliveryStatus: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("already exist");
      });

      it("allows same territory in different project", () => {
        const existing = makeDeal({ projectId: "p1", territory: "North India", rightsType: "theatrical" });
        mockGetAppDataSlice.mockReturnValue([existing]);
        const result = createRightsDeal({
          projectId: "p2", territory: "North India", distributor: "Other",
          rightsType: "theatrical", status: "open", minimumGuarantee: 0, advanceReceived: 0, deliveryStatus: "pending",
        });
        expect(result.success).toBe(true);
      });

      it("allows same territory+project with different rights type", () => {
        const existing = makeDeal({ territory: "North India", rightsType: "theatrical" });
        mockGetAppDataSlice.mockReturnValue([existing]);
        const result = createRightsDeal({
          projectId: "p1", territory: "North India", distributor: "Digital Co",
          rightsType: "digital", status: "open", minimumGuarantee: 0, advanceReceived: 0, deliveryStatus: "pending",
        });
        expect(result.success).toBe(true);
      });
    });

    describe("updateRightsDeal", () => {
      it("updates deal successfully", () => {
        const deal = makeDeal();
        mockGetAppDataSlice.mockReturnValue([deal]);
        const result = updateRightsDeal("rd-1", { distributor: "New Distributor" });
        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalled();
      });

      it("returns error for non-existent deal", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = updateRightsDeal("non-existent", { distributor: "X" });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("not found");
      });
    });

    describe("deleteRightsDeal", () => {
      it("deletes non-signed deal", () => {
        const deal = makeDeal({ status: "open" });
        mockGetAppDataSlice.mockReturnValue([deal]);
        const result = deleteRightsDeal("rd-1");
        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("rightsDeals", expect.any(Function));
      });

      it("rejects deletion of signed deal", () => {
        const deal = makeDeal({ status: "signed" });
        mockGetAppDataSlice.mockReturnValue([deal]);
        const result = deleteRightsDeal("rd-1");
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("signed");
      });
    });
  });

  // ── Distribution Agreements ───────────────────────────────────────────────

  describe("Distribution Agreements", () => {
    describe("createAgreement", () => {
      it("creates agreement with valid input", () => {
        const result = createAgreement({
          projectId: "p1",
          distributorName: "Netflix India",
          channel: "digital-ott",
          territories: ["India"],
          agreementValue: 5000000,
          advancePaid: 1000000,
          startDate: "2026-01-01",
          endDate: "2028-12-31",
          status: "draft",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.agreement.distributorName).toBe("Netflix India");
          expect(result.agreement.id).toMatch(/^dagr-/);
          expect(result.agreement.createdAt).toBeTruthy();
        }
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("distributionAgreements", expect.any(Function));
      });

      it("rejects empty distributor name", () => {
        const result = createAgreement({
          projectId: "p1", distributorName: "  ", channel: "digital-ott",
          territories: ["India"], agreementValue: 0, advancePaid: 0,
          startDate: "2026-01-01", endDate: "2028-12-31", status: "draft",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Distributor name");
      });

      it("rejects missing channel", () => {
        const result = createAgreement({
          projectId: "p1", distributorName: "Netflix", channel: "" as any,
          territories: ["India"], agreementValue: 0, advancePaid: 0,
          startDate: "2026-01-01", endDate: "2028-12-31", status: "draft",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("channel");
      });

      it("rejects empty territories", () => {
        const result = createAgreement({
          projectId: "p1", distributorName: "Netflix", channel: "digital-ott",
          territories: [], agreementValue: 0, advancePaid: 0,
          startDate: "2026-01-01", endDate: "2028-12-31", status: "draft",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("territory");
      });

      it("rejects negative agreement value", () => {
        const result = createAgreement({
          projectId: "p1", distributorName: "Netflix", channel: "digital-ott",
          territories: ["India"], agreementValue: -100, advancePaid: 0,
          startDate: "2026-01-01", endDate: "2028-12-31", status: "draft",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("non-negative");
      });

      it("rejects start date after end date", () => {
        const result = createAgreement({
          projectId: "p1", distributorName: "Netflix", channel: "digital-ott",
          territories: ["India"], agreementValue: 0, advancePaid: 0,
          startDate: "2029-01-01", endDate: "2028-12-31", status: "draft",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("after end date");
      });
    });

    describe("updateAgreement", () => {
      it("updates agreement successfully", () => {
        const agreement = makeAgreement();
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = updateAgreement("dagr-1", { agreementValue: 7000000 });
        expect(result.success).toBe(true);
      });

      it("returns error for non-existent agreement", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = updateAgreement("non-existent", { agreementValue: 0 });
        expect(result.success).toBe(false);
      });
    });

    describe("changeAgreementStatus", () => {
      it("allows draft → negotiating", () => {
        const agreement = makeAgreement({ status: "draft" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = changeAgreementStatus("dagr-1", "negotiating");
        expect(result.success).toBe(true);
      });

      it("allows negotiating → pending-approval", () => {
        const agreement = makeAgreement({ status: "negotiating" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = changeAgreementStatus("dagr-1", "pending-approval");
        expect(result.success).toBe(true);
      });

      it("allows pending-approval → active", () => {
        const agreement = makeAgreement({ status: "pending-approval" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = changeAgreementStatus("dagr-1", "active");
        expect(result.success).toBe(true);
      });

      it("blocks active → draft", () => {
        const agreement = makeAgreement({ status: "active" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = changeAgreementStatus("dagr-1", "draft");
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Cannot transition");
      });

      it("blocks expired → active", () => {
        const agreement = makeAgreement({ status: "expired" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = changeAgreementStatus("dagr-1", "active");
        expect(result.success).toBe(false);
      });

      it("same status is a no-op success", () => {
        const agreement = makeAgreement({ status: "draft" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = changeAgreementStatus("dagr-1", "draft");
        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).not.toHaveBeenCalled();
      });
    });

    describe("deleteAgreement", () => {
      it("deletes non-active agreement", () => {
        const agreement = makeAgreement({ status: "draft" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = deleteAgreement("dagr-1");
        expect(result.success).toBe(true);
      });

      it("rejects deletion of active agreement", () => {
        const agreement = makeAgreement({ status: "active" });
        mockGetAppDataSlice.mockReturnValue([agreement]);
        const result = deleteAgreement("dagr-1");
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("active");
      });
    });

    describe("VALID_AGREEMENT_TRANSITIONS", () => {
      it("defines correct transitions", () => {
        expect(VALID_AGREEMENT_TRANSITIONS["draft"]).toEqual(["negotiating", "cancelled"]);
        expect(VALID_AGREEMENT_TRANSITIONS["active"]).toEqual(["expired", "terminated"]);
        expect(VALID_AGREEMENT_TRANSITIONS["expired"]).toEqual([]);
        expect(VALID_AGREEMENT_TRANSITIONS["terminated"]).toEqual([]);
        expect(VALID_AGREEMENT_TRANSITIONS["cancelled"]).toEqual([]);
      });
    });
  });

  // ── Releases ──────────────────────────────────────────────────────────────

  describe("Releases", () => {
    describe("createRelease", () => {
      it("creates release with valid input", () => {
        const result = createRelease({
          projectId: "p1",
          title: "Theatrical Release",
          channel: "theatrical",
          territory: "India",
          plannedDate: "2027-01-15",
          status: "planned",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.release.title).toBe("Theatrical Release");
          expect(result.release.id).toMatch(/^drel-/);
        }
      });

      it("rejects empty title", () => {
        const result = createRelease({
          projectId: "p1", title: "", channel: "theatrical",
          territory: "India", plannedDate: "2027-01-15", status: "planned",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("title");
      });

      it("rejects missing channel", () => {
        const result = createRelease({
          projectId: "p1", title: "Test", channel: "" as any,
          territory: "India", plannedDate: "2027-01-15", status: "planned",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("channel");
      });

      it("rejects empty territory", () => {
        const result = createRelease({
          projectId: "p1", title: "Test", channel: "theatrical",
          territory: "  ", plannedDate: "2027-01-15", status: "planned",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Territory");
      });

      it("rejects missing planned date", () => {
        const result = createRelease({
          projectId: "p1", title: "Test", channel: "theatrical",
          territory: "India", plannedDate: "", status: "planned",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Planned date");
      });

      it("rejects window start after window end", () => {
        const result = createRelease({
          projectId: "p1", title: "Test", channel: "theatrical",
          territory: "India", plannedDate: "2027-01-15", status: "planned",
          windowStart: "2027-06-01", windowEnd: "2027-03-01",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Window start");
      });
    });

    describe("changeReleaseStatus", () => {
      it("allows planned → confirmed → released", () => {
        const release = makeRelease({ status: "planned" });
        mockGetAppDataSlice.mockReturnValue([release]);
        expect(changeReleaseStatus("drel-1", "confirmed").success).toBe(true);

        const confirmed = makeRelease({ status: "confirmed" });
        mockGetAppDataSlice.mockReturnValue([confirmed]);
        expect(changeReleaseStatus("drel-1", "released").success).toBe(true);
      });

      it("blocks released → planned", () => {
        const release = makeRelease({ status: "released" });
        mockGetAppDataSlice.mockReturnValue([release]);
        const result = changeReleaseStatus("drel-1", "planned");
        expect(result.success).toBe(false);
      });

      it("same status is no-op", () => {
        const release = makeRelease({ status: "planned" });
        mockGetAppDataSlice.mockReturnValue([release]);
        const result = changeReleaseStatus("drel-1", "planned");
        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).not.toHaveBeenCalled();
      });
    });

    describe("VALID_RELEASE_TRANSITIONS", () => {
      it("defines correct transitions", () => {
        expect(VALID_RELEASE_TRANSITIONS["planned"]).toContain("confirmed");
        expect(VALID_RELEASE_TRANSITIONS["confirmed"]).toContain("released");
        expect(VALID_RELEASE_TRANSITIONS["released"]).toEqual([]);
        expect(VALID_RELEASE_TRANSITIONS["cancelled"]).toEqual([]);
      });
    });
  });

  // ── Revenue & Collections ─────────────────────────────────────────────────

  describe("Revenue & Collections", () => {
    describe("createRevenue", () => {
      it("creates revenue with valid input", () => {
        const result = createRevenue({
          projectId: "p1",
          revenueType: "advance",
          amount: 2000000,
          status: "pending",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.revenue.amount).toBe(2000000);
          expect(result.revenue.id).toMatch(/^drev-/);
        }
      });

      it("rejects missing project", () => {
        const result = createRevenue({
          projectId: "", revenueType: "advance", amount: 100, status: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Project");
      });

      it("rejects missing revenue type", () => {
        const result = createRevenue({
          projectId: "p1", revenueType: "" as any, amount: 100, status: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Revenue type");
      });

      it("rejects negative amount", () => {
        const result = createRevenue({
          projectId: "p1", revenueType: "advance", amount: -500, status: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("non-negative");
      });

      it("rejects NaN amount", () => {
        const result = createRevenue({
          projectId: "p1", revenueType: "advance", amount: NaN, status: "pending",
        });
        expect(result.success).toBe(false);
      });
    });

    describe("updateRevenue", () => {
      it("updates revenue record", () => {
        const rev = makeRevenue();
        mockGetAppDataSlice.mockReturnValue([rev]);
        const result = updateRevenue("drev-1", { amount: 3000000 });
        expect(result.success).toBe(true);
      });

      it("returns error for non-existent record", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = updateRevenue("non-existent", { amount: 0 });
        expect(result.success).toBe(false);
      });
    });

    describe("updateCollectionStatus", () => {
      it("updates collection status", () => {
        const rev = makeRevenue();
        mockGetAppDataSlice.mockReturnValue([rev]);
        const result = updateCollectionStatus("drev-1", "collected");
        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("distributionRevenue", expect.any(Function));
      });

      it("returns error for non-existent revenue", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = updateCollectionStatus("non-existent", "collected");
        expect(result.success).toBe(false);
      });
    });
  });

  // ── Settlements ───────────────────────────────────────────────────────────

  describe("Settlements", () => {
    describe("createSettlement", () => {
      it("creates settlement and auto-calculates netPayable", () => {
        const result = createSettlement({
          projectId: "p1",
          agreementId: "dagr-1",
          grossRevenue: 10000000,
          distributorCommission: 2000000,
          deductions: 500000,
          netPayable: 0,
          settledAmount: 0,
          status: "pending",
        });
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.settlement.netPayable).toBe(7500000);
          expect(result.settlement.id).toMatch(/^dset-/);
        }
      });

      it("rejects missing project", () => {
        const result = createSettlement({
          projectId: "", agreementId: "dagr-1",
          grossRevenue: 100, distributorCommission: 10, deductions: 5,
          netPayable: 0, settledAmount: 0, status: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Project");
      });

      it("rejects missing agreement", () => {
        const result = createSettlement({
          projectId: "p1", agreementId: "",
          grossRevenue: 100, distributorCommission: 10, deductions: 5,
          netPayable: 0, settledAmount: 0, status: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("Agreement");
      });

      it("rejects negative gross revenue", () => {
        const result = createSettlement({
          projectId: "p1", agreementId: "dagr-1",
          grossRevenue: -100, distributorCommission: 0, deductions: 0,
          netPayable: 0, settledAmount: 0, status: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("non-negative");
      });

      it("rejects negative commission", () => {
        const result = createSettlement({
          projectId: "p1", agreementId: "dagr-1",
          grossRevenue: 100, distributorCommission: -10, deductions: 0,
          netPayable: 0, settledAmount: 0, status: "pending",
        });
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("non-negative");
      });
    });

    describe("updateSettlement", () => {
      it("recalculates netPayable on update", () => {
        const settlement = {
          id: "dset-1", projectId: "p1", agreementId: "dagr-1",
          grossRevenue: 10000000, distributorCommission: 2000000, deductions: 500000,
          netPayable: 7500000, settledAmount: 0, status: "pending" as const,
          createdAt: "2026-01-01T00:00:00Z",
        };
        mockGetAppDataSlice.mockReturnValue([settlement]);

        const result = updateSettlement("dset-1", { grossRevenue: 12000000 });
        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalled();
      });

      it("returns error for non-existent settlement", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = updateSettlement("non-existent", { settledAmount: 100 });
        expect(result.success).toBe(false);
      });
    });
  });

  // ── Deliverables ──────────────────────────────────────────────────────────

  describe("Deliverables", () => {
    describe("updateDeliverableStatus", () => {
      it("updates deliverable status", () => {
        const deliverable = { id: "del-1", projectId: "p1", name: "DCP", format: "DCP", territory: "India", status: "pending" as const, dueDate: "2027-01-01" };
        mockGetAppDataSlice.mockReturnValue([deliverable]);
        const result = updateDeliverableStatus("del-1", "delivered");
        expect(result.success).toBe(true);
        expect(mockUpdateAppDataSlice).toHaveBeenCalledWith("deliverables", expect.any(Function));
      });

      it("returns error for non-existent deliverable", () => {
        mockGetAppDataSlice.mockReturnValue([]);
        const result = updateDeliverableStatus("non-existent", "ready");
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain("not found");
      });
    });
  });

  // ── Analytics ─────────────────────────────────────────────────────────────

  describe("calcDistributionStats", () => {
    it("calculates stats with mixed data", () => {
      const deals: RightsDeal[] = [
        makeDeal({ id: "1", status: "signed", territory: "North", rightsType: "theatrical", minimumGuarantee: 1000, advanceReceived: 400 }),
        makeDeal({ id: "2", status: "open", territory: "South", rightsType: "digital", minimumGuarantee: 2000, advanceReceived: 0 }),
        makeDeal({ id: "3", status: "negotiating", territory: "North", rightsType: "satellite", minimumGuarantee: 500, advanceReceived: 100 }),
        makeDeal({ id: "4", status: "closed", territory: "East", rightsType: "theatrical", minimumGuarantee: 300, advanceReceived: 300 }),
      ];

      const stats = calcDistributionStats(deals, [], []);

      expect(stats.totalDeals).toBe(4);
      expect(stats.signedDeals).toBe(1);
      expect(stats.openDeals).toBe(2);
      expect(stats.totalMG).toBe(3800);
      expect(stats.totalAdvance).toBe(800);
      expect(stats.totalReceivable).toBe(3000);
    });

    it("returns zeros for empty data", () => {
      const stats = calcDistributionStats([], [], []);
      expect(stats.totalDeals).toBe(0);
      expect(stats.signedDeals).toBe(0);
      expect(stats.totalMG).toBe(0);
      expect(stats.totalAdvance).toBe(0);
      expect(stats.totalReceivable).toBe(0);
      expect(stats.byTerritory).toEqual({});
      expect(stats.byChannel).toEqual({});
      expect(stats.expiringAgreements).toEqual([]);
      expect(stats.overdueCollections).toEqual([]);
    });

    it("groups by territory correctly", () => {
      const deals: RightsDeal[] = [
        makeDeal({ id: "1", territory: "North India", minimumGuarantee: 1000, advanceReceived: 200 }),
        makeDeal({ id: "2", territory: "North India", minimumGuarantee: 500, advanceReceived: 100 }),
        makeDeal({ id: "3", territory: "South India", minimumGuarantee: 800, advanceReceived: 400 }),
      ];
      const stats = calcDistributionStats(deals, [], []);
      expect(stats.byTerritory["North India"].count).toBe(2);
      expect(stats.byTerritory["North India"].mg).toBe(1500);
      expect(stats.byTerritory["North India"].advance).toBe(300);
      expect(stats.byTerritory["South India"].count).toBe(1);
    });

    it("groups by channel correctly", () => {
      const deals: RightsDeal[] = [
        makeDeal({ id: "1", rightsType: "theatrical", minimumGuarantee: 1000 }),
        makeDeal({ id: "2", rightsType: "theatrical", minimumGuarantee: 2000 }),
        makeDeal({ id: "3", rightsType: "digital", minimumGuarantee: 500 }),
      ];
      const stats = calcDistributionStats(deals, [], []);
      expect(stats.byChannel["theatrical"].count).toBe(2);
      expect(stats.byChannel["theatrical"].mg).toBe(3000);
      expect(stats.byChannel["digital"].count).toBe(1);
    });

    it("detects overdue collections", () => {
      const revenue: DistributionRevenue[] = [
        makeRevenue({ id: "1", status: "pending", dueDate: "2020-01-01" }),
        makeRevenue({ id: "2", status: "pending", dueDate: "2030-12-31" }),
        makeRevenue({ id: "3", status: "collected", dueDate: "2020-01-01" }),
      ];
      const stats = calcDistributionStats([], [], revenue);
      expect(stats.overdueCollections).toHaveLength(1);
      expect(stats.overdueCollections[0].id).toBe("1");
    });

    it("detects expiring agreements", () => {
      const today = new Date();
      const in15Days = new Date(today.getTime() + 15 * 86400000).toISOString().slice(0, 10);
      const in60Days = new Date(today.getTime() + 60 * 86400000).toISOString().slice(0, 10);

      const agreements: DistributionAgreement[] = [
        makeAgreement({ id: "1", status: "active", endDate: in15Days }),
        makeAgreement({ id: "2", status: "active", endDate: in60Days }),
        makeAgreement({ id: "3", status: "draft", endDate: in15Days }),
      ];
      const stats = calcDistributionStats([], agreements, []);
      expect(stats.expiringAgreements).toHaveLength(1);
      expect(stats.expiringAgreements[0].id).toBe("1");
    });
  });

  // ── Data integrity ────────────────────────────────────────────────────────

  describe("Data integrity", () => {
    it("calcDistributionStats does not mutate source arrays", () => {
      const deals = [makeDeal()];
      const agreements = [makeAgreement()];
      const revenue = [makeRevenue()];
      const dealsCopy = JSON.stringify(deals);
      const agreementsCopy = JSON.stringify(agreements);
      const revenueCopy = JSON.stringify(revenue);

      calcDistributionStats(deals, agreements, revenue);

      expect(JSON.stringify(deals)).toBe(dealsCopy);
      expect(JSON.stringify(agreements)).toBe(agreementsCopy);
      expect(JSON.stringify(revenue)).toBe(revenueCopy);
    });

    it("all create functions handle empty strings gracefully", () => {
      mockGetAppDataSlice.mockReturnValue([]);

      expect(createRightsDeal({
        projectId: "", territory: "", distributor: "",
        rightsType: "theatrical", status: "open", minimumGuarantee: 0, advanceReceived: 0, deliveryStatus: "pending",
      }).success).toBe(false);

      expect(createAgreement({
        projectId: "", distributorName: "", channel: "" as any,
        territories: [], agreementValue: 0, advancePaid: 0,
        startDate: "", endDate: "", status: "draft",
      }).success).toBe(false);

      expect(createRelease({
        projectId: "", title: "", channel: "" as any,
        territory: "", plannedDate: "", status: "planned",
      }).success).toBe(false);

      expect(createRevenue({
        projectId: "", revenueType: "" as any, amount: 0, status: "pending",
      }).success).toBe(false);

      expect(createSettlement({
        projectId: "", agreementId: "",
        grossRevenue: 0, distributorCommission: 0, deductions: 0,
        netPayable: 0, settledAmount: 0, status: "pending",
      }).success).toBe(false);
    });
  });
});

"use client";

import { useMemo } from "react";
import { useModuleSlice, updateModuleSlice, getModuleSlice, seedModuleSlice } from "./module-store";

export interface Investor {
  id: string;
  name: string;
  investorType: string;
  company?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isActive: boolean;
}

export interface InvestorProject {
  id: string;
  investorId: string;
  projectId: string;
  investmentAmount: number;
  committedAmount: number;
  receivedAmount: number;
  returnedAmount: number;
  investmentType: string;
  investmentDate?: string;
  agreementRef?: string;
  status: string;
  notes?: string;
}

export interface InvestmentTransaction {
  id: string;
  investorProjectId: string;
  transactionType: string;
  amount: number;
  transactionDate: string;
  reference?: string;
  notes?: string;
}

export interface Loan {
  id: string;
  projectId?: string;
  lender: string;
  borrower: string;
  principal: number;
  annualInterestRate: number;
  interestMethod: "simple" | "compound";
  compoundingFrequency?: string;
  startDate: string;
  maturityDate: string;
  outstandingPrincipal: number;
  accruedInterest: number;
  paidInterest: number;
  status: string;
  agreementRef?: string;
  collateral?: string;
  notes?: string;
}

export interface LoanRepayment {
  id: string;
  loanId: string;
  paymentDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  reference?: string;
  notes?: string;
}

export interface BrandingDeal {
  id: string;
  projectId: string;
  brand: string;
  placementType: string;
  sceneReference?: string;
  agreementValue: number;
  invoicedAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  status: string;
  agreementRef?: string;
  notes?: string;
}

export interface FundingTranche {
  id: string;
  projectId: string;
  fundingSource: string;
  investorId?: string;
  loanId?: string;
  trancheNumber: number;
  plannedAmount: number;
  approvedAmount: number;
  releasedAmount: number;
  receivedAmount: number;
  releaseConditions?: string;
  plannedReleaseDate?: string;
  actualReleaseDate?: string;
  status: string;
}

export interface OstReceivable {
  id: string;
  projectId: string;
  musicLabel: string;
  agreementRef?: string;
  contractValue: number;
  invoicedAmount: number;
  receivedAmount: number;
  outstandingAmount: number;
  status: string;
  notes?: string;
}

export interface BurnRecord {
  id: string;
  projectId: string;
  department?: string;
  periodStart: string;
  periodEnd: string;
  budget: number;
  actualSpend: number;
  committedSpend: number;
  variance: number;
  forecastCompletionCost?: number;
  notes?: string;
}

// Seed data
const SEED_INVESTORS: Investor[] = [
  { id: "inv-1", name: "Suresh Reddy", investorType: "individual", company: "Reddy Entertainments", email: "suresh@reddy.com", isActive: true },
  { id: "inv-2", name: "Lakshmi Films Pvt Ltd", investorType: "corporate", company: "Lakshmi Films", email: "info@lakshmifilms.com", isActive: true },
];

const SEED_INVESTOR_PROJECTS: InvestorProject[] = [
  { id: "ip-1", investorId: "inv-1", projectId: "p1", investmentAmount: 5000000, committedAmount: 5000000, receivedAmount: 3000000, returnedAmount: 0, investmentType: "equity", investmentDate: "2027-01-15", status: "active" },
  { id: "ip-2", investorId: "inv-2", projectId: "p2", investmentAmount: 8000000, committedAmount: 8000000, receivedAmount: 8000000, returnedAmount: 0, investmentType: "equity", investmentDate: "2027-02-01", status: "received" },
];

const SEED_LOANS: Loan[] = [
  { id: "loan-1", projectId: "p1", lender: "State Bank of India", borrower: "Flowbender Productions", principal: 10000000, annualInterestRate: 12.5, interestMethod: "simple", startDate: "2027-01-01", maturityDate: "2028-01-01", outstandingPrincipal: 8000000, accruedInterest: 250000, paidInterest: 125000, status: "active" },
  { id: "loan-2", projectId: "p3", lender: "HDFC Bank", borrower: "Flowbender Productions", principal: 5000000, annualInterestRate: 11.0, interestMethod: "compound", compoundingFrequency: "quarterly", startDate: "2027-03-01", maturityDate: "2028-03-01", outstandingPrincipal: 5000000, accruedInterest: 0, paidInterest: 0, status: "active" },
];

const SEED_BRANDING: BrandingDeal[] = [
  { id: "brand-1", projectId: "p1", brand: "Royal Enfield", placementType: "hero-vehicle", sceneReference: "Sc-15, Sc-22", agreementValue: 2000000, invoicedAmount: 1000000, receivedAmount: 500000, outstandingAmount: 1500000, status: "active" },
  { id: "brand-2", projectId: "p2", brand: "Tanishq", placementType: "prop-placement", agreementValue: 800000, invoicedAmount: 800000, receivedAmount: 800000, outstandingAmount: 0, status: "completed" },
];

const SEED_TRANCHES: FundingTranche[] = [
  { id: "tr-1", projectId: "p1", fundingSource: "Investor - Suresh Reddy", investorId: "inv-1", trancheNumber: 1, plannedAmount: 3000000, approvedAmount: 3000000, releasedAmount: 3000000, receivedAmount: 3000000, status: "received" },
  { id: "tr-2", projectId: "p1", fundingSource: "Investor - Suresh Reddy", investorId: "inv-1", trancheNumber: 2, plannedAmount: 2000000, approvedAmount: 2000000, releasedAmount: 0, receivedAmount: 0, plannedReleaseDate: "2027-06-01", status: "approved" },
];

const SEED_OST: OstReceivable[] = [
  { id: "ost-1", projectId: "p1", musicLabel: "T-Series", contractValue: 3000000, invoicedAmount: 1500000, receivedAmount: 1000000, outstandingAmount: 2000000, status: "active" },
];

const SEED_BURN: BurnRecord[] = [
  { id: "burn-1", projectId: "p1", department: "Production", periodStart: "2027-01-01", periodEnd: "2027-01-31", budget: 5000000, actualSpend: 4200000, committedSpend: 600000, variance: 200000 },
  { id: "burn-2", projectId: "p1", department: "Post-Production", periodStart: "2027-01-01", periodEnd: "2027-01-31", budget: 2000000, actualSpend: 500000, committedSpend: 300000, variance: 1200000 },
];

export function initBusinessSeedData() {
  seedModuleSlice("investors", SEED_INVESTORS);
  seedModuleSlice("investorProjects", SEED_INVESTOR_PROJECTS);
  seedModuleSlice("loans", SEED_LOANS);
  seedModuleSlice("brandingDeals", SEED_BRANDING);
  seedModuleSlice("fundingTranches", SEED_TRANCHES);
  seedModuleSlice("ostReceivables", SEED_OST);
  seedModuleSlice("burnRecords", SEED_BURN);
}

export function useInvestors(): Investor[] {
  return useModuleSlice<Investor>("investors");
}

export function useInvestorProjects(projectId?: string): InvestorProject[] {
  const all = useModuleSlice<InvestorProject>("investorProjects");
  return useMemo(() => {
    if (!projectId) return all;
    return all.filter((ip) => ip.projectId === projectId);
  }, [all, projectId]);
}

export function useLoans(projectId?: string): Loan[] {
  const all = useModuleSlice<Loan>("loans");
  return useMemo(() => {
    if (!projectId) return all;
    return all.filter((l) => l.projectId === projectId);
  }, [all, projectId]);
}

export function useBrandingDeals(projectId?: string): BrandingDeal[] {
  const all = useModuleSlice<BrandingDeal>("brandingDeals");
  return useMemo(() => {
    if (!projectId) return all;
    return all.filter((d) => d.projectId === projectId);
  }, [all, projectId]);
}

export function useFundingTranches(projectId?: string): FundingTranche[] {
  const all = useModuleSlice<FundingTranche>("fundingTranches");
  return useMemo(() => {
    if (!projectId) return all;
    return all.filter((t) => t.projectId === projectId);
  }, [all, projectId]);
}

export function useOstReceivables(projectId?: string): OstReceivable[] {
  const all = useModuleSlice<OstReceivable>("ostReceivables");
  return useMemo(() => {
    if (!projectId) return all;
    return all.filter((o) => o.projectId === projectId);
  }, [all, projectId]);
}

export function useBurnRecords(projectId?: string): BurnRecord[] {
  const all = useModuleSlice<BurnRecord>("burnRecords");
  return useMemo(() => {
    if (!projectId) return all;
    return all.filter((b) => b.projectId === projectId);
  }, [all, projectId]);
}

export function useBusinessDashboard(projectId?: string) {
  const investors = useInvestorProjects(projectId);
  const loans = useLoans(projectId);
  const branding = useBrandingDeals(projectId);
  const ost = useOstReceivables(projectId);
  const tranches = useFundingTranches(projectId);
  const burn = useBurnRecords(projectId);

  return useMemo(() => ({
    totalInvestors: investors.length,
    investmentCommitted: investors.reduce((s, i) => s + i.committedAmount, 0),
    investmentReceived: investors.reduce((s, i) => s + i.receivedAmount, 0),
    activeLoans: loans.filter((l) => l.status === "active").length,
    outstandingPrincipal: loans.reduce((s, l) => s + l.outstandingPrincipal, 0),
    interestDue: loans.reduce((s, l) => s + l.accruedInterest, 0),
    brandingReceivables: branding.reduce((s, d) => s + d.outstandingAmount, 0),
    ostReceivables: ost.reduce((s, o) => s + o.outstandingAmount, 0),
    tranchesPlanned: tranches.reduce((s, t) => s + t.plannedAmount, 0),
    tranchesReceived: tranches.reduce((s, t) => s + t.receivedAmount, 0),
    totalBurn: burn.reduce((s, b) => s + b.actualSpend, 0),
    totalBudget: burn.reduce((s, b) => s + b.budget, 0),
  }), [investors, loans, branding, ost, tranches, burn]);
}

// CRUD helpers
export function createInvestor(input: Omit<Investor, "id">): Investor {
  const item: Investor = { id: `inv-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<Investor>("investors", (items) => [...items, item]);
  return item;
}

export function createLoan(input: Omit<Loan, "id">): Loan {
  const item: Loan = { id: `loan-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<Loan>("loans", (items) => [...items, item]);
  return item;
}

export function createBrandingDeal(input: Omit<BrandingDeal, "id">): BrandingDeal {
  const item: BrandingDeal = { id: `brand-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<BrandingDeal>("brandingDeals", (items) => [...items, item]);
  return item;
}

export function createFundingTranche(input: Omit<FundingTranche, "id">): FundingTranche {
  const item: FundingTranche = { id: `tr-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<FundingTranche>("fundingTranches", (items) => [...items, item]);
  return item;
}

export function createOstReceivable(input: Omit<OstReceivable, "id">): OstReceivable {
  const item: OstReceivable = { id: `ost-${crypto.randomUUID().slice(0, 8)}`, ...input };
  updateModuleSlice<OstReceivable>("ostReceivables", (items) => [...items, item]);
  return item;
}

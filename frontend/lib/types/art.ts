// ─── Phase 5: Art, Props, Sets & AI Set Extensions ────────────────────────────

export type PropCategory =
  | "furniture" | "decor" | "weapons-armory" | "vehicles-miniatures"
  | "electronic-gadgets" | "books-documents" | "clothing-accessories"
  | "food-consumables" | "tools-equipment" | "art-craft-supplies"
  | "period-props" | "action-props" | "signage-graphics" | "other";

export type PropCondition = "excellent" | "good" | "fair" | "damaged" | "lost" | "under-repair";
export type PropOwnership = "purchased" | "rented" | "borrowed" | "production-made";

export interface PropItem {
  id: string;
  name: string;
  category: PropCategory;
  description?: string;
  imagePlaceholder?: string;
  quantityTotal: number;
  quantityAvailable: number;
  condition: PropCondition;
  ownership: PropOwnership;
  vendorId?: string;
  rentalRecordId?: string;
  purchaseCost: number;
  rentalCostPerDay?: number;
  projectId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type PropTransactionType = "checkout" | "checkin" | "damage-report" | "lost-report" | "return";
export type PropTransactionStatus = "active" | "returned" | "damaged" | "lost";

export interface PropTransaction {
  id: string;
  propItemId: string;
  projectId: string;
  sceneId?: string;
  quantity: number;
  transactionType: PropTransactionType;
  checkedOutBy: string;
  checkoutDate: string;
  expectedReturnDate?: string;
  actualReturnDate?: string;
  conditionOnReturn?: PropCondition;
  status: PropTransactionStatus;
  notes?: string;
  createdAt: string;
}

export type SetStatus =
  | "planned" | "design" | "approved" | "construction"
  | "ready-for-shoot" | "completed" | "dismantled";

export type SetCategory =
  | "interior" | "exterior" | "underwater" | "period" | "contemporary"
  | "sci-fi-futuristic" | "action-stunt" | "miniature" | "green-screen" | "other";

export interface ProductionSet {
  id: string;
  name: string;
  category: SetCategory;
  projectId: string;
  locationId?: string;
  artDirector: string;
  crewMemberId?: string;
  description?: string;
  constructionStartDate?: string;
  constructionEndDate?: string;
  shootStartDate?: string;
  dismantleDate?: string;
  estimatedBudget: number;
  actualCost: number;
  linkedExpenseIds: string[];
  status: SetStatus;
  approvedBy?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SetTask {
  id: string;
  setId: string;
  projectId: string;
  title: string;
  assignedTo: string;
  dueDate?: string;
  completedDate?: string;
  status: "pending" | "in-progress" | "completed" | "blocked";
  notes?: string;
  createdAt: string;
}

export type AISetExtensionStatus =
  | "planned" | "reference-collection" | "concept" | "in-review"
  | "revision" | "approved" | "delivered";

export interface AISetExtensionTask {
  id: string;
  projectId: string;
  vfxShotId?: string;
  sceneId?: string;
  locationId?: string;
  title: string;
  description?: string;
  promptInstructions?: string;
  referencePlaceholders: string[];
  assignedArtist: string;
  crewMemberId?: string;
  status: AISetExtensionStatus;
  reviewNotes?: string;
  deliveryPlaceholder?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AISetExtensionVersion {
  id: string;
  taskId: string;
  versionNumber: number;
  status: AISetExtensionStatus;
  notes?: string;
  reviewedBy?: string;
  createdAt: string;
}

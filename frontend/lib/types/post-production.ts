export type PostProductionStatus =
  | "not-started"
  | "in-progress"
  | "review"
  | "in-review"
  | "approved"
  | "completed"
  | "on-hold"
  | "delayed";

export interface PostProductionItem {
  id: string;
  projectId: string;
  department: string;
  task: string;
  owner: string;
  status: PostProductionStatus;
  progress: number;
  dueDate: string;
  // Extended fields
  description?: string;
  linkedSceneId?: string;
  linkedShotId?: string;
  startDate?: string;
  priority?: "low" | "medium" | "high" | "critical";
  notes?: string;
  approvalHistory?: { action: string; by: string; at: string; notes: string }[];
  completionPercentage?: number;
}

export type PostProdMilestoneStatus = "pending" | "in-progress" | "completed" | "delayed";

export interface PostProdMilestone {
  id: string;
  projectId: string;
  title: string;
  targetDate: string;
  actualDate?: string;
  status: PostProdMilestoneStatus;
  notes: string;
  completedBy?: string;
}

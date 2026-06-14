import { z } from "zod";
import type { JobTask } from "@/db/schema";

// ─── Job Types ────────────────────────────────────────────────────────────────

export const JOB_TYPES = [
  { value: "NEW_CLIENT", label: "New Client" },
  { value: "ANNUAL_REVIEW", label: "Annual Review" },
  { value: "INSURANCE_REVIEW", label: "Insurance Review" },
  { value: "ESTATE_PLANNING", label: "Estate Planning" },
  { value: "INVESTMENT_REVIEW", label: "Investment Review" },
  { value: "MORTGAGE_REVIEW", label: "Mortgage Review" },
  { value: "TAX_PLANNING", label: "Tax Planning" },
  { value: "QUICK_ACTION", label: "Quick Action" },
  { value: "OTHER", label: "Other" },
] as const;

export type JobTypeValue = (typeof JOB_TYPES)[number]["value"];

// ─── Job Stages ───────────────────────────────────────────────────────────────

export const JOB_STAGES: Record<
  JobTypeValue,
  { value: string; label: string }[]
> = {
  NEW_CLIENT: [
    { value: "INITIAL_MEETING", label: "Initial Meeting" },
    { value: "DATA_COLLECTION", label: "Data Collection" },
    { value: "RESEARCH", label: "Research" },
    { value: "STRATEGY", label: "Strategy" },
    { value: "PRESENTATION", label: "Presentation" },
    { value: "IMPLEMENTATION", label: "Implementation" },
    { value: "COMPLETED", label: "Completed" },
  ],
  ANNUAL_REVIEW: [
    { value: "REVIEW_SCHEDULED", label: "Review Scheduled" },
    { value: "DATA_GATHERING", label: "Data Gathering" },
    { value: "ANALYSIS", label: "Analysis" },
    { value: "REVIEW_MEETING", label: "Review Meeting" },
    { value: "IMPLEMENTATION", label: "Implementation" },
    { value: "COMPLETED", label: "Completed" },
  ],
  INSURANCE_REVIEW: [
    { value: "NEEDS_ANALYSIS", label: "Needs Analysis" },
    { value: "RESEARCH", label: "Research" },
    { value: "COMPARISON", label: "Comparison" },
    { value: "PRESENTATION", label: "Presentation" },
    { value: "APPLICATION", label: "Application" },
    { value: "UNDERWRITING", label: "Underwriting" },
    { value: "COMPLETED", label: "Completed" },
  ],
  ESTATE_PLANNING: [
    { value: "INITIAL_CONSULT", label: "Initial Consult" },
    { value: "DATA_COLLECTION", label: "Data Collection" },
    { value: "STRATEGY", label: "Strategy" },
    { value: "LEGAL_REVIEW", label: "Legal Review" },
    { value: "IMPLEMENTATION", label: "Implementation" },
    { value: "COMPLETED", label: "Completed" },
  ],
  INVESTMENT_REVIEW: [
    { value: "PORTFOLIO_REVIEW", label: "Portfolio Review" },
    { value: "RESEARCH", label: "Research" },
    { value: "STRATEGY", label: "Strategy" },
    { value: "PRESENTATION", label: "Presentation" },
    { value: "REBALANCING", label: "Rebalancing" },
    { value: "COMPLETED", label: "Completed" },
  ],
  MORTGAGE_REVIEW: [
    { value: "INITIAL_CONSULT", label: "Initial Consult" },
    { value: "DATA_COLLECTION", label: "Data Collection" },
    { value: "LENDER_RESEARCH", label: "Lender Research" },
    { value: "APPLICATION", label: "Application" },
    { value: "APPROVAL", label: "Approval" },
    { value: "SETTLEMENT", label: "Settlement" },
    { value: "COMPLETED", label: "Completed" },
  ],
  TAX_PLANNING: [
    { value: "DATA_GATHERING", label: "Data Gathering" },
    { value: "ANALYSIS", label: "Analysis" },
    { value: "STRATEGY", label: "Strategy" },
    { value: "PRESENTATION", label: "Presentation" },
    { value: "IMPLEMENTATION", label: "Implementation" },
    { value: "COMPLETED", label: "Completed" },
  ],
  QUICK_ACTION: [
    { value: "TODO", label: "To Do" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "DONE", label: "Done" },
  ],
  OTHER: [
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "COMPLETED", label: "Completed" },
  ],
};

// ─── Default Tasks ────────────────────────────────────────────────────────────

export const DEFAULT_JOB_TASKS: Record<JobTypeValue, string[]> = {
  NEW_CLIENT: [
    "Send welcome email and engagement letter",
    "Collect signed engagement documents",
    "Schedule initial meeting",
    "Gather client data and financial documents",
    "Complete fact find",
    "Research and analyse current situation",
    "Develop financial strategy",
    "Prepare Statement of Advice (SOA)",
    "Present SOA to client",
    "Implement agreed recommendations",
    "Schedule follow-up review",
  ],
  ANNUAL_REVIEW: [
    "Send annual review invitation to client",
    "Collect updated financial information",
    "Review current portfolio performance",
    "Analyse changes in client circumstances",
    "Update risk profile if needed",
    "Prepare review report",
    "Conduct review meeting",
    "Document meeting outcomes",
    "Implement any agreed changes",
    "Schedule next annual review",
  ],
  INSURANCE_REVIEW: [
    "Request current policy schedules from client",
    "Conduct needs analysis",
    "Research available products",
    "Compare policy options",
    "Prepare comparison report",
    "Present recommendations to client",
    "Complete insurance application",
    "Submit application to insurer",
    "Follow up underwriting requirements",
    "Confirm policy issued and document",
  ],
  ESTATE_PLANNING: [
    "Review existing estate documents",
    "Discuss client wishes and objectives",
    "Identify estate planning gaps",
    "Engage solicitor if required",
    "Review beneficiary nominations",
    "Update superannuation nominations",
    "Prepare estate planning strategy",
    "Client approval and sign-off",
    "Implement agreed changes",
    "Document and file all records",
  ],
  INVESTMENT_REVIEW: [
    "Request current investment statements",
    "Review portfolio performance",
    "Benchmark against objectives",
    "Analyse asset allocation",
    "Identify rebalancing requirements",
    "Prepare investment strategy",
    "Present recommendations to client",
    "Client approval of changes",
    "Execute rebalancing transactions",
    "Confirm and document changes",
  ],
  MORTGAGE_REVIEW: [
    "Collect current mortgage details",
    "Review current interest rates",
    "Assess refinancing options",
    "Research lender options",
    "Prepare comparison report",
    "Present options to client",
    "Complete loan application",
    "Submit to lender",
    "Follow up approval process",
    "Coordinate settlement",
    "Confirm and document outcome",
  ],
  TAX_PLANNING: [
    "Collect income and expense information",
    "Review previous year tax return",
    "Identify tax minimisation opportunities",
    "Analyse investment structures",
    "Review super contributions strategy",
    "Prepare tax planning strategy",
    "Present recommendations to client",
    "Client approval",
    "Implement tax strategies",
    "Document and file all records",
  ],
  QUICK_ACTION: [
    "Define the action required",
    "Complete the action",
    "Confirm and document outcome",
  ],
  OTHER: [
    "Define scope and objectives",
    "Gather relevant information",
    "Analyse and prepare recommendations",
    "Present to client",
    "Implement agreed actions",
    "Document outcomes",
  ],
};

// ─── Statuses & Priorities ────────────────────────────────────────────────────

export const JOB_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ON_HOLD", label: "On Hold" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
] as const;

export const JOB_PRIORITIES = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInitialStage(jobType: string): string {
  const stages = JOB_STAGES[jobType as JobTypeValue];
  return stages?.[0]?.value ?? "IN_PROGRESS";
}

export function getStageIndex(jobType: string, stageValue: string): number {
  const stages = JOB_STAGES[jobType as JobTypeValue] ?? [];
  return stages.findIndex((s) => s.value === stageValue);
}

export function jobProgress(tasks: Pick<JobTask, "isCompleted">[]): number {
  if (!tasks.length) return 0;
  const done = tasks.filter((t) => t.isCompleted).length;
  return Math.round((done / tasks.length) * 100);
}

export function jobTypeLabel(value: string): string {
  return JOB_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function jobStatusLabel(value: string): string {
  return JOB_STATUSES.find((s) => s.value === value)?.label ?? value;
}

export function jobPriorityLabel(value: string): string {
  return JOB_PRIORITIES.find((p) => p.value === value)?.label ?? value;
}

// ─── Active Templates ─────────────────────────────────────────────────────────

export const ACTIVE_JOB_SLUGS = ["NEW_CLIENT", "ANNUAL_REVIEW"] as const;

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

export const jobFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  jobType: z.string().min(1, "Job type is required"),
  priority: z.string().min(1, "Priority is required"),
  status: z.string().min(1, "Status is required"),
  description: z.string().optional(),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
});

export type JobFormValues = z.infer<typeof jobFormSchema>;

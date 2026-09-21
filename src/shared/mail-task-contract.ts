import type { TaskDraft } from "./recruitment-task-contract.ts";
export interface ExtractedMailTask {
  mutation: "create" | "update" | "cancel";
  draft: TaskDraft;
  evidence: { field: string; quote: string }[];
}
export interface MailTaskAction extends ExtractedMailTask {
  id: string;
  state: "review" | "confirming" | "confirmed" | "ignored";
  taskId: string | null;
}
export interface MailTaskAnalysis {
  mailId: string;
  revision: number;
  sourceVersion: string;
  createdAt: string;
  method: "model" | "manual";
  actions: MailTaskAction[];
}
export interface MailTaskBatch {
  requestId: string;
  mailId: string;
  hash: string;
  command: unknown;
  actionIds: string[];
  state: "pending" | "committed" | "conflict";
  error: string;
}

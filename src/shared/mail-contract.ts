import type { Zone } from "./schedule-contract.ts";
export interface MailMessage {
  key: string;
  subject: string;
  sender: string;
  receivedAt: string;
  text: string;
  attachment: boolean;
  truncated?: boolean;
}
export interface MailExtraction {
  relevant: boolean;
  action: "create" | "update" | "cancel";
  purpose: "event" | "deadline" | "window";
  company: string;
  role: string;
  kind: "written" | "interview";
  round: string;
  date: string;
  time: string;
  zone: Zone | "";
  location: string;
  url: string;
  evidence: string[];
  uncertainties: string[];
}
export interface MailCandidate {
  id: string;
  account: string;
  subject: string;
  state:
    | "queued"
    | "review"
    | "confirmed"
    | "ignored"
    | "failed"
    | "confirming";
  extraction: MailExtraction | null;
  error: string;
  createdAt: string;
  intent: unknown | null;
}
export class MailError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export const STATUSES = [
  "未投",
  "已投",
  "笔试",
  "面试",
  "Offer",
  "结束",
  "无合适岗位",
] as const;
export type Status = (typeof STATUSES)[number];
export type StatusMap = Record<string, Status>;
export const APPLIED_STATUSES: ReadonlySet<string> = new Set([
  "已投",
  "笔试",
  "面试",
  "Offer",
  "结束",
]);
export type CompanyRow = [
  name: string,
  category: string,
  roles: string,
  city: string,
  code: string,
  alternative: string,
  url: string,
  deadline: string,
  deadlineText: string,
  note: string,
];
export interface StatusResponse {
  statuses: StatusMap;
}
export interface StatusRequest {
  updates: StatusMap;
}

export function isStatus(value: unknown): value is Status {
  return (
    typeof value === "string" && (STATUSES as readonly string[]).includes(value)
  );
}
export function parseStatuses(value: unknown): StatusMap {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid statuses");
  const result: StatusMap = Object.create(null);
  for (const [name, status] of Object.entries(value)) {
    if (!name.trim() || name.length > 200 || !isStatus(status))
      throw new Error("Invalid status entry");
    result[name] = status;
  }
  return result;
}

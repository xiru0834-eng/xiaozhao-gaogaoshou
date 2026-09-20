import { CollectionError, exactKeys, record } from "../shared/collection-contract.ts";
import type { CollectionService } from "./collection-service.ts";

export const isCollectionPath = (path: string) => /^\/api\/(?:sources|source-checks|job-preferences|collection-runs|update-batches|jobs|evidence)(?:\/|$)/.test(path);
export async function collectionRequest(service: CollectionService, path: string, method: string, readBody: () => Promise<unknown>, query = new URLSearchParams()) {
  const { store, preferences } = service;
  if (method === "GET") {
    if (path === "/api/sources") return { sources: service.sources };
    if (path === "/api/job-preferences") return { preferences: await preferences.read() };
    if (path === "/api/collection-runs" || path === "/api/jobs") {
      const offset = Number(query.get("offset") ?? 0), limit = Number(query.get("limit") ?? 100);
      if (!Number.isSafeInteger(offset) || offset < 0 || offset > 100000 || !Number.isInteger(limit) || limit < 1 || limit > 100) throw new CollectionError("VALIDATION", "分页范围不合法。");
      return path === "/api/jobs" ? store.jobs(offset, limit) : { runs: store.runs(offset, limit).map(run => service.viewRun(run)), total: store.runCount() };
    }
    const match = path.match(/^\/api\/(collection-runs|update-batches|evidence)\/([a-zA-Z0-9-]{1,100})$/);
    if (match) {
      if (match[1] === "collection-runs") return { run: service.viewRun(store.run(match[2])) };
      if (match[1] === "evidence") return { document: store.evidence(match[2]) };
      return { run: service.viewRun(store.run(match[2])), candidates: store.candidates(match[2]), revision: store.revision(), catalogRevision: store.catalogRevision() };
    }
  } else if (method === "POST") {
    let input: unknown;
    try { input = await readBody(); } catch { throw new CollectionError("VALIDATION", "请求体不合法或超过限制。"); }
    if (path === "/api/job-preferences") return { preferences: await preferences.save(input) };
    if (path === "/api/collection-runs" || path === "/api/source-checks") {
      if (path === "/api/source-checks" && record(input).mode !== "source_only") throw new CollectionError("VALIDATION", "来源检查不允许模型调用。");
      return { run: await service.start(input) };
    }
    if (path === "/api/update-batches/accept") {
      const value = record(input), prefs = await preferences.read();
      if (Array.isArray(value.candidateIds)) for (const id of value.candidateIds) {
        if (typeof id !== "string") throw new CollectionError("VALIDATION", "候选格式不正确。");
        const candidate = store.candidate(id);
        if (!candidate.accepted && store.run(candidate.runId).preferenceRevision !== prefs.revision) throw new CollectionError("CONFLICT", "偏好已更改，请重新采集评估后入库。", 409);
      }
      return { receipt: store.accept(input) };
    }
    const match = path.match(/^\/api\/collection-runs\/([a-zA-Z0-9-]{1,100})\/cancel$/);
    if (match) { exactKeys(record(input), []); return { run: service.cancel(match[1]) }; }
  } else throw new CollectionError("METHOD", "不支持此操作。", 405);
  throw new CollectionError("NOT_FOUND", "接口不存在。", 404);
}

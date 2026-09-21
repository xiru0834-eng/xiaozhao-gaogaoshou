import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomBytes } from "node:crypto";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { resolve, join, extname, relative, isAbsolute } from "node:path";
import { openDataProfile } from "./data-context.ts";
import { parseStatuses } from "../shared/types.ts";
import { DataError } from "../shared/catalog-contract.ts";
import { ModelError } from "../shared/model-contract.ts";
import { ModelSettings } from "./model-settings.ts";
import { ModelService } from "./model-service.ts";
import type { SecretProtector } from "./model-secrets.ts";
import type { ModelTransport } from "./model-client.ts";
import { CollectionError, type SourceDefinition } from "../shared/collection-contract.ts";
import { SOURCES } from "./source-registry.ts";
import { SourceReader } from "./source-fetch.ts";
import type { SourceTransport } from "./source-wire.ts";
import { PreferencesStore } from "./job-preferences.ts";
import { CollectionService } from "./collection-service.ts";
import { collectionRequest, isCollectionPath } from "./collection-api.ts";
import { ScheduleError } from "../shared/schedule-contract.ts";
import { MailAPI } from "./mail-api.ts";
import { MailError } from "../shared/mail-contract.ts";
import { TaskError } from '../shared/recruitment-task-contract.ts';
import { taskRequest } from './recruitment-task-api.ts';
import { DailyError } from "../shared/daily-contract.ts";
import { DailyService } from "./daily-service.ts";
import { dailyRequest, isDailyPath } from "./daily-api.ts";
import type { SearchTransport } from "./search-deepseek.ts";

export interface ServerOptions {
  dataDir: string;
  webDir: string;
  port: number;
  /** Dependency injection for tests; never exposed through HTTP or CLI flags. */
  modelDependencies?: { secrets?: SecretProtector; transport?: ModelTransport; searchTransport?: SearchTransport };
  collectionDependencies?: { sources?: SourceDefinition[]; transport?: SourceTransport; intervalMs?: number };
  mailDependencies?: { secrets?: SecretProtector };
}
const mime: Record<string, string> = {
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".svg": "image/svg+xml",
};

export async function startServer(options: ServerOptions) {
  const token = randomBytes(32).toString("hex");
  const context = await openDataProfile(options.dataDir);
  const { store, catalog, backups, profile, schedules } = context;
  const model = new ModelService(new ModelSettings(profile.dataDir, options.modelDependencies?.secrets), options.modelDependencies?.transport, options.modelDependencies?.searchTransport);
  let collection: CollectionService;
  try {
    const sources = options.collectionDependencies?.sources ?? [...SOURCES];
    collection = new CollectionService(await catalog.collections(backups, sources), new PreferencesStore(profile.dataDir), sources, model, new SourceReader(options.collectionDependencies));
  } catch (error) { context.close(); throw error; }
  let mail:MailAPI;
  try{mail=new MailAPI(profile.dataDir,schedules,model,options.mailDependencies?.secrets);}catch(error){await collection.close();context.close();throw error;}
  let daily:DailyService;
  try {daily=new DailyService(await catalog.daily(backups,profile.profileId),model,collection,catalog);}
  catch(error){await mail.close();await collection.close();context.close();throw error;}
  let url = "";
  const send = (
    res: ServerResponse,
    status: number,
    data: unknown,
    type = "application/json; charset=utf-8",
  ) => {
    res.writeHead(status, {
      "Content-Type": type,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "no-referrer",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    res.end(Buffer.isBuffer(data) ? data : JSON.stringify(data));
  };
  async function body(req: IncomingMessage, limit = 200000): Promise<unknown> {
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const part of req) {
      const chunk = Buffer.from(part);
      size += chunk.length;
      if (size > limit) throw new Error("Payload too large");
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  }
  let closed = false;
  const server = createServer(async (req, res) => {
    if (closed) {
      send(res, 503, { error: "service stopping" });
      return;
    }
    if (
      req.headers.host !== new URL(url).host ||
      (req.headers.origin && req.headers.origin !== url) ||
      req.headers["sec-fetch-site"] === "cross-site"
    ) {
      send(res, 403, { error: "forbidden" });
      return;
    }
    try {
      const requestUrl = new URL(req.url ?? "/", url);
      const path = requestUrl.pathname;
      const downloadProfile =
        path === "/api/backup"
          ? requestUrl.searchParams.get("profileId")
          : null;
      if (
        (req.headers["x-profile-id"] &&
          req.headers["x-profile-id"] !== profile.profileId) ||
        (downloadProfile && downloadProfile !== profile.profileId)
      ) {
        send(res, 409, {
          error: {
            code: "PROFILE_MISMATCH",
            message:
              "This page belongs to another profile; reopen the workbench.",
          },
        });
        return;
      }
      if (isDailyPath(path)) {
        if(req.headers['x-app-token']!==token || req.headers['x-profile-id']!==profile.profileId){send(res,403,{error:'forbidden'});return;}
        try {const result=await dailyRequest(daily,path,req.method??'',()=>body(req,16000),requestUrl.searchParams);send(res,req.method==='POST'&&path==='/api/discovery-runs'?202:200,{...result,profileId:profile.profileId});}
        catch(error){const failure=error instanceof DailyError?error:new DailyError('LOCAL_ERROR','每日更新操作失败，原有投递记录未改动。',500);send(res,failure.status,{profileId:profile.profileId,error:{code:failure.code,message:failure.message}});}
        return;
      }
      if (path.startsWith('/api/recruitment-')) {
        if(req.headers['x-app-token']!==token||req.headers['x-profile-id']!==profile.profileId){send(res,403,{error:'forbidden'});return;}
        try {let payload:unknown;if(req.method==='POST'){try{payload=await body(req);}catch{throw new TaskError('VALIDATION','任务请求格式无效或超过限制。');}}send(res,200,{profileId:profile.profileId,data:taskRequest(schedules,requestUrl,req.method??'GET',payload)});}
        catch(e){const error=e instanceof TaskError?e:new TaskError('STORAGE_UNAVAILABLE','任务保存未完成，请保留输入并核对记录。',503);send(res,error.status,{profileId:profile.profileId,error:{code:error.code,message:error.message}});}
        return;
      }
      if (path === "/api/schedules") {
        if (req.headers["x-app-token"] !== token || req.headers["x-profile-id"] !== profile.profileId) { send(res,403,{error:"forbidden"});return; }
        try {
          if (req.method === "GET") send(res,200,{...schedules.snapshot(),profileId:profile.profileId});
          else if (req.method === "POST") {
            let value:unknown;try {value=await body(req,40000);}catch {throw new ScheduleError("日程请求格式无效或过长。");}
            send(res,200,{...schedules.mutate(value),profileId:profile.profileId});
          } else send(res,405,{profileId:profile.profileId,error:{message:"不支持的请求方法。"}});
        } catch(error) {send(res,error instanceof ScheduleError?error.status:500,{profileId:profile.profileId,error:{message:error instanceof ScheduleError?error.message:"日程保存失败，内容未确认。请保留输入并重试。"}});}
        return;
      }
      if(path==='/api/mail'){
        if(req.headers['x-app-token']!==token||req.headers['x-profile-id']!==profile.profileId){send(res,403,{error:'forbidden'});return;}
        try{
          if(req.method==='GET')send(res,200,{...await mail.read(),profileId:profile.profileId});
          else if(req.method==='POST'){
            let value:unknown;try{value=await body(req,80000);}catch{throw new MailError('邮件请求无效或内容过长。');}
            send(res,200,{...await mail.act(value),profileId:profile.profileId});
          }else send(res,405,{profileId:profile.profileId,error:{message:'不支持的请求方法。'}});
        }catch(e){send(res,e instanceof MailError||e instanceof ScheduleError||e instanceof TaskError?e.status:500,{profileId:profile.profileId,error:{message:e instanceof MailError||e instanceof ScheduleError||e instanceof TaskError?e.message:'邮件操作失败。请保留输入，检查连接后重试。'}});}
        return;
      }
      if (isCollectionPath(path)) {
        if (req.headers["x-app-token"] !== token || req.headers["x-profile-id"] !== profile.profileId) { send(res, 403, { error: "forbidden" }); return; }
        try {
          const result = await collectionRequest(collection, path, req.method ?? "", () => body(req, 16000), requestUrl.searchParams);
          send(res, req.method === "POST" && ["/api/collection-runs", "/api/source-checks"].includes(path) ? 202 : 200, { ...result, profileId: profile.profileId });
        } catch (error) {
          const failure = error instanceof CollectionError ? error : new CollectionError("LOCAL_ERROR", "本地操作失败，原有投递记录未改动。", 500);
          send(res, failure.status, { profileId: profile.profileId, error: { code: failure.code, message: failure.message } });
        }
        return;
      }
      if (["/api/model-settings", "/api/model-tests", "/api/model-generations"].includes(path)) {
        if (req.headers["x-app-token"] !== token || req.headers["x-profile-id"] !== profile.profileId) {
          send(res, 403, { error: "forbidden" });
          return;
        }
        const disconnect = new AbortController();
        const onClose = () => { if (!res.writableEnded) disconnect.abort(); };
        res.on("close", onClose);
        try {
          if (req.method === "GET" && path === "/api/model-settings") {
            send(res, 200, { profileId: profile.profileId, settings: await model.settings.read() });
          } else if (req.method === "POST") {
            let input: unknown;
            try { input = await body(req, 16000); } catch { throw new ModelError("VALIDATION"); }
            if (path === "/api/model-settings") {
              const settings = await model.save(input);
              if (!res.destroyed) send(res, 200, { profileId: profile.profileId, settings });
            } else {
              const result = await model.run(input, path === "/api/model-tests", disconnect.signal);
              if (!res.destroyed) send(res, 200, { profileId: profile.profileId, result });
            }
          } else send(res, 405, { error: "method not allowed" });
        } catch (error) {
          const failure = error instanceof ModelError ? error : new ModelError("UPSTREAM");
          const status = failure.code === "VALIDATION" ? 400 : ["CONFLICT", "BUSY", "KEY_REENTRY"].includes(failure.code) ? 409 : failure.code === "LOCAL_LIMIT" ? 429 : failure.code === "NOT_CONFIGURED" ? 422 : 502;
          if (!res.destroyed) send(res, status, { profileId: profile.profileId, error: { code: failure.code, message: failure.message } });
        } finally { res.off("close", onClose); }
        return;
      }
      if (req.method === "POST") {
        if (req.headers["x-app-token"] !== token) {
          send(res, 403, { error: "forbidden" });
          return;
        }
        if (path === "/api/companies") {
          let value: unknown;
          try {
            value = await body(req);
          } catch {
            send(res, 400, {
              error: { code: "VALIDATION", message: "Invalid JSON body" },
            });
            return;
          }
          try {
            if (
              !value ||
              typeof value !== "object" ||
              !("company" in value) ||
              !("expectedRevision" in value) ||
              !Number.isInteger(value.expectedRevision)
            )
              throw new DataError(
                "VALIDATION",
                "company and integer expectedRevision are required",
              );
            const result = catalog.append(
              value.company,
              value.expectedRevision as number,
            );
            send(res, result.inserted ? 201 : 200, {
              ...result,
              profileId: profile.profileId,
            });
          } catch (error) {
            if (!(error instanceof DataError)) throw error;
            send(res, error.code === "VALIDATION" ? 400 : 409, {
              error: { code: error.code, message: error.message },
            });
          }
          return;
        }
        if (path !== "/api/status") {
          send(res, 404, { error: "not found" });
          return;
        }
        let updates;
        try {
          const value = await body(req);
          if (!value || typeof value !== "object" || !("updates" in value))
            throw new Error("Invalid body");
          updates = parseStatuses(value.updates);
        } catch {
          send(res, 400, { error: "invalid request" });
          return;
        }
        store.save(updates);
        send(res, 200, { ok: true, profileId: profile.profileId });
        return;
      }
      if (req.method !== "GET") {
        send(res, 405, { error: "method not allowed" });
        return;
      }
      if (path === "/health") {
        send(res, 200, {
          app: "xiaozhao-gaogaoshou-ts",
          version: "0.2.0-dev",
          profileId: profile.profileId,
          instanceId: profile.instanceId,
          schemas: { progress: store.schemaVersion(), catalog: catalog.schemaVersion(), schedules: schedules.schemaVersion(), mail: mail.store.schemaVersion() },
          features: { recruitmentTasks: 2 },
        });
        return;
      }
      if (path === "/api/status") {
        send(res, 200, {
          statuses: store.statuses(),
          profileId: profile.profileId,
        });
        return;
      }
      if (path === "/api/catalog") {
        send(res, 200, { ...catalog.snapshot(), profileId: profile.profileId });
        return;
      }
      if (path === "/api/companies") {
        const limit = Number(requestUrl.searchParams.get("limit") ?? 100);
        const offset = Number(requestUrl.searchParams.get("offset") ?? 0);
        if (
          !Number.isInteger(limit) ||
          limit < 1 ||
          limit > 500 ||
          !Number.isInteger(offset) ||
          offset < 0
        ) {
          send(res, 400, {
            error: {
              code: "VALIDATION",
              message: "limit must be 1-500 and offset non-negative",
            },
          });
          return;
        }
        const snapshot = catalog.snapshot();
        send(res, 200, {
          profileId: profile.profileId,
          revision: snapshot.revision,
          total: snapshot.companies.length,
          items: snapshot.metadata
            .slice(offset, offset + limit)
            .map((entry, index) => ({
              ...entry,
              row: snapshot.companies[offset + index],
            })),
        });
        return;
      }
      if (path === "/api/backup") {
        const kind = requestUrl.searchParams.get("kind") ?? "progress";
        if (kind !== "progress" && kind !== "catalog") {
          send(res, 400, {
            error: { code: "VALIDATION", message: "Unknown backup kind" },
          });
          return;
        }
        const temp = await mkdtemp(join(backups, "export-"));
        try {
          const file = join(temp, "snapshot.db");
          await (kind === "catalog" ? catalog : store).backup(file);
          res.setHeader(
            "Content-Disposition",
            `attachment; filename="${kind === "catalog" ? "catalog" : "qiuzhao"}-backup.db"`,
          );
          send(res, 200, await readFile(file), "application/octet-stream");
        } finally {
          await rm(temp, { recursive: true, force: true });
        }
        return;
      }
      if (path === "/") {
        const html = (
          await readFile(join(options.webDir, "index.html"), "utf8")
        )
          .replace("__APP_TOKEN__", token)
          .replace("__PROFILE_ID__", profile.profileId);
        send(res, 200, Buffer.from(html), "text/html; charset=utf-8");
        return;
      }
      // Only built assets, never the source tree, credentials or database directory.
      const decoded = decodeURIComponent(path);
      const file = resolve(options.webDir, "." + decoded);
      const rel = relative(resolve(options.webDir), file);
      if (
        !decoded.startsWith("/assets/") ||
        rel.startsWith("..") ||
        isAbsolute(rel) ||
        !mime[extname(file)]
      ) {
        send(res, 404, { error: "not found" });
        return;
      }
      try {
        send(res, 200, await readFile(file), mime[extname(file)]);
      } catch {
        send(res, 404, { error: "not found" });
      }
    } catch {
      send(res, 500, { error: "request failed" });
    }
  });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  try {
    await new Promise<void>((resolveReady, reject) => {
      server.once("error", reject);
      server.listen(options.port, "127.0.0.1", () => {
        server.off("error", reject);
        const address = server.address();
        if (!address || typeof address === "string") {
          reject(new Error("No TCP address"));
          return;
        }
        url = `http://127.0.0.1:${address.port}`;
        resolveReady();
      });
    });
  } catch (error) {
    await daily.close();
    await mail.close();
    await collection.close();
    context.close();
    throw error;
  }
  void daily.tick().catch(() => {});
  return {
    url,
    close: async () => {
      if (closed) return;
      closed = true;
      // Stop accepting work first; an already accepted request may still be
      // awaiting decryption or a provider and must retain its database handles.
      const drained = new Promise<Error | undefined>((done) => server.close(done));
      try {
        model.dispose();
        await daily.close();
        await collection.close();
      } finally {
        const closeError = await drained;
        try { await mail.close(); }
        finally { context.close(); }
        if (closeError) throw closeError;
      }
    },
  };
}

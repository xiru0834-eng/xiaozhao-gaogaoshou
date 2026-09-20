import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { randomBytes } from "node:crypto";
import { readFile, mkdtemp, rm, mkdir, access } from "node:fs/promises";
import { resolve, join, extname, relative, isAbsolute } from "node:path";
import { Store } from "./store.ts";
import { parseStatuses } from "../shared/types.ts";
import { DATA, APPEND_DATES } from "../shared/catalog.ts";

export interface ServerOptions {
  dataDir: string;
  webDir: string;
  port: number;
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
  const store = new Store(join(options.dataDir, "qiuzhao.db"));
  const backups = join(options.dataDir, "backups");
  try {
    await mkdir(backups, { recursive: true });
    const daily = join(backups, new Date().toISOString().slice(0, 10) + ".db");
    try {
      await access(daily);
    } catch {
      await store.backup(daily);
    }
  } catch (error) {
    store.close();
    throw error;
  }
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
  async function body(req: IncomingMessage): Promise<unknown> {
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const part of req) {
      const chunk = Buffer.from(part);
      size += chunk.length;
      if (size > 200000) throw new Error("Payload too large");
      chunks.push(chunk);
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown;
  }
  const server = createServer(async (req, res) => {
    if (
      req.headers.host !== new URL(url).host ||
      (req.headers.origin && req.headers.origin !== url) ||
      req.headers["sec-fetch-site"] === "cross-site"
    ) {
      send(res, 403, { error: "forbidden" });
      return;
    }
    try {
      const path = new URL(req.url ?? "/", url).pathname;
      if (req.method === "POST") {
        if (req.headers["x-app-token"] !== token) {
          send(res, 403, { error: "forbidden" });
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
        send(res, 200, { ok: true });
        return;
      }
      if (req.method !== "GET") {
        send(res, 405, { error: "method not allowed" });
        return;
      }
      if (path === "/health") {
        send(res, 200, { app: "xiaozhao-gaogaoshou-ts", version: "0.2.0-dev" });
        return;
      }
      if (path === "/api/status") {
        send(res, 200, { statuses: store.statuses() });
        return;
      }
      if (path === "/api/catalog") {
        send(res, 200, { companies: DATA, appendDates: [...APPEND_DATES] });
        return;
      }
      if (path === "/api/backup") {
        const temp = await mkdtemp(join(backups, "export-"));
        try {
          const file = join(temp, "snapshot.db");
          await store.backup(file);
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="qiuzhao-backup.db"',
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
        ).replace("__APP_TOKEN__", token);
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
    store.close();
    throw error;
  }
  return {
    url,
    close: async () => {
      await new Promise<void>((done, reject) =>
        server.close((error) => (error ? reject(error) : done())),
      );
      store.close();
    },
  };
}

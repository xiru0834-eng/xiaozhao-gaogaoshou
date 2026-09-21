/** Loopback listener for the standalone workbench application. */
import { createServer } from "node:http";
import { openDataProfile } from "./data-context.ts";
import { createWorkbench, type WorkbenchOptions } from "./workbench.ts";

/** Standalone profile and listener configuration. */
export interface ServerOptions extends WorkbenchOptions {
  dataDir: string;
  port: number;
}

/** Starts a loopback server with profile locking and owned request teardown.
 * @param options Profile directory, built assets, port and provider dependencies.
 * @returns Listener URL and an idempotent asynchronous close operation.
 */
export async function startServer(options: ServerOptions) {
  const app = await createWorkbench(options, await openDataProfile(options.dataDir));
  let url = "";
  const server = createServer((req, res) => { void app.handle(req, res, url); });
  server.requestTimeout = 10000;
  server.headersTimeout = 10000;
  try {
    await new Promise<void>((resolveReady, reject) => {
      server.once("error", reject);
      server.listen(options.port, "127.0.0.1", () => {
        server.off("error", reject);
        const address = server.address();
        if (!address || typeof address === "string") { reject(new Error("No TCP address")); return; }
        url = `http://127.0.0.1:${address.port}`;
        resolveReady();
      });
    });
  } catch (error) { await app.close(); throw error; }
  app.start();
  let closing: Promise<void> | undefined;
  return {
    url,
    close(): Promise<void> {
      if (closing) return closing;
      const drained = new Promise<Error | undefined>((done) => server.close(done));
      closing = (async () => {
        try { await app.close(); }
        finally { const error = await drained; if (error) throw error; }
      })();
      return closing;
    },
  };
}

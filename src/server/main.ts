import { join, resolve } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";
import { startServer } from "./http.ts";

const args = process.argv.slice(2);
function option(name: string): string | undefined {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  if (!args[i + 1] || args[i + 1].startsWith("--"))
    throw new Error(`Missing ${name}`);
  return args[i + 1];
}
const dataDir = resolve(
  option("--data-dir") ??
    join(
      process.env.LOCALAPPDATA ?? join(homedir(), ".local", "share"),
      "XiaozhaoGaogaoshou",
      "profiles",
      "typescript-preview",
    ),
);
if (/[/\\]QiuzhaoLedger(?:[/\\]|$)/i.test(dataDir))
  throw new Error("Refusing the legacy application data directory");
const port = Number(option("--port") ?? 18765);
if (!Number.isInteger(port) || port < 1024 || port > 65535 || port === 18763)
  throw new Error("Use an isolated port (default 18765), not legacy 18763");
const webDir = fileURLToPath(new URL("../../web/", import.meta.url));
const app = await startServer({ dataDir, port, webDir });
console.log(
  `校招高高手 · TypeScript 预览 ${app.url}\n独立数据目录：${dataDir}\nCtrl+C 停止；未迁移原版个人数据。`,
);
let stopping = false;
async function stop() {
  if (!stopping) {
    stopping = true;
    await app.close();
  }
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

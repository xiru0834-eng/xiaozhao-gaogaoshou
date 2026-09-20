import { execFile } from "node:child_process";
import { join } from "node:path";
import { ModelError } from "../shared/model-contract.ts";

export interface SecretProtector {
  protect(value: string): Promise<string>;
  unprotect(ciphertext: string): Promise<string>;
}

/** No credentials in command line, environment, temporary files or error messages. */
async function dpapi(action: "Protect" | "Unprotect", value: string): Promise<string> {
  if (process.platform !== "win32") throw new ModelError("SECRET_STORAGE");
  const script = `$ErrorActionPreference='Stop'; Add-Type -AssemblyName System.Security; try { $bytes=[Convert]::FromBase64String([Console]::In.ReadToEnd()); $entropy=[Text.Encoding]::UTF8.GetBytes('xiaozhao-model-settings-v1'); $out=[Security.Cryptography.ProtectedData]::${action}($bytes,$entropy,[Security.Cryptography.DataProtectionScope]::CurrentUser); [Console]::Out.Write([Convert]::ToBase64String($out)) } catch { exit 1 }`;
  return new Promise((resolve, reject) => {
    const child = execFile(
      join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe"),
      ["-NoProfile", "-NonInteractive", "-Command", script],
      { windowsHide: true, timeout: 8000, maxBuffer: 32768, encoding: "utf8" },
      (error, stdout) => {
        if (error || !/^[A-Za-z0-9+/=]+$/.test(stdout.trim())) reject(new ModelError("SECRET_STORAGE"));
        else resolve(stdout.trim());
      },
    );
    child.stdin?.on("error", () => { /* execFile callback handles failures. */ });
    child.stdin?.end(value);
  });
}
export const windowsSecrets: SecretProtector = {
  async protect(value) { return dpapi("Protect", Buffer.from(value, "utf8").toString("base64")); },
  async unprotect(value) { return Buffer.from(await dpapi("Unprotect", value), "base64").toString("utf8"); },
};

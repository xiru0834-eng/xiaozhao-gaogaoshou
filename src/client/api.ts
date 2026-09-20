import { parseStatuses, type StatusMap } from "../shared/types.ts";
import type { ProgressApi } from "./progress.ts";

export function statusApi(): ProgressApi {
  let token =
    document.querySelector<HTMLMetaElement>('meta[name="app-token"]')
      ?.content ?? "";
  async function post(updates: StatusMap): Promise<Response> {
    return fetch("/api/status", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-App-Token": token },
      body: JSON.stringify({ updates }),
      keepalive: true,
    });
  }
  return {
    async read() {
      const res = await fetch("/api/status", { cache: "no-store" });
      if (!res.ok) throw new Error("Read failed");
      const data: unknown = await res.json();
      if (!data || typeof data !== "object" || !("statuses" in data))
        throw new Error("Invalid response");
      return parseStatuses(data.statuses);
    },
    async write(updates) {
      let res = await post(updates);
      if (res.status === 403) {
        // A local service restart rotates its in-memory token; refresh through the same-origin page.
        const page = await fetch("/", { cache: "no-store" });
        if (!page.ok) throw new Error("Reconnect failed");
        const doc = new DOMParser().parseFromString(
          await page.text(),
          "text/html",
        );
        const next = doc.querySelector<HTMLMetaElement>(
          'meta[name="app-token"]',
        )?.content;
        if (!next || !/^[a-f0-9]{64}$/.test(next))
          throw new Error("Invalid reconnect response");
        token = next;
        res = await post(updates);
      }
      if (!res.ok) throw new Error("Save failed");
      const ack: unknown = await res.json();
      if (!ack || typeof ack !== "object" || !("ok" in ack) || ack.ok !== true)
        throw new Error("Missing save confirmation");
    },
  };
}

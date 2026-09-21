import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { startServer } from "../src/server/http.ts";
import { emptyTaskDraft } from "../src/shared/recruitment-task-contract.ts";
test("task HTTP is protected, supports task lifecycle and real calendar projection without copying events", async () => {
  const dir = await mkdtemp(join(tmpdir(), "task-http-"));
  await writeFile(
    join(dir, "index.html"),
    '<meta name="app-token" content="__APP_TOKEN__">',
  );
  const app = await startServer({ port: 0, dataDir: dir, webDir: dir });
  try {
    const health = await (await fetch(app.url + "/health")).json(),
      html = await (await fetch(app.url)).text();
    const headers = {
      "X-App-Token": html.match(/content="([a-f0-9]{64})"/)![1],
      "X-Profile-Id": health.profileId,
      "Content-Type": "application/json",
    };
    assert.equal((await fetch(app.url + "/api/recruitment-tasks")).status, 403);
    const body = {
      requestId: randomUUID(),
      operations: [
        {
          action: "create",
          draft: {
            ...emptyTaskDraft(),
            title: "技术一面",
            timing: {
              mode: "fixed",
              start: {
                precision: "minute",
                date: "2026-10-05",
                time: "14:00",
                zone: "Asia/Shanghai",
              },
              end: null,
            },
          },
        },
      ],
    };
    const res = await fetch(app.url + "/api/recruitment-task-commands", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    assert.equal(res.status, 200);
    const task = (await res.json()).data.items[0];
    const list = await (
      await fetch(app.url + "/api/recruitment-tasks?limit=50", { headers })
    ).json();
    assert.equal(list.data.total, 1);
    const timeline = await (
      await fetch(
        app.url +
          "/api/recruitment-timeline?from=2026-10-01&to=2026-10-31&zone=Australia%2FSydney",
        { headers },
      )
    ).json();
    assert.equal(timeline.data.markers[0].time, "17:00");
    assert.equal(timeline.data.markers[0].taskId, task.id);
    const legacy = await (
      await fetch(app.url + "/api/schedules", { headers })
    ).json();
    assert.equal(legacy.items.length, 0);
    assert.equal(
      (
        await fetch(app.url + "/api/recruitment-tasks?limit=999999", {
          headers,
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await fetch(app.url + "/api/recruitment-tasks", {
          headers: { ...headers, Origin: "https://evil.test" },
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(
          app.url + "/api/recruitment-timeline?from=2020-01-01&to=2026-01-01",
          { headers },
        )
      ).status,
      400,
    );
  } finally {
    await app.close();
    await rm(dir, { recursive: true, force: true });
  }
});

// Isolated synthetic UI -> real HTTP -> model adapter -> mail.db -> schedules.db.
import { createRequire } from "node:module";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";
import { startServer } from "../dist/server/server/http.js";
import { ModelSettings } from "../dist/server/server/model-settings.js";
import { emptyTaskDraft } from "../dist/server/shared/recruitment-task-contract.js";
const { chromium } = createRequire(import.meta.url)(
  process.argv[2] || "playwright",
);
const dir = await mkdtemp(join(tmpdir(), "mail-tasks-ui-"));
const secrets = {
  protect: async (s) => Buffer.from(s).toString("base64"),
  unprotect: async (s) => Buffer.from(s, "base64").toString(),
};
const day = new Date().toISOString().slice(0, 10),
  next = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
const answer = {
  version: 2,
  actions: [
    {
      mutation: "create",
      draft: {
        ...emptyTaskDraft(),
        title: "预约技术面试",
        company: "合成验收公司",
        action: "book",
        timing: {
          mode: "deadline",
          due: { precision: "date", date: next, zone: null },
          boundary: "unspecified",
        },
      },
      linkRef: null,
      evidence: [
        { field: "company", quote: "合成验收公司" },
        { field: "timing", quote: `${next}前预约面试` },
      ],
    },
    {
      mutation: "create",
      draft: {
        ...emptyTaskDraft(),
        title: "在线测评",
        company: "合成验收公司",
        kind: "assessment",
        action: "complete",
        timing: {
          mode: "fixed",
          start: {
            precision: "minute",
            date: day,
            time: "14:00",
            zone: "Asia/Shanghai",
          },
          end: null,
        },
      },
      linkRef: "LINK_1",
      evidence: [
        { field: "company", quote: "合成验收公司" },
        { field: "timing", quote: `${day} 14:00 北京时间在线测评` },
      ],
    },
  ],
};
await new ModelSettings(dir, secrets).save({
  expectedRevision: 0,
  config: {
    baseUrl: "https://synthetic.example/v1",
    model: "fixture",
    timeoutSeconds: 10,
    maxTokens: 2048,
    tokenField: "max_tokens",
  },
  keyAction: "replace",
  apiKey: "synthetic-only",
});
let providerCalls = 0;
const app = await startServer({
  port: 0,
  dataDir: dir,
  webDir: resolve("dist/web"),
  mailDependencies: { secrets },
  modelDependencies: {
    secrets,
    transport: async (url, key, payload) => {
      assert.equal(url.href, "https://synthetic.example/v1/chat/completions");
      assert.equal(key, "synthetic-only");
      assert.ok(!payload.includes("PRIVATE-TOKEN"));
      providerCalls++;
      return {
        choices: [
          {
            message: { role: "assistant", content: JSON.stringify(answer) },
            finish_reason: "stop",
          },
        ],
      };
    },
  },
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
const errors = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => void d.accept());
  await page.goto(app.url + "/#schedules");
  const health = await (await fetch(app.url + "/health")).json(),
    html = await (await fetch(app.url)).text();
  const headers = {
    "Content-Type": "application/json",
    "X-App-Token": html.match(/name="app-token" content="([a-f0-9]+)"/)[1],
    "X-Profile-Id": health.profileId,
  };
  const request = async (path, body) => {
    const r = await fetch(app.url + path, {
      method: body ? "POST" : "GET",
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: await r.json() };
  };
  await page.getByRole("button", { name: /邮件待确认/ }).click();
  await page.getByText("邮箱连接与隐私设置", { exact: false }).click();
  await page.locator("[data-m=consent]").check();
  await page.getByRole("button", { name: "保存分析授权", exact: true }).click();
  await page.getByText("邮箱连接与隐私设置", { exact: false }).click();
  await page.getByRole("button", { name: "粘贴一封邮件", exact: true }).click();
  await page
    .getByLabel("邮件标题", { exact: true })
    .fill("合成验收公司 · 面试与测评安排");
  await page
    .getByLabel("收信时间（本机时区）", { exact: true })
    .fill(day + "T10:00");
  await page
    .getByLabel("邮件正文", { exact: true })
    .fill(
      `合成验收公司：请在${next}前预约面试；${day} 14:00 北京时间在线测评。入口 https://exam.example.test/start?token=PRIVATE-TOKEN`,
    );
  await page.getByRole("button", { name: "保存到待分析", exact: true }).click();
  await page.getByRole("button", { name: "使用模型分析", exact: true }).click();
  await page.locator(".mt-action").first().waitFor({ timeout: 20000 });
  assert.equal(await page.locator(".mt-action").count(), 2);
  assert.equal(providerCalls, 1);
  assert.equal((await request("/api/recruitment-tasks")).data.data.total, 0);
  await mkdir("qa-companion", { recursive: true });
  await page.screenshot({
    path: "qa-companion/mail-tasks-review.png",
    fullPage: true,
  });
  await page
    .locator(".mt-action")
    .first()
    .getByRole("button", { name: "核对并记录", exact: true })
    .click();
  assert.equal(
    await page.locator(".rt-dialog input[name=aTime]").inputValue(),
    "",
  );
  await page.getByLabel("我已核对原文及本次操作", { exact: true }).check();
  await page.getByRole("button", { name: "确认记录任务", exact: true }).click();
  await page.locator(".rt-dialog").waitFor({ state: "detached" });
  assert.equal((await request("/api/recruitment-tasks")).data.data.total, 1);
  // Simulated save failure retains edits; retry uses the same logical confirmation.
  await page
    .locator(".mt-action")
    .nth(1)
    .getByRole("button", { name: "核对并记录", exact: true })
    .click();
  await page
    .getByLabel("事项名称 *", { exact: true })
    .fill("在线测评（已核对）");
  await page.getByLabel("我已核对原文及本次操作", { exact: true }).check();
  await page.route("**/api/mail", async (route) => {
    if (
      route.request().method() === "POST" &&
      route.request().postDataJSON()?.action === "confirmTasks"
    )
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          profileId: health.profileId,
          error: { message: "合成保存失败" },
        }),
      });
    else await route.continue();
  });
  await page.getByRole("button", { name: "确认记录任务", exact: true }).click();
  await page
    .locator(".rt-dialog .rt-error")
    .filter({ hasText: "合成保存失败" })
    .waitFor();
  assert.equal(
    await page.getByLabel("事项名称 *", { exact: true }).inputValue(),
    "在线测评（已核对）",
  );
  assert.equal((await request("/api/recruitment-tasks")).data.data.total, 1);
  await page.unroute("**/api/mail");
  await page.getByRole("button", { name: "确认记录任务", exact: true }).click();
  await page.locator(".rt-dialog").waitFor({ state: "detached" });
  assert.equal((await request("/api/recruitment-tasks")).data.data.total, 2);
  assert.equal((await request("/api/schedules")).data.items.length, 0);
  await page
    .getByRole("button", { name: "查看任务与日历", exact: true })
    .click();
  await page.locator(".rt-row").first().waitFor();
  assert.equal(await page.locator(".rt-row").count(), 2);
  await page.getByRole("button", { name: "月历", exact: true }).click();
  await page.locator("[data-s=grid] .schedule-pill").first().waitFor();
  await page.locator(`[data-date="${day}"]`).click();
  await page
    .locator("[data-s=day-events] [data-recruitment-task]")
    .first()
    .waitFor();
  await page.screenshot({
    path: "qa-companion/mail-tasks-calendar.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "求职任务", exact: true }).click();
  await page.getByRole("button", { name: "＋ 记录任务", exact: true }).click();
  await page
    .getByLabel("事项名称 *", { exact: true })
    .fill("人工补充 · 时间待定");
  await page.getByRole("button", { name: "保存任务", exact: true }).click();
  await page.locator(".rt-dialog").waitFor({ state: "detached" });
  assert.equal((await request("/api/recruitment-tasks")).data.data.total, 3);
  await page.reload();
  await page.getByRole("button", { name: "求职任务", exact: true }).click();
  await page.locator(".rt-row").nth(2).waitFor();
  await page.screenshot({
    path: "qa-companion/mail-tasks-list.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: "qa-companion/mail-tasks-narrow.png",
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "narrow task page must not overflow horizontally",
  );
  await page.getByRole("button", { name: "＋ 记录任务", exact: true }).click();
  await page.screenshot({
    path: "qa-companion/mail-tasks-editor-narrow.png",
    fullPage: true,
  });
  assert.ok(
    await page
      .locator(".rt-dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth + 1),
    "narrow editor overflow",
  );
  await page.getByRole("button", { name: "关闭任务编辑", exact: true }).click();
  await page.locator("#theme-toggle").click();
  await page.evaluate(async () => {
    await Promise.all(
      document.getAnimations().map((a) => a.finished.catch(() => {})),
    );
  });
  console.log(
    "Dark controls:",
    await page
      .locator(".rt-panel select")
      .first()
      .evaluate((el) => ({
        background: getComputedStyle(el).backgroundColor,
        color: getComputedStyle(el).color,
        paper: getComputedStyle(el).getPropertyValue("--paper"),
        surface: getComputedStyle(el).getPropertyValue("--surface"),
      })),
  );
  await page.screenshot({
    path: "qa-companion/mail-tasks-dark.png",
    fullPage: true,
  });
  for(const skin of ['mint','blue','sakura','violet','amber'])for(const mode of ['light','dark']){
    await page.locator('#appearance-open').click();
    await page.locator(`label.skin-choice:has(input[value="${skin}"])`).click();
    await page.locator(`.skin-mode label:has(input[value="${mode}"])`).click();
    await page.locator('[data-a=apply]').click();
    assert.equal(await page.locator('html').getAttribute('data-skin'),skin);
    assert.equal(await page.locator('html').getAttribute('data-theme'),mode);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    assert.equal(await page.locator('.rt-row').count(),3);
  }
  const row=page.locator('.rt-row').filter({hasText:'人工补充 · 时间待定'});
  await row.getByRole('button',{name:'查看任务',exact:true}).click();
  await page.getByRole('button',{name:'记为已完成',exact:true}).click();await page.locator('.rt-dialog').waitFor({state:'detached'});
  await row.getByRole('button',{name:'重新打开',exact:true}).click();
  await page.getByRole('button',{name:'删除任务',exact:true}).click();await page.locator('.rt-dialog').waitFor({state:'detached'});
  await page.locator('.rt-panel [data-rt=state]').selectOption('deleted');
  await page.locator('.rt-row').getByRole('button',{name:'恢复',exact:true}).click();
  await page.getByRole('button',{name:'恢复任务',exact:true}).click();await page.locator('.rt-dialog').waitFor({state:'detached'});
  assert.equal((await request('/api/recruitment-tasks')).data.data.total,3);
  // Model failure must not hide local mail or prevent revoking analysis consent.
  await writeFile(join(dir, 'model-settings.json'), '{synthetic corrupt configuration');
  await page.locator('#open-mail').click();
  const settings = page.locator('.mail-settings');
  if (!(await settings.evaluate(el => el.open))) await settings.locator('summary').click();
  await page.getByText('模型配置文件无法读取。台账不受影响；请检查资料目录，不要删除投递数据库。', {exact:true}).waitFor();
  await page.locator('[data-m=consent]').uncheck();
  const revokeResponse = page.waitForResponse(r => new URL(r.url()).pathname === '/api/mail' && r.request().method() === 'POST' && r.ok());
  await page.locator('[data-m=save-consent]').click(); await revokeResponse;
  const mailAfterFailure = (await request('/api/mail')).data;
  assert.equal(mailAfterFailure.preferences.enabled, false);
  assert.equal(mailAfterFailure.preferences.automatic, false);
  assert.equal(mailAfterFailure.candidates.length, 1);
  assert.equal(providerCalls, 1, 'configuration failure must not call the model');
  await page.locator('[data-m=close]').click();
  // A new frontend with an old backend must preserve old schedules and explain restart.
  await page.route('**/health',async route=>{const response=await route.fetch(),payload=await response.json();delete payload.features;await route.fulfill({response,json:payload});});
  await page.reload();await page.getByText('现有日程可正常使用；邮件转任务需要重新启动 TypeScript 预览服务后刷新。',{exact:true}).waitFor();
  assert.equal(await page.getByRole('button',{name:'求职任务',exact:true}).isDisabled(),true);
  assert.equal(await page.getByRole('button',{name:'＋ 新建日程',exact:true}).isEnabled(),true);
  assert.deepEqual(errors, []);
  await writeFile(
    "qa-companion/mail-tasks-result.json",
    JSON.stringify(
      {
        passed: true,
        providerCalls,
        taskCount: 3,
        legacyEvents: 0,
        consoleErrors: errors,
        checks: [
          "partial confirmation",
          "no unconfirmed write",
          "save failure retains edits",
          "reload persistence",
          "calendar projection",
          "manual task without inference",
          "390px layout",
          "five skins in both modes",
          "complete/delete/restore",
          "old backend compatibility notice",
          "corrupt model config preserves mail access and consent revocation",
        ],
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS: synthetic Edge UI, 1 model call, 3 tasks, no duplicate legacy events, persistence, failed-save recovery, 390px layout; no personal profile touched.",
  );
} finally {
  await browser.close();
  await app.close();
  await rm(dir, { recursive: true, force: true });
}

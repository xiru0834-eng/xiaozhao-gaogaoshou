// Isolated real HTTP + SQLite + browser verification, no personal profile access.
import { createRequire } from "node:module";
import { mkdtemp, rm, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
import { startServer } from "../dist/server/server/http.js";
const { chromium } = createRequire(import.meta.url)(
  process.argv[2] || "playwright",
);
const dir = await mkdtemp(join(tmpdir(), "schedule-browser-"));
const app = await startServer({
  port: 0,
  dataDir: dir,
  webDir: resolve("dist/web"),
});
const browser = await chromium.launch({ channel: "msedge", headless: true });
try {
  const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
    }),
    page = await context.newPage(),
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(app.url + "/#schedules");
  await page
    .getByRole("button", { name: "＋ 新建日程", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "＋ 新建日程", exact: true }).click();
  await page.getByLabel("公司 *", { exact: true }).fill("日程功能验收公司");
  await page.getByLabel("岗位", { exact: true }).fill("Agent 应用研发");
  await page.getByLabel("轮次", { exact: true }).fill("技术一面");
  const day = await page.locator("input[name=date]").inputValue();
  await page.getByLabel("开始时间", { exact: true }).fill("14:00");
  await page
    .getByLabel("结束时间（可选，同日）", { exact: true })
    .fill("15:00");
  await page
    .getByLabel("地点／会议方式", { exact: true })
    .fill("线上 · 腾讯会议");
  await page
    .getByLabel("会议／笔试链接", { exact: true })
    .fill("https://example.com/meeting");
  await page.getByRole("button", { name: "＋ 添加一项", exact: true }).click();
  await page
    .getByLabel("准备事项", { exact: true })
    .fill("复习 RAG 检索与重排");
  await page.getByRole("button", { name: "保存日程", exact: true }).click();
  await page.getByText("日程已保存在本机。", { exact: true }).waitFor();
  await page.reload();
  await page
    .getByRole("button", {
      name: "编辑日程：日程功能验收公司 技术一面",
      exact: true,
    })
    .waitFor();
  await page
    .getByRole("button", {
      name: "编辑日程：日程功能验收公司 技术一面",
      exact: true,
    })
    .click();
  assert.equal(
    await page.getByLabel("岗位", { exact: true }).inputValue(),
    "Agent 应用研发",
  );
  // Failed save must retain all inputs and never imply success.
  await page.route("**/api/schedules", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({
            profileId: pageProfile,
            error: { message: "测试保存失败" },
          }),
        })
      : route.continue(),
  );
  const pageProfile = await page
    .locator("meta[name=profile-id]")
    .getAttribute("content");
  await page
    .getByLabel("安排备注", { exact: true })
    .fill("失败后必须保留这段内容");
  await page.getByRole("button", { name: "保存日程", exact: true }).click();
  await page.getByText("测试保存失败", { exact: true }).waitFor();
  assert.equal(
    await page.getByLabel("安排备注", { exact: true }).inputValue(),
    "失败后必须保留这段内容",
  );
  await page.unroute("**/api/schedules");
  await page.getByLabel("准备项已完成", { exact: true }).check();
  await page
    .getByLabel("面后复盘", { exact: true })
    .fill("验证记录：<script>alert(1)</script> 应当只显示文字");
  await page
    .locator(".schedule-dialog select[name=status]")
    .selectOption("completed");
  await page.getByRole("button", { name: "保存日程", exact: true }).click();
  await page.locator(".schedule-dialog").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "全部列表", exact: true }).click();
  await page.getByRole("heading", { name: /已完成.*1 场/ }).waitFor();
  await page
    .getByRole("button", {
      name: "编辑日程：日程功能验收公司 技术一面",
      exact: true,
    })
    .click();
  assert.equal(
    await page.getByLabel("准备项已完成", { exact: true }).isChecked(),
    true,
  );
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "删除日程", exact: true }).click();
  await page.getByText("日程已删除。", { exact: true }).waitFor();
  // Seed illustrative events only into this temporary test profile for visual QA.
  const raw = await (await fetch(app.url)).text(),
    token = raw.match(/name="app-token" content="([a-f0-9]{64})"/)[1],
    profile = (await (await fetch(app.url + "/health")).json()).profileId;
  const headers = {
    "X-App-Token": token,
    "X-Profile-Id": profile,
    "Content-Type": "application/json",
  };
  let revision = (
    await (await fetch(app.url + "/api/schedules", { headers })).json()
  ).revision;
  for (const [index, company] of [
    "示例 · 青禾科技",
    "示例 · 云川智能",
    "示例 · 星桥工作室",
    "示例 · 澄光研发",
  ].entries()) {
    const date =
      index < 2
        ? day
        : day.slice(0, 8) +
          String(Math.min(28, Number(day.slice(-2)) + index)).padStart(2, "0");
    const item = {
      id: randomUUID(),
      company,
      role: "AI / Agent 应用研发",
      kind: index === 1 ? "written" : "interview",
      round: index === 1 ? "在线笔试" : "技术一面",
      date,
      time: index === 1 ? "19:00" : "14:00",
      endTime: "",
      zone: "Asia/Shanghai",
      status: "planned",
      location: "线上",
      url: "",
      notes: "测试用示例，不是个人真实安排",
      review: "",
      tasks: [
        { text: "准备项目介绍", done: true },
        { text: "复习 RAG", done: false },
      ],
    };
    const result = await fetch(app.url + "/api/schedules", {
      method: "POST",
      headers,
      body: JSON.stringify({
        requestId: randomUUID(),
        expectedRevision: revision,
        action: "save",
        item,
      }),
    });
    assert.equal(result.status, 200);
    revision = (await result.json()).revision;
  }
  await page.getByRole("button", { name: "刷新", exact: true }).click();
  await page
    .getByText("仅保存在本机 · 日程状态与投递进度独立", { exact: true })
    .waitFor();
  await mkdir("qa-companion", { recursive: true });
  await page.screenshot({
    path: "qa-companion/schedules-list.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "月历", exact: true }).click();
  await page.screenshot({
    path: "qa-companion/schedules-calendar.png",
    fullPage: true,
  });
  await page
    .getByRole("button", {
      name: "编辑日程：示例 · 青禾科技 技术一面",
      exact: true,
    })
    .click();
  await page.screenshot({ path: "qa-companion/schedules-editor.png" });
  await page.getByRole("button", { name: "关闭日程编辑", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.screenshot({
    path: "qa-companion/schedules-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "切换到深色主题", exact: true }).click();
  await page.waitForTimeout(500);
  await page.screenshot({
    path: "qa-companion/schedules-dark.png",
    fullPage: true,
  });
  assert.deepEqual(errors, []);
  console.log(
    "PASS real SQLite/HTTP/UI create, reload, edit, preparation checklist, completion, list, delete, calendar, narrow viewport; zero page errors",
  );
} finally {
  await browser.close();
  await app.close();
  await rm(dir, { recursive: true, force: true });
}

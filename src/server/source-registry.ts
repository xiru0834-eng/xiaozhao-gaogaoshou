import type { SourceDefinition } from "../shared/collection-contract.ts";
/** Reviewed public entries. Never load URLs or executable adapters from model output. */
export const SOURCES: readonly SourceDefinition[] = [
  {
    id: "speediance-llm", company: "速境 Speediance", name: "速境 · 大模型应用开发工程师", kind: "detail",
    entryUrl: "https://sil.speediance.com/zh/career/llm-application-engineer",
    allowedUrls: ["https://sil.speediance.com/zh/career/llm-application-engineer"], verifiedAt: "2026-09-20",
    note: "官网公开详情；页面要求 3 年以上开发经验，仅作核验例，不预设适合应届生。",
  },
  {
    id: "minimax-careers", company: "MiniMax", name: "MiniMax · 官方招聘入口", kind: "listing",
    entryUrl: "https://www.minimax.cn/careers", allowedUrls: ["https://www.minimax.cn/careers"], verifiedAt: "2026-09-20",
    note: "官网可读取届别说明；详情跳转飞书，尚未启用详情适配，不把入口当岗位。",
  },
  {
    id: "kimi-campus", company: "月之暗面 Moonshot", name: "Kimi · 校园招聘入口", kind: "listing",
    entryUrl: "https://careers.kimi.com/campus", allowedUrls: ["https://careers.kimi.com/campus"], verifiedAt: "2026-09-20",
    note: "官方校招页；岗位依赖动态加载时显示受限，不抓登录接口。",
  },
];

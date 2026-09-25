export type InterviewMode = "online" | "offline" | "mixed" | "unknown";
export interface InterviewEvidence {
  mode: InterviewMode;
  scope: string;
  note: string;
  url: string;
  checked: string;
}

// Evidence is batch- and company-specific. Online tests or AI screening alone do
// not establish that every later interview can be attended remotely.
const evidence: Record<string, InterviewEvidence> = {
  "中移九天（中国移动数智事业部）": {
    mode: "mixed",
    scope: "2027 届秋招 · 九天公司",
    note: "流程含 AI 面试，其后还有两轮面试；后两轮形式未公布，须向招聘方确认。",
    url: "https://career.hebut.edu.cn/home/correcruit/content/id/80377.html",
    checked: "2026-09-25",
  },
  "中国移动（集团统一）": {
    mode: "unknown",
    scope: "2027 届集团统一招聘",
    note: "公告明确统一笔试在线进行，面试形式由各单位安排，不能据此认定可线上面试。",
    url: "https://myjob.dlmu.edu.cn/campus/view/id/868690",
    checked: "2026-09-25",
  },
  "京东方 BOE": {
    mode: "mixed",
    scope: "2027 届全球校招 · 部分岗位",
    note: "部分岗位设置 AI 面试，后续面试形式未公布；AI 面试不能代表完整流程线上。",
    url: "https://job.tiangong.edu.cn/correcruit/content/id/55609.html",
    checked: "2026-09-25",
  },
  "长安汽车": {
    mode: "unknown",
    scope: "2027 届全球校招",
    note: "简章明确线上测评，但未注明后续面试地点或方式。",
    url: "https://career.hebut.edu.cn/home/correcruit/content/id/79852.html",
    checked: "2026-09-25",
  },
  "中信银行": {
    mode: "unknown",
    scope: "2027 年校园招聘",
    note: "公告明确全球统一考试在线进行，但面试形式未公布。",
    url: "https://career.nankai.edu.cn/correcruit/content/id/117681.html",
    checked: "2026-09-25",
  },
  "工行软件开发中心": {
    mode: "unknown",
    scope: "2027 年度校招 · 软件开发中心",
    note: "招聘流程列出笔试与面试，但未注明面试形式；线上申请不代表线上面试。",
    url: "https://myjob.dlmu.edu.cn/campus/view/id/869130",
    checked: "2026-09-25",
  },
  "联通数科": {
    mode: "unknown",
    scope: "2027 届秋招 · 联通数科",
    note: "公告列出笔面试测评，但未注明面试方式。",
    url: "https://career.nankai.edu.cn/correcruit/content/id/118230.html",
    checked: "2026-09-25",
  },
};

export const INTERVIEW_MODE_LABEL: Record<InterviewMode, string> = {
  online: "确认可全程线上",
  offline: "明确需要线下",
  mixed: "部分线上 / 后续待确认",
  unknown: "面试形式待确认",
};

export function interviewEvidence(name: string): InterviewEvidence {
  return evidence[name] ?? {
    mode: "unknown",
    scope: "当前收录岗位 / 2027 届",
    note: "未找到适用于该岗位及批次的完整面试形式说明。请在收到面邀后向 HR 确认每一轮能否远程参加。",
    url: "",
    checked: "",
  };
}

export function matchesInterviewMode(name: string, filter: string): boolean {
  const mode = interviewEvidence(name).mode;
  return filter === "all" || (filter === "online-candidate" ? mode !== "offline" : mode === filter);
}

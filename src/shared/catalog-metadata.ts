export interface CatalogSeedMeta {
  ownership: "private" | "foreign" | "state" | "public";
  aliases: string[];
  firstSeenDate: string | null;
  channel: "none" | "online" | "hybrid" | "offline" | "verify";
  channelEvidence: string;
}

// 只含岗位目录元信息，不包含 qiuzhao.db 中的个人投递状态。
export const CATALOG_METADATA = new Map<string, CatalogSeedMeta>([
  [
    "腾讯",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "字节跳动",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "阿里巴巴（淘天/高德/钉钉/饿了么/盒马/夸克/通义）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "阿里淘天 AI Studio",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "阿里云",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "百度",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "拼多多",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "京东（JDS / TGT）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "快手",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "蚂蚁集团（含 OceanBase）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "网商银行",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "小红书",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "美团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "B 站",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "网易有道",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "网易互娱",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "网易雷火",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "得物",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "贝壳找房",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "SHEIN",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "Shopee 研发中心",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "58 同城「58A 计划」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "菜鸟",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "微博",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "唯品会",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "高途",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "携程",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "搜狐「引力计划」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "腾讯音乐 TME",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "滴滴",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "虎牙",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "爱奇艺",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "顺丰科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "阅文集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "去哪儿",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "货拉拉",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "哈啰",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "美图",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "汽车之家「JIA STAR」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "知乎",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "作业帮",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "途虎养车",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "途牛",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "满帮集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "泡泡玛特",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "安踏集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "蜜雪集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "粉笔",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "松鼠 AI",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "阿里健康",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "MiniMax",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "智谱 Z.ai",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "科大讯飞",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "DeepSeek",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "月之暗面 Moonshot",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "百川智能「源点计划」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "面壁智能「前进四」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "实在智能",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "星环科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "深势科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "思必驰",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "杉数科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "速境 Speediance",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "海艺科技 SeaArt",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "商汤科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "阶跃星辰 StepFun",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "依图科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "云知声",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "第四范式",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "旷视 / 千里科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "云天励飞",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "晶泰科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "群核科技（酷家乐）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "上海人工智能实验室",
    {
      "ownership": "public",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "之江实验室",
    {
      "ownership": "public",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "北京通用人工智能研究院 BIGAI",
    {
      "ownership": "public",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中科院计算所",
    {
      "ownership": "public",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "启元实验室",
    {
      "ownership": "public",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "智源研究院「智星」",
    {
      "ownership": "public",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "字节 Seed 大模型人才校招",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "米哈游",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "沐瞳科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "鹰角网络",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "莉莉丝",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "叠纸游戏",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "库洛游戏",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "点点互动",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "4399",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "三七互娱",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "波克城市",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "西山居",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "深蓝互动",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "巨人网络",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "网龙",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "心动 / TapTap",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "完美世界",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "小黑盒",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "多益网络",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "吉比特",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "乐元素",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "小米",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "OPPO",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "vivo",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "荣耀",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "大疆",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "传音控股",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "海康威视",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "大华股份",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "联想",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "韶音科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "影石 Insta360",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "石头科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "追觅科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "云鲸智能",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "拓竹科技 Bambu Lab",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "安克创新",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "CVTE 视源",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "禾赛科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "智元机器人 AgiBot",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "银河通用 Galbot",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "优必选",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "自变量机器人",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "普渡科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "极智嘉 Geek+",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "星海图",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "穹彻智能",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "千寻智能",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "北京人形机器人创新中心",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "宇树科技 Unitree",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "寒武纪",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "摩尔线程",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "燧原科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "海光信息",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "联发科 MTK",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "京东方 BOE",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "紫光展锐",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "沐曦",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "昆仑芯",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "长江存储",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "安谋科技 Arm China",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "TCL 华星",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "TCL 实业",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "美的集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "海尔集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "老板电器",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "普冉股份",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "TP-LINK",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "三环集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "迈瑞医疗",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "联影集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "三星中国（西安 SRCX / 北京研究院）",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "招银网络科技",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "恒生电子",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "同花顺",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "度小满",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "众安保险",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "九坤投资「梧桐计划」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "万得 Wind",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "银泰商业",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中金所技术公司",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "上交所技术公司",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "浦银金融科技（浦发银行）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "阳光保险 科技条线",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "建信金科",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "工行软件开发中心",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "农银金科",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中银金科",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "交银金科",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "中信银行",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "江苏银行 总行金融科技培养生",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "南京银行",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "宁波银行 总行金融科技定向生",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "苏商银行",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "民生科技（民生银行）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "徽商银行",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "兴业数金",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "微众银行",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "平安集团 / 平安科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中电金信",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "广发证券 IT",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官方公告邮箱投递"
    }
  ],
  [
    "中金公司",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "申万宏源",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "银河证券",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "招商证券",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中信建投",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "华泰证券",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中证股转科技",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "金证股份",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "国寿财险 金融科技中心",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "泰康",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中国人保",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "汇丰科技 HSBC",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "瑞银 UBS GTP",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "衍复投资",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "鸣石基金",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "宽德投资「无境计划」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "曹操出行",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "理想汽车",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "小鹏汽车",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "蔚来",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "地平线",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "Momenta",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "小马智行 Pony.ai",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "文远知行 WeRide",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "轻舟智航 QCraft",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "九识智能 ZELOS",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "元戎启行",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "卓驭科技（大疆车载）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "宁德时代",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "比亚迪",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "吉利 / 极氪",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "长安汽车",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "广汽集团 / 研究院",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "上汽零束 / 上汽集团",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "德赛西威",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "赛力斯",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "一汽集团",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "东风研发总院",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "易控智驾",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "酷睿程 CARIZON",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中国汽研 CAERI",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "华为",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "金蝶",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "用友网络",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "万兴科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "合合信息",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "彩讯股份",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "广联达",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "博世 BCSC（无锡）",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "名创优品",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "神州数码集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中望软件",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "达梦数据",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "超聚变 xFusion",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "hybrid",
      "channelEvidence": "官网可投；2027 校招公告列明 9–10 月进校交流活动"
    }
  ],
  [
    "中国电子云（中电云计算）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "hybrid",
      "channelEvidence": "官方校招简章明确：官网网申或宣讲会/双选会现场投递，二选一即可"
    }
  ],
  [
    "神州信息",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中移九天（中国移动数智事业部）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中移互联网",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中移金科",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "咪咕 / 中国移动研究院 / 中移物联网",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "天翼云（中国电信）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "联通数科",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中科曙光",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "浪潮集团",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "新华三 H3C",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中兴通讯",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "昆仑数智（中石油）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "中电科 32 所",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官方公告邮箱投递"
    }
  ],
  [
    "中电科智能科技研究院",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官方公告邮箱投递"
    }
  ],
  [
    "中电科 58 所",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "电科网安（中电科 30 所系）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "中国网安 / 三十所",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "卡奥斯 COSMOPlat（海尔）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "先导智能",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "麒麟软件",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "达观 / 中控信息",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "帆软",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "深信服",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "奇安信",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "绿盟科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "长亭科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "亚信安全",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "迪普科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "汇川技术",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "三一集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "树根互联（三一系）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "新大陆科技集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "东软集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "杰瑞集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "华大基因",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "卫宁健康",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "数坤科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "声网 Agora",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "软通动力",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中软国际",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "汉得信息",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "金山办公",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "360",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "明源云",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "锐捷网络",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "太极股份（中电科 15 所）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "中核华辉",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "国家电网（信通 / 国网智能）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "南网数字集团（南方电网）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "招商局集团",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "金山云「云翼计划」",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中国移动（集团统一）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中国电信（集团）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "verify",
      "channelEvidence": "当前仅保存了搜索页，需回公司官网核验"
    }
  ],
  [
    "TeleAI（中国电信人工智能研究院）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官方公告邮箱投递"
    }
  ],
  [
    "中国联通（集团）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "Apple 中国",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "NVIDIA 中国",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "Qualcomm 中国",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "微软亚太研发集团",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "亚马逊",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "SAP 中国研究院「STAR」",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "埃森哲「AI 未来分析师计划 AAP」",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "凯捷 Capgemini",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "施耐德电气",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "西门子中国",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "GE 医疗 EEDP",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "爱立信中国研发中心",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "IBM 中国",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "毕马威 KPMG",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "普华永道 PwC",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "紫金山实验室",
    {
      "ownership": "public",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中原银行 / 郑州银行",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中国航信",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": null,
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "途游游戏",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-19",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "苏州科达",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-19",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "北方华创",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-19",
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中景芯创",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-19",
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "威迈斯新能源",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-19",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "富兰瓦时 FranklinWH",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": "2026-09-20",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "虹科",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-20",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "小天才",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-21",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "新石器无人车 Neolix",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-21",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "中海达",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-22",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "挚文集团（陌陌 / 探探）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-23",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "启云方",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-23",
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "柠檬微趣",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-23",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "税友集团",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "智慧芽",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "微分智飞",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "国信证券",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中邮科技",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "中科闻歌",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "安脉盛",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "华测导航",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "时创意",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "骄成超声",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "嘉立创",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "保利发展控股",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "卓望数码",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "online",
      "channelEvidence": "官网或官方授权招聘系统可投"
    }
  ],
  [
    "海雀科技",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-24",
      "channel": "none",
      "channelEvidence": ""
    }
  ],
  [
    "云帐房",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "博思软件",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "九方智投（九方云）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "思谋科技 SmartMore",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "北电数智",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "银河航天",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "友达光电（昆山）",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "数字政通",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "广电运通（含中数智汇）",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "三诺生物",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "固德威",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "英集动力",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "傅利叶智能",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "拓维信息",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "开目软件",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "e签宝",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "联宝科技（联想合肥）",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "南方基金",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "英科医疗",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "龙湖集团（千丁智能）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "奥普特 OPT",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "三棵树",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "德力西电气",
    {
      "ownership": "foreign",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "BOSS直聘（华品博睿）",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "中船第七二二研究所",
    {
      "ownership": "state",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "纳芯微电子",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "阳光电源",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "北森云计算",
    {
      "ownership": "private",
      "aliases": [],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "笔试/面试能否全程线上待核实；线上网申不等于全程线上考核。详见岗位来源说明。"
    }
  ],
  [
    "海能达",
    {
      "ownership": "private",
      "aliases": [
        "Hytera",
        "海能达通信股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2027公告有网申入口；未取得笔试和全部面试可远程完成的明确说明。网申不等于线上考核。"
    }
  ],
  [
    "东昇聚变",
    {
      "ownership": "private",
      "aliases": [
        "东昇聚变(上海)技术有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "可邮件投递；未公开说明笔试/面试能否全部线上，需要先向HR确认，不能把邮箱投递当线上面试。"
    }
  ],
  [
    "长城信息",
    {
      "ownership": "state",
      "aliases": [
        "长城信息股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "公告流程为网申/现场投递→笔试→HR面试→专业面试，未明确考核地点或远程替代；仅支持线上者须核验。"
    }
  ],
  [
    "华润数科",
    {
      "ownership": "state",
      "aliases": [
        "华润数科控股有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "已核官网当前可网申，未见面试远程承诺；不能认定全程线上。"
    }
  ],
  [
    "北京医疗健康大模型（联通）",
    {
      "ownership": "state",
      "aliases": [
        "北京医疗健康大模型有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "公告有笔试及初复试，但未公开说明全程线上；海外学历资格及远程流程均待确认。"
    }
  ],
  [
    "药石科技",
    {
      "ownership": "private",
      "aliases": [
        "PharmaBlock",
        "南京药石科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "智联平台可投递不代表远程笔面试；公开JD未说明考核方式。"
    }
  ],
  [
    "麦科田医疗",
    {
      "ownership": "private",
      "aliases": [
        "Medcaptain",
        "深圳麦科田生物医疗技术有限公司",
        "深圳麦科田生物医疗技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "公告没有全线上笔面试保证；CET6硬条件或雅思替代也需确认。"
    }
  ],
  [
    "千曙科技",
    {
      "ownership": "private",
      "aliases": [
        "TranXmart",
        "北京千曙科技有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官网流程面试阶段包含笔试，未说明能否全部线上；正式岗位可申请但远程资格待确认。"
    }
  ],
  [
    "华勤技术",
    {
      "ownership": "private",
      "aliases": [
        "Huaqin",
        "华勤技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官网明确网申后5天内完成线上考试+线上测评；后续2至3轮面试是否远程未说明，另有线下招聘行程，不能标全线上。"
    }
  ],
  [
    "歌尔股份",
    {
      "ownership": "private",
      "aliases": [
        "Goertek",
        "歌尔股份有限公司",
        "歌尔集团"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "精英公告含HR初试/业务面试/高管面对面；无法确认是否允许远程替代。歌尔之翼也未明确全线上，先确认再投。"
    }
  ],
  [
    "乾程科技",
    {
      "ownership": "private",
      "aliases": [
        "TEchen",
        "青岛乾程科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2027公告有AI初试和复试；没有确认笔试及复试全部线上。"
    }
  ],
  [
    "卡斯柯",
    {
      "ownership": "state",
      "aliases": [
        "CASCO",
        "卡斯柯信号有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "https://casco.zhiye.com/Campus 明确在线笔试9月10日起；技术/人事面试9月20日起，是否线上未明确。"
    }
  ],
  [
    "水滴",
    {
      "ownership": "private",
      "aliases": [
        "Waterdrop",
        "北京水滴科技集团有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官方岗位和2027公告未明确所有笔面试形式；不能承诺全程线上。"
    }
  ],
  [
    "振石控股集团",
    {
      "ownership": "private",
      "aliases": [
        "振石控股集团有限公司",
        "振石集团"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官方岗位未明确笔试和面试形式，按待核实保留。"
    }
  ],
  [
    "壁仞科技",
    {
      "ownership": "private",
      "aliases": [
        "Biren Technology",
        "上海壁仞科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官网JD未保证笔面试全线上；内推码仅来源称有效，未校验未试投。"
    }
  ],
  [
    "曦望 Sunrise",
    {
      "ownership": "private",
      "aliases": [
        "曦望Sunrise",
        "曦望芯科",
        "杭州曦望芯科智能科技有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官方岗位未披露笔面试全部线上；不能把校招网申当线上面试证据。"
    }
  ],
  [
    "清华大学能源互联网创新研究院",
    {
      "ownership": "public",
      "aliases": [
        "清华能源互联网创新研究院",
        "清华能源互联网研究院（北京）"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "仅核实官方2027岗位；专用投递方式及笔面试形式未明确，不能保证全程线上。"
    }
  ],
  [
    "清华四川能源互联网研究院",
    {
      "ownership": "public",
      "aliases": [
        "Tsinghua Sichuan Energy Internet Research Institute",
        "清华四川能源研究院"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2027招聘公告及官方详情未给全程线上考核保证；电力领域学习要求单列。"
    }
  ],
  [
    "河南兜圈子网络",
    {
      "ownership": "private",
      "aliases": [
        "兜圈子网络",
        "河南兜圈子网络技术有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "岗位未明确面试方式；小型软件服务企业，是否驻场与全程线上均须核实。"
    }
  ],
  [
    "中远海运科技",
    {
      "ownership": "state",
      "aliases": [
        "上海中远海运科技股份有限公司",
        "中远海运科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官方2027研发岗及Harness校招岗均可见；笔试/面试形式未注明，国聘页脚在线笔试平台为通用服务，不证明该岗远程。"
    }
  ],
  [
    "每日互动（个推）",
    {
      "ownership": "private",
      "aliases": [
        "Getui",
        "个推",
        "每日互动股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "官网线下/线上面试日期为2025，不套用到2027；本届考核形式待确认。"
    }
  ],
  [
    "联友科技",
    {
      "ownership": "state",
      "aliases": [
        "Lianyou Technology",
        "深圳联友科技有限公司",
        "联友科技（东风南方系）"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2026-09-26核对官方https://szly.zhiye.com/Campus：线上测评明确，面试未说明线上/线下；不能推断全流程线上。"
    }
  ],
  [
    "国能日新",
    {
      "ownership": "private",
      "aliases": [
        "SPRIXIN",
        "国能日新科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2026-09-26官方https://sprixin.zhiye.com/campus列面试、笔试/测评但未标线上/现场；海外应届具体窗口待核。"
    }
  ],
  [
    "普源精电 RIGOL",
    {
      "ownership": "private",
      "aliases": [
        "RIGOL",
        "普源精电",
        "普源精电科技股份有限公司",
        "苏州普源精电科技有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2026-09-26官方2027校园站未明确笔试/面试方式；岗位ONSITE办公标签不等于线下面试。"
    }
  ],
  [
    "信也科技",
    {
      "ownership": "private",
      "aliases": [
        "FinVolution",
        "上海上湖信息技术有限公司",
        "上海耳序信息技术有限公司",
        "拍拍贷"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "2026-09-20川大就业网企业发布2027简章明确10–11月在线笔试&面试，9/26核验：https://jy.scu.edu.cn/index/index/employdetail.html?data=MDAwMDAwMDAwMJG6n3_Ed6imi4qQtLh5eN6K0dSuyGHRp7ugzc-GnZ2skMx9ZMN4gtKLipCwxKF0lZC5sq-0gqJv 。线下校园宣讲不等于必到面试；最终仍以岗位通知为准。"
    }
  ],
  [
    "湖南省交通科学研究院",
    {
      "ownership": "state",
      "aliases": [
        "湖南省交通科学研究院有限公司",
        "湘交科"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2026-09-26雇主JD未明确考试和面试形式，湖南建投2027简章仅列网申-资格审查-面试。智联平台支持视频面试不是该公司承诺；登录后资格尾部亦待核。"
    }
  ],
  [
    "杭州智元研究院",
    {
      "ownership": "state",
      "aliases": [
        "中国兵器装备集团智能创新研究院",
        "智元研究院",
        "杭州智元研究院有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "verify",
      "channelEvidence": "2026-09-26集团官网校招详情与列表未说明笔面试形式；海归资格及后续政审/面试具体要求待核。深蓝社区招聘转述不能当全程线上证据。"
    }
  ],
  [
    "星网锐捷",
    {
      "ownership": "state",
      "aliases": [
        "Star-net",
        "星网锐捷通讯",
        "福建星网锐捷通讯股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "官网网申可用；这里只表示线上递简历。2027官网写在线笔试测评，面试未明确线上，不能保证全流程线上。"
    }
  ],
  [
    "中控技术 SUPCON",
    {
      "ownership": "private",
      "aliases": [
        "SUPCON",
        "中控技术",
        "中控技术股份有限公司",
        "浙江中控技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "官方Moka可网上递简历；简章含AI面试，但初试/复试与测评方式未明确，不能认定全程线上。"
    }
  ],
  [
    "中国移动云公司（中移苏州软件）",
    {
      "ownership": "state",
      "aliases": [
        "中国移动云公司",
        "中移(苏州)软件技术有限公司",
        "云公司-中移（苏州）软件技术有限公司",
        "移动云"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "中国移动官方具体岗位可网申。该单位公告仅列笔试/面试流程，未确认全部线上；不要把集团或其他省公司方式套过来。"
    }
  ],
  [
    "南京因克斯智能",
    {
      "ownership": "private",
      "aliases": [
        "ENCOS",
        "南京因克斯智能科技有限公司",
        "因克斯",
        "因克斯智能"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "hybrid",
      "channelEvidence": "企业2027公告提供邮箱网申或现场投递两条渠道，不要求必须现场递简历；综合面试方式未明确，全程线上待核。"
    }
  ],
  [
    "鼎捷数智",
    {
      "ownership": "foreign",
      "aliases": [
        "DigiwinSoft",
        "鼎捷数智股份有限公司",
        "鼎捷软件",
        "鼎捷软件股份有限公司",
        "鼎新电脑"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "企业在高校发布的招聘公告明确在线简历投递邮箱；笔试/初复试/HR面试未说明线上，待核。"
    }
  ],
  [
    "联芸科技",
    {
      "ownership": "private",
      "aliases": [
        "Maxio Technology",
        "联芸科技（杭州）有限公司",
        "联芸科技(杭州)股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "官方北森校园全职职位保留立即投递；只能确认网上递简历，尚无全程线上笔面试证据。"
    }
  ],
  [
    "中国移动成都产业研究院",
    {
      "ownership": "state",
      "aliases": [
        "中国移动（成都）产业研究院",
        "中移（成都）产业研究院",
        "中移（成都）信息通信科技有限公司",
        "成研院"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "具体官方岗位可网申；公告明确10月24日在线统一笔试，10至12月面试但未明确线上。线上宣传不等于线上面试。"
    }
  ],
  [
    "中国移动在线营销服务中心",
    {
      "ownership": "state",
      "aliases": [
        "中国移动通信有限公司在线营销服务中心",
        "中国移动通信集团有限公司在线营销服务中心",
        "在线营销服务中心"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "企业公告指定智联和10086网申渠道；本次已读智能体工程具体JD和申请入口。笔试及各轮面试能否线上未知。"
    }
  ],
  [
    "好未来 TAL（学而思）",
    {
      "ownership": "private",
      "aliases": [
        "TAL",
        "北京世纪好未来教育科技有限公司",
        "好未来",
        "好未来集团",
        "学而思"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "官方新招聘站全职算法岗有申请按钮；同一页也含实习转正，须按岗位性质区分。海外具体毕业月份和全程线上考核均待确认。"
    }
  ],
  [
    "新中大科技",
    {
      "ownership": "private",
      "aliases": [
        "Newgrand",
        "新中大",
        "新中大科技股份有限公司",
        "杭州新中大科技股份有限公司",
        "杭州新中大软件股份有限公司"
      ],
      "firstSeenDate": "2026-09-26",
      "channel": "online",
      "channelEvidence": "高校发布的企业2027公告提供邮箱，可网上发送简历但本轮未发信；实习签约/转正流程与线上笔面试资格仍需问清。"
    }
  ],
  [
    "容知日新",
    {
      "ownership": "private",
      "aliases": [
        "安徽容知日新科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "未确认笔试与全部面试可以线上完成。"
    }
  ],
  [
    "经纬恒润",
    {
      "ownership": "private",
      "aliases": [
        "Hirain",
        "北京经纬恒润科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "海外窗口符合月份；远程笔面试未明确。"
    }
  ],
  [
    "精智达",
    {
      "ownership": "private",
      "aliases": [
        "深圳精智达技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公开信息未承诺全线上。"
    }
  ],
  [
    "趣加 FunPlus",
    {
      "ownership": "private",
      "aliases": [
        "FunPlus",
        "北京趣加科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "网申入口不证明全程线上，需确认。"
    }
  ],
  [
    "全志科技",
    {
      "ownership": "private",
      "aliases": [
        "Allwinner",
        "珠海全志科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "笔面试线上形式未核实。"
    }
  ],
  [
    "中科星图测控",
    {
      "ownership": "state",
      "aliases": [
        "中科星图测控技术股份有限公司",
        "星图测控"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "尚无全线上笔面试证据，央国企考核地点尤其需先问清。"
    }
  ],
  [
    "清昴智能",
    {
      "ownership": "private",
      "aliases": [
        "清昴智能科技（北京）有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "海外届别与全线上考核均待确认。"
    }
  ],
  [
    "深城交",
    {
      "ownership": "state",
      "aliases": [
        "深圳市城市交通规划设计研究中心股份有限公司",
        "深城交科技集团股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "未查到笔面试均可远程的明确承诺。"
    }
  ],
  [
    "苏纳光电",
    {
      "ownership": "private",
      "aliases": [
        "苏州苏纳光电有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "笔试/面试是否均线上待核。"
    }
  ],
  [
    "天锐星通",
    {
      "ownership": "private",
      "aliases": [
        "成都天锐星通科技有限公司",
        "成都天锐星通科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "批次及全线上笔面试均待核。"
    }
  ],
  [
    "什方科技",
    {
      "ownership": "private",
      "aliases": [
        "什方智造",
        "深圳市什方智造科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "只确认AI面试线上，其他轮次未明确，不能标全线上。"
    }
  ],
  [
    "庭宇科技",
    {
      "ownership": "private",
      "aliases": [
        "北京庭宇科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "正式/实习批次、海外资格、线上流程均需确认。"
    }
  ],
  [
    "江苏北人",
    {
      "ownership": "private",
      "aliases": [
        "江苏北人智能制造科技股份有限公司",
        "江苏北人机器人系统股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "未确认远程笔面试；推理部署能力要求须自评。"
    }
  ],
  [
    "广东辛孚科技",
    {
      "ownership": "private",
      "aliases": [
        "广东辛孚科技有限公司",
        "辛孚工业"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "尚无全程线上笔面试承诺，须先确认。"
    }
  ],
  [
    "金域医学",
    {
      "ownership": "private",
      "aliases": [
        "广州金域医学检验中心有限公司",
        "广州金域医学检验集团股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方JD未明确全部笔试面试线上；须先向招聘方确认。"
    }
  ],
  [
    "锦浪科技",
    {
      "ownership": "private",
      "aliases": [
        "Ginlong",
        "Solis",
        "锦浪科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "未发现该岗位全线上考试面试承诺。"
    }
  ],
  [
    "量智开物",
    {
      "ownership": "private",
      "aliases": [
        "IQI",
        "量智开物（北京）科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网流程仅技术交流/综合沟通，线上线下未明确。"
    }
  ],
  [
    "中欧基金",
    {
      "ownership": "foreign",
      "aliases": [
        "中欧基金管理有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "在线测评有公告线索，多轮面试及实习方式未确认。"
    }
  ],
  [
    "康龙化成",
    {
      "ownership": "private",
      "aliases": [
        "Pharmaron",
        "佰翱得（无锡）生物科学有限公司",
        "康龙化成（北京）新药技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "未核实全程线上，勿将全球招聘理解为远程面试承诺。"
    }
  ],
  [
    "诺禾致源",
    {
      "ownership": "private",
      "aliases": [
        "Novogene",
        "北京诺禾致源科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "校招申请入口可见；毕业窗口与线上笔面试待核。"
    }
  ],
  [
    "诺因智能",
    {
      "ownership": "foreign",
      "aliases": [
        "Knowin AI",
        "深圳诺因智能有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方岗位未说明全线上笔试/面试。"
    }
  ],
  [
    "共进股份（共进电子）",
    {
      "ownership": "state",
      "aliases": [
        "共进电子",
        "共进股份",
        "深圳市共进电子有限公司",
        "深圳市共进电子股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "网申开放不等于线上考核；招聘和现场调试安排须核实。"
    }
  ],
  [
    "振华研究院（贵阳）",
    {
      "ownership": "state",
      "aliases": [
        "振华研究院（贵阳）有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方校招JD未给考试面试形式，不能认定线上。"
    }
  ],
  [
    "芯耀辉",
    {
      "ownership": "private",
      "aliases": [
        "芯耀辉科技（上海）有限公司",
        "芯耀辉科技有限公司",
        "芯耀辉科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方岗位可申请；未见笔试及全部面试可线上完成的明确说明。"
    }
  ],
  [
    "它石智航 TARS",
    {
      "ownership": "foreign",
      "aliases": [
        "TARS",
        "上海它石智航技术有限公司",
        "它石智航"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网可网申和公开内推；笔试及全部面试是否允许远程未明确，不标全线上。"
    }
  ],
  [
    "星际天算",
    {
      "ownership": "private",
      "aliases": [
        "上海星际荣耀天基算力科技有限责任公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "高校公告及雇主猎聘页面已核；未明确远程笔试/面试安排。"
    }
  ],
  [
    "算能 SOPHGO",
    {
      "ownership": "private",
      "aliases": [
        "SOPHGO",
        "北京算能科技有限公司",
        "算丰",
        "青岛算能科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "2027公告明确线上笔试；面试地点/远程替代未明确，因此整体仍待核。"
    }
  ],
  [
    "辉羲智能",
    {
      "ownership": "private",
      "aliases": [
        "北京辉羲智能信息技术有限公司",
        "合肥辉羲智能科技有限公司",
        "辉羲智能科技"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方FAQ有部分岗位笔试，但未给出全部面试可远程的明确说明。"
    }
  ],
  [
    "联通支付",
    {
      "ownership": "state",
      "aliases": [
        "联通支付有限公司",
        "联通沃支付"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "雇主岗位在招，但没有明确全线上笔面试承诺；央国企尤需先核。"
    }
  ],
  [
    "杰华特",
    {
      "ownership": "foreign",
      "aliases": [
        "JoulWatt",
        "杰华特微电子股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网能投不代表远程考核，未取得全部笔面试方式证据。"
    }
  ],
  [
    "容百集团",
    {
      "ownership": "private",
      "aliases": [
        "Ronbay",
        "宁波容百新能源科技股份有限公司",
        "容百科技"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公告与岗位均未明确所有面试可线上；需确认远程流程。"
    }
  ],
  [
    "华银数科（华夏银行）",
    {
      "ownership": "state",
      "aliases": [
        "华银数字科技（北京）有限公司",
        "华银数科",
        "龙盈智达（北京）科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "2027官方公告未保证所有笔面试远程；海外毕业资格细节和亲属回避也须确认。"
    }
  ],
  [
    "分子之心",
    {
      "ownership": "foreign",
      "aliases": [
        "MoleculeMind",
        "分子之心（北京）科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网只确认招聘邮箱；27批次详细资格及远程笔面试须HR进一步确认。"
    }
  ],
  [
    "长飞光纤 YOFC",
    {
      "ownership": "foreign",
      "aliases": [
        "YOFC",
        "长飞光纤",
        "长飞光纤光缆股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "流程包含AI面试、业务面试、测评；业务面试是否可线上未明确，不能仅凭AI面试标全程线上。"
    }
  ],
  [
    "星使智算",
    {
      "ownership": "private",
      "aliases": [
        "Sidereus AI",
        "北京星使智算科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "能在线交简历不等于考核线上；具体职责、海外毕业细则及笔面试方式须HR确认。"
    }
  ],
  [
    "长城证券",
    {
      "ownership": "state",
      "aliases": [
        "华能资本长城证券",
        "长城证券股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "央企官网未明确笔试与全部面试是否远程；须确认仅线上可否完成，另核海外学历及本科岗位口径。"
    }
  ],
  [
    "中能智新",
    {
      "ownership": "state",
      "aliases": [
        "中能智新科技产业发展有限公司",
        "北京市中能智新科技产业发展有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方公告考试/综合面试但未明线上；海外学历窗口、入职通知后1个月报到与2027年1月毕业衔接均须确认。"
    }
  ],
  [
    "因诺资产",
    {
      "ownership": "private",
      "aliases": [
        "因诺(上海)资产管理有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "online",
      "channelEvidence": "官方入口已复核；原邮件入口保留在说明中，投递状态与排序未改。"
    }
  ],
  [
    "泛联新安",
    {
      "ownership": "private",
      "aliases": [
        "湖南泛联新安信息科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公开JD未明确笔试与面试方式，不能认定全线上。"
    }
  ],
  [
    "睿创微纳",
    {
      "ownership": "private",
      "aliases": [
        "烟台睿创微纳技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方岗位及校招公告未明确全部笔面试可远程。"
    }
  ],
  [
    "龙艺集团",
    {
      "ownership": "private",
      "aliases": [
        "上海龙艺企业管理集团有限责任公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "online",
      "channelEvidence": "官方2027校招页声明全流程线上，含线上测评和全国远程初面、高管终审；不等于远程办公。"
    }
  ],
  [
    "信锐",
    {
      "ownership": "private",
      "aliases": [
        "信锐技术",
        "深圳市信锐网科技术有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方JD支持远程线上面试；高校流程含线上/线下笔面，笔试能否远程仍需核实。"
    }
  ],
  [
    "中能拾贝",
    {
      "ownership": "private",
      "aliases": [
        "中能拾贝（广州）科技有限公司",
        "中能拾贝科技有限公司",
        "广州健新科技有限责任公司",
        "广州拾贝云科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "校园职位页面未明确笔面试形式；工作现场办公不等于面试必须现场。"
    }
  ],
  [
    "三未信安",
    {
      "ownership": "private",
      "aliases": [
        "三未信安科技股份有限公司",
        "山东三未信安信息科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网当前校招单岗未明确笔试和面试形式；线上投递不等于全程线上笔面试。"
    }
  ],
  [
    "福达新材",
    {
      "ownership": "private",
      "aliases": [
        "浙江福达合金材料科技有限公司",
        "福达合金",
        "福达合金材料股份有限公司",
        "福达新材料集团股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方单岗未明确笔面试方式；线上网申不代表全程远程。"
    }
  ],
  [
    "点触科技",
    {
      "ownership": "private",
      "aliases": [
        "厦门点触科技",
        "厦门点触科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方未明确笔面试方式；网申不等于全程线上。"
    }
  ],
  [
    "紫讯科技",
    {
      "ownership": "private",
      "aliases": [
        "福建紫讯信息科技有限公司",
        "紫讯技术",
        "紫讯技术（福建）股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "宣讲会现场面试与网申流程并存，远程面试是否可安排尚未确认。"
    }
  ],
  [
    "北方集成电路技术创新中心",
    {
      "ownership": "state",
      "aliases": [
        "北方集成电路创新中心",
        "北方集成电路技术创新中心(北京)有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网未明确笔试及面试线上/线下，海外毕业窗口也需HR确认；不能认定全程线上。"
    }
  ],
  [
    "潮流网络（杭州）",
    {
      "ownership": "private",
      "aliases": [
        "Grandstream",
        "深圳市潮流网络技术有限公司",
        "深圳市潮流网络技术有限公司杭州分公司",
        "潮流网络"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方及2027公告未明确笔面试线上线下；海外毕业窗口待核，不认定全程线上。"
    }
  ],
  [
    "Coremail（广东盈世/论客）",
    {
      "ownership": "private",
      "aliases": [
        "Coremail",
        "广东盈世计算机科技有限公司",
        "盈世",
        "论客",
        "论客科技(广州)有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方入口已复核；原邮件入口保留在说明中，投递状态与排序未改。"
    }
  ],
  [
    "小影科技",
    {
      "ownership": "private",
      "aliases": [
        "QuVideo",
        "小影",
        "杭州小影创新科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "Agent岗位未写笔面试模式；旧产品经理现场要求属于另岗，不能推定Agent全程线上。"
    }
  ],
  [
    "浙达能源",
    {
      "ownership": "private",
      "aliases": [
        "浙江浙达能源科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "杭电09-24岗位公告未明确笔试或面试形式；2027届窗口平台补充待企业核实。"
    }
  ],
  [
    "北京华科软（中国电建）",
    {
      "ownership": "state",
      "aliases": [
        "北京华科软科技有限公司",
        "华科软"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "电建官方2027招聘详情逐岗核验；未说明线上笔面试，海外资格待核。"
    }
  ],
  [
    "靖安科技",
    {
      "ownership": "private",
      "aliases": [
        "杭州靖安科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "2027岗位正文已核；原投递邮箱需登录查看，笔面试形式未知。"
    }
  ],
  [
    "徐工汽车",
    {
      "ownership": "state",
      "aliases": [
        "徐州徐工汽车科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "集团公告线上测评；具体笔试/面试未明，英语证书替代待核。"
    }
  ],
  [
    "仙工智能",
    {
      "ownership": "private",
      "aliases": [
        "SEER Robotics",
        "上海仙工智能科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网2027说明面试线上/线下；Rust要求未验证具备。"
    }
  ],
  [
    "图灵深视",
    {
      "ownership": "private",
      "aliases": [
        "TuringSenseAI",
        "图灵深视（苏州）科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网校招大模型岗位已核；27届窗口为平台补充，笔面试未知。"
    }
  ],
  [
    "图迹科技",
    {
      "ownership": "private",
      "aliases": [
        "Togeek",
        "杭州图迹科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "企业官网有校园方向；平台补充27届，需确认正式岗位及远程考核。"
    }
  ],
  [
    "阿丘科技",
    {
      "ownership": "private",
      "aliases": [
        "Aqrose",
        "北京阿丘科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网2027：线上笔试，但面试线上/线下，非已确认全程线上。"
    }
  ],
  [
    "爱科科技",
    {
      "ownership": "private",
      "aliases": [
        "IECHO",
        "杭州爱科科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网校招岗位可申请；27届高校索引补充，考核形式未明。"
    }
  ],
  [
    "德明利",
    {
      "ownership": "private",
      "aliases": [
        "TWSC",
        "深圳市德明利技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网岗位直接写2027；笔试/面试均未确认线上。"
    }
  ],
  [
    "金溢科技",
    {
      "ownership": "private",
      "aliases": [
        "Genvict",
        "深圳市金溢科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网2027岗位方向2与Agent匹配；考核形式未明确。"
    }
  ],
  [
    "海格通信",
    {
      "ownership": "state",
      "aliases": [
        "广州海格通信集团股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "2027公告：面试线上/线下，笔试未知，需确认海外远程安排。"
    }
  ],
  [
    "江波龙",
    {
      "ownership": "private",
      "aliases": [
        "Longsys",
        "深圳市江波龙电子股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "需笔试但形式未知；CET4硬门槛及雅思替代必须先确认。"
    }
  ],
  [
    "新产业生物",
    {
      "ownership": "private",
      "aliases": [
        "Snibe",
        "深圳市新产业生物医学工程股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网2027职责明确Agent/RAG；笔面试形式未明。"
    }
  ],
  [
    "交控科技",
    {
      "ownership": "private",
      "aliases": [
        "TCT",
        "交控科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方2027AI岗位；CV实战缺口及考核形式待核。"
    }
  ],
  [
    "航天软件",
    {
      "ownership": "state",
      "aliases": [
        "北京神舟航天软件技术股份有限公司",
        "神舟航天软件"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网明确2027AI全栈Agent职责；未说明线上笔面试或海外细节。"
    }
  ],
  [
    "东山精密",
    {
      "ownership": "private",
      "aliases": [
        "DSBJ",
        "苏州东山精密制造股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网AI工程师正文及高校2027简章已核；笔面试形式未知。"
    }
  ],
  [
    "易思维",
    {
      "ownership": "private",
      "aliases": [
        "ISV",
        "易思维（杭州）科技有限公司",
        "易思维（杭州）科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "企业2027高校公告及完整AI岗位交叉核验；官方入口抓取失败、薪酬和笔面试方式待确认。"
    }
  ],
  [
    "奔图科技（原纳思达）",
    {
      "ownership": "private",
      "aliases": [
        "Ninestar",
        "奔图科技股份有限公司",
        "纳思达",
        "纳思达股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "网申已核；部分岗位笔试，具体笔试/面试形式未说明，不保证全程线上。"
    }
  ],
  [
    "山东省商行联盟",
    {
      "ownership": "state",
      "aliases": [
        "山东商行联盟",
        "山东省城市商业银行合作联盟有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公告邮箱投递；笔试及面试形式未核，不把邮箱投递当全程线上。"
    }
  ],
  [
    "扬腾创新",
    {
      "ownership": "private",
      "aliases": [
        "CHT Group",
        "扬腾创新(福建)信息科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "新校招网申入口已核；笔面试形式待核。"
    }
  ],
  [
    "融通供应链（北京跃瀚）",
    {
      "ownership": "state",
      "aliases": [
        "北京跃瀚科技有限责任公司",
        "建信融通",
        "建信融通有限责任公司",
        "融通供应链"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方公告明确线上测评/笔试；双选会、综合面试能否远程未明，不保证全程线上。"
    }
  ],
  [
    "长川科技",
    {
      "ownership": "private",
      "aliases": [
        "CCTECH",
        "杭州长川科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "部分岗位AI笔面试；业务面/综合面形式未明。"
    }
  ],
  [
    "山东世纪阳光纸业集团",
    {
      "ownership": "private",
      "aliases": [
        "Sunshine Paper",
        "世纪阳光纸业",
        "山东世纪阳光纸业集团有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "网申入口已核；初面/笔试/复试形式未明，线上宣讲不等于线上考核。"
    }
  ],
  [
    "北京航天情报与信息研究所（208所）",
    {
      "ownership": "state",
      "aliases": [
        "北京航天情报与信息研究所",
        "航天二院208所",
        "航天科工二院208所"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公告提供邮箱投递；测评及两轮面试形式未核，不保证线上。"
    }
  ],
  [
    "OBSBOT寻影（睿魔智能）",
    {
      "ownership": "private",
      "aliases": [
        "OBSBOT",
        "寻影",
        "睿魔智能",
        "睿魔智能科技(深圳)有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方校招入口已核；笔面试方式本轮未核。"
    }
  ],
  [
    "湖南日望科技集团（澳德信息）",
    {
      "ownership": "private",
      "aliases": [
        "日望科技集团",
        "湖南日望科技集团有限公司",
        "湖南澳德信息科技有限公司",
        "湖南澳德信息股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "高校企业单岗已核；笔面试形式本轮未核。"
    }
  ],
  [
    "华兴源创",
    {
      "ownership": "private",
      "aliases": [
        "HY C",
        "HYC",
        "苏州华兴源创科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公告给出钉钉网申；笔面试形式未核。"
    }
  ],
  [
    "同元软控",
    {
      "ownership": "private",
      "aliases": [
        "同元",
        "苏州同元软控信息技术有限公司",
        "苏州同元软控技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "校招公告已核；笔面试形式未核。"
    }
  ],
  [
    "芯碁微装",
    {
      "ownership": "private",
      "aliases": [
        "CFMEE",
        "合肥芯碁微电子装备股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "高校企业校招及AI应用岗位已核；考核形式未核。"
    }
  ],
  [
    "浩鲸科技",
    {
      "ownership": "private",
      "aliases": [
        "iwhalecloud",
        "Whale Cloud",
        "浩鲸云计算科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方北森网申可查；考核形式本轮未核。"
    }
  ],
  [
    "长园深瑞",
    {
      "ownership": "private",
      "aliases": [
        "深瑞",
        "长园深瑞继保自动化有限公司",
        "长园科技集团股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "企业官方北森入口已核；笔面试方式未核，不保证线上。"
    }
  ],
  [
    "数马电子",
    {
      "ownership": "private",
      "aliases": [
        "Xhorse",
        "深圳数马电子技术有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "2027校招与Agent岗位已核；考核形式未核。"
    }
  ],
  [
    "亿联网络",
    {
      "ownership": "private",
      "aliases": [
        "Yealink",
        "厦门亿联网络技术股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方北森校园入口；招聘流程含在线笔试，面试形式未核。"
    }
  ],
  [
    "国机数科",
    {
      "ownership": "state",
      "aliases": [
        "SINOMACH Digital",
        "国机数字科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "企业智联校园职位正文明确2027届；未投递或登录。"
    }
  ],
  [
    "芯元时代",
    {
      "ownership": "private",
      "aliases": [
        "AGISILICON",
        "芯元时代(上海)科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方职位明确2027应届；考核方式未核。"
    }
  ],
  [
    "网宿科技",
    {
      "ownership": "private",
      "aliases": [
        "Wangsu",
        "网宿",
        "网宿科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "企业牛客公开校招正文已核，未登录或投递。"
    }
  ],
  [
    "路特创新",
    {
      "ownership": "private",
      "aliases": [
        "Momcozy",
        "ROOT GLOBAL",
        "ROOT路特",
        "深圳市路特创新科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网岗位有2027届RAG/Agent职责；未确认笔面试方式，不标已证实线上。"
    }
  ],
  [
    "东方芯港集成",
    {
      "ownership": "state",
      "aliases": [
        "上海东方芯港集成电路有限公司",
        "芯港集成"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "招聘流程含网申/内推、测评、面试；线上线下未明。"
    }
  ],
  [
    "芯联集成",
    {
      "ownership": "private",
      "aliases": [
        "SMEC",
        "中芯集成",
        "绍兴中芯集成电路制造股份有限公司",
        "芯联集成电路制造股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "校招和岗位已核实；面试方式未明，不声称全流程线上。"
    }
  ],
  [
    "祥承通讯",
    {
      "ownership": "private",
      "aliases": [
        "XC-TECH",
        "上海祥承通讯技术有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "未公布笔面试线上/线下；只收集不投递。"
    }
  ],
  [
    "竞技世界",
    {
      "ownership": "private",
      "aliases": [
        "JJ斗地主",
        "JJ比赛",
        "竞技世界（北京）网络技术有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公告列笔试和面试，线上线下未明。"
    }
  ],
  [
    "赛豆科技（AIVA）",
    {
      "ownership": "private",
      "aliases": [
        "AIVA汽车",
        "赛豆科技",
        "重庆赛豆科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "校招及岗位已核；面试方式未公布，不声称确认全流程线上。"
    }
  ],
  [
    "通达海",
    {
      "ownership": "private",
      "aliases": [
        "TDH",
        "南京通达海信息技术有限公司",
        "南京通达海科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "2027校园和AI岗位已核，笔面试方式未明。"
    }
  ],
  [
    "佳期投资",
    {
      "ownership": "private",
      "aliases": [
        "JQ Investments",
        "上海佳期投资管理有限公司",
        "上海佳期私募基金管理有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方2027校招Agent研发职位可见；线上考试与面试未核验。"
    }
  ],
  [
    "智网数科（国家管网）",
    {
      "ownership": "state",
      "aliases": [
        "北京智网数科技术有限公司",
        "国家管网集团北京智网数科公司",
        "国家管网集团北京智网数科技术有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方明确线上笔试；面试方式未明，时间地点另行通知。"
    }
  ],
  [
    "海目星",
    {
      "ownership": "private",
      "aliases": [
        "海目星激光",
        "海目星激光科技集团股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "笔试面试方式未公布，须确认线上安排。"
    }
  ],
  [
    "汇中仪表",
    {
      "ownership": "private",
      "aliases": [
        "汇中仪表股份有限公司",
        "汇中股份"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "笔试面试方式未公布，须确认线上安排。"
    }
  ],
  [
    "景嘉微",
    {
      "ownership": "private",
      "aliases": [
        "景嘉微电子",
        "长沙景嘉微电子股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "校招公告未明确笔试面试线上或线下。"
    }
  ],
  [
    "斯维尔（中建科创）",
    {
      "ownership": "state",
      "aliases": [
        "斯维尔科技",
        "深圳市斯维尔科技股份有限公司",
        "深圳斯维尔"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "明确线上测评；两轮面试方式未公布。"
    }
  ],
  [
    "亿嘉和",
    {
      "ownership": "private",
      "aliases": [
        "亿嘉和科技股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "笔试面试方式未公布。"
    }
  ],
  [
    "方舟健客（方舟云康）",
    {
      "ownership": "private",
      "aliases": [
        "广州方舟云康信息科技集团有限公司",
        "广州方舟医药有限公司",
        "方舟云康",
        "方舟健客集团"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方面试站点未填写，线上方式未核实。"
    }
  ],
  [
    "江苏金融租赁",
    {
      "ownership": "state",
      "aliases": [
        "江苏金租",
        "江苏金融租赁股份有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "包含实习体验考察；笔试面试及实习能否远程未核实，不标全线上。"
    }
  ],
  [
    "创维数字",
    {
      "ownership": "private",
      "aliases": [
        "创维数字股份有限公司",
        "创维集团",
        "深圳创维数字技术有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官方未明确笔面试方式，线上可行性待确认。"
    }
  ],
  [
    "恒湾科技",
    {
      "ownership": "private",
      "aliases": [
        "ZILLNK",
        "四川恒湾科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "未明确笔面试方式，不能认定全程线上。"
    }
  ],
  [
    "诗裴丝（浙江浩迈）",
    {
      "ownership": "private",
      "aliases": [
        "Spes诗裴丝",
        "Spēs",
        "浙江浩迈科技有限公司",
        "诗裴丝"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "岗位未公开笔面试方式，线上流程未核实。"
    }
  ],
  [
    "四方继保（四方股份）",
    {
      "ownership": "private",
      "aliases": [
        "北京四方继保自动化股份有限公司",
        "四方继保",
        "四方股份"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网写在线笔试；面试方式未公开，不能认定全程线上。"
    }
  ],
  [
    "方正微电子",
    {
      "ownership": "state",
      "aliases": [
        "FMIC",
        "深圳方正微电子有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公开流程未明确线上或线下面试。"
    }
  ],
  [
    "大连工业软件创新发展研究院",
    {
      "ownership": "public",
      "aliases": [
        "大连工业软件创新研究院",
        "大连工业软件研究院"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "公告明确线上/线下面试路径；是否可全程线上需招聘方确认，非强制线下已知。"
    }
  ],
  [
    "上海芯源创新中心",
    {
      "ownership": "public",
      "aliases": [
        "芯源创新中心"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网有现场宣讲和邮箱投递，一二面方式未明确，不能声称已确认线上。"
    }
  ],
  [
    "博道基金",
    {
      "ownership": "private",
      "aliases": [
        "博道基金管理有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "面试方式未明确，实习转正路径和能否全程线上需确认；未绕过官网证书安全警告。"
    }
  ],
  [
    "牧星科技（杭州）",
    {
      "ownership": "private",
      "aliases": [
        "杭州牧星科技"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "高校企业发布校招原文未明确线上/线下面试，需确认。"
    }
  ],
  [
    "费曼智核",
    {
      "ownership": "state",
      "aliases": [
        "Phibotics",
        "深圳费曼智核"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "官网未明确笔试面试方式；仅标待核验，不声称全程线上。"
    }
  ],
  [
    "启望精密",
    {
      "ownership": "private",
      "aliases": [
        "北京启望精密光学科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "招聘原文未明确笔试面试方式，需确认可全程线上。"
    }
  ],
  [
    "北太振寰",
    {
      "ownership": "private",
      "aliases": [
        "北太天元",
        "北太振寰（重庆）科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "线下宣讲不等于线下面试，实际笔试面试未公布。"
    }
  ],
  [
    "巨鲨医疗",
    {
      "ownership": "private",
      "aliases": [
        "南京巨鲨显示科技有限公司",
        "巨鲨"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "校招原文未明确线上/线下面试。"
    }
  ],
  [
    "艾飞智控",
    {
      "ownership": "private",
      "aliases": [
        "AiFly",
        "深圳市艾飞智控科技有限公司"
      ],
      "firstSeenDate": "2026-09-27",
      "channel": "verify",
      "channelEvidence": "本届官方公告未明确全程线上，面试方式需确认，不能把宣讲现场安排当作必须线下面试。"
    }
  ]
]);

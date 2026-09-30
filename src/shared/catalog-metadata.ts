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
  ],

  // Synced public metadata; no application status is included.
  ["中国石化",{"ownership":"state","aliases":["Sinopec","中国石油化工集团有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"中国石化官方2027校招职位列表在线展示；具体岗位资格和截止时间待官方核验。"}],
  ["AIA Digital+（友邦资讯科技）",{"ownership":"foreign","aliases":["AIA Digital+","AIA TSS","友邦资讯科技"],"firstSeenDate":"2026-09-29","channel":"none","channelEvidence":"招聘信息来自用户提供的公众号文章及公开招聘页；未核实官方申请入口。"}],
  ["汤氏集团（浙江汤氏供应链）",{"ownership":"foreign","aliases":["汤氏集团","浙江汤氏供应链管理有限公司"],"firstSeenDate":"2026-09-29","channel":"none","channelEvidence":"用户提供公众号招聘线索；第三方校招索引佐证2027岗位名称，官方申请状态和入口待核。"}],
  ["飞派科技",{"ownership":"private","aliases":["FlyPai","广州飞派科技"],"firstSeenDate":"2026-09-29","channel":"none","channelEvidence":"民营企业普通招聘入口；面试形式未核验"}],
  ["快递100（前海百递）",{"ownership":"private","aliases":["前海百递","快递100","深圳前海百递网络有限公司"],"firstSeenDate":"2026-09-29","channel":"none","channelEvidence":"民营企业；正式投递入口与面试形式待官方公众号核验"}],
  ["诺瓦星云",{"ownership":"private","aliases":["NovaStar","西安诺瓦星云科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"none","channelEvidence":"民营上市公司校招门户；面试形式未核验"}],
  ["瑞泊（XrayBot）",{"ownership":"private","aliases":["XrayBot","瑞泊","瑞泊VIDYA"],"firstSeenDate":"2026-09-29","channel":"none","channelEvidence":"民营AI公司邮件投递；面试形式未核验"}],
  ["海富通基金",{"ownership":"foreign","aliases":["HFT Fund","海富通基金管理有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方岗位页未说明笔试、面试形式，不能判定全程线上。"}],
  ["非凸科技",{"ownership":"private","aliases":["FT Tech","上海非凸智能科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"仅确认校招开启，面试形式未公开，需向官方确认线上安排。"}],
  ["杭州睿琪软件（Glority）",{"ownership":"foreign","aliases":["Glority","Glority Software","杭州睿琪软件有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开岗位及公众号索引未说明笔面试形式，需确认能否全程线上。"}],
  ["龙盛研究院（浙江龙盛）",{"ownership":"public","aliases":["Lonsen","浙江龙盛","浙江龙盛集团股份有限公司","龙盛研究院"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公告确认邮箱投递，但未公开笔试、各轮面试是否支持全程线上，投递前需向联系人确认。"}],
  ["南京信人智能科技",{"ownership":"private","aliases":["NBBBOSS","信人智能","南京信人智能科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开公告未披露笔面试形式，需确认能否全程线上。"}],
  ["上海九同方技术",{"ownership":"private","aliases":["上海九同方技术有限公司","九同方","湖北九同方微电子有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"未找到可靠的线上/线下面试说明，需投递前向招聘方确认。"}],
  ["泓京纬",{"ownership":"private","aliases":["泓京纬科技","深圳市泓京纬科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"流程已公开但各轮线上/线下形式未公开，需确认能否远程完成。"}],
  ["五新智能装备",{"ownership":"public","aliases":["UNIROC","五新智能","湖南五新智能装备集团股份有限公司"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"投递渠道含公众号/邮箱和线下宣讲；公开资料未确认面试能否全程线上，需提前说明仅能线上参加。"}],
  ["中国电气装备科学技术研究院",{"ownership":"state","aliases":["中国电气装备科学技术研究院有限公司","中国电气装备集团科学技术研究院","中国电装科学技术研究院"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开简章未明确笔试和面试是否全程线上，投递前需向招聘方确认。"}],
  ["海颐软件",{"ownership":"state","aliases":["东方电子海颐软件","烟台海颐软件股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开资料未披露面试形式，需确认能否全程线上。"}],
  ["乐动机器人",{"ownership":"public","aliases":["LDROBOT","深圳乐动机器人股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方职位页未说明面试是否支持全程远程，需投递前确认。"}],
  ["梅特勒托利多",{"ownership":"foreign","aliases":["METTLER TOLEDO","梅特勒-托利多","梅特勒托利多国际贸易（上海）有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网未明确校招面试形式，需确认能否全程线上。"}],
  ["华苏科技",{"ownership":"private","aliases":["南京华苏科技有限公司","江苏华苏科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开原文未说明面试形式，需先确认线上安排。"}],
  ["迈安德集团",{"ownership":"private","aliases":["迈安德","迈安德集团有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开简章未说明笔面试线上/线下，需确认。"}],
  ["红茶移动",{"ownership":"private","aliases":["Redtea Mobile","深圳红茶移动科技有限公司","红茶移动科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"未找到可靠的线上面试说明，投递前确认。"}],
  ["百子尖科技集团",{"ownership":"private","aliases":["杭州百子尖科技股份有限公司","百子尖科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"仅核到投递入口，面试形式需向招聘方确认。"}],
  ["弋途科技",{"ownership":"private","aliases":["上海弋途科技有限公司","弋途"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公众号未披露完整面试形式，需确认线上安排。"}],
  ["云幕智造",{"ownership":"private","aliases":["云幕智能","苏州云幕智造科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开简章未说明面试渠道，投递前需确认。"}],
  ["卡本科技",{"ownership":"private","aliases":["卡本","卡本科技集团股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"未公开笔面试形式，需先确认全程线上可行性。"}],
  ["极飞科技",{"ownership":"private","aliases":["XAG","广州极飞科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招入口未说明面试是否全程线上，需投递前确认。"}],
  ["长虹控股集团",{"ownership":"state","aliases":["四川长虹","四川长虹电子控股集团有限公司","长虹集团"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开招聘页未给出全程线上承诺，央国企流程需重点确认线下环节。"}],
  ["东方算芯",{"ownership":"private","aliases":["EcosDA","上海东方算芯科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方入口未说明面试方式，需确认是否可线上完成。"}],
  ["无问芯穹",{"ownership":"private","aliases":["Infinigence AI","上海无问芯穹智能科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网未披露笔面试形式，需确认。"}],
  ["华橙网络",{"ownership":"private","aliases":["Imou","乐橙","杭州华橙网络科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开信息未确认面试形式，需投递前确认。"}],
  ["久远银海",{"ownership":"public","aliases":["四川久远银海软件股份有限公司","银海软件"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"移动端招聘入口未披露面试方式，需确认线上可行性。"}],
  ["树根科技",{"ownership":"private","aliases":["iROOTECH","树根互联","树根互联股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招页未给出面试渠道，需确认。"}],
  ["知象光电",{"ownership":"private","aliases":["Revopoint","西安知象光电科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方投递入口未说明面试形式，需尽快确认并投递。"}],
  ["萤石网络",{"ownership":"public","aliases":["EZVIZ","杭州萤石网络股份有限公司","萤石"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招入口未承诺全程线上，需投递前确认。"}],
  ["山河智能",{"ownership":"state","aliases":["SUNWARD","山河智能装备股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"央国企类流程未公开线上/线下安排，需重点核实。"}],
  ["道一云",{"ownership":"private","aliases":["Do1","广东道一信息技术股份有限公司","道一信息"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公众号公开简章未说明面试形式，需确认。"}],
  ["飞毛腿动力科技",{"ownership":"private","aliases":["福建飞毛腿动力科技有限公司","飞毛腿集团"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"在线投递可用，但面试形式未公开。"}],
  ["上能电气",{"ownership":"public","aliases":["Sineng Electric","上能电气股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方入口未说明面试是否全程线上，需确认。"}],
  ["麒麟信安",{"ownership":"public","aliases":["KylinSec","湖南麒麟信安科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网未公布全程线上安排，需提前确认。"}],
  ["优旦科技",{"ownership":"private","aliases":["优旦","安徽优旦科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开信息未说明笔面试方式，需确认。"}],
  ["思特奇",{"ownership":"public","aliases":["STQ","北京思特奇信息技术股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"招聘入口未披露各轮形式，需确认能否线上完成。"}],
  ["飞算数智",{"ownership":"private","aliases":["飞算科技","飞算科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招页未说明笔面试形式，需投递前确认能否线上完成。"}],
  ["得一微电子",{"ownership":"private","aliases":["Yeestor","深圳市得一微电子有限责任公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方职位未说明笔面试方式，需确认。"}],
  ["武汉噢易云计算",{"ownership":"private","aliases":["OS-EASY","噢易云","武汉噢易云计算股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开流程含笔试、初面和终面但未注明线上或线下，需确认。"}],
  ["上海银行",{"ownership":"state","aliases":["Bank of Shanghai","上海银行股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"银行类招聘未在职位页承诺全程线上，笔试和面试形式需重点确认。"}],
  ["稳健医疗",{"ownership":"public","aliases":["Winner Medical","崇阳稳健","稳健医疗用品股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方岗位未说明笔面试方式，需确认。"}],
  ["南芯科技",{"ownership":"public","aliases":["Southchip","上海南芯半导体科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开职位未说明面试形式，需确认。"}],
  ["紫光同芯",{"ownership":"private","aliases":["TsinghuaIC","紫光同芯微电子有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"央国企背景芯片企业流程未注明线上/线下，需重点确认。"}],
  ["电科思仪",{"ownership":"state","aliases":["Ceyear","中电科思仪科技股份有限公司","中电科电科思仪股份有限公司","电科思仪科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"央企招聘公告未承诺全程线上，笔试及面试地点需重点确认。"}],
  ["理工雷科",{"ownership":"public","aliases":["Racobit","北京理工雷科电子信息技术有限公司","雷科防务"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"招聘流程公开但未注明各轮线上或线下，需提前确认。"}],
  ["未尔科技",{"ownership":"private","aliases":["北京未尔锐创科技有限公司","北京未尔锐创科技股份有限公司","未尔锐创"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开信息未说明面试形式，军工工业软件场景需重点确认是否支持线上。"}],
  ["富创精密",{"ownership":"public","aliases":["富创精密设备","沈阳富创精密设备股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"高校就业网明确写明视频面试，属于目前证据清晰的线上面试岗位。"}],
  ["星龙数智",{"ownership":"private","aliases":["北京星龙数智科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开岗位未说明面试形式，需确认。"}],
  ["豹趣科技",{"ownership":"private","aliases":["Cheetah Fun","珠海豹趣科技有限公司"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"校招宣讲安排现场笔试并次日面试，但在线表单可投；异地批次是否支持线上需确认。"}],
  ["飞腾信息技术",{"ownership":"state","aliases":["Phytium","天津飞腾信息技术有限公司","飞腾","飞腾信息技术有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"央国企类官方岗位未承诺全程线上，需重点确认。"}],
  ["云览科技",{"ownership":"foreign","aliases":["CloudView","成都云览科技有限公司"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"官网明确面试原则上以线上为主，部分岗位或终轮可能安排线下沟通。"}],
  ["飞亚达",{"ownership":"state","aliases":["FIYTA","飞亚达精密科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"高校发布的官方校招简章流程明确为线上测评、线上单面。"}],
  ["星宸科技",{"ownership":"public","aliases":["SigmaStar","星宸科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方岗位未说明面试形式，需在投递前确认是否支持全程线上。"}],
  ["秩益科技",{"ownership":"private","aliases":["Rankyee","苏州秩益科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开招聘页未说明面试形式，需确认。"}],
  ["邯郸制药",{"ownership":"private","aliases":["邯郸制药股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"招聘简章未说明笔试和面试是否全程线上，需确认。"}],
  ["中新赛克",{"ownership":"public","aliases":["Sinovatio","深圳市中新赛克科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"流程为网申、AI筛选、专业技术面试、综合面试；公告未确认面试形式，需询问是否线上。"}],
  ["苏仁智能",{"ownership":"private","aliases":["深圳市苏仁智能科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校招聘简章未披露面试方式，需确认是否支持全程线上。"}],
  ["天津小橙集团",{"ownership":"private","aliases":["天津小橙集团有限公司","小橙集团"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"邮件投递岗位未说明面试形式，需确认。"}],
  ["株洲齿轮",{"ownership":"state","aliases":["株洲齿轮有限责任公司","株齿","潍柴株齿"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开岗位未明确笔面试是否支持全程线上，央国企类流程需重点确认。"}],
  ["研极微电子",{"ownership":"private","aliases":["杭州研极微电子有限公司","研极"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招信息未说明面试形式，需确认。"}],
  ["智辰半导体",{"ownership":"private","aliases":["Smartera Semiconductor","智辰半导体（深圳）有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网未承诺全程线上面试，需确认；岗位以官方校招入口实时列表为准。"}],
  ["POVISON",{"ownership":"private","aliases":["Povis Home","Povison"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"公开校招说明为线上/线下结合，具体以通知为准；若只能线上需先向HR确认。"}],
  ["古茗",{"ownership":"private","aliases":["古茗科技集团有限公司","古茗茶饮"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方网申可在线投递，但笔面试方式未公开，需确认。"}],
  ["镁信健康",{"ownership":"private","aliases":["MedTrust Health","上海镁信健康科技集团股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招入口未公开全程线上承诺，需确认。"}],
  ["倍漾量化",{"ownership":"private","aliases":["倍漾私募基金管理（南京）有限公司"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"过往流程明确线上笔试与线上技术面，终面形式未承诺；需确认2027批次是否全程线上。"}],
  ["美象信息",{"ownership":"private","aliases":["美象信息科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网招聘页未说明面试形式，需确认。"}],
  ["燕山AI",{"ownership":"private","aliases":["YANSHAN.AI","长沙燕山科技有限公司"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"公开简章明确前期面试全程线上，但终试邀请到长沙并报销路费；只能线上者需先确认能否远程终试。"}],
  ["炎魂网络",{"ownership":"private","aliases":["Panda Studio","杭州炎魂网络科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招站未公开全程线上承诺，需确认。"}],
  ["天马微电子",{"ownership":"state","aliases":["Tianma","天马微电子股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"央企校招公告未确认全部笔面试线上，需重点向HR核验。"}],
  ["晟通集团",{"ownership":"private","aliases":["SNTON","晟通科技集团有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网和校招材料未说明面试形式，需确认是否全程线上。"}],
  ["易方达基金",{"ownership":"private","aliases":["E Fund","易方达基金管理有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开简章明确有统一笔试和不超过两周的实习考察，但未说明是否均可线上完成；只能线上者应先向招聘方确认。"}],
  ["算苗科技",{"ownership":"private","aliases":["SUNMMIO","算苗科技（北京）有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招简章未说明笔试或面试形式，需向HR确认是否全程线上。"}],
  ["中电科数字",{"ownership":"state","aliases":["中国电科32所","中电科数字技术股份有限公司","中电科数字科技（集团）有限公司","华东计算技术研究所","电科数字"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"公司官方FAQ明确会根据实际情况安排现场或视频面试，不能保证全程线上，投递前需确认。"}],
  ["中电鸿信",{"ownership":"state","aliases":["中电鸿信信息科技有限公司","江苏电信数据和AI发展中心"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公告仅列笔试、面试和体检流程，未说明线上或线下，需重点核验。"}],
  ["坤维科技",{"ownership":"private","aliases":["坤维传感","常州坤维传感科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校园招聘信息未说明面试形式，需确认是否可全程线上。"}],
  ["GOC",{"ownership":"private","aliases":["Global OneClick","出海一叮科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招信息未说明笔试面试形式，需确认是否支持全程线上。"}],
  ["瑞创达",{"ownership":"private","aliases":["东方瑞创达","烟台东方瑞创达电子科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"招聘公告未公开笔试面试形式，需向HR确认。"}],
  ["宁银消金",{"ownership":"private","aliases":["宁波银行消费金融","浙江宁银消费金融股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公告列出初面、笔试测评、复试及终面，但未说明线上或线下，需确认。"}],
  ["巡天千河",{"ownership":"private","aliases":["上海巡天千河空间技术有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开流程仅写初试预约和复试，未说明线上或线下，需确认。"}],
  ["乐享元游",{"ownership":"private","aliases":["元游信息","海南元游信息技术有限公司广州分公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开岗位页未说明笔试面试形式，需确认是否全程线上。"}],
  ["贝瑞文化",{"ownership":"private","aliases":["贝瑞文化创意有限公司","重庆贝瑞文化"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校招聘公告未披露面试形式，需向招聘方确认。"}],
  ["CET中电技术",{"ownership":"state","aliases":["中电电力技术","深圳市中电电力技术股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"招聘简章未公开笔面试形式，央企背景岗位需重点核验是否支持线上。"}],
  ["华泰资产",{"ownership":"foreign","aliases":["Huatai Asset Management","华泰资产管理有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招信息未说明面试形式，需确认；其控股股东华泰保险集团的实际控制人为安达集团，故按外企归类。"}],
  ["东方财富",{"ownership":"private","aliases":["Eastmoney","东方财富信息股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招信息未明确笔试和面试是否全程线上，需投递前确认。"}],
  ["申万菱信基金",{"ownership":"state","aliases":["SWM MU Fund","申万菱信基金管理有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"流程含笔试、面试与后续实习考察，公告未明确线上支持；仅能线上需先向HR核实。"}],
  ["中国银保信",{"ownership":"state","aliases":["CBIT","中国银行保险信息技术管理有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方只披露笔试、测评和面试流程，未写形式；央国企岗位必须先确认能否线上。"}],
  ["宁波通商银行",{"ownership":"state","aliases":["NCBANK","宁波通商银行股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方仅写10至12月笔面试及高管面试，未说明形式；银行岗位需先核验线上支持。"}],
  ["达坦能源",{"ownership":"foreign","aliases":["Tartan Energy","上海达坦能源科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网列岗但未说明校招笔面试形式，需确认能否全程线上；公司源自加拿大集团，按外企归类。"}],
  ["胜软科技",{"ownership":"private","aliases":["VictorySoft","山东胜软科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开流程含线上空宣或线下宣讲、测评和AI面试，但未承诺甄选全程线上，需确认。"}],
  ["上海航天电子技术研究所",{"ownership":"state","aliases":["中国航天科技集团上海航天电子技术研究所","航天八院电子所"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"第三方聚合页未披露笔面试形式；央企科研院所岗位必须先确认是否允许全程线上。"}],
  ["中昊芯英",{"ownership":"private","aliases":["TsingMicro","中昊芯英（杭州）科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开岗位表未说明面试形式，需投递前确认线上支持。"}],
  ["速境智能实验室",{"ownership":"private","aliases":["SIL","Speediance","Speediance AI","深圳市速境生活科技有限公司","速境智能"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招页未说明面试形式，需邮件确认是否可全程线上。"}],
  ["AlayaDB.AI",{"ownership":"private","aliases":["AlayaDB","AlayaDB AI"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方只说明3至4轮面试，未明确线上；需邮件确认全程远程面试支持。"}],
  ["未岚大陆",{"ownership":"private","aliases":["Navimow","未岚大陆(北京)科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招流程写笔试/面试但未说明形式，需确认能否全程线上。"}],
  ["白杨智能",{"ownership":"private","aliases":["Baiyang AI"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开招聘入口未说明笔试面试形式，须向HR确认是否支持全流程线上。"}],
  ["遨森电商",{"ownership":"private","aliases":["Aosom","遨森电子商务股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方入口未公开本岗位面试形式，须向HR确认是否全线上。"}],
  ["成都航天通信",{"ownership":"state","aliases":["成都航天","成都航天通信设备有限责任公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"流程只写综合面试，未说明线上或线下；央企岗位必须先电话或邮件确认能否全流程线上。"}],
  ["怀信科技",{"ownership":"private","aliases":["Wellthinic","上海怀信智能科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027公开信息未说明面试形式；2026批次标注ONSITE仅能说明办公地点，不能推断本批面试，须确认。"}],
  ["中移园区建设",{"ownership":"state","aliases":["中国移动信息港中心","中国移动通信有限公司信息港中心","中移园区建设发展有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开招聘信息未说明笔试和面试形式；央企岗位必须在投递前向HR确认线上安排。"}],
  ["汇添富基金",{"ownership":"public","aliases":["HTF Fund","汇添富基金管理股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方职位页未公开笔试和面试形式，投递前需确认能否线上完成。"}],
  ["光轮智能",{"ownership":"private","aliases":["Lightwheel","光轮智能（北京）科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招信息仅写网申和面试，未说明线上或线下，须确认。"}],
  ["Style3D",{"ownership":"private","aliases":["Linctex","凌迪科技","浙江凌迪数字科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开流程为初试、复试、终面，未披露形式，须先确认线上安排。"}],
  ["钛虎机器人",{"ownership":"private","aliases":["TI5 Robot","钛虎机器人科技（上海）有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校园招聘页未披露面试形式，须在投递前确认是否支持全线上。"}],
  ["黑格科技",{"ownership":"private","aliases":["HeyGears","广州黑格智造信息科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方岗位入口未披露面试形式，须向招聘方确认全线上可能性。"}],
  ["万国数据",{"ownership":"public","aliases":["GDS","GDS Holdings","万国数据服务有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开招聘信息未说明笔试和面试形式，须先确认。"}],
  ["爱建证券",{"ownership":"state","aliases":["爱建证券有限责任公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方校招页未公开面试形式；国企金融机构须在投递前确认是否支持线上。"}],
  ["恒达智控",{"ownership":"state","aliases":["郑州恒达智控科技股份有限公司","郑煤机智控"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"招聘入口未说明面试方式，央国企岗位须向HR确认。"}],
  ["深圳华强",{"ownership":"public","aliases":["深圳华强实业股份有限公司","深圳华强电子网集团股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"工作模式标注onsite只代表办公要求；招聘流程未说明面试线上或线下，须确认。"}],
  ["东方有线",{"ownership":"state","aliases":["OCN","东方有线网络有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招信息未披露笔试和面试形式；上海地方国企需向HR确认是否支持全线上。"}],
  ["上海华力",{"ownership":"state","aliases":["上海华力集成电路制造有限公司","华力微电子"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开招聘流程仅写在线测评和多轮面试，未明确面试是否可全程线上，须向HR确认。"}],
  ["卡特彼勒中国",{"ownership":"foreign","aliases":["Caterpillar","卡特彼勒","卡特彼勒（中国）投资有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方职位页未明确笔试和面试形式；海外候选人是否支持全程线上须确认。"}],
  ["上海瓴阅教育科技",{"ownership":"private","aliases":["上海瓴阅","瓴阅教育"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"JD提及远程工作环境，但未等同于全程线上面试"}],
  ["神州数码融信软件",{"ownership":"private","aliases":["神州数码融信","神州数码融信软件有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"国家平台未说明面试形式"}],
  ["吉祥航空",{"ownership":"private","aliases":["Juneyao Air","上海吉祥航空股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方招聘页未说明面试形式"}],
  ["中创实",{"ownership":"private","aliases":["中创实（北京）科技有限公司","中创实北京"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校岗位页未给面试形式，且当前开放状态需复核"}],
  ["中电科网络安全",{"ownership":"state","aliases":["中电科网安","中电科网络安全科技股份有限公司","卫士通"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方2027校招职位页未说明笔面试形式"}],
  ["中科天算",{"ownership":"private","aliases":["中科天算科技","北京中科天算科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027校招公告未说明笔面试形式"}],
  ["东风奕派科技",{"ownership":"state","aliases":["东风奕派","东风奕派汽车科技公司","东风奕派汽车科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027全球校招公告未说明笔面试形式"}],
  ["星际悦动",{"ownership":"private","aliases":["usmile","广州星际悦动股份有限公司","星际悦动股份"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方招聘站及高校校招公告未说明笔面试形式"}],
  ["世纪华通",{"ownership":"private","aliases":["ST华通","世纪华通集团","浙江世纪华通集团股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招公告未说明统一笔面试形式"}],
  ["Sharpa",{"ownership":"foreign","aliases":["Sharpa Robotics","上海大裂谷智能科技有限公司","大裂谷智能"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方职位站与校招公告未说明统一笔面试形式"}],
  ["富兰瓦时",{"ownership":"foreign","aliases":["Franklin Whole Home","FranklinWH","深圳市富兰瓦时技术有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校发布的2027校招简章未说明笔面试形式"}],
  ["思谋科技",{"ownership":"private","aliases":["SmartMore","思谋智能","深圳思谋信息科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公告说明部分岗位笔试和2-3轮技术面试，但未说明线上或线下"}],
  ["未来光谱科技",{"ownership":"private","aliases":["WLGPT","未来光谱","杭州未来光谱科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官网说明笔试、技术面和HR面，未说明线上或线下；实习要求线下"}],
  ["元征科技",{"ownership":"public","aliases":["LAUNCH TECH","元征","元征科技股份有限公司","深圳市元征科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027校招简章未说明笔面试形式"}],
  ["中国电子云",{"ownership":"state","aliases":["CECLOUD","中国电子云计算技术有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027招聘简章明确AI面试、技术笔试和面试，未说明所有环节线上或线下"}],
  ["立邦中国",{"ownership":"foreign","aliases":["Nippon Paint","立邦","立邦投资有限公司","立邦涂料(中国)有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027校招简章未说明笔面试形式"}],
  ["方正电机",{"ownership":"private","aliases":["Founder Motor","浙江方正电机","浙江方正电机股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校宣讲信息明确2027届AI开发工程师；笔面试形式未披露"}],
  ["姚泾河私募",{"ownership":"private","aliases":["上海卓胜私募","上海卓胜私募基金管理合伙企业（有限合伙）","上海姚泾河私募基金管理有限公司","姚泾河基金"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开校招汇总明确2027/2028届DL模型/Agent开发岗位"}],
  ["广西康明斯",{"ownership":"foreign","aliases":["Guangxi Cummins Industrial Power","广西康明斯工业动力有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027校招公告明确IT专员（AI应用方向）；现场或线上面试"}],
  ["鼎益科技",{"ownership":"private","aliases":["TIPRO","TIPRO鼎益科技","西安鼎益科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027全球校招摘要明确AI大模型应用类；笔面试形式待核验"}],
  ["广州公交集团",{"ownership":"state","aliases":["广州市公交集团","广州市公共交通集团有限公司"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"公开校招说明初试为线上或现场，复试待通知"}],
  ["AlphaGrep",{"ownership":"foreign","aliases":["AlphaGrep China","AlphaGrep Securities"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027/2028校招明确AI应用方向；仅线上空宣已确认"}],
  ["鸿程系统",{"ownership":"state","aliases":["浙江鸿程系统","浙江鸿程计算机系统有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"结构化校招平台明确2027届AI应用开发工程师；原公告待复核"}],
  ["九方智投",{"ownership":"private","aliases":["上海九方云智能科技有限公司","九方云智能"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027校招岗位明确现场办公；招聘流程形式待核验"}],
  ["帝迈生物",{"ownership":"private","aliases":["帝迈","深圳市帝迈生物技术有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"吉林大学就业网2027届硕博校招公告明确AI全栈工程师"}],
  ["新烛时代",{"ownership":"private","aliases":["XinZhu-AI","XinZhuAI","北京新烛时代科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校就业网公开简章明确2027届可投及工业研发智能体岗位"}],
  ["云账户",{"ownership":"private","aliases":["云账户技术（天津）有限公司","云账户科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027届校招公开信息明确AI Agent全栈研发及完整研发闭环"}],
  ["索恩格电动",{"ownership":"foreign","aliases":["Sona Comstar","索恩格","索恩格汽车电动系统有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"校招聚合页列出2027届AI应用工程师，待官方岗位页进一步核验"}],
  ["上海汇众汽车",{"ownership":"state","aliases":["上海汇众汽车制造有限公司","汇众汽车"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"智联校园职位页明确2027届及AI智能体开发职责；信息仍需官方二次核验"}],
  ["北银金科",{"ownership":"state","aliases":["北京银行北银金科","北银金融科技有限责任公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"银行招聘公告列出2027应届生Agent应用算法工程师，待官方系统复核"}],
  ["浙商银行",{"ownership":"public","aliases":["浙商银行股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校就业网2027招聘公告"}],
  ["国家电投集团数字科技有限公司",{"ownership":"state","aliases":["国家电投数字科技","国家电投数科"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开国企职位库列出2027校招及智慧管理部智能体开发岗，官方入口待核验"}],
  ["北京中数智汇科技股份有限公司",{"ownership":"state","aliases":["ChinaDaaS","中数智汇"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开职位聚合页标注企业官方2027届在招库，官方入口待核验"}],
  ["北京北方华创微电子装备有限公司",{"ownership":"public","aliases":["NAURA微电子","北方华创微电子"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"高校就业网2027校招简章及北方华创官方投递入口"}],
  ["中国电建集团河北省电力勘测设计研究院有限公司",{"ownership":"state","aliases":["中国电建河北院","河北省电力勘测设计研究院"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"河北工业大学就业网2027校园招聘公告，来源中国电建招聘平台"}],
  ["广州市品高软件股份有限公司",{"ownership":"public","aliases":["BingoSoft","品高股份","品高软件"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"广州官方人才平台校招职位页，2026-09-08更新"}],
  ["中电科普天科技股份有限公司",{"ownership":"state","aliases":["中电科普天","普天科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027校园招聘公告及智联企业职位页，官方入口待核验"}],
  ["建发致新",{"ownership":"state","aliases":["厦门建发致新","建发致新医疗科技集团股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"建发集团官方招聘职位页J14131"}],
  ["挚文集团",{"ownership":"private","aliases":["MOMO","北京陌陌信息技术有限公司","陌陌"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"挚文集团2027校招Agent开发工程师公开职位及官方校招入口"}],
  ["金证科技",{"ownership":"private","aliases":["深圳市金证科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"大连海事大学就业网金证科技2027秋招职位页"}],
  ["北京中科圣泰环境科技有限公司",{"ownership":"state","aliases":["中科圣泰","北京中科圣泰"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"大连理工大学盘锦校区就业网2027届校园招聘职位页"}],
  ["南天信息",{"ownership":"state","aliases":["云南南天电子信息产业股份有限公司","广州南天"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"南天信息官方Hotjob应届生招聘系统010294/010454/010455"}],
  ["兴证全球基金",{"ownership":"public","aliases":["兴全基金","兴证全球基金管理有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"兴证全球基金官方2027校园招聘系统及对外经贸大学校招公告"}],
  ["泰康在线",{"ownership":"private","aliases":["泰康在线财产保险股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"智联招聘泰康在线AI应用工程师-27校招职位页"}],
  ["奇瑞汽车",{"ownership":"state","aliases":["Chery","奇瑞控股集团","奇瑞汽车股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"吉林大学就业网奇瑞汽车2027届校园招聘公告"}],
  ["华能云成数科",{"ownership":"state","aliases":["云成数科","华能云成数字产融科技（雄安）有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"华能2027校招官方系统与公开招聘公告"}],
  ["中国能建湖南院",{"ownership":"state","aliases":["中国能源建设集团湖南省电力设计院有限公司","湖南省电力设计院"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"湖南大学就业网2027届校园招聘公告"}],
  ["东阿阿胶",{"ownership":"state","aliases":["Dong-E-E-Jiao","东阿阿胶股份有限公司"],"firstSeenDate":"2026-09-29","channel":"hybrid","channelEvidence":"2027届校招公告明确线上测评和通常线上初试，复试形式多样"}],
  ["联通数据智能",{"ownership":"state","aliases":["中国联通数据科学与人工智能研究院","联通数据智能有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"中国联通2027校招官方系统列出该独立招聘单位，笔面试形式待确认"}],
  ["中航科创",{"ownership":"state","aliases":["AVIC INNO","中航科创有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027届校招流程包含面试/笔试和复面，未明确全程线上"}],
  ["合肥大智慧财汇数据科技",{"ownership":"private","aliases":["合肥大智慧财汇数据科技有限公司","大智慧财汇"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"2027校招公开简章可核，笔面试及官方终态入口待核实"}],
  ["万得信息",{"ownership":"private","aliases":["Wind资讯","万得","上海万得信息技术股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"万得官方招聘页，2027校招资格与大模型算法岗位说明可见"}],
  ["中电信人工智能科技（北京）有限公司",{"ownership":"state","aliases":["中国电信人工智能公司","中国电信人工智能科技","中电信人工智能科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"中国电信官网2026-08-25发布2027届校园招聘启动公告，统一校招系统列出该法人主体。"}],
  ["云深处科技",{"ownership":"private","aliases":["Deep Robotics","杭州云深处科技","杭州云深处科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"高校就业平台给出云深处2027全球校招岗位范围与钉钉官方招聘入口。"}],
  ["ComindX",{"ownership":"private","aliases":["ComindX AI","ComindX Personal OS"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"公开2027校招页完整列出记忆智能体工程师职责、地点与截止日；官方ATS未找到，可信度低于官方直链。"}],
  ["英特尔中国",{"ownership":"foreign","aliases":["Intel","Intel China","英特尔"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"英特尔中国校园招聘官网可访问，公开报道确认2027届校招与AI岗位清单；具体职位类型需逐岗核验。"}],
  ["数字绿土",{"ownership":"private","aliases":["GreenValley","GreenValley International","北京数字绿土科技","北京数字绿土科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"华中科技大学就业网发布2027届校招简章；企业历史官方51job招聘站可核验公司与算法方向，但当前投递入口需通过招聘公众号确认。"}],
  ["黑芝麻智能",{"ownership":"public","aliases":["Black Sesame Technologies","BST","黑芝麻智能科技","黑芝麻智能科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方招聘站和高校就业网确认2027届岗位；内推码ES3WBG来自2026-09-08牛客校园大使公开帖，仅标记来源称有效未实测。"}],
  ["航天恒星科技",{"ownership":"public","aliases":["Space Star Technology","航天五院503所","航天恒星","航天恒星科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"官方北森招聘站明确列出2027届岗位、岗位编号及多模态大模型/智能体职责；中国航天科技集团官网确认其所属体系。"}],
  ["峰岹科技",{"ownership":"private","aliases":["Fortior Technology","峰岹科技（深圳）股份有限公司","峰岹科技深圳股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"华中科技大学就业网发布公司2027届校园招聘，明确AI算法工程师（模型强化训练、知识库）及2027届资格。"}],
  ["绿联科技",{"ownership":"private","aliases":["UGREEN","深圳市绿联科技股份有限公司","绿联"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"绿联官方北森招聘站明确列出2027届资格及Agent、RAG、MCP相关岗位职责。"}],
  ["上海船舶研究设计院",{"ownership":"state","aliases":["上海船舶研究设计院有限公司","中国船舶集团上海船舶研究设计院"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"中国船舶集团官方北森招聘站列出2027届智能船舶工程师J12037及大模型、智能决策方向。"}],
  ["洛枢算力",{"ownership":"private","aliases":["Luoshu Tech","洛枢","洛枢科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"企业官网校园招聘页明确全部岗位面向2027届，并列出AI全栈、Agent工作流和模型网关职责。"}],
  ["驭势科技",{"ownership":"private","aliases":["UISEE","驭势科技（北京）股份有限公司","驭势科技UISEE","驭势科技北京股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"企业官网招聘入口及华中科技大学就业网2026-08-11发布的驭势科技2027届秋招简章共同确认正式校招和AI算法岗位。"}],
  ["亿纬锂能",{"ownership":"private","aliases":["EVE","EVE Energy","亿纬","惠州亿纬锂能股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"亿纬锂能官网校园招聘入口、中国地质大学就业网2027届全球校招简章及当前公开AI智能体岗位信息交叉核验。"}],
  ["UCloud优刻得",{"ownership":"private","aliases":["UCloud","上海优刻得","优刻得","优刻得科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"UCloud官方北森招聘站为投递入口，认证HR公开2027大模型推理优化/AI Infra职位，官方招聘站和校招公告相互印证。"}],
  ["星猿哲科技",{"ownership":"private","aliases":["XYZ Robotics","星猿哲","星猿哲科技（上海）有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"星猿哲官网校园招聘入口与南开大学就业网2027校园招聘岗位交叉核验，岗位发布时间2026-09-04。"}],
  ["原力灵机 Dexmal",{"ownership":"private","aliases":["Dexmal","北京原力灵机智能科技有限公司","原力灵机"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"原力灵机官网、官方飞书招聘站及大连海事大学就业网2027届正式校招公告交叉核验。"}],
  ["成都银行",{"ownership":"state","aliases":["Bank of Chengdu","BOCD","成都银行股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"成都银行官网2027年秋季校园招聘公告与岗位说明交叉核验，报名期2026-09-17至2026-10-25。"}],
  ["清微智能",{"ownership":"private","aliases":["北京清微智能科技有限公司","北京清微智能科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"清微智能2027校园招聘官网入口与南开大学、北京科技大学就业信息交叉核验；网申期2026-08-21至2026-10-30。"}],
  ["北京蓝箭鸿擎科技",{"ownership":"private","aliases":["北京蓝箭鸿擎科技有限公司","蓝箭鸿擎","鸿擎科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"鸿擎科技官方飞书招聘入口与河北工业大学就业网2027全球校园招聘简章交叉核验。"}],
  ["库犸科技 Mammotion",{"ownership":"private","aliases":["Mammotion","MammoX","库犸科技","深圳库犸科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"库犸科技官方飞书校招入口与香港中文大学（深圳）、东北大学就业信息交叉核验；公开信息显示截止2026-09-30。"}],
  ["微纳核芯",{"ownership":"private","aliases":["微纳核芯电子科技","杭州微纳核芯电子科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"华中科技大学就业网2027校招简章与微纳核芯官网招聘入口交叉核验；网申截止2026-10-31。"}],
  ["中电福富",{"ownership":"state","aliases":["FFCS","中电福富信息科技有限公司","福富公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"中电福富官方招聘站与2026-09-16发布的2027秋招第一批公告交叉核验，正式校招仍在进行。"}],
  ["微步在线",{"ownership":"private","aliases":["ThreatBook","北京微步","北京微步在线科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"微步在线官方Moka校招入口、南开大学就业网2027校招简章及牛客27届机器学习算法岗位交叉核验。"}],
  ["北京度量科技",{"ownership":"private","aliases":["NOKOV","NOKOV度量","北京度量科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"华中科技大学就业网2026-09-16发布的2027届校园招聘简章核验，页面列明算法工程师及网申入口。"}],
  ["智平方",{"ownership":"private","aliases":["AI2 Robotics","智平方科技","深圳市智平方科技有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"智平方官方飞书招聘站与华中科技大学就业网2027全球校园招聘简章交叉核验。"}],
  ["MOVA",{"ownership":"private","aliases":["MOVA招聘","MOVA智能","MOVA科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"MOVA官方北森校招站与公开2027全球校招公告交叉核验；公告显示截止2026-11-30。"}],
  ["威迈斯新能源集团",{"ownership":"private","aliases":["VMAX","威迈斯","深圳威迈斯新能源（集团）股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"威迈斯官网人力资源校园招聘入口与天津大学就业网2027招聘简章交叉核验。"}],
  ["无锡信捷电气",{"ownership":"private","aliases":["信捷电气","无锡信捷","无锡信捷电气股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"华中农业大学就业网2027届招聘公告与AI系统开发工程师岗位页核验。"}],
  ["江阴怡源智信",{"ownership":"private","aliases":["怡源智信","江阴怡源","江阴怡源智信运维技术股份有限公司"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"武汉纺织大学2027届毕业生秋季招聘会公告的完整岗位表核验。"}],
  ["语核科技 LangCore",{"ownership":"private","aliases":["LangCore","Langhub","语核科技"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"语核科技官方加入页当前校招岗位及官方FAQ，与企业公众号2027秋招转载交叉核验。"}],
  ["上海发那科机器人",{"ownership":"foreign","aliases":["Shanghai FANUC","上海发那科","发那科机器人"],"firstSeenDate":"2026-09-29","channel":"verify","channelEvidence":"华中科技大学就业网2027届上海发那科校招简章确认正式校招；公开招聘职位页交叉核验AI Agent岗位职责、学历和专业要求。"}],
  ["泰康基金",{"ownership":"private","aliases":["泰康基金管理","泰康基金管理有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"泰康基金官方网站人才招聘页列出信息技术部开发工程师（AI方向），官网我要投递按钮直达 jobtaikang.zhiye.com 北森职位 bbf5e851-88fe-4864-a798-75da1e6836d4；2026-09-29 实时核验。"}],
  ["智明星通",{"ownership":"private","aliases":["ELEX","ELEX智明星通","北京智明星通科技股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"智明星通官方校园招聘页明确列出2027届招聘问答与立即投递入口；岗位线索由公开校招岗位表交叉验证。"}],
  ["新浪集团",{"ownership":"private","aliases":["新浪","新浪&微博","新浪集团控股有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"新浪官方招聘域名career.sina.com.cn的校园招聘页明确显示新浪与微博2027届校园招聘已启动。"}],
  ["艾普工华",{"ownership":"private","aliases":["EPIC HUST","艾普工华科技(武汉)有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"2027届招聘简章公开公司域名邮箱hr@epichust.com，并给出人工智能算法工程师职责、学历和工作地点。"}],
  ["亚特电器",{"ownership":"private","aliases":["YAT亚特","YAT电器","浙江亚特电器股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"2027校招公开岗位表列出AI应用开发，投递入口为企业专属北森域名yat-pro.zhiye.com；亚特公司官网同时保留校园招聘栏目。"}],
  ["上海电气上电公司",{"ownership":"state","aliases":["上海电气电站设备有限公司","上海电气集团上海电机厂有限公司","上电公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"2027届公开校招岗位表列出IT开发（AI应用算法工程师），入口为上海电气体系企业专属Hotjob校园招聘站。"}],
  ["飞博共创",{"ownership":"private","aliases":["厦门飞博共创网络科技股份有限公司","飞博共创网络","飞博共创网络科技"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"高校公开的2027届招聘简章列出AI全栈完整职责；公司官网联系页公开校招邮箱fbxz@feibo.cn，正式投递入口为企业专属北森招聘站。"}],
  ["誉龙智能（ZBS POS）",{"ownership":"private","aliases":["ZBS POS","福州誉龙智能科技有限公司","誉龙智能"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"高校就业网发布完整2027届校园招聘简章，明确企业全称、2027届资格、AI应用工程师、网申时间和企业专属在线入口。"}],
  ["嘉实基金",{"ownership":"private","aliases":["Harvest Fund","嘉实基金管理有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"嘉实基金官网加入我们页面的校园招聘栏目直接列出人工智能分析师并提供申请按钮；高校公告确认2027届校招。"}],
  ["招商基金",{"ownership":"state","aliases":["China Merchants Fund","招商基金管理有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"招商基金2027届秋季校园招聘公告明确AI类软件开发和AI算法岗，并给出企业专属北森投递入口。"}],
  ["泰康资产",{"ownership":"private","aliases":["Taikang Asset","泰康资产管理有限责任公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"泰康资产2027届官方校招公告列出三类AI技术岗，并给出泰康企业专属北森网申地址。"}],
  ["ONERWAY（上海固锦）",{"ownership":"private","aliases":["ONERWAY","上海固锦信息技术有限公司","固锦信息"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"高校就业平台发布上海固锦2027届校园招聘，列出AI应用工程师及企业专属Moka简历入口。"}],
  ["北京计算机技术及应用研究所",{"ownership":"state","aliases":["706所","中国航天科工二院706所","航天科工二院706所"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"企业2027届官方在招库公开AI Agent开发岗位；北京计算机技术及应用研究所智联企业页提供正式申请入口，单位为航天科工体系事业单位。"}],
  ["中国信科（中信科移动）",{"ownership":"state","aliases":["中信科移动","中信科移动通信技术股份有限公司","中国信息通信科技集团有限公司","中国信科集团"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"中国信科集团官方前程无忧校园招聘专题当前列出2027校招AI应用开发工程师-联仪J11102，并提供职位申请入口。"}],
  ["360集团",{"ownership":"private","aliases":["三六零集团","北京奇虎科技有限公司","奇虎360"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"360集团官方北森校园招聘页面显示27秋招全职AI应用开发工程师J12457，并提供立即投递入口。"}],
  ["创美药业",{"ownership":"private","aliases":["Charmacy","创美","创美药业股份有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"2027届正式校招公告明确FDE管培生岗位、广州地点和邮箱/二维码投递流程；公司官网可核验企业主体。"}],
  ["新时达",{"ownership":"private","aliases":["STEP","上海新时达电气股份有限公司","新时达电气"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"公司官网人才招聘页确认校招通道已开启并可跳转投递；2027届官方职位库列出Agent开发工程师企业信息化方向。"}],
  ["中软融鑫",{"ownership":"state","aliases":["北京中软融鑫计算机系统工程有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"智联招聘经审核企业职位当前可打开、可在线投递，明确2027届本科及以上和AI全栈岗位。"}],
  ["深朴智能（SimpleAI）",{"ownership":"private","aliases":["SIMPLE AI","SimpleAI","北京深朴智能科技有限公司","深朴智能"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"公司官方微信公众号发布2027届全球校园招聘，公开信息明确列出AI Agent软件工程师与官方投递邮箱hr@simpleai.tech。"}],
  ["园测信息科技",{"ownership":"state","aliases":["园区测绘","园测信息科技股份有限公司","苏州工业园区测绘地理信息有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"苏州工业园区官方人才平台圆才网当前列出2027届全职AI应用开发工程师，2026-09-10发布、12-31截止并提供直接投简历按钮。"}],
  ["英特仿真（INTESIM）",{"ownership":"private","aliases":["INTESIM","英特仿真","英特工程仿真技术（大连）有限公司","英特工程仿真技术大连有限公司"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"英特仿真2027届校招公告明确列出AI算法研发工程师智能体方向、正式校招流程及hr@intesim.com邮箱投递，公告有效至2026-12-06。"}],
  ["中城交（上海）科技",{"ownership":"state","aliases":["中城交","中城交(上海)科技有限公司","中城交科技"],"firstSeenDate":"2026-09-29","channel":"online","channelEvidence":"牛客2027届校招数字化专场企业HR职位页显示立即申请，投递窗口2026-08-27至2027-08-31；企业官网及上海政府公开信息核实公司主体与国资背景。"}],
  ["经海纬象",{"ownership":"private","aliases":["Gwalrus","上海经海纬象生物材料有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027正式校招聚合记录与公司官方简历入口交叉核验"}],
  ["全芯智造",{"ownership":"private","aliases":["AMEDAC","全芯智造技术有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招记录与官方北森校园职位入口交叉核验"}],
  ["58同城",{"ownership":"private","aliases":["五八同城","北京五八信息技术有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"SMA-Wiki职位记录与58官方校园招聘页面交叉核验"}],
  ["智洋创新",{"ownership":"private","aliases":["智洋创新科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027岗位记录与官方认证校招专题交叉核验"}],
  ["同方数科",{"ownership":"state","aliases":["同方数字科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"SMA-Wiki 2027岗位记录与中核官方招聘入口交叉核验"}],
  ["埃斯顿",{"ownership":"private","aliases":["ESTUN","南京埃斯顿自动化股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与埃斯顿官方校园招聘入口交叉核验"}],
  ["卧安机器人",{"ownership":"private","aliases":["SwitchBot","深圳卧安机器人有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027秋招岗位记录与官方校园职位页交叉核验"}],
  ["节卡机器人",{"ownership":"private","aliases":["JAKA","节卡机器人股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与公司官网招聘页交叉核验"}],
  ["灵心巧手",{"ownership":"private","aliases":["Linkerbot","北京灵心巧手科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027全球校招记录与公司官网职位页交叉核验"}],
  ["中建电商",{"ownership":"state","aliases":["中建电子商务有限责任公司","云筑网"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与国聘招聘入口交叉核验"}],
  ["太力科技",{"ownership":"private","aliases":["中山市太力家庭用品制造有限公司","太力集团"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招记录与公司官方校园招聘页交叉核验"}],
  ["因诺股份",{"ownership":"private","aliases":["因诺航空","西安因诺航空科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与公司官方加入我们页面交叉核验"}],
  ["拓斯达科技",{"ownership":"private","aliases":["广东拓斯达科技股份有限公司","拓斯达"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与公司官方校园招聘入口交叉核验"}],
  ["德塔智能",{"ownership":"private","aliases":["Delta Intelligence","北京德塔智能科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与公司官网招聘页交叉核验"}],
  ["禾迈股份",{"ownership":"private","aliases":["Hoymiles","杭州禾迈电力电子股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招岗位记录与官方Moka入口交叉核验"}],
  ["iData",{"ownership":"private","aliases":["无锡盈达聚力科技有限公司","盈达聚力"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招记录与官方北森职位入口交叉核验"}],
  ["BIGO",{"ownership":"private","aliases":["BIGO Technology","百果园"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027岗位记录与BIGO官方校园招聘入口交叉核验"}],
  ["中汽工程",{"ownership":"state","aliases":["中国汽车工业工程有限公司","机械工业第四设计研究院"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招岗位记录与官方招聘专题交叉核验"}],
  ["中国铁塔",{"ownership":"state","aliases":["China Tower","中国铁塔股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与中国铁塔官方招聘入口交叉核验"}],
  ["国家能源集团数科公司（人工智能研究院）",{"ownership":"state","aliases":["国家能源集团人工智能研究院","国家能源集团数科公司","国能数智科技开发（北京）有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招岗位记录与国家能源集团官方招聘入口交叉核验"}],
  ["鼎桥技术",{"ownership":"private","aliases":["TD Tech","鼎桥通信技术有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与鼎桥官方招聘门户交叉核验"}],
  ["华信咨询设计研究院",{"ownership":"state","aliases":["HXDI","华信咨询设计研究院有限公司","华信设计"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"前程无忧官方2027专题可检索，岗位页与聚合记录一致"}],
  ["英柏检测",{"ownership":"private","aliases":["IMPAQ","英柏检测技术有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与英柏检测官方北森入口交叉核验"}],
  ["招商平安资产",{"ownership":"state","aliases":["招商平安资产管理有限责任公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"招商局集团官方2027校园招聘与成员公司职位记录交叉核验"}],
  ["方太集团",{"ownership":"private","aliases":["FOTILE","宁波方太厨具有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027职位记录与方太官方北森校园招聘入口交叉核验"}],
  ["理邦仪器",{"ownership":"private","aliases":["EDAN","深圳市理邦精密仪器股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027岗位记录与企业前程无忧招聘入口交叉核验"}],
  ["深诣机器人",{"ownership":"private","aliases":["深诣机器人科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招记录与公开飞书招聘表单交叉核验"}],
  ["中国科学院东莞材料科学与技术研究所",{"ownership":"state","aliases":["DIMST","东莞材料所","中国科学院东莞材料所"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"研究所官网明确发布2027校园招聘，岗位包含AI应用研发工程师"}],
  ["航空工业雷达所（雷华电子技术研究所）",{"ownership":"state","aliases":["607所","中国航空工业集团公司雷华电子技术研究所","航空工业雷达所","雷华电子技术研究所"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"高校官方就业公告给出2027校招与官方智联投递入口，聚合记录明确AI应用研发"}],
  ["方正科技",{"ownership":"state","aliases":["方正科技集团股份有限公司","方科PCB"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"SMA-Wiki 2027校招岗位清单与企业官方北森门户交叉核验"}],
  ["国电南自",{"ownership":"state","aliases":["SAC","国电南京自动化股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方智联专题与华中科技大学就业公告均明确2027校招及人工智能工程师"}],
  ["国贸控股集团",{"ownership":"state","aliases":["ITG Holding","厦门国贸控股集团有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方北森招聘系统与高校官方2027校园招聘公告交叉核验"}],
  ["海博思创",{"ownership":"private","aliases":["HyperStrong","北京海博思创科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业官网校园招聘入口、官方51job专题及高校就业公告三方核验"}],
  ["明阳集团",{"ownership":"private","aliases":["明阳智慧能源集团","明阳智慧能源集团股份公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"SMA-Wiki 2027岗位清单与明阳官方北森职位入口交叉核验"}],
  ["中通服咨询设计研究院",{"ownership":"state","aliases":["CICDI","中通服咨询设计研究院有限公司","中通服设计院"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方智联专题与天津大学就业公告均明确2027校招及人工智能工程师职责"}],
  ["冰鉴科技",{"ownership":"private","aliases":["ICEKREDIT","上海冰鉴信息科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方校园招聘页明确大语言模型开发工程师职责、学历、Python与RAG要求，并提供申请入口"}],
  ["平安银行金融科技部",{"ownership":"private","aliases":["平安银行数字金融发展办公室","平安银行金融科技部（数字金融发展办公室）"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"高校官方就业公告明确岗位清单、2027届资格、8月10日至11月6日网申期及官方入口"}],
  ["虹软科技",{"ownership":"private","aliases":["ArcSoft","虹软","虹软科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方校园招聘页明确2027届、AIGC算法工程师职责、城市及立即申请入口"}],
  ["均胜集团",{"ownership":"private","aliases":["Joyson","均胜电子","宁波均胜电子股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"SMA-Wiki全量记录明确2027校招正式岗位及机器人Agent Planning/Skills，入口为企业官方Moka校园招聘"}],
  ["酷哇科技",{"ownership":"private","aliases":["CowaRobot","酷哇机器人","酷哇科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校招公开岗位清单与官方Moka入口交叉核验，明确AI算法、多模态及软件工程相关专业"}],
  ["中石油数智研究院",{"ownership":"state","aliases":["中国石油数智研究院","中石油（北京）数智研究院有限公司","中石油北京数智研究院"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"中国石油招聘平台公开招聘信息与岗位编号27010828交叉核验，明确软件工程专业、硕士及以上和大模型知识工程方向"}],
  ["朴朴科技",{"ownership":"private","aliases":["PUPU","朴朴","朴朴科技（福建）有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027校园招聘宣讲信息明确研发工程师（AI大模型）和软件工程相关专业，投递入口为企业官方校招系统"}],
  ["泰豪软件",{"ownership":"private","aliases":["Tellhow Software","泰豪软件股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"泰豪官网校园招聘页明确AI软件开发工程师、2026年8月发布、2027年6月截止、本科及以上和计算机相关专业"}],
  ["英飞源技术",{"ownership":"private","aliases":["Infypower","深圳英飞源技术有限公司","英飞源"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027届秋季校园招聘明确AI软件工程师、计算机专业以及海外毕业时间范围，入口为企业官方北森校招"}],
  ["广州广日股份",{"ownership":"state","aliases":["广州广日","广州广日股份有限公司","广日股份"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027届秋招公开信息明确大模型工程师、硕士学历、广州岗位和当前网申入口；企业为广州工控集团旗下国有控股上市公司"}],
  ["马上消费金融",{"ownership":"private","aliases":["MaAI星启计划","马上消费","马上消费金融股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"2027届秋招公开岗位方向与官方飞书招聘入口交叉核验，明确大模型应用、金融智能与决策等正式岗位"}],
  ["中博研究院",{"ownership":"state","aliases":["中博信息技术研究院","中博信息技术研究院有限公司","中国通信服务中博研究院"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"中国电信统一招聘系统明确显示2027年度秋季校园招聘AI研发工程师，可通过正式校招入口申请"}],
  ["中国有研科技集团",{"ownership":"state","aliases":["中国有研","中国有研科技集团有限公司","北京有色金属研究总院","有研科技集团"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"集团官网2026-09-15发布2027年应届毕业生招聘公告，明确人工智能开发工程师、200余名需求及官方招聘门户"}],
  ["姚记科技",{"ownership":"private","aliases":["上海姚记科技股份有限公司","姚记科技股份","姚记集团"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"牛客企业校招岗位显示2027届、AIGC技术工程师且当前可申请；公开2027秋招说明核验毕业窗口、截止日期与最多投递2岗"}],
  ["武汉精测电子集团",{"ownership":"private","aliases":["武汉精测电子集团股份有限公司","精测电子"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官方北森页面明确标注校园招聘、全职、2027校招并提供现在申请入口"}],
  ["科大国创云网",{"ownership":"private","aliases":["国创云网","科大国创云网科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方北森校园招聘入口与高校就业网2027届招聘简章交叉核验"}],
  ["中国科学院工业人工智能研究所",{"ownership":"state","aliases":["中科院工业人工智能研究所","工业人工智能研究所"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"研究所官方智联招聘站可投；岗位页面核验硕士及以上、经验不限、智能体安全开发方向"}],
  ["超图软件",{"ownership":"private","aliases":["SuperMap","北京超图软件股份有限公司","超图"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官网校园招聘页明确岗位、5个HC、地点、完整JD及校招投递邮箱"}],
  ["中国通号研究设计院集团",{"ownership":"state","aliases":["北京全路通信信号研究设计院","北京全路通信信号研究设计院集团有限公司","通号研究设计院"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方北森校园招聘入口与国家大学生就业服务平台2027届招聘简章交叉核验"}],
  ["深圳信步科技",{"ownership":"private","aliases":["SEAVO","信步科技","深圳市信步科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官方Hotjob招聘站显示2027正式校园招聘及AI工程师申请入口"}],
  ["德兰明海",{"ownership":"private","aliases":["PowerOak","德兰明海新能源","深圳市德兰明海新能源股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业2027校园招聘专题页提供AI工程师岗位及正式网申入口"}],
  ["宝可梦（上海）玩具",{"ownership":"foreign","aliases":["Pokemon China","宝可梦（上海）玩具有限公司","宝可梦中国"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方Moka校园招聘站明确2027届毕业窗口、AI工程师及上海工作地点"}],
  ["上海航天技术基础研究所",{"ownership":"state","aliases":["上海航天808所","中国航天科技集团第八研究院第八〇八研究所","航天八院基础所"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"上海航天八院官方北森移动招聘入口显示2027校园招聘元器件AI应用工程师"}],
  ["Manifold AI（流形空间）",{"ownership":"private","aliases":["Manifold AI","北京流形空间智能科技有限公司","流形空间"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方招聘站明确2026-09至2027-12毕业窗口、正式校招岗位及投递截止日期"}],
  ["中国通信服务陕西公司",{"ownership":"state","aliases":["中国通服陕西","陕西省通信服务有限公司","陕西通服"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"中国通服陕西2027官方招聘专题与中国电信统一招聘入口交叉核验"}],
  ["圣湘生物",{"ownership":"private","aliases":["Sansure Biotech","圣湘生物科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官方北森校招站及2027秋招问答明确毕业窗口、网申时间和AI工程师"}],
  ["为旌科技",{"ownership":"private","aliases":["Visinextek","上海为旌科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"天津大学就业网2026-09-17招聘简章与企业官网Join Us交叉核验，明确2027届、岗位及官网/邮箱投递"}],
  ["ToDesk（久尺网络）",{"ownership":"private","aliases":["ToDesk","久尺网络","久尺网络科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"华中科技大学就业网2026-09-18发布2027届正式校招简章，企业官网提供招聘入口"}],
  ["itc保伦股份",{"ownership":"private","aliases":["itc","保伦股份","广东保伦电子股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业官方招聘站与2026-09发布的2027届正式批招聘简章交叉核验"}],
  ["赛维时代",{"ownership":"private","aliases":["Sailvan Times","赛维时代科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业官方Hotjob职位列表当日可见AI应用工程师（2027届）和AI算法工程师（2027届）"}],
  ["思特威 SmartSens",{"ownership":"private","aliases":["SmartSens","思特威","思特威（上海）电子科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"思特威官方校园站显示2027届招聘；内推码来自牛客近期公开帖，仅标记为来源称有效未实测"}],
  ["艾罗能源",{"ownership":"private","aliases":["SolaX Power","浙江艾罗网络能源技术股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业官方Moka入口与西安理工大学2027届招聘简章交叉核验"}],
  ["国科微电子",{"ownership":"private","aliases":["国科微","湖南国科微电子股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方北森校招入口与河北工业大学2026-09发布的2027届简章交叉核验"}],
  ["海柔创新",{"ownership":"private","aliases":["HAI ROBOTICS","深圳市海柔创新科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方北森校园入口与杭州电子科技大学2027届简章交叉核验，海外毕业窗口覆盖2027-01"}],
  ["远景能源",{"ownership":"private","aliases":["Envision Energy","远景能源有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方Moka入口与高校就业网2027届简章及在招岗位JD交叉核验；企业性质按中国民营企业核验"}],
  ["宇视科技",{"ownership":"private","aliases":["Uniview","浙江宇视科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业官方招聘站与四川大学、河北工业大学2027届招聘简章交叉核验"}],
  ["聚芯微电子",{"ownership":"private","aliases":["武汉聚芯微电子股份有限公司","聚芯微"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业官方Moka校招入口与2026-08发布的2027届正式招聘简章交叉核验"}],
  ["飞步科技",{"ownership":"private","aliases":["FABU Technology","杭州飞步科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"企业官方Moka校招入口与2026-08发布的2027届招聘公告交叉核验"}],
  ["宁德新能源 ATL",{"ownership":"foreign","aliases":["ATL","ATL新能源集团","宁德新能源科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"ATL官方招聘站与南开大学2026-08发布的2027全球校招简章交叉核验"}],
  ["招商银行上海分行",{"ownership":"state","aliases":["招商银行股份有限公司上海分行","招行上海分行"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"招商银行官方招聘入口与天津理工大学2026-09发布的上海分行2027招聘公告交叉核验；按招商局集团实际控制关系归入央国企"}],
  ["云道智能",{"ownership":"private","aliases":["SimWE","云道智造","北京云道智造科技有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官网人才页当前列出校园招聘物理AI算法工程师，并链接官方Moka入口"}],
  ["墨芯人工智能",{"ownership":"private","aliases":["Moffett AI","墨芯AI","墨芯人工智能科技（深圳）有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官方Join Us页面与2027届校园招聘公告交叉核验"}],
  ["湖北江城实验室",{"ownership":"state","aliases":["江城实验室","湖北江城实验室科技有限责任公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方北森校园招聘入口与2026-08发布的2027届招聘简章交叉核验"}],
  ["砺算科技",{"ownership":"private","aliases":["Lisuan Tech","砺算科技（上海）有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官网校园招聘页与2026-08发布的2027届校招公告交叉核验"}],
  ["瑞芯微电子",{"ownership":"private","aliases":["Rockchip","瑞芯微","瑞芯微电子股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"瑞芯微官网招聘页与天津大学2026-09发布的2027届完整岗位简章交叉核验"}],
  ["先临三维",{"ownership":"private","aliases":["SHINING 3D","先临三维科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"公司官方北森校园招聘入口与2026-09发布的2027届正式批公告交叉核验"}],
  ["思朗科技",{"ownership":"private","aliases":["SmartLogic","上海思朗科技股份有限公司","思朗"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"思朗官方飞书校招站、公司官网与南开大学2026-09发布的2027届简章交叉核验"}],
  ["开立医疗",{"ownership":"private","aliases":["SonoScape","开立生物医疗","深圳开立生物医疗科技股份有限公司"],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"官方校招入口与高校就业网2027届完整JD交叉核验；内推码来自四川大学近期校招公告，未实际试投"}],
  ["中国电科第十四研究所",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"http://hr.nriet.com/Pages/Job/Jobs.aspx\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["上海集成电路研发中心 ICRD",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/icrd/126587?locale=zh-CN#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["盈峰环境",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/inforeenviro/182015#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["晶盛机电",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/jsjd/118048?locale=zh-CN#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["顾家家居",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/kuka/172508#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["广和通",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://fibocom.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["镁伽科技 MegaRobo",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://megarobo.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["新能德",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://nvtpower.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["朗坤科技",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://leoking.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["公牛集团",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://gongniu.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["飞凌嵌入式",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://forlinx1.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["积成电子",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://ieslab.zhaopin.com/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["中国信息通信研究院（中国信通院）",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://zhaopin.caict.ac.cn/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["中证信用",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://zp.chinacsci.com/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["超参数科技",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://hr.chaocanshu.cn/campus_apply/chaocanshu/45562#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["华睿科技",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://irayple.zhiye.com/jobs?queryId=f3272345-0f2d-4925-a1e0-ba67130513df\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["天准科技",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://tztek.gllue.com/portal/campus\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["卓胜微",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://maxscend.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["武汉新芯",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://whxmc.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["曦诺未来 X-Gravity",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://xynovatech.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["中国电科第三十六研究所",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://cetc36.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["凡拓数创",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://frontop.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["微观博易",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/bjwgby/118127#/job/b43cd8bf-4d6d-4640-be91-36e4d18f19d2\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["钱江摩托",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/geely/78436#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["北京润科通用技术",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/runketongyong/170057?locale=zh-CN#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["移远通信",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/quectel/65934?locale=zh-CN&sessionid=#/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["盛弘股份",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://app.mokahr.com/campus-recruitment/sinexcel/74287#/job/c940bb64-a5aa-40de-aec1-b57e0599e8a4\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["中海地产",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://coli688.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["博众精工",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://bozhon3.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["昆仑万维",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://jobs.kunlun.com/459522/position/list\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["恒玄科技",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://bestechnic.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["强脑科技 BrainCo",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://www.brainco.cn/recruit/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["桥介数物",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://f0exxg5fp6u.jobs.feishu.cn/426122\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["丽天智能 LEAPTNG",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://distribute.ebiaoge.com/sp/formreport/distribute/tot7psavqa/7598583105417817957\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["普渡机器人 Pudu Robotics",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://pudutech.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["普冉半导体 Puya Semiconductor",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://h2t8ckbsk1.jobs.feishu.cn/678396\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["彩讯科技 Richinfo",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://www.richinfo.cn/jobs/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["远光软件",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://zhaopin.sgcc.com.cn/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["北京汽车研究总院",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://baicgroup.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["北京北汽光粒智能科技",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://baicgroup.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["北汽汽车金融（杭州）",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://baicgroup.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["中国天辰工程",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://china-tcc.zhiye.com/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["星宸科技 SigmaStar",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://sigmastar.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["全志科技 Allwinner",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://campus.allwinnertech.com/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["飞派科技 FlyPai",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://flypai.com/jobs.html\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["因诺资产 Inno Asset",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"mailto:resume@innoam.com\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["中移金科（中移动金融科技）",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://zyjkcampus.zhaopin.com/index.html\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["明汯投资",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://join.mhfunds.com/index\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["其域创新 XGRIDS",{"ownership":"private","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://pecivkvtit.jobs.feishu.cn/252342/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["中科芯集成电路",{"ownership":"state","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://cksic.zhiye.com/campus/jobs\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
  ["麦当劳中国科技研发中心",{"ownership":"foreign","aliases":[],"firstSeenDate":"2026-09-30","channel":"online","channelEvidence":"{\"verified_at\":\"2026-09-30\",\"entry_url\":\"https://www.mcdonalds.com.cn/\",\"method\":\"10111-source-audit+official-entry-verification\"}"}],
]);

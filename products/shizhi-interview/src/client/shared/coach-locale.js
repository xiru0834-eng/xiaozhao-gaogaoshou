/** Product copy for the Chinese interview workspace. */
const zh = Object.freeze({
  careerBrand: '校招高高手 × 拾知', careerHome: '校招工作台', careerPractice: '面试陪练', careerPrepare: '准备面试',
  careerWaitSave: '请等待投递进度保存完成；如保存失败，请先重连。',
  careerHelp: '使用说明与数据保存',
  careerLocal: '整合版的公司与投递资料保存在拾知本地数据目录；面试点评共用左下角设置中的模型。',
  careerDataPath: '.dsh-home/profiles/web/data/shizhi-interview/career/',
  careerFooter: '公司目录来自校招高高手的历史快照，职位和推荐码请以招聘官网为准。投递状态是你手动记录的进度；练习不会自动改变它。资料保存在拾知本地目录，右上角可分别备份投递进度和公司目录。模型在左下角设置中统一配置。',
  careerRole: '目标岗位', careerRolePlaceholder: '例如：Java 后端开发、AI 应用开发',
  careerTarget: '这次为哪家公司准备', careerClear: '取消公司关联', careerHint: '先填写目标岗位，再选择练习方向。基础题用于能力练习，不代表这家公司的真实面试题。',
  careerHistory: '这家公司的练习记录', careerEmpty: '还没有关联练习，选一个方向开始。', careerRecorded: '次作答',
  careerOpen: '查看练习', careerFrame: '公司清单与投递工作台', careerBack: '返回公司清单',
  chatTitle: '直接聊聊', chatHint: '问一个技术问题，或者打个招呼。开始练习时再选择下方方向。',
  chatPlaceholder: '例如：你好，能用一个例子解释数据库索引吗？', chatSend: '发送消息', sending: '正在发送…',
  brand: '拾知 · 面试陪练', home: '开始练习', eyebrow: '把“看懂了”，练成“讲清楚”。',
  headline: '下一次面试，从这一次开口开始。', intro: '选一个方向，用自己的话回答。每次专注一个知识点，再看反馈、补遗漏、重新表达。',
  catalog: '选择今天的练习方向', catalogHint: '32 道基础题 · 每题约 3–5 分钟 · 随时保存',
  local: '练习保存在本机；AI 点评会把回答发送给你配置的模型服务。',
  setup: '选择一个方向即可创建练习。模型可在设置中配置；未配置时也能练题和保存回答。',
  question: '当前练习', start: '开始练习', next: '下一道题', finish: '结束并保存', retry: '重新回答',
  submit: '保存回答并请求点评', review: '重新请求点评', followup: '针对回答追问一题',
  answer: '你的回答', placeholder: '像面对面试官一样说出你的理解，也可以直接输入。先解释是什么，再说明原理和适用场景。',
  record: '开始口述', stop: '结束口述', cancel: '取消录音', recording: '正在听你说…', transcribing: '正在转写…',
  check: '提交前请检查转写，尤其是技术名词。系统只评价你确认后的文字。',
  browserPrivacy: '浏览器语音识别可能使用浏览器厂商的在线服务。开始口述即使用该服务；也可以直接输入。',
  noVoice: '当前浏览器不支持语音识别。可换用 Chrome，或按说明接入语音转写服务；文字作答仍可用。',
  providerPrivacy: '开始口述将把录音发送到已配置的语音服务；录音不写入本机练习档案。', seconds: '秒录音上限',
  permission: '麦克风未获授权，请在浏览器中允许后重试。', speechError: '语音识别未完成，请重试或直接输入。',
  noSpeech: '没有识别到语音，请靠近麦克风后重试。', network: '语音服务连接失败，请检查网络或改用文字。',
  playback: '朗读题目', stopPlayback: '停止朗读', noPlayback: '当前浏览器没有可用的朗读服务。',
  feedback: '本题反馈', pending: '回答已保存，点评请求已排队。请查看对话区的运行状态；失败后可重新请求点评。',
  unavailable: '回答已保存；当前会话没有可用的智能体。请新建会话并配置模型，然后继续这条练习。',
  history: '作答记录', noAnswer: '先试着独立回答，再看参考要点。', reference: '参考要点', source: '查看参考资料',
  referenceHint: '这是人工整理的复习提示，不是对本次回答的评分。', feedbackHint: 'AI 评价仅供练习参考；有疑问时请核对资料。',
  attempts: '次作答', questions: '题', score: '分', saved: '本次练习已保存，可以在练习档案中查看。',
  error: '操作失败，请重试。', micBusy: '请先结束口述，再提交回答。', coach: '专项口述', custom: '更多练习',
  previous: '上次回答', edit: '整理后重答', remaining: '待点评', answered: '已回答', refresh: '刷新反馈',
})

/** Retrieves locale-owned product text.
 * @param {keyof typeof zh} key Chinese dictionary key.
 * @returns {string} Display text.
 */
export function t(key) { return zh[key] }

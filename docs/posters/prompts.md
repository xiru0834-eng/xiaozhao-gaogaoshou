# 品牌海报生成提示词

2026-09-20。使用内置 `image_gen`，每张独立生成一次；最终图片保留原始输出，没有再进行裁切或后期图像修改。

唯一图像参考为仓库 `assets/qiuzhao-mascot.png`，仅用于保持吉祥物身份。没有将真实 UI 截图或求职数据提供给图片生成工具。输出中的界面是抽象宣传插画，不是实拍。

## 验收约束

- 不出现使用者姓名、简历、手机号、邮箱、投递记录、公司清单、真实内推码或模型密钥。
- 正确展示品牌名与核心中文标题；少量装饰性短句不承载功能承诺。
- 不宣称自动投递、每日自主搜岗、保证 Offer 或模型完全离线。
- 海报 02 标出兼容版助手；海报 03 保留模型调用发送文本和可能计费的说明。
- 检查文字可读、边缘无截断、系列辨识度及 Markdown 图片实际加载。

## 01 · 机会工作台

```text
Use case: ads-marketing / compositing.
Create ONE finished premium Chinese software-product campaign poster for the real product 校招高高手. This is a polished poster artwork, NOT a plain screenshot, NOT a slide deck, NOT a collage contact sheet.
Input image 1 is the existing brand mascot to preserve: mint-green short bob, warm amber eyes, cream star hair clip, forest-green outfit with cream collar, friendly gentle expression. Reinterpret the pose beautifully while keeping the recognizable character identity; wholesome chibi visual, never sexualized. Only the existing mascot is provided as an identity reference. Do NOT reproduce actual application screenshots, actual company names, real user information, real referral codes, real statistics, resumes or personally identifiable data. Use abstract decorative interface fragments containing simple blocks, lines, symbols and checkmarks only, no company rows or other small interface text.
Design system: mint #96E5C4, deep graphite #18252B, ivory #F5F4EC; generous breathing room, beautifully balanced editorial grid, expressive oversized Chinese typography, restrained four-point-star motif, precise tiny section numbering, refined custom illustration with tactile cut-paper and soft 3D depth. Warm, credible, distinctive indie product with premium anime-game companion personality. Do not copy any game brand, no trademarked game characters or unrelated corporate logos.
Chinese lettering must be beautifully typeset and correct, with clear hierarchy. Use only the provided exact text, no invented slogans, no gibberish, no random numbers, no fake charts, no fake reviews, no testimonials, no QR codes, no fake awards, no watermarks. Do not claim automatic applications, daily autonomous updates, guaranteed offers, or completely offline AI. Keep any interface text subordinate; do not invent success statistics.
Output one high-resolution landscape poster, 3:2 aspect ratio (ideally 1536 x 1024), with generous safe margins so nothing is cut off.
Poster 01: OPPORTUNITY WORKSPACE. Bright warm ivory and pale mint background with one deep graphite architectural shape. Turn the actual software workspace into a beautifully crafted floating desk/planner object, with a crisp angled abstract panel suggesting tidy opportunity cards using blank lines and shapes only. The mascot is a small thoughtful guide holding a checklist beside the workspace, not dominating it. A few calm paper tabs imply organizing opportunities. Main headline dominates the upper/left portion; illustration anchors lower/right, with carefully considered visual rhythm and large quiet areas. Avoid generic tech gradients and excessive sparkle.
Exact text:
Small brand: "校招高高手"
Small series label: "01 / 机会工作台"
Very large two-line headline: "机会很多，" / "下一步要清楚。"
Secondary line: "搜索 · 组合筛选 · 内推线索 · 进度记录"
Footer: "下一家，准备好了。"
Small unobtrusive disclosure: "品牌创意海报"
```

## 02 · 贴边小助手

```text
Use case: ads-marketing / compositing.
Create ONE finished premium Chinese software-product campaign poster for the real product 校招高高手. This is a polished poster artwork, NOT a plain screenshot, NOT a slide deck, NOT a collage contact sheet.
Input image 1 is the existing brand mascot to preserve: mint-green short bob, warm amber eyes, cream star hair clip, forest-green outfit with cream collar, friendly gentle expression. Reinterpret the pose beautifully while keeping the recognizable character identity; wholesome chibi visual, never sexualized. Only the existing mascot is provided as an identity reference. Do NOT reproduce actual application screenshots, actual company names, real user information, real referral codes, real statistics, resumes or personally identifiable data. Use abstract decorative interface fragments containing simple blocks, lines, symbols and checkmarks only, no company rows or other small interface text.
Design system: mint #96E5C4, deep graphite #18252B, ivory #F5F4EC; generous breathing room, beautifully balanced editorial grid, expressive oversized Chinese typography, restrained four-point-star motif, precise tiny section numbering, refined custom illustration with tactile cut-paper and soft 3D depth. Warm, credible, distinctive indie product with premium anime-game companion personality. Do not copy any game brand, no trademarked game characters or unrelated corporate logos.
Chinese lettering must be beautifully typeset and correct, with clear hierarchy. Use only the provided exact text, no invented slogans, no gibberish, no random numbers, no fake charts, no fake reviews, no testimonials, no QR codes, no fake awards, no watermarks. Do not claim automatic applications, daily autonomous updates, guaranteed offers, or completely offline AI. Keep any interface text subordinate; do not invent success statistics.
Output one high-resolution landscape poster, 3:2 aspect ratio (ideally 1536 x 1024), with generous safe margins so nothing is cut off.
Poster 02: DESKTOP COMPANION. Deep graphite night palette contrasted with luminous-but-not-neon soft mint and warm ivory. A beautiful oversized browser-window silhouette, with a slender conceptual mint companion panel resting at its edge to demonstrate saving screen space. The mascot leans gently from the slim panel, with small clipboard, companionable and reassuring. Strong asymmetric editorial composition, confident huge ivory Chinese lettering, fine mint typographic accents. Show a small discreet edge tab, not a giant mobile phone; this is a desktop application. Show compact abstract rows and folded controls with icons only; do not reproduce real data. No fake interactions or state changes.
Exact text:
Small brand: "校招高高手"
Small series label: "02 / 贴边小助手"
Very large two-line headline: "小窗陪着投，" / "大窗用来看。"
Secondary line: "贴边收起 · 固定展开 · 下一家"
Footer: "少一点遮挡，多一点从容。"
Small unobtrusive disclosure: "品牌创意海报 · 兼容版助手"
```

## 03 · 本地优先

```text
Use case: ads-marketing / compositing.
Create ONE finished premium Chinese software-product campaign poster for the real product 校招高高手. This is a polished poster artwork, NOT a plain screenshot, NOT a slide deck, NOT a collage contact sheet.
Input image 1 is the existing brand mascot to preserve: mint-green short bob, warm amber eyes, cream star hair clip, forest-green outfit with cream collar, friendly gentle expression. Reinterpret the pose beautifully while keeping the recognizable character identity; wholesome chibi visual, never sexualized. Only the existing mascot is provided as an identity reference. Do NOT reproduce actual application screenshots, actual company names, real user information, real referral codes, real statistics, resumes or personally identifiable data. Use abstract decorative interface fragments containing simple blocks, lines, symbols and checkmarks only, no company rows or other small interface text.
Design system: mint #96E5C4, deep graphite #18252B, ivory #F5F4EC; generous breathing room, beautifully balanced editorial grid, expressive oversized Chinese typography, restrained four-point-star motif, precise tiny section numbering, refined custom illustration with tactile cut-paper and soft 3D depth. Warm, credible, distinctive indie product with premium anime-game companion personality. Do not copy any game brand, no trademarked game characters or unrelated corporate logos.
Chinese lettering must be beautifully typeset and correct, with clear hierarchy. Use only the provided exact text, no invented slogans, no gibberish, no random numbers, no fake charts, no fake reviews, no testimonials, no QR codes, no fake awards, no watermarks. Do not claim automatic applications, daily autonomous updates, guaranteed offers, or completely offline AI. Keep any interface text subordinate; do not invent success statistics.
Output one high-resolution landscape poster, 3:2 aspect ratio (ideally 1536 x 1024), with generous safe margins so nothing is cut off.
Poster 03: LOCAL DATA AND OPTIONAL MODEL. Muted fresh sage / pale mint and ivory with sharply controlled graphite typography. Artistic still-life of a personal desktop workspace: a clean translucent local file drawer, a small discreet lock, and a single elegant physical toggle representing optional model connectivity. The mascot carefully keeps a checklist in the local drawer; a thin deliberate connection leads to a small abstract model panel shown as a blank clean conceptual interface with a toggle. The AI is an optional tool, no giant sci-fi robot. Balance the conceptual illustration with generous negative space and a large beautiful headline. Bespoke matte materials, sophisticated studio shadows, small cream star accent.
Exact text:
Small brand: "校招高高手"
Small series label: "03 / 本地优先"
Very large two-line headline: "记录留在本机，" / "AI 由你开启。"
Secondary line: "本地保存 · 备份导出 · 自定义模型"
Footer: "你的进度，自己掌握。"
Small but readable factual line: "模型调用会发送输入内容，可能计费。"
Small unobtrusive disclosure: "品牌创意海报"
```

---
description: "A local campus-recruiting workbench with company-linked interview practice, voice answers, and Harness model feedback."
kind: "package-bundle"
---

# Campus Recruiting Workbench × Shizhi Interview Coach

English | [中文](README.zh.md)

## Summary

The home page combines the company catalog and application tracker from Xiaozhao Gaogaoshou with Shizhi interview practice. Filter companies, record application progress, and select **准备面试** to practice for a confirmed target role. Choose from 56 original questions across agent application development, networking, databases, Java, and Redis; speak or type an answer, review feedback, and try again. SQLite stores data locally. AI feedback uses the model configured in Harness.

## Table of Contents

- [Use this package](#use-this-package)
- [Understand the implementation](#understand-the-implementation)
- [Model Experience](#model-experience)
- [Known Limitations and Deferred Work](#known-limitations-and-deferred-work)
- [Further Exploration](#further-exploration)
- [Dev Note](#dev-note)

<a id="use-this-package"></a>

## Use this package

### Start the local product

Use Node 22.19 or newer with Git, npm, and pnpm available. This product runs inside the Xiaozhao Gaogaoshou repository and uses its root `src/` and `web/` directories. The build checks the workbench entry, identity placeholders, required page elements, and both adapters; compatible UI and catalog changes can build directly. [career-upstream.json](scripts/career-upstream.json) records the initial integration's source revision without restricting everyday edits.

```powershell
git clone --branch feat/shizhi-interview-integration https://github.com/xiru0834-eng/xiaozhao-gaogaoshou.git
cd xiaozhao-gaogaoshou
npm run coach:install
npm run coach
```

For an existing checkout, switch to this branch and skip cloning. Open the private localhost URL printed by Harness. **New session** returns to **校招工作台**; the top navigation also offers **面试陪练** and **直接聊聊**, without selecting a workspace. Each new practice gets its own session; existing records remain accessible through **拾知 · 面试陪练** in the sidebar. Company browsing, progress recording, and saving answers work without a model key; configure **Settings → Models** for chat and AI feedback. Stop the server with Ctrl+C.

The launcher builds the client and installs this directory as a linked bundle in its isolated `web` profile on first launch. It then starts the official `dsh web` entry point on `127.0.0.1:4317`. `SHIZHI_PORT` changes the port; `DSH_HOME` overrides the default product-local `.dsh-home` directory. If pnpm reports a store mismatch while reusing a profile, set `SHIZHI_PNPM_STORE` to that profile's original store directory and restart. Keep the printed token URL private.

### Practice and review

Select **准备面试** on a company card, enter a target role, and choose a practice subject. Reviews use the confirmed role as background. Return to the company to see linked practices and saved scores. These are general knowledge questions, not verified questions from that employer. Practice does not change application status. The 315-company catalog is an upstream historical snapshot; verify deadlines, roles, and referral codes on the recruiting websites. The integrated tracker starts with its own progress database and does not import the friend's existing personal records automatically.

Submitting saves the answer before requesting model feedback. The card distinguishes running requests from incomplete results and offers retries that reuse saved evaluations. New reviews list met, partial, incorrect, missing, and uncertain points, quote the answer as evidence, and suggest one next action. Fixed questions require all reference criteria; persistence rejects quotations absent from the answer, which does not guarantee the model's judgment. Expand **参考答案** for the generated explanation. **重新回答** appends an attempt; comparison shows the last two evaluated answers and criteria newly met. **针对回答追问一题** follows up on a saved answer. **结束并保存** archives without a model. Markdown exports retain structured feedback, role, and project context.

**今天复习什么** groups history by topic and question and highlights repeated omissions. Suggested intervals are one day for weak answers and seven days otherwise, with early review allowed; these are fixed rules, not a validated personalized memory algorithm. Uncertain judgments are marked separately rather than classified as mastered or incorrect. Legacy reviews use scores for filtering. **重新练这题** creates a linked practice without changing the source archive and supports comparison with its answer.

Expand **按目标岗位练习 / 模拟面试**, provide a role plus job requirements or project experience, and start targeted questions and follow-ups. Mock interviews also require project experience and offer 10/15/20 minutes, at most 4/6/8 questions, difficulty, and interviewer style. Defaults are 15 minutes and six questions, without coding; elapsed time includes model waits. Each saved answer leads to another question until the time or question limit triggers a final report; early ending is available. The current answer remains submittable after time expires. Submit or clear drafts before ending or switching practices. Reports distinguish demonstrated ability, insufficient evidence, and unexamined topics using saved answers. Failed reports can be retried, or answers archived alone. Scores and reference answers remain hidden during the interview.

The agent application bank contains 24 original oral questions for campus and junior roles, grouped into agent fundamentals, tools/MCP, RAG, context/security, workflow reliability, and evaluation/project discussion. Expand **浏览题库与选题** to start from any question; subsequent questions follow catalog order and skip those already practiced in the current session. Reviews use fixed reference criteria with links to official reading. These are not employer questions, and the cues do not prescribe a single wording for a correct answer. Maintain the content in [the agent catalog](src/domain/agent-catalog.js).

### Voice input

Without a dedicated service, supported browsers use their built-in speech recognition. It may send audio to the browser vendor and depends on browser support, microphone permission, and connectivity. With a dedicated service configured, the browser records audio and the server transcribes it after recording stops. Review the editable text before submission. Question playback uses the browser's speech synthesis and available system voices.

Voice input distinguishes microphone permission, recording time, final-result collection, and transcription; submission, question changes, and playback are disabled during these operations. **取消本次口述** restores the draft from before recording; late results cannot overwrite it. Browser recognition errors retain the original draft and confirmed phrases. Failed voice configuration requests offer a retry without switching services automatically. Ending voice input still requires manual review and submission; text exceeding 16000 characters remains editable and cannot be submitted until shortened.

For Alibaba Cloud Model Studio, copy this product's `.env.example` to `.env` and fill in your Beijing-region API key. The template selects the [synchronous Qwen-ASR endpoint](https://help.aliyun.com/zh/model-studio/qwen-asr-api-reference) below; you can also use your Beijing workspace-specific endpoint from the Model Studio console. Free quota and model access depend on your account.

```dotenv
SHIZHI_ASR_PROVIDER=qwen
SHIZHI_ASR_URL=https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions
SHIZHI_ASR_MODEL=qwen3-asr-flash
SHIZHI_ASR_API_KEY=
```

Restart the product and refresh the page after changing `.env`. An empty Qwen key disables voice input and prompts for configuration; text answers remain available. Authentication and permission failures show actionable guidance. Keys stay on the server. Audio is sent to Qwen as an in-memory Base64 recording, without saving audio files or publishing download URLs. Qwen recording supports WebM or Ogg. Defaults are 180 seconds, 8 MiB, and a 60-second provider timeout. Plugin `speech` configuration can override `provider`, `url`, `model`, `apiKeyEnv`, `maxSeconds`, `maxBytes`, and `timeoutMs`; Qwen limits are 300 seconds and 10 MB. The UI displays the destination before recording and requires manual confirmation before submitting the transcript.

For [Speaches transcription](https://speaches.ai/usage/speech-to-text/) or another multipart service, set `SHIZHI_ASR_PROVIDER=multipart`, use the full transcription URL (for example `http://127.0.0.1:8000/v1/audio/transcriptions`), and provide a model ID installed or available on that service. `multipart` is the default when no provider is specified, preserving existing configurations. An unauthenticated local service can leave the key empty. Clear both URL and model to restore browser recognition.

### Data and checks

Paths in this section are relative to `products/shizhi-interview`. By default, practice data lives in `.dsh-home/profiles/web/data/shizhi-interview/interview.sqlite`. The adjacent `career/` directory contains `catalog.db`, `qiuzhao.db`, and `profile-id`. The workbench export menu downloads catalog and progress backups separately; keep the whole product data directory to preserve company-linked practice history. Harness stores conversations under the same isolated home. Git ignores credentials, generated bundles, dependencies, and local data. To retain data from an existing Shizhi installation, stop it and set `DSH_HOME` to that installation's data home before starting this checkout; do not run two servers against the same home.

The database migrates to SQLite `user_version=1` with a nullable structured-review field per evaluation, preserving old records; back up the data directory before upgrading. Existing records are not automatically re-evaluated; new attempts receive structured feedback.

```powershell
cd products/shizhi-interview
npm run verify
```

This builds both clients and the reused upstream storage modules, runs domain/storage and coaching/voice regressions, and checks JavaScript syntax. Integration tests cover stable company identity, progress after reopening SQLite, usable backups, company-linked review context, authenticated routes, and in-flight response cleanup. Tests also replay saved model results from browser runs with synthetic answers, covering feedback evidence, re-answer comparison, and mock reports. These keyless observations in `test/fixtures/recorded-coach-results.json` are not authoritative answer keys. Automated tests do not measure model feedback quality or physical microphone recognition.

<a id="understand-the-implementation"></a>

## Understand the implementation

<details>
<summary>Implementation internals</summary>

Practice cards use light backgrounds. The [Markdown wrapper](src/client/shared/ui.js) and [product styles](src/client/shared/styles.js) set text, link, and inline-code colors for feedback, answer history, and explanations so they do not inherit the chat's dark-theme text.

The bundle inserts one plugin through [cordis.patch.yml](cordis.patch.yml). [Coach commands](src/application/coach-commands.js) own the built-in practice flow; [the catalog](src/domain/coach-catalog.js) owns question prompts and source-linked reference cues. [The agent bridge](src/adapters/dsh/agent-event-bridge.js) queues logged Harness messages and existing atomic tools persist model feedback. Built-in coaching sessions restrict tools to the interview catalog. [Voice input](src/client/features/voice-answer.js) owns editable drafts; [the provider adapter](src/infrastructure/speech-provider.js) owns server-side transcription. No Harness agent-loop changes are required.

[The career build](scripts/build-career.mjs) bundles the same repository's TypeScript UI, CatalogStore, and Store. A same-origin iframe isolates its styles. [HTML validation](scripts/career-html.mjs) parses the page and rewrites asset and backup URLs; missing required elements, identity placeholders, or adapters fail the build. Two client adapters route requests to authenticated Harness endpoints and send company selections to Shizhi. [Career routes](src/adapters/http/career-routes.js) validate writes and expose linked history; [the repository](src/infrastructure/career-repository.js) resolves company names to catalog-owned IDs. Optional `config.target` fields preserve company and role in the existing practice JSON; existing practice records need no migration. Shared interface changes must update the adapters and their tests together.

</details>

<a id="model-experience"></a>

## Model Experience

Feedback requests identify an existing question and attempt, require reading saved data, and prohibit duplicate answers. Each new request carries a logged scope reminder: greetings and knowledge questions do not resume historical reviews, and only explicit practice requests enter the practice flow. The model responds to the current request without listing internal tools or record identifiers for ordinary users. Reference cues accompany built-in questions. Scores are model-generated practice feedback, not hiring predictions. Question selection and archiving work without inference; follow-ups, explanations, and personalized evaluation require a working model.

<a id="known-limitations-and-deferred-work"></a>

## Known Limitations and Deferred Work

This is a Chinese desktop-browser MVP without subscriptions, payments, accounts, or production hosting. The upstream Python companion, job crawler, automatic ranking, and standalone model-settings service are not included. Browser recognition is not guaranteed offline; a local transcription service needs separate installation. Feedback reliability still needs evaluation with real users. Question explanations are stored per question; evaluations are stored per attempt. This bundle and the original `dsh-interview` cannot be enabled together because their tool and route names overlap.

<a id="further-exploration"></a>

## Further Exploration

See [third-party notices](NOTICE.md) for the MIT interview foundation, the workbench source, and interface references. The workbench has no public redistribution license at the pinned revision; this package has `private: true` to prevent npm publication. [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) provides the runtime, model configuration, session logs, and plugin lifecycle.

<a id="dev-note"></a>

## Dev Note

<details>
<summary>Working context for maintainers</summary>

The package is private and remains an independent directory under `products/`. The runtime is pinned in the lockfile. Package identity must match the browser module loader identity in the build script. Browser verification uses the in-page directory picker supplied by the startup overlay.

</details>

---
description: "A local campus-recruiting workbench with company-linked interview practice, voice answers, and Harness model feedback."
kind: "package-bundle"
---

# Campus Recruiting Workbench × Shizhi Interview Coach

English | [中文](README.zh.md)

## Summary

The home page combines the company catalog and application tracker from Xiaozhao Gaogaoshou with Shizhi interview practice. Filter companies, record application progress, and select **准备面试** to practice for a confirmed target role. Choose from 32 original questions across networking, databases, Java, and Redis; speak or type an answer, review feedback, and try again. SQLite stores data locally. AI feedback uses the model configured in Harness.

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

Use Node 22.19 or newer with Git, npm, and pnpm available. This product runs inside the Xiaozhao Gaogaoshou repository and uses its root `src/` and `web/` directories. A full Git clone is required because the build checks those sources against the tested revision in [career-upstream.json](scripts/career-upstream.json).

```powershell
git clone --branch feat/shizhi-interview-integration https://github.com/xiru0834-eng/xiaozhao-gaogaoshou.git
cd xiaozhao-gaogaoshou
npm run coach:install
npm run coach
```

For an existing checkout, switch to this branch and skip cloning. Open the private localhost URL printed by Harness. **New session** returns to **校招工作台**; the top navigation also offers **面试陪练** and **直接聊聊**, without selecting a workspace. Each new practice gets its own session; existing records remain accessible through **拾知 · 面试陪练** in the sidebar. Company browsing, progress recording, and saving answers work without a model key; configure **Settings → Models** for chat and AI feedback. Stop the server with Ctrl+C.

The launcher builds the client and installs this directory as a linked bundle in its isolated `web` profile on first launch. It then starts the official `dsh web` entry point on `127.0.0.1:4317`. `SHIZHI_PORT` changes the port; `DSH_HOME` overrides the default product-local `.dsh-home` directory. Keep the printed token URL private.

### Practice and review

Select **准备面试** on a company card, enter a target role, and choose a practice subject. Reviews use the confirmed role as background. Return to the company to see linked practices and saved scores. These are general knowledge questions, not verified questions from that employer. Practice does not change application status. The 315-company catalog is an upstream historical snapshot; verify deadlines, roles, and referral codes on the recruiting websites. The integrated tracker starts with its own progress database and does not import the friend's existing personal records automatically.

Submit an answer to save it before requesting model feedback. A queued request is not a completed review: failures remain visible in the Harness conversation, and **重新请求点评** retries the saved attempt. **重新回答** appends a new attempt without replacing previous answers. **针对回答追问一题** asks the model for a question based on the saved answer. **结束并保存** archives the practice even if no model is configured. The archive supports Markdown export with company and role metadata. Editing a knowledge-practice topic preserves its company association.

### Voice input

Browser speech recognition is used when available. It may send audio to the browser vendor's service and depends on browser support, microphone permission, and connectivity. Review the editable transcript before submission. Question playback uses the browser's speech synthesis and available system voices.

For a dedicated service, copy `.env.example` to `.env` and set both variables below. This interface follows [Speaches transcription](https://github.com/speaches-ai/speaches/blob/master/docs/usage/speech-to-text.md); install a model on that service separately.

```dotenv
SHIZHI_ASR_URL=http://127.0.0.1:8000/v1/audio/transcriptions
SHIZHI_ASR_MODEL=your-installed-model-id
SHIZHI_ASR_API_KEY=
```

Restart the product after changing `.env`. The provider key stays on the server. Recorded audio is held in memory and sent to the configured endpoint; the product does not save audio files. The default recording limit is 180 seconds and 8 MiB, with a 60-second provider timeout. Plugin `speech` configuration can override `url`, `model`, `apiKeyEnv`, `maxSeconds`, `maxBytes`, and `timeoutMs`. The recording UI displays the destination origin before use.

### Data and checks

Paths in this section are relative to `products/shizhi-interview`. By default, practice data lives in `.dsh-home/profiles/web/data/shizhi-interview/interview.sqlite`. The adjacent `career/` directory contains `catalog.db`, `qiuzhao.db`, and `profile-id`. The workbench export menu downloads catalog and progress backups separately; keep the whole product data directory to preserve company-linked practice history. Harness stores conversations under the same isolated home. Git ignores credentials, generated bundles, dependencies, and local data. To retain data from an existing Shizhi installation, stop it and set `DSH_HOME` to that installation's data home before starting this checkout; do not run two servers against the same home.

```powershell
cd products/shizhi-interview
npm run verify
```

This builds both clients and the reused upstream storage modules, runs domain/storage and coaching/voice regressions, and checks JavaScript syntax. Integration tests cover stable company identity, progress after reopening SQLite, usable backups, company-linked review context, authenticated routes, and in-flight response cleanup. Automated tests do not measure model feedback quality or physical microphone recognition.

<a id="understand-the-implementation"></a>

## Understand the implementation

<details>
<summary>Implementation internals</summary>

The bundle inserts one plugin through [cordis.patch.yml](cordis.patch.yml). [Coach commands](src/application/coach-commands.js) own the built-in practice flow; [the catalog](src/domain/coach-catalog.js) owns question prompts and source-linked reference cues. [The agent bridge](src/adapters/dsh/agent-event-bridge.js) queues logged Harness messages and existing atomic tools persist model feedback. Built-in coaching sessions restrict tools to the interview catalog. [Voice input](src/client/features/voice-answer.js) owns editable drafts; [the provider adapter](src/infrastructure/speech-provider.js) owns server-side transcription. No Harness agent-loop changes are required.

[The career build](scripts/build-career.mjs) bundles the upstream TypeScript UI, CatalogStore, and Store without editing that checkout. A same-origin iframe isolates its styles. Two client adapters route requests to authenticated Harness endpoints and send company selections to Shizhi. [Career routes](src/adapters/http/career-routes.js) validate writes and expose linked history; [the repository](src/infrastructure/career-repository.js) resolves company names to catalog-owned IDs. Optional `config.target` fields preserve company and role in the existing practice JSON; existing practice records need no migration. Upstream revision changes require reviewing adapters and updating the pin before building.

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

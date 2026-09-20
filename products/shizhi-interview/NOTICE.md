# Third-party notices

The company workbench, historical company catalog, and company/progress SQLite modules come from [xiru0834-eng/xiaozhao-gaogaoshou](https://github.com/xiru0834-eng/xiaozhao-gaogaoshou), tested against commit `c99c2a4794b389fb9c3a805ce4875d5760dfe508` on 2026-09-20. They are read from this repository's root `src/` and `web/` directories. The source does not grant a public open-source license; the MIT notice below does not license the workbench or its assets. This package sets `private: true` to prevent npm publication. Integration adapters replace the standalone server routes and model-settings panel at build time.

This product derives its domain model, SQLite repository, atomic interview tools, export support, and original Harness workspace views from [codingayice/dsh-interview](https://github.com/codingayice/dsh-interview), version 0.5.1, retrieved on 2026-09-20. The upstream MIT copyright and permission notice is retained in [LICENSE](LICENSE). The upstream source is available through its [commit history](https://github.com/codingayice/dsh-interview/commits/main/).

The Shizhi coaching workspace, original 32-question catalog, editable voice-answer flow, speech-provider adapter, command handling, and additional tests are modifications made for this product. The original authors do not endorse this derivative.

[Speaches](https://github.com/speaches-ai/speaches) informed the optional multipart transcription interface; no Speaches implementation code is copied. Web Speech API behavior follows the [MDN reference](https://developer.mozilla.org/en-US/docs/Web/API/SpeechRecognition). Browser recognition can use the browser vendor's network service.

Question prompts and short reference cues are newly written study material, not copied interview answers. Each topic links to its technical reference. The inherited Hot 100 feature includes upstream problem metadata and links; it does not grant rights to redistribute third-party problem statements.

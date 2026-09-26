# Xiaozhao desktop (Windows x64)

English | [中文](README.zh.md)

## Install and use

Run `Xiaozhao-Setup-0.1.4-x64.exe`, choose an installation directory, and open the desktop shortcut. The installer includes Electron, Node 24.21.0, both product interfaces, and runtime dependencies. Users do not need Git, Node, npm, or pnpm. The complete `win-unpacked` directory can also run directly; its EXE alone is insufficient.

First launch accepts a DeepSeek key and an Alibaba Cloud Beijing-region key, or lets users explore without keys. Qwen `qwen3-asr-flash` transcribes recordings online; account quotas and charges apply. AI feedback and mock interviews require the user's model credentials. The header opens **Settings → Model and voice**; blank fields retain keys and explicit checkboxes remove them. It also links to the collecting and mail model settings. Saving restarts the workbench: save workbench edits and finish recordings and model tasks first; answer drafts are flushed automatically. Other providers, permissions, plugins and agent presets are under **Advanced settings**. The desktop DeepSeek key takes priority over the corresponding Harness key.

Closing the last window stops the backend. Reopening restores local records, and a second launch focuses the existing window. The server binds only to loopback, remembers its allocated port, and selects another port if it is occupied. Recruiting links open in the default browser; exports use native save dialogs. Desktop voice input uses Qwen rather than browser-vendor recognition.

This unsigned test installer can trigger an unknown-publisher warning. Automatic updates are not implemented; close the application before installing a newer build. Only Windows x64 is built. The optional desktop companion remains separate. Installation, upgrades, and uninstallation preserve user data by default.

## Data and configuration

Release data lives in `%APPDATA%\XiaozhaoShizhi`; development uses `XiaozhaoShizhi-Dev`. The application menu opens that directory. Desktop startup neither reads source `.env` files nor automatically imports existing web records or keys.

- `data/profiles/web/data/shizhi-interview/` holds interview and workbench databases and backups.
- `data/` holds Harness sessions, model settings, and workspace information.
- `desktop-credentials.json` stores setup-page credentials encrypted with Electron `safeStorage` and the Windows user account; copying it to another computer does not make it decryptable.

Use **Settings → Data and backup** to export an encrypted `.szbackup` containing practices, answer drafts, sessions, applications, catalogs, schedules and configuration. A password of at least 10 characters protects the AES-256-GCM archive; it is not stored and cannot be recovered. Restore works across computers and re-encrypts credentials with the destination OS account. Archives are limited to 256 MB and omit runtime dependencies and port caches. Export and restore pause and restart the backend; save workbench edits and finish recording or model tasks first. Restore asks before replacing data and rolls back if startup fails. A manual copy of the closed application data directory remains possible, but its OS-encrypted keys cannot be decrypted by a different Windows account. To migrate web records, back up both homes and copy data separately while retaining desktop profile configuration and plugin junctions; do not overwrite the desktop home with the source profile. Packaging omits type declarations, source maps and native debug symbols to reduce installed size and the number of files processed during upgrades; runtime code, resources and licenses remain. Packaging uses an allowlist and excludes `.env`, personal databases, recordings, caches, and development data. `resources/backend/runtime-inventory.json` lists dependencies; their directories retain license files, alongside bundled Electron and Node licenses.

## Build from source

Developers need Windows x64, Node 24.14 or newer within 24.x, and npm. From the complete repository root:

```powershell
npm ci
npm run coach:install
npm run desktop:install
npm run desktop:prepare
npm run desktop
```

Run `npm run desktop:dist` after validation. Output is under `products/shizhi-desktop/release/`. Re-run preparation after changing the product clients, backend, or bridge. Shell `src/` changes only require repackaging. Node uses a pinned SHA256; Electron uses the official checksums in its npm package. If GitHub downloads are unavailable, set `ELECTRON_MIRROR` to an HTTPS version directory such as `https://npmmirror.com/mirrors/electron/44.4.5/` and run `npm --prefix products/shizhi-desktop run prepare:electron`; checksum verification remains mandatory.

## Verification and implementation

Run `npm test`, `npm run test:runtime`, `npm run test:lifecycle`, and `npm run test:desktop` in this directory. Runtime tests launch real `dsh web` with developer tools removed from PATH, checking authentication, both products, persisted records, port collisions, and graceful exit. Lifecycle tests cover parent loss. Electron tests use temporary data and software rendering to exercise first-run configuration, the full-width header, history and focus restoration, model settings, returning from plugins, coach navigation, global light/dark/system appearance, iframe theme controls, reload persistence, export menu hit targets, narrow windows, renderer isolation, draft refresh/restart recovery, and full backup/restore, producing screenshots. These checks do not measure physical microphone capture or model feedback quality.

The [backend launcher](src/backend.mjs) invokes the bundled official `dsh web` CLI. A [Cordis bridge](bridge/index.mjs) reports readiness and handles shutdown over parent IPC. First run creates a writable profile and two local plugin junctions without running a package manager. Product renderers disable Node integration and enable sandboxing and context isolation. The setup page and product main frame receive separate restricted preloads; preload is injected only into the product main frame, and IPC checks the sending frame and local origin. Main-process native dialogs select all backup paths. Microphone permission is restricted to audio requests from the loopback workbench. Source-web startup and data remain independent.

See the [interview guide](../shizhi-interview/README.md), [Electron security guidance](https://www.electronjs.org/docs/latest/tutorial/security), and [NSIS configuration](https://www.electron.build/nsis/).

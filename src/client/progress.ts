import { parseStatuses, type Status, type StatusMap } from "../shared/types.ts";

export interface ProgressApi {
  read(): Promise<StatusMap>;
  write(updates: StatusMap): Promise<void>;
}

/** Owns save ordering and retry. Rendering never decides whether a write succeeded. */
export class Progress {
  state: StatusMap = {};
  ready = false;
  private pending: StatusMap = {};
  private writing = false;
  private version = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private disposed = false;
  private api: ProgressApi;
  private notify: (message: string) => void;
  private delay: number;
  constructor(
    api: ProgressApi,
    notify: (message: string) => void,
    delay = 400,
  ) {
    this.api = api;
    this.notify = notify;
    this.delay = delay;
  }
  get dirty(): boolean {
    return this.writing || Object.keys(this.pending).length > 0;
  }
  async connect(): Promise<void> {
    if (this.dirty) {
      this.notify("还有修改未保存，请勿关闭窗口");
      return;
    }
    const version = this.version;
    this.notify("正在连接 qiuzhao.db…");
    try {
      const remote = parseStatuses(await this.api.read());
      if (version !== this.version || this.dirty) return;
      this.state = remote;
      this.ready = true;
      this.notify("qiuzhao.db 已连接");
    } catch {
      this.ready = false;
      this.notify("数据库未连接，请重启 TypeScript 服务后重试");
    }
  }
  set(name: string, status: Status): void {
    if (!this.ready) throw new Error("Database not connected");
    const updates = parseStatuses({ [name]: status });
    this.version++;
    Object.assign(this.state, updates);
    Object.assign(this.pending, updates);
    this.notify("正在保存到数据库…");
    this.schedule();
  }
  private schedule(): void {
    if (this.disposed) return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void this.flush();
    }, this.delay);
  }
  async flush(): Promise<void> {
    if (this.writing || !Object.keys(this.pending).length || this.disposed)
      return;
    clearTimeout(this.timer);
    const batch = this.pending;
    this.pending = {};
    this.writing = true;
    let failed = false;
    try {
      await this.api.write(batch);
    } catch {
      this.pending = { ...batch, ...this.pending };
      failed = true;
    } finally {
      this.writing = false;
    }
    this.notify(
      failed
        ? "写库失败，请勿关闭窗口；正在重试"
        : this.dirty
          ? "正在保存后续修改，请勿关闭窗口…"
          : "已写入 qiuzhao.db",
    );
    if (this.dirty) this.schedule();
  }
  async refresh(): Promise<void> {
    if (!this.ready || this.dirty) return;
    const version = this.version;
    try {
      const remote = parseStatuses(await this.api.read());
      if (
        version !== this.version ||
        this.dirty ||
        JSON.stringify(remote) === JSON.stringify(this.state)
      )
        return;
      this.state = remote;
      this.notify("已同步其他窗口的进度");
    } catch {
      /* Keep visible data. Next focus or write retries. */
    }
  }
  dispose(): void {
    this.disposed = true;
    clearTimeout(this.timer);
  }
}

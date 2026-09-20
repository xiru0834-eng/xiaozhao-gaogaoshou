import { parseStatuses } from "../shared/types.ts";
import type { ProgressApi } from "./progress.ts";
import type { DataSession } from './session.ts';

export function statusApi(session: DataSession): ProgressApi {
  return {
    async read() {
      const data = await session.read('/api/status');
      return parseStatuses(data.statuses);
    },
    async write(updates) {
      const ack = await session.write('/api/status', {updates});
      if (ack.ok !== true)
        throw new Error("Missing save confirmation");
    },
  };
}

/** Adapts the workbench's data session to the authenticated Harness origin. */
import { createSession } from '../../../../src/client/session.ts'

/** Reads only the workbench's profile identity; Harness retains model credentials.
 * @returns {object} Namespaced workbench data session.
 */
export function sessionFromPage() {
  const identity = (doc) => ({ profileId: doc.querySelector('meta[name="profile-id"]').content,
    token: doc.querySelector('meta[name="app-token"]').content })
  const current = identity(document)
  return createSession(current.profileId, current.token,
    (path, options) => fetch(`/interview/career${path}`, options), async () => {
      const response = await fetch('/interview/career/', { cache: 'no-store' })
      if (!response.ok) throw new Error('工作台连接失败，请刷新页面')
      return identity(new DOMParser().parseFromString(await response.text(), 'text/html'))
    })
}
